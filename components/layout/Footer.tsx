import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 py-12 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-gray-200">
          {/* Column 1: Logo & Tagline */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Anshkosh Logo" width={32} height={32} className="w-8 h-8" />
              <span className="text-2xl font-bold font-heading tracking-tight">
                <span className="text-gray-900">ANSH</span>
                <span className="text-coral-500">KOSH</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500">
              Discover Indian startups before launch.
            </p>
            <p className="text-xs text-gray-400">
              © 2025 Anshkosh. All rights reserved.
            </p>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm font-heading uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/discover" className="hover:text-gray-900 transition-colors">Discover</Link></li>
              <li><Link href="/categories" className="hover:text-gray-900 transition-colors">Categories</Link></li>
              <li><Link href="/journal" className="hover:text-gray-900 transition-colors">Journal</Link></li>
              <li><Link href="/startup/new" className="hover:text-gray-900 transition-colors">Submit a Startup</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm font-heading uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link></li>
              <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link></li>
              <li><Link href="/trust-safety" className="hover:text-gray-900 transition-colors">Trust & Safety</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm font-heading uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/contact" className="hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="mailto:hello@anshkosh.com" className="hover:text-gray-900 transition-colors">
                  hello@anshkosh.com
                </a>
              </li>
              <li className="text-gray-500">India</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 text-center text-xs text-gray-400">
          This platform is an early-access pilot. Payments and reward orders are not currently open.
        </div>
      </div>
    </footer>
  );
}
