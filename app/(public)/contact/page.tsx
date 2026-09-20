import { seoMetadata } from "@/lib/seo";
import ContactContent from "./ContactContent";

export const metadata = seoMetadata({
  title: "Contact Us — Anshkosh",
  description: "Get in touch with the Anshkosh team about questions, partnership ideas, or feedback.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactContent />;
}
