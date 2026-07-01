import type {
  CreditTransactionType,
  OutputFormat,
  Prisma,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  FORMAT_CREDIT_COST,
  getCreditCost as getClientCreditCost,
  getFormatCreditCost as getClientFormatCreditCost,
  SNAKE_CASE_FORMAT_COSTS,
} from "@/lib/credit-costs";
import {
  PLAN_LIMITS,
  type Plan,
  type PlanLimits,
} from "@/types";

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `Insufficient credits: required ${required}, available ${available}`,
    );
    this.name = "InsufficientCreditsError";
  }
}

const FORMAT_CREDIT_COSTS: Record<OutputFormat, number> = {
  TWITTER_THREAD: 1,
  LINKEDIN_POST: 1,
  LINKEDIN_ARTICLE: 2,
  INSTAGRAM_CAPTION: 1,
  INSTAGRAM_CAROUSEL: 2,
  FACEBOOK_POST: 1,
  THREADS_POST: 1,
  BLOG_POST: 2,
  SEO_BLOG: 2,
  NEWSLETTER: 2,
  EMAIL_NEWSLETTER: 2,
  YOUTUBE_DESCRIPTION: 1,
  YOUTUBE_CHAPTERS: 1,
  TIKTOK_SCRIPT: 1,
  EMAIL_SEQUENCE: 3,
  SEO_META: 1,
  THREAD_HOOKS: 1,
  CAROUSEL: 2,
  SHORTS_SCRIPT: 1,
  AD_COPY: 2,
  LEAD_MAGNET: 2,
  PINTEREST_PIN: 1,
};

export async function getCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return user.credits;
}

export async function canAfford(
  userId: string,
  amount: number,
): Promise<boolean> {
  const credits = await getCredits(userId);
  return credits >= amount;
}

export function getCreditCost(formats: Array<OutputFormat | string>): number {
  return formats.reduce((total, format) => {
    if (typeof format === "string") {
      if (format in SNAKE_CASE_FORMAT_COSTS) {
        return (
          total +
          SNAKE_CASE_FORMAT_COSTS[format as keyof typeof SNAKE_CASE_FORMAT_COSTS]
        );
      }
      return total + getClientFormatCreditCost(format);
    }
    return total + (FORMAT_CREDIT_COSTS[format] ?? 1);
  }, 0);
}

export function getFormatCreditCost(format: OutputFormat | string): number {
  if (typeof format === "string") {
    return getClientFormatCreditCost(format);
  }
  return FORMAT_CREDIT_COSTS[format] ?? 1;
}

export { getClientCreditCost, getClientFormatCreditCost };

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Prisma.InputJsonValue,
): Promise<{ balance: number; transactionId: string }> {
  if (amount <= 0) {
    throw new Error("Deduction amount must be positive");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (user.credits < amount) {
      throw new InsufficientCreditsError(amount, user.credits);
    }

    const newBalance = user.credits - amount;

    const [updatedUser, transaction] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { credits: newBalance },
        select: { credits: true },
      }),
      tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          balance: newBalance,
          type: "DEDUCTION",
          description,
          metadata,
        },
      }),
    ]);

    return {
      balance: updatedUser.credits,
      transactionId: transaction.id,
    };
  });
}

export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  description = "Credit deduction",
  metadata?: Prisma.InputJsonValue,
): Promise<{ creditsRemaining: number; transactionId: string }> {
  const result = await deductCredits(userId, amount, description, metadata);
  return {
    creditsRemaining: result.balance,
    transactionId: result.transactionId,
  };
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: Prisma.InputJsonValue,
): Promise<{ balance: number; transactionId: string }> {
  if (amount <= 0) {
    throw new Error("Credit amount must be positive");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const newBalance = user.credits + amount;

    const [updatedUser, transaction] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { credits: newBalance },
        select: { credits: true },
      }),
      tx.creditTransaction.create({
        data: {
          userId,
          amount,
          balance: newBalance,
          type,
          description,
          metadata,
        },
      }),
    ]);

    return {
      balance: updatedUser.credits,
      transactionId: transaction.id,
    };
  });
}

export async function logUsage(
  userId: string,
  action: string,
  creditsUsed: number,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.usageLog.create({
    data: {
      userId,
      action,
      creditsUsed,
      metadata,
    },
  });
}