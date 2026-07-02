export const LEGAL = {
  appName: "RepurAI",
  companyName: "RepurAI",
  website:
    process.env.NEXT_PUBLIC_APP_URL ?? "https://repurai-beta.vercel.app",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@repurai.app",
  lastUpdated: "July 2, 2026",
  governingLaw: "the laws applicable in your jurisdiction",
} as const;