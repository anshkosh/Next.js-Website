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
  buttonGold,
  hr,
  footer,
  footerText,
  link,
} from "./shared";

export const UpvoteMilestoneEmail = ({
  startupName = "Your Startup",
  milestone = 100,
  slug = "your-startup",
}: {
  startupName?: string;
  milestone?: number;
  slug?: string;
}) => {
  const baseUrl = getBaseUrl();

  return (
    <Html>
      <Head />
      <Preview>{`🎉 ${startupName} hit ${milestone} upvotes!`}</Preview>
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
            <Heading style={heading}>Congratulations! 🚀</Heading>
            <Text style={text}>
              Amazing work! <strong>{startupName}</strong> just crossed a
              massive milestone of <strong>{milestone} upvotes</strong> on
              anshkosh!
            </Text>
            <Text style={text}>
              People are loving what you&apos;re building. Keep up the momentum!
            </Text>
            <Section style={btnContainer}>
              <Button style={buttonGold} href={`${baseUrl}/startups/${slug}`}>
                View Your Listing
              </Button>
            </Section>
            <Text style={text}>
              Keep shining,
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

export default UpvoteMilestoneEmail;
