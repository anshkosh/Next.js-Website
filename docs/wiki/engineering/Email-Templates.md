# Email templates and branding

Application mail is rendered through `lib/email/templates/index.ts` and the shared React Email layout in `components/email/layout.tsx`. The layout includes the existing Anshkosh rosette, the ANSH/KOSH wordmark, an orange accent, readable text, a primary action and a common company/help/privacy footer. It uses presentation tables and inline styles.

`public/email-brand.svg` exports the website header's actual SVG mark and Oswald Bold wordmark with the same colours, 32px mark, 24px text, 8px gap and tight tracking. A white rounded backing keeps the dark navy wordmark readable when email clients use a dark background. The lettering is outlined, so it does not depend on the recipient having Oswald installed. `node scripts/build-email-brand.mjs` exports the high-resolution `public/email-brand.png`; emails display it at 216 × 48px. Both application and operations messages use this same asset at a public HTTPS URL. The image has an Anshkosh text alternative and the footer retains readable brand text when images are blocked.

The logo header band is white in both the application templates and operations alerts, with an explicit light color scheme so dark-mode clients preserve the logo contrast. The renderer covers welcome/verification, password reset, email change, account export/deletion codes, startup approval/review notes, vote milestones, approved-comment alerts, newsletter confirmation, contact enquiries/acknowledgements and admin submission notices. Account notification footers link to the existing email preferences. Essential security emails do not offer an unsubscribe action. Newsletter confirmation retains its existing consent and expiry wording.

Better Auth still issues and validates recovery/verification links. Privacy confirmation still uses the existing single-use codes and 15-minute expiry. Email rendering does not create, consume or replace those tokens. React escapes message text and user-provided values; templates must not concatenate untrusted HTML.

## Local previews and checks

Run `npx tsx scripts/preview-emails.ts <output-directory>` to generate an HTML gallery and 14 sample emails. The script bundles a local copy of the brand image, so previews work before deployment and without fetching remote images. It only renders files; it does not queue or send messages. Open the generated `index.html` to browse them. Sample links and codes are previews.

Run `npx vitest run __tests__/email-templates.test.ts __tests__/account-privacy-actions.test.ts __tests__/email-preferences.test.ts __tests__/public-form-identity.test.ts`. The checks cover branding, preserved security URLs, escaped user input, privacy code purpose and notification preferences. Run the normal lint/type checks and CI before merging.

## Operations alert installation

Operations alerts run outside the website process. `deploy/operations-email.mjs` provides their dependency-free HTML renderer; the alert retains its plain-text body. `deploy/operations.mjs` imports this module, and the first-install script includes it.

**A normal website deploy does not update the installed root-owned operations helper.** Deploy the website release containing `/email-brand.png` before activating the alert design. Updating an existing VPS helper requires owner-authorized maintenance: compare the reviewed versions with the installed helper, take the deployment lock, preserve a private backup, install `operations-email.mjs` alongside the helper and update only the reviewed branding changes in `operations.mjs`. Keep root ownership and mode 644, run Node syntax checks and retain any unrelated operational fixes already on the VPS. Install the dependency before the helper that imports it. Verify alert rendering and delivery after installation. Do not rerun the first-install script over the existing operations setup.
