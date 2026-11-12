import type { BetterAuthOptions } from "better-auth";
import { verificationLoginHref } from "./login-return";

const RESEND_COOLDOWN_MS = 60_000;

type SendVerificationEmail = NonNullable<NonNullable<BetterAuthOptions["emailVerification"]>["sendVerificationEmail"]>;

export const sendAccountVerificationEmail: SendVerificationEmail = async ({ user, url }, request) => {
  const requestUrl = request && new URL(request.url);
  const requestPath = requestUrl?.pathname.replace(/\/+$/, "");
  const signIn = requestPath === "/api/auth/sign-in/email";
  const resend = signIn || requestPath === "/api/auth/send-verification-email";
  let verificationUrl = url;
  if (signIn) {
    // The destination belongs to the verification link. Setting callbackURL
    // on the sign-in request also redirects successful password sign-ins.
    const link = new URL(url);
    const next = requestUrl?.searchParams.get("next") ?? link.searchParams.get("callbackURL");
    link.searchParams.set("callbackURL", verificationLoginHref(next));
    verificationUrl = link.href;
  }
  const { emailQueue } = await import("./jobs/queues");
  // BullMQ checks and sets the cooldown in the same Redis operation as enqueue.
  const options = resend ? { deduplication: { id: `verification-resend-${user.id}`, ttl: RESEND_COOLDOWN_MS } } : undefined;
  await emailQueue.add("email-verification", {
    template: "welcome",
    to: user.email,
    data: { founderName: user.name, url: verificationUrl },
  }, options);
};
