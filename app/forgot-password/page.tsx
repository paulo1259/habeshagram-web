"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthCard, AuthInput, AuthMessage, AuthSubmit, authLinkClass } from "@/components/auth/auth-card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

export default function ForgotPasswordPage() {
  const { authMode, sendPasswordReset } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSent(false);
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("auth.resetFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow={t("auth.resetEyebrow")}
      title={t("auth.resetTitle")}
      body={authMode === "supabase" ? t("auth.resetBody") : t("auth.notConfigured")}
      footer={
        <>
          <Link href="/login" className={authLinkClass}>
            {t("auth.backToLogin")}
          </Link>
          <Link href="/signup" className={authLinkClass}>
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
        {errorMessage ? <AuthMessage tone="error">{errorMessage}</AuthMessage> : null}
        {sent ? <AuthMessage tone="success">{t("auth.resetSent")}</AuthMessage> : null}
        <AuthSubmit disabled={isSubmitting}>{isSubmitting ? t("auth.resetSending") : t("auth.resetSend")}</AuthSubmit>
        <p className="text-[12.5px] leading-5 text-stone-400">{t("auth.resetPrivacy")}</p>
      </form>
    </AuthCard>
  );
}
