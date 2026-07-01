import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (process.env.DIRECT_DATABASE_URL) {
    return process.env.DIRECT_DATABASE_URL;
  }

  if (url.startsWith("prisma+postgres://")) {
    try {
      const parsed = new URL(url);
      const apiKey = parsed.searchParams.get("api_key");
      if (apiKey) {
        const decoded = JSON.parse(
          Buffer.from(apiKey, "base64url").toString("utf8"),
        ) as { databaseUrl?: string };
        if (decoded.databaseUrl) {
          return decoded.databaseUrl;
        }
      }
    } catch {
      // Fall through to the original URL.
    }
  }

  return url;
}

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: resolveDatabaseUrl(),
    max: 10,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function isPrismaClientStale(client: PrismaClient): boolean {
  const c = client as PrismaClient & {
    brandVoice?: unknown;
    scheduledPost?: unknown;
    monetizationAsset?: unknown;
  };
  return (
    typeof c.brandVoice === "undefined" ||
    typeof c.scheduledPost === "undefined" ||
    typeof c.monetizationAsset === "undefined"
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !isPrismaClientStale(cached)) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();