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
  notesContainer,
  notesText,
  btnContainer,
  button,
  hr,
  footer,
  footerText,
  link,
} from "./shared";

export const StartupRejectedEmail = ({
  startupName = "Your Startup",
  startupId = "id",
  notes = "Please review your submission.",
}: {
  startupName?: string;
  startupId?: string;
  notes?: string;
}) => {
  const baseUrl = getBaseUrl();

  return (
    <Html>
      <Head />
      <Preview>Update needed for {startupName}</Preview>
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
            <Heading style={heading}>Update Needed</Heading>
            <Text style={text}>
              We&apos;ve reviewed your submission for <strong>{startupName}</strong>.
              Before we can set it live, we need you to make a few changes.
            </Text>
            <Section style={notesContainer}>
              <Text style={notesText}>{notes}</Text>
            </Section>
            <Text style={text}>
              Don&apos;t worry! Just make the changes and resubmit your startup for
              review.
            </Text>
            <Section style={btnContainer}>
              <Button
                style={button}
                href={`${baseUrl}/startup/${startupId}/edit`}
              >
                Edit Your Startup
              </Button>
            </Section>
            <Text style={text}>
              Thanks,
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

export default StartupRejectedEmail;
