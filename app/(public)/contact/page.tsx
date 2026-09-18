import { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact Us — Anshkosh",
  description:
    "Get in touch with the Anshkosh team. Whether you have a question, a partnership idea, or feedback, we'd love to hear from you.",
  openGraph: {
    title: "Contact Us — Anshkosh",
    description:
      "Reach out to the Anshkosh team with any questions, partnership ideas, or feedback.",
    url: "https://www.anshkosh.com/contact",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
