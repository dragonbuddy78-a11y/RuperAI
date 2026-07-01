import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const count = await prisma.brandVoice.count();
  console.log("brandVoice count:", count);
  const u = await prisma.user.findUnique({
    where: { email: "goatdev1997@outlook.com" },
    select: { id: true, plan: true },
  });
  console.log("user:", u);
}

main()
  .catch((e) => console.error("ERR:", e))
  .finally(() => prisma.$disconnect());