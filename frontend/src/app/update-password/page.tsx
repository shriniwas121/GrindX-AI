"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const establishRecoverySession = async () => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;

        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (type === "recovery" && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          // Clean the URL hash after session is set
          window.history.replaceState(
            {},
            document.title,
            "/update-password"
          );
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!mounted) return;

        const hasSession = !!data.session;
        setHasRecoverySession(hasSession);

        if (!hasSession) {
          setMessage("This password reset link is invalid or has expired.");
        }
      } catch (err: any) {
        if (!mounted) return;
        setHasRecoverySession(false);
        setMessage(err?.message || "Could not verify reset link.");
      } finally {
        if (mounted) setIsCheckingSession(false);
      }
    };

    establishRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      setMessage("Please fill both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.trim().length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;

      setMessage("Password updated successfully. Redirecting to sign in...");
      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setMessage(err?.message || "Could not update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Reset Password
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter your new password below.
        </p>

        {isCheckingSession ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Verifying reset link...
          </div>
        ) : !hasRecoverySession ? (
          <div className="space-y-4">
            {message && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />

            {message && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}