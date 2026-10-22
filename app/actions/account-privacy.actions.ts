"use server";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { z } from "zod";
import { AccountPrivacyError, deleteAccountSchema, discardUnsentPrivacyCode, eraseAccount, issuePrivacyCode, privacyPurposeSchema } from "@/lib/account-privacy";
import { limitPrivacyAction, privacyActor } from "@/lib/account-privacy-auth";
import { sendEmail } from "@/lib/email/adapter";
import { revalidateSavedPath } from "@/lib/cache-after-save";

export async function requestAccountPrivacyCode(input: unknown) {
  const parsed = z.object({ purpose: privacyPurposeSchema }).strict().safeParse(input);
  if (!parsed.success) return { error: "Choose download or account deletion." };
  try {
    const actor = await privacyActor(await headers());
    await limitPrivacyAction(actor.userId, `request:${parsed.data.purpose}`, 3);
    const issued = await issuePrivacyCode(actor, parsed.data.purpose);
    const deleting = parsed.data.purpose === "delete";
    const action = deleting ? "delete your account" : "download your account data";
    try {
      await sendEmail({
        to: issued.email,
        subject: deleting ? "Confirm your Anshkosh account deletion" : "Your Anshkosh data download code",
        html: `<html lang="en"><body><h1>${deleting ? "Account deletion confirmation" : "Account data download"}</h1><p>You asked to ${action}. Paste this code into Account settings on Anshkosh:</p><p style="font-family:monospace;font-size:24px;overflow-wrap:anywhere">${issued.code}</p><p>This code expires in 15 minutes and can be used once. ${deleting ? "Your account is only deleted after you enter the code, type DELETE and confirm on the website." : "It can only authorize a data download, not account deletion."}</p><p>If you did not request this, ignore this email. Do not share the code.</p></body></html>`,
        text: `You asked to ${action}. Paste this code into Account settings on Anshkosh: ${issued.code}\nThe code expires in 15 minutes and can be used once. ${deleting ? "Nothing is deleted until you type DELETE and confirm on the website." : "This code cannot delete your account."}\nIf you did not request this, ignore this email. Do not share the code.`,
      });
    } catch {
      await discardUnsentPrivacyCode(issued.proof).catch(() => {});
      return { error: "We could not send the confirmation email. Please try again later." };
    }
    return { success: true };
  } catch (error) {
    return { error: error instanceof AccountPrivacyError ? error.message : "The confirmation request could not be completed. Please try again." };
  }
}

export async function deleteMyAccount(input: unknown) {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const actor = await privacyActor(await headers());
    await limitPrivacyAction(actor.userId, "delete", 10);
    await eraseAccount(actor, parsed.data.code);
    revalidateSavedPath("/", "layout");
  } catch (error) {
    return { error: error instanceof AccountPrivacyError ? error.message : "Your account could not be deleted. Nothing is confirmed deleted; please try again." };
  }
  // The protected settings layout can no longer render after session revocation.
  // Redirect outside the catch so a successful deletion is never reported failed.
  redirect("/account-deleted", RedirectType.replace);
}
