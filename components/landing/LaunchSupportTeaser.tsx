import Link from "next/link";
import { Check } from "lucide-react";

export default function LaunchSupportTeaser() {
  return (
    <>
      {[
        { label: "Free startup listings & launch support", href: "/launch-support" },
        { label: "Startup directory listings & credible SEO backlink outreach (planned)", href: null },
      ].map(({ label, href }) => (
        <li key={label} className="flex items-center gap-3 text-sm text-gray-800 font-medium">
          <div className="w-5 h-5 rounded-full bg-coral-50 text-coral-500 flex items-center justify-center shrink-0 border border-coral-100">
            <Check aria-hidden="true" className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          {href ? (
            <Link href={href} className="hover:text-coral-700 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-500 rounded-sm">
              {label}
            </Link>
          ) : <span>{label}</span>}
        </li>
      ))}
    </>
  );
}
