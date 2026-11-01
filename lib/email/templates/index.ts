import { render } from "@react-email/components";
import WelcomeEmail from "@/components/email/welcome";
import StartupApprovedEmail from "@/components/email/startup_approved";
import StartupRejectedEmail from "@/components/email/startup_rejected";
import UpvoteMilestoneEmail from "@/components/email/upvote_milestone";
import NewSubmissionEmail from "@/components/email/new_submission";
import ContactInquiryEmail from "@/components/email/contact_inquiry";
import * as React from "react";
import NewsletterConfirmationEmail from "@/components/email/newsletter_confirmation";
import FounderCommentApprovedEmail from "@/components/email/founder_comment_approved";
import AccountSecurityEmail from "@/components/email/account_security";
import ContactAcknowledgementEmail from "@/components/email/contact_acknowledgement";

export type TemplateName = "welcome" | "startup_approved" | "startup_rejected" | "upvote_milestone" | "new_submission" | "contact_inquiry" | "newsletter_confirmation" | "founder_comment_approved" | "password_reset" | "email_change" | "account_export_code" | "account_deletion_code" | "contact_acknowledgement";

export async function renderEmailTemplate(template: TemplateName, data: Record<string, unknown>): Promise<string> {
  switch (template) {
    case "password_reset":
    case "email_change":
    case "account_export_code":
    case "account_deletion_code":
      return render(React.createElement(AccountSecurityEmail, {
        kind: template, userName: String(data.userName ?? "there"), url: String(data.url ?? ""),
        newEmail: String(data.newEmail ?? ""), code: String(data.code ?? ""),
      }));
    case "contact_acknowledgement":
      return render(React.createElement(ContactAcknowledgementEmail, {
        senderName: String(data.senderName ?? "there"), subject: String(data.subject ?? "your enquiry"),
      }));
    case "newsletter_confirmation":
      return render(React.createElement(NewsletterConfirmationEmail, { confirmationUrl: String(data.confirmationUrl) }));
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
      return render(React.createElement(ContactInquiryEmail, {
        senderName: String(data.senderName ?? ""), senderEmail: String(data.senderEmail ?? ""),
        subject: String(data.subject ?? ""), message: String(data.message ?? ""), submittedAt: String(data.submittedAt ?? ""),
      }));
    case "founder_comment_approved":
      return render(React.createElement(FounderCommentApprovedEmail, {
        startupName: String(data.startupName ?? "Your startup"),
        authorName: String(data.authorName ?? "A visitor"),
        commentBody: String(data.commentBody ?? ""),
        startupId: String(data.startupId ?? ""),
      }));
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

export function getSubject(template: TemplateName, data: Record<string, unknown>): string {
  switch (template) {
    case "newsletter_confirmation": return "Confirm your Anshkosh newsletter signup";
    case "welcome": return "Welcome to Anshkosh";
    case "password_reset": return "Reset your Anshkosh password";
    case "email_change": return "Confirm your Anshkosh email change";
    case "account_export_code": return "Your Anshkosh data download code";
    case "account_deletion_code": return "Confirm your Anshkosh account deletion";
    case "contact_acknowledgement": return "We received your message — Anshkosh";
    case "startup_approved": return `${data.startupName} has been approved on Anshkosh`;
    case "startup_rejected": return `Update needed: ${data.startupName}`;
    case "upvote_milestone": return `${data.startupName} reached ${data.milestone} upvotes on Anshkosh`;
    case "new_submission": return `New startup for review: ${data.startupName}`;
    case "contact_inquiry": return `[Contact] ${data.subject} — from ${data.senderName}`;
    case "founder_comment_approved": return `A comment on ${data.startupName} is now public`;
    default: return "Message from Anshkosh";
  }
}
