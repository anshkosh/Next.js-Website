interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "noreply@anshkosh.com";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured in environment variables.");
  }

  // Explicit, loopback-only mail capture for isolated E2E tests. Never enabled in production.
  const testEndpoint = process.env.E2E_TEST_MODE === "1" && process.env.NODE_ENV !== "production"
    ? "http://127.0.0.1:3181/send" : null;
  const response = await fetch(testEndpoint || "https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "anshkosh", email: fromEmail },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Email provider request failed (${response.status})`);
  }

  const result = await response.json().catch(() => ({}));
  console.log("[Brevo] Email sent successfully. MessageId:", result.messageId || "ok");
}
