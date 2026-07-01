import { PLANS } from "@/lib/plans";

/** When true, new signups get Pro free and paid checkout is disabled. */
export function isBetaFreePro(): boolean {
  return process.env.NEXT_PUBLIC_BETA_FREE_PRO !== "false";
}

export const BETA_PRO_CREDITS = PLANS.PRO.creditsMonthly;

export const BETA_MESSAGE =
  "We're in open beta — every new account gets full Pro access free while we gather feedback.";