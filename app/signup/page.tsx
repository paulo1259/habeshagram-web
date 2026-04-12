"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/use-app-data";

export default function SignupPage() {
  const router = useRouter();
  const { signup, currentUser, authMode, isReady } = useAppData();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && currentUser) {
      router.replace("/");
    }
  }, [currentUser, isReady, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage("Choose a username with at least 3 characters.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage("Use a password with at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await signup({ username, email, password, bio });
      router.push("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface bg-warm px-4 py-10">
      <div className="mx-auto max-w-md rounded-[2rem] border border-brand-100 bg-white/95 p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Sign up</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Join HabeshaGram</h1>
        <p className="mt-2 text-sm text-stone-600">
          {authMode === "firebase"
            ? "Create your account and set up your HabeshaGram profile."
            : "Firebase auth is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* values to .env.local, restart the dev server, and then create your account."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 outline-none ring-brand-300 focus:ring-2"
          />
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
          <textarea
            rows={3}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Tell the community a little about yourself"
            className="w-full rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 outline-none ring-brand-300 focus:ring-2"
          />
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-stone-600">
          <Link href="/" className="font-medium text-brand-800">
            Back to feed
          </Link>
          <Link href="/login" className="font-medium text-brand-800">
            Already have an account?
          </Link>
        </div>
      </div>
    </main>
  );
}
