import { render } from "@react-email/components";
import WelcomeEmail from "@/components/email/welcome";
import StartupApprovedEmail from "@/components/email/startup_approved";
import StartupRejectedEmail from "@/components/email/startup_rejected";
import UpvoteMilestoneEmail from "@/components/email/upvote_milestone";
import NewSubmissionEmail from "@/components/email/new_submission";
import ContactInquiryEmail from "@/components/email/contact_inquiry";
import * as React from "react";

export type TemplateName = "welcome" | "startup_approved" | "startup_rejected" | "upvote_milestone" | "new_submission" | "contact_inquiry";

export async function renderEmailTemplate(template: TemplateName, data: Record<string, any>): Promise<string> {
  switch (template) {
    case "welcome":
      return render(React.createElement(WelcomeEmail, data));
    case "startup_approved":
      return render(React.createElement(StartupApprovedEmail, data));
    case "startup_rejected":
      return render(React.createElement(StartupRejectedEmail, data));
    case "upvote_milestone":
      return render(React.createElement(UpvoteMilestoneEmail, data));
    case "new_submission":
      return render(React.createElement(NewSubmissionEmail, data));
    case "contact_inquiry":
      return render(React.createElement(ContactInquiryEmail, data as Parameters<typeof ContactInquiryEmail>[0]));
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

export function getSubject(template: TemplateName, data: Record<string, any>): string {
  switch (template) {
    case "welcome": return "Welcome to anshkosh! 🚀";
    case "startup_approved": return `${data.startupName} is now live on anshkosh!`;
    case "startup_rejected": return `Update needed: ${data.startupName}`;
    case "upvote_milestone": return `🎉 ${data.startupName} hit ${data.milestone} upvotes!`;
    case "new_submission": return `New startup for review: ${data.startupName}`;
    case "contact_inquiry": return `[Contact] ${data.subject} — from ${data.senderName}`;
    default: return "Message from anshkosh";
  }
}
