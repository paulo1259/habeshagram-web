"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/use-app-data";

export default function ForgotPasswordPage() {
  const { authMode, sendPasswordReset } = useAppData();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");
      await sendPasswordReset(email);
      setSuccessMessage(
        "If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send a password reset email right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface bg-warm px-4 py-10">
      <div className="glass-card mx-auto max-w-md rounded-[2rem] border border-brand-100 p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Password reset</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Reset your password</h1>
        <p className="mt-2 text-sm text-stone-600">
          {authMode === "firebase"
            ? "Enter the email you signed up with and we'll send a reset link."
            : "Firebase auth is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* values to .env.local, restart the dev server, and then use password reset here."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 outline-none ring-brand-300 focus:ring-2"
          />
          {errorMessage ? (
            <p className="rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending reset link..." : "Send reset link"}
          </Button>
        </form>

        <p className="mt-4 text-xs leading-5 text-stone-500">
          For privacy, HabeshaGram won't confirm whether a specific email has an account before sending this request.
        </p>

        <div className="mt-6 flex items-center justify-between text-sm text-stone-600">
          <Link href="/login" className="font-medium text-brand-800">
            Back to login
          </Link>
          <Link href="/signup" className="font-medium text-brand-800">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
