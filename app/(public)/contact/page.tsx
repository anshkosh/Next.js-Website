import { seoMetadata } from "@/lib/seo";
import ContactContent from "./ContactContent";
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/validators/contact.schema";

export const metadata = seoMetadata({
  title: "Contact Us — Anshkosh",
  description: "Get in touch with the Anshkosh team about questions, partnership ideas, or feedback.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string | string[] }>;
}) {
  const { subject } = await searchParams;
  const initialSubject = typeof subject === "string" &&
    CONTACT_SUBJECTS.includes(subject as ContactSubject)
    ? subject as ContactSubject
    : "";
  return <ContactContent key={initialSubject} initialSubject={initialSubject} />;
}
