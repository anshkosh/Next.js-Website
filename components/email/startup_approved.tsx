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
  btnContainer,
  buttonSuccess,
  hr,
  footer,
  footerText,
  link,
} from "./shared";

export const StartupApprovedEmail = ({
  startupName = "Your Startup",
}: {
  startupName?: string;
  slug?: string;
}) => {
  const baseUrl = getBaseUrl();

  return (
    <Html>
      <Head />
      <Preview>Your startup has been approved on Anshkosh.</Preview>
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
            <Heading style={heading}>Great news! 🎉</Heading>
            <Text style={text}>
              Your startup, <strong>{startupName}</strong>, has been approved
              on Anshkosh.
            </Text>
            <Text style={text}>
              Your approved listing is public while founder mode is on. You can
              manage its visibility from your dashboard without losing saved work.
            </Text>
            <Section style={btnContainer}>
              <Button
                style={buttonSuccess}
                href={`${baseUrl}/dashboard`}
              >
                Open Your Dashboard
              </Button>
            </Section>
            <Text style={text}>
              Best of luck,
              <br />
              The anshkosh Team
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you submitted a startup to
              anshkosh.
              <br />
              <a href="#" style={link}>
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default StartupApprovedEmail;
