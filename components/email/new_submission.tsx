import { Section, Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { detailsBox, detailText, getBaseUrl, text } from "./shared";

export const NewSubmissionEmail = ({ startupName = "New startup", founderName = "Founder", category = "Technology" }: { startupName?: string; founderName?: string; category?: string }) => (
  <EmailLayout preview={`New startup for review: ${startupName}`} category="Review queue" title="A startup is ready for review."
    reason="You received this because you are an Anshkosh admin or reviewer.">
    <Text style={text}>A founder has submitted a startup profile for moderation.</Text>
    <Section style={detailsBox}>
      <Text style={detailText}><strong>Startup:</strong> {startupName}</Text>
      <Text style={detailText}><strong>Founder:</strong> {founderName}</Text>
      <Text style={detailText}><strong>Category:</strong> {category}</Text>
    </Section>
    <EmailAction href={`${getBaseUrl()}/admin/moderation`}>Review submission</EmailAction>
  </EmailLayout>
);
export default NewSubmissionEmail;
