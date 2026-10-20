"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import AuthHomeIcon from "@/components/auth/AuthHomeIcon";
import PasswordField from "@/components/auth/PasswordField";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Failed to login");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient for Admin */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AuthHomeIcon onDark />
        <h1 className="text-center text-3xl font-extrabold text-white font-heading tracking-tight">
          Admin Access
        </h1>
        <p className="mt-2 text-center text-sm text-gray-400">
          Secure login for Anshkosh staff
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-2xl sm:px-10 border border-gray-700">
          <form method="post" className="space-y-5" onSubmit={handleAdminLogin}>
            {error && (
              <div className="bg-red-900/50 border border-red-800 text-red-200 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300">Admin Email</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="admin@anshkosh.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="mt-1">
                <PasswordField
                  id="admin-password"
                  name="password"
                  label="Admin password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-lg shadow-indigo-900/50 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-gray-900 disabled:opacity-70 transition-colors mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Authenticate
            </button>
          </form>
          
          <div className="mt-6 border-t border-gray-700 pt-6">
            <Link href="/" className="flex items-center justify-center text-sm font-medium text-gray-400 hover:text-white transition-colors">
              ← Return to public site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
