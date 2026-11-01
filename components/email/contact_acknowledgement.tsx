import { Text } from "@react-email/components";
import { CONTACT_RESPONSE_TARGET } from "@/lib/contact-copy";
import EmailLayout from "./layout";
import { text } from "./shared";

export default function ContactAcknowledgementEmail({ senderName, subject }: { senderName: string; subject: string }) {
  return (
    <EmailLayout preview="Your message has reached the Anshkosh team." category="Contact confirmation" title="We received your message."
      reason="You received this confirmation because you contacted Anshkosh.">
      <Text style={text}>Hi {senderName},</Text>
      <Text style={text}>Thanks for reaching out. We received your message about <strong>{subject}</strong>. {CONTACT_RESPONSE_TARGET}</Text>
    </EmailLayout>
  );
}
