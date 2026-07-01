import type { PlanType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";

export async function countUserMonetizationProjects(
  userId: string,
): Promise<number> {
  return prisma.monetizationProject.count({ where: { userId } });
}

export function getMaxMonetizationProjects(plan: PlanType): number {
  return PLANS[plan]?.maxMonetizationProjects ?? 1;
}

export async function canCreateMonetizationProject(
  userId: string,
  plan: PlanType,
): Promise<boolean> {
  const max = getMaxMonetizationProjects(plan);
  if (max < 0) return true;
  const count = await countUserMonetizationProjects(userId);
  return count < max;
}