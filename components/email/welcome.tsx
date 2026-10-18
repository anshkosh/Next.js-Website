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
  button,
  hr,
  footer,
  footerText,
  link,
} from "./shared";

export const WelcomeEmail = ({
  founderName = "Founder",
  url,
}: {
  founderName?: string;
  url?: string;
}) => {
  const baseUrl = getBaseUrl();
  const targetUrl = url || `${baseUrl}/login`;

  return (
    <Html>
      <Head />
      <Preview>Welcome to anshkosh! 🚀</Preview>
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
            <Heading style={heading}>
              Welcome to anshkosh, {founderName}!
            </Heading>
            <Text style={text}>
              We&apos;re thrilled to have you join India&apos;s premier startup showcase
              platform. anshkosh is the best place to launch, discover, and
              upvote the most exciting startups in the country.
            </Text>
            <Text style={text}>
              Ready to show the world what you&apos;re building?
            </Text>
            <Section style={btnContainer}>
              <Button style={button} href={targetUrl}>
                {url ? "Verify Email & Get Started" : "Submit Your Startup"}
              </Button>
            </Section>
            <Text style={text}>
              Best,
              <br />
              The anshkosh Team
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you signed up for anshkosh.
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

export default WelcomeEmail;
