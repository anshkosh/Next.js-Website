import { z } from "zod";

export const CONTACT_SUBJECTS = [
  "General",
  "Partnership",
  "Press",
  "Bug Report",
  "Other",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(254, "Email is too long"),
  subject: z.enum(CONTACT_SUBJECTS, {
    message: "Please select a subject",
  }),
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message must be 2000 characters or fewer"),
  turnstileToken: z.string().min(1, "Please complete the CAPTCHA challenge"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
