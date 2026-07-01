import { NextResponse } from "next/server";

import { getOAuthProviders } from "@/lib/oauth";

export async function GET() {
  const providers = getOAuthProviders()
    .filter((p) => p.enabled)
    .map((p) => ({ id: p.id, name: p.name }));

  return NextResponse.json({ providers });
}