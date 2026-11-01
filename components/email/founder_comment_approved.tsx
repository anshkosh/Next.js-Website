import { Section, Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { detailsBox, detailText, getBaseUrl, text } from "./shared";

export default function FounderCommentApprovedEmail({ startupName = "Your startup", authorName = "A visitor", commentBody = "", startupId = "" }: { startupName?: string; authorName?: string; commentBody?: string; startupId?: string }) {
  return (
    <EmailLayout preview={`A visitor’s comment on ${startupName} is now public.`} category="Startup discussion"
      title="A new comment is live." reason="You received this because approved comment alerts are enabled for your account." preferences>
      <Text style={text}>A moderator approved a comment from <strong>{authorName}</strong> on <strong>{startupName}</strong>.</Text>
      <Section style={detailsBox}><Text style={detailText}>{commentBody}</Text></Section>
      <EmailAction href={`${getBaseUrl()}/startup/${encodeURIComponent(startupId)}/discussion`}>Open your discussion</EmailAction>
      <Text style={text}>You can reply from your dashboard. Replies are reviewed before they appear publicly.</Text>
    </EmailLayout>
  );
}
