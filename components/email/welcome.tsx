import { Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { getBaseUrl, text } from "./shared";

export const WelcomeEmail = ({ founderName = "there", url }: { founderName?: string; url?: string }) => (
  <EmailLayout
    preview={url ? "Verify your email to get started on Anshkosh." : "Your Anshkosh account is ready."}
    category={url ? "Email verification" : "Welcome"}
    title={`Welcome to Anshkosh, ${founderName}.`}
    reason="You received this email because you signed up for Anshkosh."
  >
    <Text style={text}>Explore Indian startups, share useful feedback and follow what founders are building.</Text>
    <Text style={text}>{url ? "Verify your email to get started. You can enable founder mode in Profile settings whenever you want to share your own startup." : "Open your account to explore startups. You can enable founder mode in Profile settings whenever you want to share your own startup."}</Text>
    <EmailAction href={url || `${getBaseUrl()}/login`} showUrl={!!url}>{url ? "Verify email and get started" : "Open your account"}</EmailAction>
    {url && <Text style={text}>If you did not create this account, you can ignore this email.</Text>}
  </EmailLayout>
);
export default WelcomeEmail;
