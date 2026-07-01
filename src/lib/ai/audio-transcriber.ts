import OpenAI from "openai";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const WHISPER_MODEL = "whisper-large-v3";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/m4a": "m4a",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "video/mp4": "mp4",
};

export function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith("audio/") || mimeType === "video/mp4";
}

export function getAudioExtension(mimeType: string, fileName?: string): string {
  if (AUDIO_EXTENSIONS[mimeType]) return AUDIO_EXTENSIONS[mimeType];
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext && ["mp3", "wav", "m4a", "webm", "ogg", "mp4"].includes(ext)) return ext;
  return "mp3";
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  fileName?: string,
): Promise<{ text: string; wordCount: number }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Audio transcription requires GROQ_API_KEY. Add it to your .env file.",
    );
  }

  if (buffer.length > MAX_AUDIO_BYTES) {
    throw new Error("Audio file exceeds maximum size of 25MB");
  }

  const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
  const ext = getAudioExtension(mimeType, fileName);
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const file = new File([blob], `audio.${ext}`, { type: mimeType });

  const result = await client.audio.transcriptions.create({
    file,
    model: WHISPER_MODEL,
    response_format: "verbose_json",
  });

  const text = result.text?.trim();
  if (!text || text.length < 20) {
    throw new Error(
      "Could not extract enough speech from the audio. Try a clearer recording.",
    );
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return { text, wordCount };
}