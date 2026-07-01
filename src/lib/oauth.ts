export type OAuthProviderId = "google" | "github";

export interface OAuthProviderConfig {
  id: OAuthProviderId;
  name: string;
  enabled: boolean;
}

export function getOAuthProviders(): OAuthProviderConfig[] {
  return [
    {
      id: "google",
      name: "Google",
      enabled: Boolean(
        process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
      ),
    },
    {
      id: "github",
      name: "GitHub",
      enabled: Boolean(
        process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
      ),
    },
  ];
}

export function getEnabledOAuthProviders(): OAuthProviderConfig[] {
  return getOAuthProviders().filter((p) => p.enabled);
}

export function isOAuthConfigured(): boolean {
  return getEnabledOAuthProviders().length > 0;
}