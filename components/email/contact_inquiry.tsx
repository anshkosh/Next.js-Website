import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";

interface ContactInquiryEmailProps {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export default function ContactInquiryEmail({
  senderName,
  senderEmail,
  subject,
  message,
  submittedAt,
}: ContactInquiryEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>
              ANSH<span style={logoAccent}>KOSH</span>
            </Heading>
            <Text style={headerSub}>New Contact Inquiry</Text>
          </Section>

          {/* Meta row */}
          <Section style={metaSection}>
            <Row>
              <Column style={metaLabel}>From</Column>
              <Column style={metaValue}>
                {senderName} &lt;{senderEmail}&gt;
              </Column>
            </Row>
            <Row>
              <Column style={metaLabel}>Subject</Column>
              <Column style={metaValue}>{subject}</Column>
            </Row>
            <Row>
              <Column style={metaLabel}>Received</Column>
              <Column style={metaValue}>{submittedAt}</Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Message */}
          <Section style={messageSection}>
            <Text style={messageLabel}>Message</Text>
            <Text style={messageBody}>{message}</Text>
          </Section>

          <Hr style={divider} />

          {/* Footer note */}
          <Section>
            <Text style={footerText}>
              Reply directly to this email to respond to {senderName} at{" "}
              {senderEmail}.
            </Text>
            <Text style={footerText}>— Anshkosh Contact System</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#FAFAFA",
  fontFamily: "'Inter', Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  maxWidth: "600px",
  margin: "0 auto",
  overflow: "hidden",
  border: "1px solid #E5E7EB",
};

const header: React.CSSProperties = {
  backgroundColor: "#E8521E",
  padding: "28px 32px 20px",
  textAlign: "center",
};

const logo: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "0.05em",
  margin: 0,
};

const logoAccent: React.CSSProperties = {
  color: "#FFD6C4",
};

const headerSub: React.CSSProperties = {
  color: "#FFE8DC",
  fontSize: "13px",
  marginTop: "4px",
  marginBottom: 0,
};

const metaSection: React.CSSProperties = {
  padding: "20px 32px 8px",
};

const metaLabel: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  width: "90px",
  paddingBottom: "10px",
};

const metaValue: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  paddingBottom: "10px",
};

const divider: React.CSSProperties = {
  borderColor: "#E5E7EB",
  margin: "0 32px",
};

const messageSection: React.CSSProperties = {
  padding: "20px 32px",
};

const messageLabel: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "8px",
};

const messageBody: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.75",
  whiteSpace: "pre-wrap",
  margin: 0,
};

const footerText: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "12px",
  padding: "0 32px",
  margin: "4px 0",
};
