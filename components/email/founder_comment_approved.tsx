import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Img,
} from "@react-email/components";
import * as React from "react";

import {
  getBaseUrl,
  main,
  container,
  header,
  logoContainer,
  logoImage,
  logoText,
  logoTextPrimary,
  logoTextSecondary,
  content,
  heading,
  text,
  detailsBox,
  detailText,
  btnContainer,
  buttonDark,
  hr,
  footer,
  footerText,
} from "./shared";

export default function FounderCommentApprovedEmail({
  startupName = "Your startup",
  authorName = "A visitor",
  commentBody = "",
  startupId = "",
}: {
  startupName?: string;
  authorName?: string;
  commentBody?: string;
  startupId?: string;
}) {
  const baseUrl = getBaseUrl();
  const discussionUrl = `${baseUrl}/startup/${encodeURIComponent(startupId)}/discussion`;

  return (
    <Html>
      <Head />
      <Preview>A visitor’s comment on {startupName} is now public.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logoContainer}>
              <Img src={`${baseUrl}/logo.png`} width="32" height="32" alt="Anshkosh Logo" style={logoImage} />
              <span style={logoText}>
                <span style={logoTextPrimary}>ANSH</span>
                <span style={logoTextSecondary}>KOSH</span>
              </span>
            </div>
          </Section>
          <Section style={content}>
            <Heading style={heading}>A new comment is live</Heading>
            <Text style={text}>
              A moderator approved a comment from <strong>{authorName}</strong> on <strong>{startupName}</strong>.
            </Text>
            <Section style={detailsBox}>
              <Text style={detailText}>{commentBody}</Text>
            </Section>
            <Section style={btnContainer}>
              <Button style={buttonDark} href={discussionUrl}>Open your discussion</Button>
            </Section>
            <Text style={text}>
              You can reply from your dashboard. Replies are reviewed before they appear publicly.
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You received this because approved comment alerts are enabled for your account. Manage this preference in{" "}
              <a href={`${baseUrl}/settings#email-notifications`} style={{ color: "#6b7280", textDecoration: "underline" }}>Profile settings</a>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
