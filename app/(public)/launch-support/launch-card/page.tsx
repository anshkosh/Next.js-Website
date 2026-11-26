import Link from "next/link";
import LaunchCardMaker from "@/components/launch/LaunchCardMaker";
import LaunchToolLayout, { launchLinkStyle } from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "Free Startup Launch Card Maker with Example",
  description: "Make a launch card with your startup name, tagline, logo and link. Download a free square or landscape PNG without creating an account.",
  path: "/launch-support/launch-card",
});

export default function LaunchCardPage() {
  return (
    <LaunchToolLayout
      active="launch-card"
      title="Free startup launch card maker"
      description="Add your startup name, tagline and link, choose a style, and download a PNG for your launch announcement. No watermark or account required."
    >
      <section aria-labelledby="launch-card-definition" className="mb-8 max-w-3xl space-y-3">
        <h2 id="launch-card-definition" className="font-heading text-2xl font-bold">What is a startup launch card?</h2>
        <p className="leading-relaxed text-gray-600">
          A startup launch card is a graphic that introduces your product, explains what it helps people do, and shows where to learn more. Share it in a social post, launch email or community announcement.
        </p>
      </section>
      <LaunchCardMaker />
      <section aria-labelledby="launch-card-example" className="mt-12 max-w-3xl space-y-5">
        <h2 id="launch-card-example" className="font-heading text-2xl font-bold">A launch card example</h2>
        <p className="leading-relaxed text-gray-600">Here is a fictional example you can adapt to your product.</p>
        <dl className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div><dt className="font-semibold">Startup name</dt><dd className="mt-1 text-gray-600">QuoteDesk</dd></div>
          <div><dt className="font-semibold">Tagline</dt><dd className="mt-1 text-gray-600">Send clear renovation quotes from your phone.</dd></div>
          <div><dt className="font-semibold">Website</dt><dd className="mt-1 break-words text-gray-600">quotedesk.example/demo</dd></div>
        </dl>
        <p className="leading-relaxed text-gray-600">
          Use one task your product helps people finish and a destination where they can try it or learn more. Add a logo if you have one. Check the preview on your phone, since long text is shortened to fit.
        </p>
        <h2 className="pt-3 font-heading text-2xl font-bold">Choose a size and share your card</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-gray-600">
          <li>Choose square for a 1080 × 1080 PNG or landscape for a 1200 × 630 PNG.</li>
          <li>Match the launch message to your current stage, such as looking for beta testers or launching soon.</li>
          <li>The address is drawn on the image. Include a clickable link in your caption or email as well.</li>
        </ul>
        <p className="leading-relaxed text-gray-600">
          Prepare the written announcement and asset links with the{" "}
          <Link href="/launch-support/kit" className={launchLinkStyle}>free Launch Kit</Link>.
        </p>
      </section>
    </LaunchToolLayout>
  );
}
