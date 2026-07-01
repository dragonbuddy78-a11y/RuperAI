import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { BETA_PRO_CREDITS, isBetaFreePro } from "@/lib/beta";
import { prisma } from "@/lib/prisma";
import { registerSchema, safeParseBody } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = safeParseBody(registerSchema, body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const betaPro = isBetaFreePro();
    const startingCredits = betaPro ? BETA_PRO_CREDITS : 50;
    const startingPlan = betaPro ? "PRO" : "FREE";

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        credits: startingCredits,
        plan: startingPlan,
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: startingCredits,
        balance: startingCredits,
        type: "BONUS",
        description: betaPro
          ? "Open beta — free Pro access"
          : "Welcome bonus credits",
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}