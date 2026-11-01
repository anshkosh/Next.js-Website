import { Section, Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { getBaseUrl, notesContainer, notesText, text } from "./shared";

export const StartupRejectedEmail = ({ startupName = "Your startup", startupId = "id", notes = "Please review your submission." }: { startupName?: string; startupId?: string; notes?: string }) => (
  <EmailLayout preview={`Update needed for ${startupName}.`} category="Startup review" title="A few changes are needed."
    reason="You received this update about your startup submission." preferences>
    <Text style={text}>We reviewed your submission for <strong>{startupName}</strong>. Please address the review notes before submitting it again.</Text>
    <Section style={notesContainer}><Text style={notesText}>{notes}</Text></Section>
    <Text style={text}>Your saved work is available in your dashboard.</Text>
    <EmailAction href={`${getBaseUrl()}/startup/${encodeURIComponent(startupId)}/edit`}>Edit your startup</EmailAction>
  </EmailLayout>
);
export default StartupRejectedEmail;
