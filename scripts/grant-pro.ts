import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { PLANS } from "../src/lib/plans";

async function main() {
  const emailArg = process.argv[2];

  const users = emailArg
    ? await prisma.user.findMany({
        where: { email: emailArg.toLowerCase() },
        select: { id: true, email: true, name: true, plan: true, credits: true },
      })
    : await prisma.user.findMany({
        select: { id: true, email: true, name: true, plan: true, credits: true },
        orderBy: { createdAt: "desc" },
      });

  if (users.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }

  const proCredits = PLANS.PRO.creditsMonthly;

  for (const user of users) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "PRO",
        credits: Math.max(user.credits, proCredits),
      },
      select: { email: true, name: true, plan: true, credits: true },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: Math.max(0, proCredits - user.credits),
        balance: updated.credits,
        type: "BONUS",
        description: "Pro plan granted (dev)",
      },
    });

    console.log(`✓ Upgraded ${updated.email} → PRO (${updated.credits} credits)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());