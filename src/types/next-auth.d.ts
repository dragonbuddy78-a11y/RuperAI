import type { PlanType } from "@/generated/prisma";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      credits: number;
      plan: PlanType;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    credits?: number;
    plan?: PlanType;
    onboardingCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    credits?: number;
    plan?: PlanType;
    onboardingCompleted?: boolean;
  }
}