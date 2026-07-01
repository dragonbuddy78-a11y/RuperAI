import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const protectedRoutes = [
  "/dashboard",
  "/studio",
  "/library",
  "/monetization",
  "/analytics",
  "/billing",
  "/settings",
  "/onboarding",
] as const;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user);

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/sign-in", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    isLoggedIn &&
    !pathname.startsWith("/onboarding") &&
    req.auth?.user?.onboardingCompleted === false &&
    protectedRoutes
      .filter((route) => route !== "/onboarding")
      .some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      )
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard",
    "/studio",
    "/library",
    "/monetization",
    "/analytics",
    "/billing",
    "/settings",
    "/onboarding",
    "/dashboard/:path*",
    "/studio/:path*",
    "/library/:path*",
    "/monetization/:path*",
    "/analytics/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};