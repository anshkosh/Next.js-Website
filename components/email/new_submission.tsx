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

export const NewSubmissionEmail = ({
  startupName = "New Startup",
  founderName = "Founder",
  category = "Technology",
}: {
  startupName?: string;
  founderName?: string;
  category?: string;
}) => {
  const baseUrl = getBaseUrl();

  return (
    <Html>
      <Head />
      <Preview>New startup for review: {startupName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logoContainer}>
              <Img
                src={`${baseUrl}/logo.png`}
                width="32"
                height="32"
                alt="Anshkosh Logo"
                style={logoImage}
              />
              <span style={logoText}>
                <span style={logoTextPrimary}>ANSH</span>
                <span style={logoTextSecondary}>KOSH</span>
              </span>
            </div>
          </Section>
          <Section style={content}>
            <Heading style={heading}>New Submission 📬</Heading>
            <Text style={text}>
              A new startup has been submitted to anshkosh and is awaiting
              moderation.
            </Text>
            <div style={detailsBox}>
              <Text style={detailText}>
                <strong>Startup:</strong> {startupName}
              </Text>
              <Text style={detailText}>
                <strong>Founder:</strong> {founderName}
              </Text>
              <Text style={detailText}>
                <strong>Category:</strong> {category}
              </Text>
            </div>
            <Section style={btnContainer}>
              <Button style={buttonDark} href={`${baseUrl}/admin/moderation`}>
                Review Now
              </Button>
            </Section>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you are an admin or reviewer on
              anshkosh.
              <br />
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default NewSubmissionEmail;
