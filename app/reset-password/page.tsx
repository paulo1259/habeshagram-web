"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthCard, AuthInput, AuthMessage, AuthSubmit, authLinkClass } from "@/components/auth/auth-card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { updatePassword } from "@/services/auth-service";

/**
 * Where the password-reset email lands. Supabase signs the visitor in with a
 * short-lived recovery session from the link; this page uses it to set the
 * new password.
 */
export default function ResetPasswordPage() {
  const { currentUser, isReady } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.trim().length < 6) {
      setErrorMessage(t("auth.passwordShort"));
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await updatePassword(password);
      setDone(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("auth.resetFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const noSession = isReady && !currentUser;

  return (
    <AuthCard
      eyebrow={t("auth.resetEyebrow")}
      title={t("auth.newPasswordTitle")}
      body={t("auth.newPasswordBody")}
      footer={
        <Link href="/" className={authLinkClass}>
          {t("auth.backToZema")}
        </Link>
      }
    >
      {done ? (
        <AuthMessage tone="success">{t("auth.newPasswordDone")}</AuthMessage>
      ) : noSession ? (
        <div className="space-y-4">
          <AuthMessage tone="error">{t("auth.newPasswordNoSession")}</AuthMessage>
          <Link href="/forgot-password" className={authLinkClass}>
            {t("auth.requestNewLink")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <AuthInput
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("auth.newPassword")}
            aria-label={t("auth.newPassword")}
          />
          {errorMessage ? <AuthMessage tone="error">{errorMessage}</AuthMessage> : null}
          <AuthSubmit disabled={isSubmitting || !isReady}>
            {isSubmitting ? t("auth.newPasswordSaving") : t("auth.newPasswordSave")}
          </AuthSubmit>
        </form>
      )}
    </AuthCard>
  );
}
