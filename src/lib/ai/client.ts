import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { GenerationOptions, ContentFormat } from "@/types";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";

export type AIProvider = "groq" | "gemini" | "xai";

const PROVIDERS: Record<
  AIProvider,
  { baseURL?: string; apiKeyEnv: string; defaultModel: string; fallbackModel?: string }
> = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    defaultModel: "llama-3.3-70b-versatile",
    fallbackModel: "llama-3.1-8b-instant",
  },
  xai: {
    baseURL: "https://api.x.ai/v1",
    apiKeyEnv: "XAI_API_KEY",
    defaultModel: process.env.XAI_MODEL ?? "grok-3-mini",
    fallbackModel: "grok-2-latest",
  },
  gemini: {
    apiKeyEnv: "GEMINI_API_KEY",
    defaultModel: "gemini-2.0-flash",
  },
};

const clients = new Map<AIProvider, OpenAI>();

function resolveProvider(): AIProvider {
  const preferred = process.env.AI_PROVIDER as AIProvider | undefined;
  if (preferred && isProviderConfigured(preferred)) {
    return preferred;
  }

  if (isProviderConfigured("groq")) return "groq";
  if (isProviderConfigured("gemini")) return "gemini";
  if (isProviderConfigured("xai")) return "xai";

  throw new Error(
    "No AI provider configured. Add GROQ_API_KEY (free), GEMINI_API_KEY (free), or XAI_API_KEY to .env",
  );
}

function isProviderConfigured(provider: AIProvider): boolean {
  return Boolean(process.env[PROVIDERS[provider].apiKeyEnv]);
}

function getOpenAIClient(provider: AIProvider): OpenAI {
  const cached = clients.get(provider);
  if (cached) return cached;

  const config = PROVIDERS[provider];
  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`${config.apiKeyEnv} is not configured`);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: config.baseURL,
  });

  clients.set(provider, client);
  return client;
}

export function getActiveProvider(): AIProvider {
  return resolveProvider();
}

export function getModel(plan?: string): string {
  const provider = resolveProvider();

  if (provider === "groq") {
    return plan === "FREE" || !plan
      ? "llama-3.1-8b-instant"
      : PROVIDERS.groq.defaultModel;
  }

  return PROVIDERS[provider].defaultModel;
}

export interface GenerateOptions {
  format: ContentFormat;
  content: string;
  options?: GenerationOptions;
  temperature?: number;
  maxTokens?: number;
  plan?: string;
}

export interface GenerateResult {
  output: string;
  model: string;
  tokensUsed: number;
  provider: AIProvider;
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number },
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: PROVIDERS.gemini.defaultModel,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 4096,
    },
  });

  const output = result.response.text().trim();
  const tokensUsed =
    (result.response.usageMetadata?.promptTokenCount ?? 0) +
    (result.response.usageMetadata?.candidatesTokenCount ?? 0);

  return {
    output,
    model: PROVIDERS.gemini.defaultModel,
    tokensUsed,
    provider: "gemini",
  };
}

async function callOpenAICompatible(
  provider: AIProvider,
  messages: ChatCompletionMessageParam[],
  options?: { temperature?: number; maxTokens?: number; plan?: string },
): Promise<GenerateResult> {
  const client = getOpenAIClient(provider);
  const config = PROVIDERS[provider];
  const model =
    provider === "groq"
      ? getModel(options?.plan)
      : config.defaultModel;

  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    });

    const output = response.choices[0]?.message?.content?.trim() ?? "";
    const tokensUsed =
      (response.usage?.prompt_tokens ?? 0) +
      (response.usage?.completion_tokens ?? 0);

    return { output, model, tokensUsed, provider };
  } catch (error) {
    if (config.fallbackModel && model !== config.fallbackModel) {
      const response = await client.chat.completions.create({
        model: config.fallbackModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      });

      const output = response.choices[0]?.message?.content?.trim() ?? "";
      const tokensUsed =
        (response.usage?.prompt_tokens ?? 0) +
        (response.usage?.completion_tokens ?? 0);

      return {
        output,
        model: config.fallbackModel,
        tokensUsed,
        provider,
      };
    }
    throw error;
  }
}

async function generateWithFallback(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; plan?: string },
): Promise<GenerateResult> {
  const primary = resolveProvider();
  const chain: AIProvider[] = [
    primary,
    ...(["groq", "gemini", "xai"] as AIProvider[]).filter(
      (p) => p !== primary && isProviderConfigured(p),
    ),
  ];

  let lastError: unknown;
  for (const provider of chain) {
    try {
      if (provider === "gemini") {
        return await callGemini(systemPrompt, userPrompt, options);
      }

      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
      return await callOpenAICompatible(provider, messages, options);
    } catch (error) {
      lastError = error;
      console.warn(`AI provider ${provider} failed, trying next...`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All AI providers failed");
}

export async function generateContent(
  params: GenerateOptions,
): Promise<GenerateResult> {
  const systemPrompt = buildSystemPrompt(params.format, params.options);
  const userPrompt = buildUserPrompt(params.content, params.options);

  return generateWithFallback(systemPrompt, userPrompt, {
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    plan: params.plan,
  });
}

export interface StreamGenerateOptions extends GenerateOptions {
  onChunk: (chunk: string) => void;
  onComplete?: (result: GenerateResult) => void;
}

export async function generateContentStream(
  params: StreamGenerateOptions,
): Promise<GenerateResult> {
  const provider = resolveProvider();

  if (provider === "gemini") {
    const result = await generateContent(params);
    params.onChunk(result.output);
    params.onComplete?.(result);
    return result;
  }

  const client = getOpenAIClient(provider);
  const model = getModel(params.plan);
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(params.format, params.options) },
    { role: "user", content: buildUserPrompt(params.content, params.options) },
  ];

  let fullOutput = "";
  let tokensUsed = 0;

  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 4096,
    stream: true,
    stream_options: { include_usage: true },
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullOutput += delta;
      params.onChunk(delta);
    }
    if (chunk.usage) {
      tokensUsed =
        (chunk.usage.prompt_tokens ?? 0) + (chunk.usage.completion_tokens ?? 0);
    }
  }

  const result: GenerateResult = {
    output: fullOutput.trim(),
    model,
    tokensUsed,
    provider,
  };

  params.onComplete?.(result);
  return result;
}

export async function generateWithCustomPrompt(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; plan?: string },
): Promise<GenerateResult> {
  return generateWithFallback(systemPrompt, userPrompt, options);
}

export async function* streamCustomPrompt(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; plan?: string },
): AsyncGenerator<string, GenerateResult, undefined> {
  const result = await generateWithFallback(systemPrompt, userPrompt, options);
  yield result.output;
  return result;
}