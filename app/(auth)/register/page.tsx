"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Loader2, Mail, User, CheckCircle2 } from "lucide-react";
import AuthHomeIcon from "@/components/auth/AuthHomeIcon";
import PasswordField from "@/components/auth/PasswordField";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = () => {
    if (password.length === 0)
      return { score: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (password.length > 6) score += 1;
    if (password.length > 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-400" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-yellow-400" };
    if (score >= 3) return { score: 3, label: "Strong", color: "bg-green-500" };
    return { score: 0, label: "", color: "bg-gray-200" };
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setError(error.message || "Registration failed");
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-12 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 text-center border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
              Check your email
            </h1>
            <p className="text-gray-600 mb-8">
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-gray-900">{email}</span>. Please
              verify your email to continue.
            </p>
            <Link
              href="/login"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-coral-100/40 via-gray-50 to-gray-50"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AuthHomeIcon />
        <h1 className="text-center text-3xl font-extrabold text-gray-900 font-heading tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Anshkosh to showcase your startup
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form method="post" className="space-y-5" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-coral-500 focus:border-coral-500 sm:text-sm transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <PasswordField
                  id="register-password"
                  name="password"
                  label="Password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-coral-500 focus:border-coral-500 sm:text-sm transition-colors"
                />
              </div>
              <p id="password-requirements" className="mt-2 text-xs text-gray-500">
                Use at least 8 characters, including one uppercase letter and one number.
              </p>
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex gap-1 h-1.5">
                    <div
                      className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : "bg-gray-200"}`}
                    ></div>
                    <div
                      className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : "bg-gray-200"}`}
                    ></div>
                    <div
                      className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : "bg-gray-200"}`}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-medium ${strength.score >= 3 ? "text-green-600" : "text-gray-500"}`}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-coral-600 focus:ring-coral-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-coral-600 hover:text-coral-500"
                  >
                    Terms of Service
                  </Link>{" "}
                  and confirm I have read the{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-coral-600 hover:text-coral-500"
                  >
                    Privacy Notice
                  </Link>
                  .
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="w-full min-h-12 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-coral-600 hover:bg-coral-700 focus:ring-2 focus:ring-offset-2 focus:ring-coral-600 disabled:opacity-70 transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Account
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link
              href="/login"
              className="font-medium text-gray-900 hover:text-gray-700"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
