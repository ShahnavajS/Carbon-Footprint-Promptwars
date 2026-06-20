"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthActions } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MailCheck } from "lucide-react";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12 dark:bg-forest-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-forest-100 via-canvas to-clay-50 dark:from-forest-900 dark:via-forest-950 dark:to-forest-900"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-medium tracking-tight text-forest-700 dark:text-forest-200"
          >
            <span aria-hidden="true" className="text-2xl">
              🌱
            </span>
            <span>EcoScore</span>
          </Link>
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-ink dark:text-paper">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-ink-soft dark:text-forest-200/70">
            Recover access to your carbon tracker account.
          </p>
        </div>

        <Card className="rounded-lg p-8">
          <CardContent className="p-0">
            <Eyebrow tone="clay" className="mb-5">
              Recovery
            </Eyebrow>

            {successMsg ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 text-forest-600 dark:bg-forest-950/40 dark:text-forest-300">
                  <MailCheck className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg font-medium text-ink dark:text-paper">
                  Email Sent
                </h3>
                <p className="mt-2 text-sm text-ink-soft dark:text-forest-200/70">{successMsg}</p>
                <Link href="/login" className="mt-6 block">
                  <Button variant="primary" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {(errorMsg || (authError && !errorMsg)) && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-5 rounded-xs border border-clay-200 bg-clay-50 p-3 text-sm font-medium text-clay-600 dark:border-clay-900/40 dark:bg-clay-950/30 dark:text-clay-300"
                  >
                    {errorMsg || authError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={emailError}
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-ink-soft dark:text-forest-200/70">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-forest-700 underline-offset-4 hover:underline dark:text-forest-300"
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
