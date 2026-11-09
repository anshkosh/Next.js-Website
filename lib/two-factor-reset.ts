import type { Prisma } from "@prisma/client";

export type TwoFactorResetInput = {
  operatorId: string | null;
  operatorName: string;
  targetUserId: string;
  targetEmail: string;
  reason: string;
};

export function validResetReason(reason: unknown): reason is string {
  return typeof reason === "string" && reason.trim().length >= 5 && reason.trim().length <= 500;
}

/**
 * Removes a staff member's authenticator and backup codes, signs them out
 * everywhere and records who did it. An admin is sent back through forced
 * enrollment at their next sign-in. Call inside a transaction.
 */
export async function resetTwoFactor(tx: Prisma.TransactionClient, input: TwoFactorResetInput) {
  await tx.twoFactor.deleteMany({ where: { userId: input.targetUserId } });
  await tx.user.update({ where: { id: input.targetUserId }, data: { twoFactorEnabled: false } });
  await tx.session.deleteMany({ where: { userId: input.targetUserId } });
  return tx.adminTwoFactorResetAudit.create({
    data: {
      operatorId: input.operatorId,
      operatorName: input.operatorName.slice(0, 100),
      targetUserId: input.targetUserId,
      targetEmail: input.targetEmail,
      reason: input.reason.trim(),
    },
    select: { id: true, createdAt: true },
  });
}
