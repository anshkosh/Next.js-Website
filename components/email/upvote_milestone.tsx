import { Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { getBaseUrl, text } from "./shared";

export const UpvoteMilestoneEmail = ({ startupName = "Your startup", milestone = 100, slug = "your-startup" }: { startupName?: string; milestone?: number; slug?: string }) => (
  <EmailLayout preview={`${startupName} reached ${milestone} upvotes on Anshkosh.`} category="Community activity"
    title={`${milestone} upvotes for ${startupName}.`} reason="You received this because vote milestone alerts are enabled for your account." preferences>
    <Text style={text}>Your startup profile has reached <strong>{milestone} upvotes</strong> on Anshkosh.</Text>
    <Text style={text}>Keep sharing progress and inviting useful feedback. Votes reflect community participation; they do not verify demand or product-market fit.</Text>
    <EmailAction href={`${getBaseUrl()}/startups/${encodeURIComponent(slug)}`}>View your listing</EmailAction>
  </EmailLayout>
);
export default UpvoteMilestoneEmail;
