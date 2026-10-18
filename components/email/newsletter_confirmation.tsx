import { Html, Head, Body, Preview, Container, Heading, Text, Button } from "@react-email/components";
import { main, container, heading, text, buttonDark } from "./shared";

export default function NewsletterConfirmationEmail({ confirmationUrl }: { confirmationUrl: string }) {
  return <Html lang="en" dir="ltr"><Head /><Body style={main}>
    <Preview>Confirm your request for occasional Anshkosh updates</Preview>
    <Container style={container}>
      <Heading as="h1" style={heading}>Confirm your newsletter signup</Heading>
      <Text style={text}>You requested occasional founder stories and pilot updates from Anshkosh Pvt Ltd. Confirm your email to join the list.</Text>
      <Button href={confirmationUrl} style={{ ...buttonDark, boxSizing: "border-box" }}>Review and confirm signup</Button>
      <Text style={text}>This link expires in 24 hours. If you did not request this, ignore this email: you will not be subscribed.</Text>
      <Text style={text}>You can unsubscribe without an account. Anshkosh Pvt Ltd · Hyderabad, Telangana, India · hello@anshkosh.com</Text>
    </Container>
  </Body></Html>;
}
NewsletterConfirmationEmail.PreviewProps = { confirmationUrl: "https://www.anshkosh.com/newsletter/confirm?token=preview" };
