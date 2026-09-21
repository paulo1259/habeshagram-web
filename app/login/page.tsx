"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard, AuthInput, AuthMessage, AuthSubmit, authLinkClass } from "@/components/auth/auth-card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { getSafeNext } from "@/lib/safe-next";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, authMode, isReady } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await login(email, password);
      router.push(getSafeNext());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("auth.loginFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow={t("auth.login")}
      title={t("auth.welcomeBack")}
      body={authMode === "supabase" ? t("auth.loginBody") : t("auth.notConfigured")}
      footer={
        <>
          <Link href="/" className={authLinkClass}>
            {t("auth.backToZema")}
          </Link>
          <Link href={`/signup${nextQuery}`} className={authLinkClass}>
            {t("auth.noAccount")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("auth.password")}
          aria-label={t("auth.password")}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] font-medium text-stone-500 transition hover:text-ink">
            {t("auth.forgot")}
          </Link>
        </div>
        {errorMessage ? <AuthMessage tone="error">{errorMessage}</AuthMessage> : null}
        {currentUser ? <AuthMessage tone="success">{t("auth.alreadyIn", { name: currentUser.username })}</AuthMessage> : null}
        <AuthSubmit disabled={isSubmitting}>{isSubmitting ? t("auth.loggingIn") : t("auth.logIn")}</AuthSubmit>
      </form>
    </AuthCard>
  );
}
