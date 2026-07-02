const AYRSHARE_BASE = "https://api.ayrshare.com/api";

export interface AyrshareSocialAccount {
  platform: string;
  displayName?: string;
  username?: string;
  profileUrl?: string;
  userImage?: string;
}

export interface AyrsharePublishResult {
  status: string;
  id?: string;
  scheduleDate?: string;
  postIds?: Array<{
    platform: string;
    status: string;
    id?: string;
    postUrl?: string;
    message?: string;
  }>;
  errors?: Array<{ platform?: string; message: string; code?: number }>;
}

function getPrivateKey(): string | null {
  const base64 = process.env.AYRSHARE_PRIVATE_KEY_BASE64 === "true";
  const raw = process.env.AYRSHARE_PRIVATE_KEY;
  if (!raw) return null;
  if (base64) {
    return Buffer.from(raw, "base64").toString("utf8");
  }
  return raw.replace(/\\n/g, "\n");
}

export function isAyrshareConfigured(): boolean {
  return Boolean(
    process.env.AYRSHARE_API_KEY &&
      process.env.AYRSHARE_DOMAIN &&
      getPrivateKey(),
  );
}

async function ayrshareRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    profileKey?: string;
  } = {},
): Promise<T> {
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    throw new Error("Ayrshare is not configured");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (options.profileKey) {
    headers["Profile-Key"] = options.profileKey;
  }

  const res = await fetch(`${AYRSHARE_BASE}${path}`, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json()) as T & {
    status?: string;
    message?: string;
    errors?: Array<{ message: string }>;
  };

  if (!res.ok || data.status === "error") {
    const msg =
      data.message ??
      data.errors?.[0]?.message ??
      `Ayrshare request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function createAyrshareProfile(title: string) {
  return ayrshareRequest<{
    status: string;
    profileKey: string;
    refId: string;
    title: string;
  }>("/profiles", {
    method: "POST",
    body: { title },
  });
}

export async function generateAyrshareConnectUrl(
  profileKey: string,
  redirectUrl?: string,
) {
  const domain = process.env.AYRSHARE_DOMAIN;
  const rawKey = process.env.AYRSHARE_PRIVATE_KEY;
  if (!rawKey || !domain) {
    throw new Error("Ayrshare JWT configuration is incomplete");
  }

  const useBase64 = process.env.AYRSHARE_PRIVATE_KEY_BASE64 === "true";
  const privateKey = useBase64 ? rawKey : rawKey.replace(/\\n/g, "\n");

  const body: Record<string, unknown> = {
    domain,
    privateKey,
    profileKey,
    allowedSocial: [
      "twitter",
      "linkedin",
      "instagram",
      "facebook",
      "threads",
      "tiktok",
      "youtube",
      "pinterest",
    ],
  };

  if (redirectUrl) {
    body.redirect = redirectUrl;
  }

  if (useBase64) {
    body.base64 = true;
  }

  return ayrshareRequest<{
    status: string;
    url: string;
    token: string;
  }>("/profiles/generateJWT", {
    method: "POST",
    body,
  });
}

export async function getAyrshareProfileDetails(profileKey: string) {
  return ayrshareRequest<{
    activeSocialAccounts?: string[];
    displayNames?: AyrshareSocialAccount[];
    title?: string;
  }>("/user", { profileKey });
}

export async function publishToAyrshare(
  profileKey: string,
  input: {
    post: string;
    platforms: string[];
    scheduleDate?: string;
    mediaUrls?: string[];
    notes?: string;
  },
): Promise<AyrsharePublishResult> {
  const body: Record<string, unknown> = {
    post: input.post,
    platforms: input.platforms,
  };

  if (input.scheduleDate) body.scheduleDate = input.scheduleDate;
  if (input.mediaUrls?.length) body.mediaUrls = input.mediaUrls;
  if (input.notes) body.notes = input.notes;

  const data = await ayrshareRequest<AyrsharePublishResult & { posts?: AyrsharePublishResult[] }>(
    "/post",
    { method: "POST", body, profileKey },
  );

  if (data.posts?.[0]) {
    return data.posts[0];
  }

  return data;
}

export async function ensureAyrshareProfileForUser(user: {
  id: string;
  email: string | null;
  name: string | null;
  ayrshareProfileKey: string | null;
  ayrshareRefId: string | null;
}) {
  if (user.ayrshareProfileKey) {
    return {
      profileKey: user.ayrshareProfileKey,
      refId: user.ayrshareRefId,
    };
  }

  const title = `RepurAI-${user.id}`;
  const created = await createAyrshareProfile(title);
  return {
    profileKey: created.profileKey,
    refId: created.refId,
  };
}