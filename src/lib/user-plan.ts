import type { PlanType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function getUserPlan(userId: string): Promise<PlanType> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return user?.plan ?? "FREE";
}