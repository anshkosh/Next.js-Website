import { Link, Section, Text } from "@react-email/components";
import EmailLayout from "./layout";
import { detailsBox, detailText, text } from "./shared";

interface ContactInquiryEmailProps {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  submittedAt: string;
}
export default function ContactInquiryEmail({ senderName, senderEmail, subject, message, submittedAt }: ContactInquiryEmailProps) {
  return (
    <EmailLayout preview={`Contact enquiry: ${subject}`} category="Contact inbox" title="A new message for Anshkosh."
      reason="You received this because you are a configured contact-form recipient.">
      <Section style={detailsBox}>
        <Text style={detailText}><strong>From:</strong> {senderName} &lt;{senderEmail}&gt;</Text>
        <Text style={detailText}><strong>Subject:</strong> {subject}</Text>
        <Text style={detailText}><strong>Received:</strong> {submittedAt}</Text>
      </Section>
      <Text style={{ ...text, whiteSpace: "pre-wrap" }}>{message}</Text>
      <Text style={text}>To respond, email <Link href={`mailto:${senderEmail}`} style={{ color: "#a23510" }}>{senderEmail}</Link>.</Text>
    </EmailLayout>
  );
}
