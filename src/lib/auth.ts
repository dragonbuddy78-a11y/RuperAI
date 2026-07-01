import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }

          const { email, password } = parsed.data;
          const normalizedEmail = email.toLowerCase().trim();

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user?.password) {
            return null;
          }

          const passwordValid = await bcrypt.compare(password, user.password);
          if (!passwordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Credentials authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.sub = user.id;
      }

      const userId = (token.id as string) ?? token.sub;
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            credits: true,
            plan: true,
            onboardingCompleted: true,
          },
        });

        if (dbUser) {
          token.credits = dbUser.credits;
          token.plan = dbUser.plan;
          token.onboardingCompleted = dbUser.onboardingCompleted;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const userId = (token.id as string) ?? token.sub;
        if (userId) {
          session.user.id = userId;

          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              credits: true,
              plan: true,
              onboardingCompleted: true,
            },
          });

          if (dbUser) {
            session.user.credits = dbUser.credits;
            session.user.plan = dbUser.plan;
            session.user.onboardingCompleted = dbUser.onboardingCompleted;
          } else {
            session.user.credits =
              typeof token.credits === "number" ? token.credits : 0;
            session.user.plan =
              (token.plan as "FREE" | "STARTER" | "PRO" | "ENTERPRISE") ??
              "FREE";
            session.user.onboardingCompleted = Boolean(
              token.onboardingCompleted,
            );
          }
        }
      }
      return session;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}