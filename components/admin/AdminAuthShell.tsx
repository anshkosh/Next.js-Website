import AuthHomeIcon from "@/components/auth/AuthHomeIcon";

/** Dark full-page frame shared by the admin sign-in, 2FA code and 2FA setup screens. */
export default function AdminAuthShell({ title, subtitle, wide = false, children }: { title: string; subtitle: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900"></div>
      <div className={`sm:mx-auto sm:w-full ${wide ? "sm:max-w-lg" : "sm:max-w-md"}`}>
        <AuthHomeIcon onDark />
        <h1 className="text-center text-3xl font-extrabold text-white font-heading tracking-tight">{title}</h1>
        <p className="mt-2 text-center text-sm text-gray-400">{subtitle}</p>
      </div>
      <div className={`mt-8 sm:mx-auto sm:w-full ${wide ? "sm:max-w-lg" : "sm:max-w-md"}`}>
        <div className="bg-gray-800 py-8 px-4 shadow-2xl shadow-black/50 rounded-2xl sm:px-10 border border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}
