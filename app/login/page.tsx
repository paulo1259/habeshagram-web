"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/use-app-data";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, authMode, isReady } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && currentUser) {
      router.replace("/");
    }
  }, [currentUser, isReady, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await login(email, password);
      router.push("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface bg-warm px-4 py-10">
      <div className="glass-card mx-auto max-w-md rounded-[2rem] border border-brand-100 p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Login</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-stone-600">
          {authMode === "firebase"
            ? "Sign in with your email and password."
            : "Firebase auth is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* values to .env.local, restart the dev server, then sign in here."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 outline-none ring-brand-300 focus:ring-2"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 outline-none ring-brand-300 focus:ring-2"
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-brand-800 transition hover:text-brand-900">
              Forgot password?
            </Link>
          </div>
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          {currentUser ? (
            <p className="text-sm text-brand-700">Already logged in as @{currentUser.username}.</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-4 text-xs leading-5 text-stone-500">
          Soft launch note: make sure Firebase Authentication is enabled and your current domain is in Authorized domains before inviting testers.
        </p>

        <div className="mt-6 flex items-center justify-between text-sm text-stone-600">
          <Link href="/" className="font-medium text-brand-800">
            Back to feed
          </Link>
          <Link href="/signup" className="font-medium text-brand-800">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
