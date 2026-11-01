import { Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { text } from "./shared";

export default function NewsletterConfirmationEmail({ confirmationUrl }: { confirmationUrl: string }) {
  return (
    <EmailLayout preview="Confirm your request for occasional Anshkosh updates." category="Newsletter"
      title="Confirm your newsletter signup." reason="You received this because someone requested newsletter updates for this email address.">
      <Text style={text}>You requested occasional founder stories and pilot updates from Anshkosh Pvt Ltd. Confirm your email to join the list.</Text>
      <EmailAction href={confirmationUrl} showUrl>Review and confirm signup</EmailAction>
      <Text style={text}>This link expires in 24 hours. If you did not request this, ignore this email: you will not be subscribed.</Text>
      <Text style={text}>You can unsubscribe without an account using the link in future newsletter emails.</Text>
    </EmailLayout>
  );
}
NewsletterConfirmationEmail.PreviewProps = { confirmationUrl: "https://www.anshkosh.com/newsletter/confirm?token=preview" };
