import Image from "next/image";
import Link from "next/link";

export default function AuthHomeIcon({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Anshkosh home"
      className={`mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 ${onDark ? "bg-white p-1 shadow-lg shadow-black/20 focus-visible:ring-offset-gray-900" : ""}`}
    >
      <Image src="/logo.svg" alt="" width={48} height={48} className="h-full w-full" />
    </Link>
  );
}
