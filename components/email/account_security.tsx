import { Section, Text } from "@react-email/components";
import EmailLayout, { EmailAction } from "./layout";
import { detailsBox, getBaseUrl, text } from "./shared";

export type SecurityEmailKind = "password_reset" | "email_change" | "account_export_code" | "account_deletion_code";

export default function AccountSecurityEmail({ kind, userName = "there", url = "", newEmail = "", code = "" }: {
  kind: SecurityEmailKind;
  userName?: string;
  url?: string;
  newEmail?: string;
  code?: string;
}) {
  const deleting = kind === "account_deletion_code";
  const codeEmail = deleting || kind === "account_export_code";
  const title = kind === "password_reset" ? "Reset your password." : kind === "email_change" ? "Confirm your email change." : deleting ? "Confirm account deletion." : "Your account data download.";
  return (
    <EmailLayout preview={title} category="Account security" title={title}
      reason="You received this because an account security action was requested on Anshkosh.">
      {!codeEmail && <Text style={text}>Hi {userName},</Text>}
      {kind === "password_reset" && <>
        <Text style={text}>Use the link below to choose a new Anshkosh password.</Text>
        <EmailAction href={url} showUrl>Reset your password</EmailAction>
      </>}
      {kind === "email_change" && <>
        <Text style={text}>You asked to change your Anshkosh email to <strong>{newEmail}</strong>. Confirm this request below. We will then send a verification link to the new address.</Text>
        <EmailAction href={url} showUrl>Confirm email change</EmailAction>
      </>}
      {codeEmail && <>
        <Text style={text}>You asked to {deleting ? "delete your account" : "download your account data"}. Paste this code into Account settings on Anshkosh:</Text>
        <Section style={detailsBox}>
          <Text style={{ color: "#111827", fontFamily: "'Courier New', monospace", fontSize: "20px", lineHeight: "30px", letterSpacing: "1px", margin: 0, overflowWrap: "anywhere", wordBreak: "break-all" }}>{code}</Text>
        </Section>
        <Text style={text}>This code expires in 15 minutes and can be used once. {deleting ? "Your account is only deleted after you enter the code, type DELETE and confirm on the website." : "It can only authorize a data download, not account deletion."}</Text>
        <EmailAction href={`${getBaseUrl()}/settings`}>Open account settings</EmailAction>
        <Text style={text}>Do not share the code.</Text>
      </>}
      <Text style={text}>If you did not request this, you can ignore this email.</Text>
    </EmailLayout>
  );
}
