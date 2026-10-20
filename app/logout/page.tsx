import { seoMetadata } from "@/lib/seo";
import Logout from "@/components/auth/Logout";

export const metadata = { ...seoMetadata({ title: "Sign out — Anshkosh", description: "Sign out of your Anshkosh account.", path: "/logout" }), robots: { index: false, follow: false } };

export default function LogoutPage() { return <Logout />; }
