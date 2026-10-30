import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
// ponytail: reuse Better Auth's hasher so this fallback cannot drift from sign-in.
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function readHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY || !stdin.setRawMode) throw new Error("Run this command in an interactive terminal.");
  stdout.write(prompt);
  stdin.setEncoding("utf8");
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error?: Error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (key: string) => {
      if (key === "\u0003") return finish(new Error("Cancelled."));
      if (key === "\r" || key === "\n") return finish();
      if (key === "\u007f" || key === "\b") value = value.slice(0, -1);
      else if (!key.startsWith("\u001b") && key >= " ") value += key;
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const email = args.length === 2 && args[0] === "--email" ? args[1].trim().toLowerCase() : "";
  if (!email) {
    throw new Error("Usage: npx tsx scripts/set-admin-password.ts --email <admin-email> (password is entered privately)");
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user || user.role !== "admin" || !user.emailVerified || user.banned) {
    throw new Error("Target must be an existing, verified, active admin account.");
  }

  const rl = createInterface({ input: stdin, output: stdout });
  let operator = "";
  let reason = "";
  let approvalReference = "";
  try {
    stdout.write(`Target: ${user.name} (${user.email})\n`);
    operator = (await rl.question("Your name: ")).trim();
    reason = (await rl.question("Reason for reset: ")).trim();
    approvalReference = (await rl.question("Owner approval reference (or 'local development'): ")).trim();
    const confirmation = (await rl.question("Type the target email to confirm: ")).trim().toLowerCase();
    if (operator.length < 2 || operator.length > 100 || reason.length < 5 || reason.length > 500 || !approvalReference || confirmation !== user.email.toLowerCase()) {
      throw new Error("Confirmation details were incomplete or did not match; no changes were made.");
    }
  } finally {
    rl.close();
  }

  const password = await readHidden("New password (8–128 characters): ");
  const confirmation = await readHidden("Re-enter new password: ");
  if (password.length < 8 || password.length > 128 || password !== confirmation) {
    throw new Error("Passwords must match and contain 8–128 characters; no changes were made.");
  }

  const passwordHash = await hashPassword(password);
  const audit = await prisma.$transaction(async tx => {
    const credential = await tx.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
    if (credential) await tx.account.update({ where: { id: credential.id }, data: { password: passwordHash } });
    else await tx.account.create({ data: { accountId: user.id, providerId: "credential", userId: user.id, password: passwordHash } });

    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.verification.deleteMany({ where: { identifier: { startsWith: "reset-password:" }, value: user.id } });
    return tx.adminPasswordResetAudit.create({
      data: { operatorName: operator, targetUserId: user.id, targetEmail: user.email, reason, approvalReference },
      select: { id: true, createdAt: true },
    });
  });

  console.log(JSON.stringify({ passwordReset: true, auditId: audit.id, recordedAt: audit.createdAt.toISOString(), sessionsRevoked: true, pendingResetLinksInvalidated: true }));
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : "Password reset failed; no password was printed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
