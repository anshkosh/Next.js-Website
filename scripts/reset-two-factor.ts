import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";
import { resetTwoFactor, validResetReason } from "../lib/two-factor-reset";

// Break-glass: use only when no other admin can reset two-factor from /admin/admins
// (for example, the only admin lost their phone and backup codes).
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args.length === 2 && args[0] === "--email" ? args[1].trim().toLowerCase() : "";
  if (!email) throw new Error("Usage: npx tsx scripts/reset-two-factor.ts --email <staff-email>");

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user || (user.role !== "admin" && user.role !== "reviewer")) {
    throw new Error("Target must be an existing admin or reviewer account.");
  }

  const rl = createInterface({ input: stdin, output: stdout });
  let operator = "";
  let reason = "";
  try {
    stdout.write(`Target: ${user.name} (${user.email}), role ${user.role}, two-factor ${user.twoFactorEnabled ? "on" : "off"}\n`);
    operator = (await rl.question("Your name: ")).trim();
    reason = (await rl.question("Reason for reset (include the owner approval reference): ")).trim();
    const confirmation = (await rl.question("Type the target email to confirm: ")).trim().toLowerCase();
    if (operator.length < 2 || operator.length > 100 || !validResetReason(reason) || confirmation !== user.email.toLowerCase()) {
      throw new Error("Confirmation details were incomplete or did not match; no changes were made.");
    }
  } finally {
    rl.close();
  }

  const audit = await prisma.$transaction(tx => resetTwoFactor(tx, {
    operatorId: null,
    operatorName: `${operator} (CLI)`,
    targetUserId: user.id,
    targetEmail: user.email,
    reason,
  }));

  console.log(JSON.stringify({ twoFactorReset: true, auditId: audit.id, recordedAt: audit.createdAt.toISOString(), sessionsRevoked: true }));
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : "Two-factor reset failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
