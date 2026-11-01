# Email templates and branding

Application mail is rendered through `lib/email/templates/index.ts` and the shared React Email layout in `components/email/layout.tsx`. The layout includes the existing Anshkosh rosette, the ANSH/KOSH wordmark, an orange accent, readable text, a primary action and a common company/help/privacy footer. It uses presentation tables and inline styles. The wordmark stays readable when images are blocked; the PNG logo uses the public HTTPS website URL rather than a local development address.

The renderer covers welcome/verification, password reset, email change, account export/deletion codes, startup approval/review notes, vote milestones, approved-comment alerts, newsletter confirmation, contact enquiries/acknowledgements and admin submission notices. Account notification footers link to the existing email preferences. Essential security emails do not offer an unsubscribe action. Newsletter confirmation retains its existing consent and expiry wording.

Better Auth still issues and validates recovery/verification links. Privacy confirmation still uses the existing single-use codes and 15-minute expiry. Email rendering does not create, consume or replace those tokens. React escapes message text and user-provided values; templates must not concatenate untrusted HTML.

## Local previews and checks

Run `npx tsx scripts/preview-emails.ts <output-directory>` to generate an HTML gallery and 14 sample emails. The script only renders files; it does not queue or send messages. Open the generated `index.html` to browse them. Sample links and codes are previews.

Run `npx vitest run __tests__/email-templates.test.ts __tests__/account-privacy-actions.test.ts __tests__/email-preferences.test.ts __tests__/public-form-identity.test.ts`. The checks cover branding, preserved security URLs, escaped user input, privacy code purpose and notification preferences. Run the normal lint/type checks and CI before merging.

## Operations alert installation

Operations alerts run outside the website process. `deploy/operations-email.mjs` provides their dependency-free HTML renderer; the alert retains its plain-text body. `deploy/operations.mjs` imports this module, and the first-install script includes it.

**A normal website deploy does not update the installed root-owned operations helper.** Activating the alert design on an existing VPS requires owner-authorized maintenance: compare the reviewed versions with the installed helper, take the deployment lock, preserve a private backup, install `operations-email.mjs` alongside the helper and update only the reviewed branding changes in `operations.mjs`. Keep root ownership and mode 644, run Node syntax checks and retain any unrelated operational fixes already on the VPS. Install the dependency before the helper that imports it. Verify alert rendering and delivery after installation. Do not rerun the first-install script over the existing operations setup.
