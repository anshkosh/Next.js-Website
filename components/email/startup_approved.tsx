import { Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { getBaseUrl, text } from "./shared";

export const StartupApprovedEmail = ({ startupName = "Your startup" }: { startupName?: string; slug?: string }) => (
  <EmailLayout preview={`${startupName} has been approved on Anshkosh.`} category="Startup review" title="Your startup is approved."
    reason="You received this update about your startup submission." preferences>
    <Text style={text}>Your startup, <strong>{startupName}</strong>, has been approved on Anshkosh.</Text>
    <Text style={text}>Your approved listing is public while founder mode is on. You can manage its visibility from your dashboard without losing saved work.</Text>
    <EmailAction href={`${getBaseUrl()}/dashboard`}>Open your dashboard</EmailAction>
  </EmailLayout>
);
export default StartupApprovedEmail;
