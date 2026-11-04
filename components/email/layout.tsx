import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { button, getBaseUrl, text } from "./shared";

interface EmailLayoutProps {
  preview: string;
  category: string;
  title: string;
  reason: string;
  preferences?: boolean;
  children: React.ReactNode;
}

// Tables and inline styles also work in email clients without flexbox or web fonts.
export default function EmailLayout({ preview, category, title, reason, preferences = false, children }: EmailLayoutProps) {
  const baseUrl = getBaseUrl();
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "24px 12px", backgroundColor: "#f4f5f7", fontFamily: "Arial, Helvetica, sans-serif", color: "#111827" }}>
        <Container style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
          <Section style={{ backgroundColor: "#ffffff", colorScheme: "light", border: "1px solid #e5e7eb", borderTop: "4px solid #e8521e", borderRadius: "12px 12px 0 0", padding: "24px" }}>
            <Link href={baseUrl}>
              <Img src="https://www.anshkosh.com/email-brand.png" alt="Anshkosh" width="216" height="48" style={{ display: "block", border: 0, maxWidth: "100%", height: "auto" }} />
            </Link>
          </Section>
          <Section style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderTop: 0, borderRadius: "0 0 12px 12px", padding: "28px 24px" }}>
            <Text style={{ color: "#a23510", fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", lineHeight: "16px", margin: "0 0 8px", textTransform: "uppercase" }}>{category}</Text>
            <Heading as="h1" style={{ color: "#111827", fontSize: "27px", fontWeight: 700, letterSpacing: "-0.6px", lineHeight: "35px", margin: "0 0 20px", overflowWrap: "anywhere" }}>{title}</Heading>
            {children}
            <Text style={{ ...text, margin: "24px 0 0", fontSize: "14px" }}>The Anshkosh team</Text>
          </Section>
          <Section style={{ padding: "20px 12px 8px", textAlign: "center" }}>
            <Text style={footerText}>{reason}</Text>
            {preferences && <Text style={footerText}><Link href={`${baseUrl}/settings#email-notifications`} style={footerLink}>Manage email preferences</Link></Text>}
            <Text style={footerText}>
              <Link href={baseUrl} style={footerLink}>Anshkosh</Link>{" · "}
              <Link href="mailto:hello@anshkosh.com" style={footerLink}>Get help</Link>{" · "}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy</Link>
            </Text>
            <Text style={footerText}>Anshkosh Pvt Ltd · Hyderabad, Telangana, India</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailAction({ href, children, showUrl = false }: { href: string; children: React.ReactNode; showUrl?: boolean }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <Button href={href} style={button}>{children}</Button>
      {showUrl && <Text style={{ ...footerText, margin: "16px 0 0", textAlign: "left", overflowWrap: "anywhere", wordBreak: "break-all" }}>
        If the button does not work, copy this link into your browser:<br />
        <Link href={href} style={footerLink}>{href}</Link>
      </Text>}
    </Section>
  );
}

const footerText: React.CSSProperties = { color: "#6b7280", fontSize: "12px", lineHeight: "19px", margin: "6px 0" };
const footerLink: React.CSSProperties = { color: "#4b5563", textDecoration: "underline" };
