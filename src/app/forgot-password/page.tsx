"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthActions } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Leaf, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendPasswordReset, isLoading, error: authError } = useAuthActions();

  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const validate = () => {
    setEmailError("");
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await sendPasswordReset(email);
      setSuccessMsg("We've sent a password reset link to your email address.");
      setEmail("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg(errorMsg || "Failed to send reset email. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-50 via-white to-teal-50 px-4 py-12 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400"
          >
            <Leaf className="h-8 w-8" />
            <span>EcoScore</span>
          </Link>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Recover access to your carbon tracker account.
          </p>
        </div>

        <Card className="border-slate-200/60 shadow-xl dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl">Recover Password</CardTitle>
            <CardDescription>Enter email and we will send a reset token.</CardDescription>
          </CardHeader>
          <CardContent>
            {successMsg ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Email Sent
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{successMsg}</p>
                <div className="mt-6">
                  <Link href="/login">
                    <Button variant="primary" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/35 dark:text-red-400"
                  >
                    {errorMsg}
                  </div>
                )}
                {authError && !errorMsg && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/35 dark:text-red-400"
                  >
                    {authError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={emailError}
                      disabled={isLoading}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Sign In
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
