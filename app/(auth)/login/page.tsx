"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import AuthHomeIcon from "@/components/auth/AuthHomeIcon";
import PasswordField from "@/components/auth/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
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
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize Google login");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-coral-100/40 via-gray-50 to-gray-50"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AuthHomeIcon />
        <h1 className="text-center text-3xl font-extrabold text-gray-900 font-heading tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your startup profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full min-h-12 flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 disabled:opacity-70 transition-colors"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with email</span>
              </div>
            </div>
          </div>

          <form className="space-y-5 mt-6" onSubmit={handleEmailLogin}>
            {error && (
              <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-coral-500 focus:border-coral-500 sm:text-sm transition-colors"
                  placeholder="you@startup.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm font-medium text-coral-600 hover:text-coral-500">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1">
                <PasswordField
                  id="login-password"
                  name="password"
                  label="Password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-coral-500 focus:border-coral-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full min-h-12 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Don&apos;t have an account? </span>
            <Link href="/register" className="font-medium text-coral-600 hover:text-coral-500">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
