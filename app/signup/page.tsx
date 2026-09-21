"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthCard, AuthInput, AuthMessage, AuthSubmit, authLinkClass } from "@/components/auth/auth-card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { getSafeNext } from "@/lib/safe-next";
import { EmailConfirmationRequiredError } from "@/services/auth-service";

export default function SignupPage() {
  const router = useRouter();
  const { signup, currentUser, authMode, isReady } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSentTo, setConfirmSentTo] = useState("");
  const [nextQuery, setNextQuery] = useState("");

  useEffect(() => {
    const next = getSafeNext("");
    setNextQuery(next ? `?next=${encodeURIComponent(next)}` : "");
  }, []);

  useEffect(() => {
    if (isReady && currentUser) {
      router.replace(getSafeNext());
    }
  }, [currentUser, isReady, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage(t("auth.usernameShort"));
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage(t("auth.required"));
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage(t("auth.passwordShort"));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await signup({ username, email, password });
      router.push(getSafeNext());
    } catch (error) {
      if (error instanceof EmailConfirmationRequiredError) {
        setConfirmSentTo(email.trim());
      } else {
        setErrorMessage(error instanceof Error ? error.message : t("auth.signupFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmSentTo) {
    return (
      <AuthCard
        eyebrow={t("auth.signupEyebrow")}
        title={t("auth.checkEmailTitle")}
        footer={
          <Link href="/" className={authLinkClass}>
            {t("auth.backToZema")}
          </Link>
        }
      >
        <div className="flex gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/[0.07] p-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
          <p className="text-[14.5px] leading-6 text-stone-600">{t("auth.checkEmailBody", { email: confirmSentTo })}</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow={t("auth.signupEyebrow")}
      title={t("auth.signupTitle")}
      body={authMode === "supabase" ? t("auth.signupBody") : t("auth.notConfigured")}
      footer={
        <>
          <Link href="/" className={authLinkClass}>
            {t("auth.backToZema")}
          </Link>
          <Link href={`/login${nextQuery}`} className={authLinkClass}>
            {t("auth.haveAccount")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <AuthInput
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={t("auth.username")}
          aria-label={t("auth.username")}
        />
        <AuthInput
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("auth.email")}
          aria-label={t("auth.email")}
        />
        <AuthInput
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("auth.password")}
          aria-label={t("auth.password")}
        />
        {errorMessage ? <AuthMessage tone="error">{errorMessage}</AuthMessage> : null}
        <AuthSubmit disabled={isSubmitting}>{isSubmitting ? t("auth.creating") : t("auth.create")}</AuthSubmit>
      </form>
    </AuthCard>
  );
}
