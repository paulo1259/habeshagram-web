"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

type ShareActionsProps = {
  path: string;
  title: string;
  text?: string;
  className?: string;
  layout?: "inline" | "menu";
  compact?: boolean;
};

function buildAbsoluteUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error("Clipboard copy failed.");
  }
}


export function ShareActions({
  path,
  title,
  text,
  className,
  layout = "inline",
  compact = false
}: ShareActionsProps) {
  const [feedback, setFeedback] = useState("");
  const { t } = useLanguage();
  const [errorMessage, setErrorMessage] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  const absoluteUrl = useMemo(() => buildAbsoluteUrl(path), [path]);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!feedback && !errorMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedback("");
      setErrorMessage("");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [errorMessage, feedback]);

  async function handleCopy() {
    try {
      setErrorMessage("");
      await copyText(absoluteUrl);
      trackEvent("share_action", {
        action: "copy_link",
        path,
        title
      });
      setFeedback(t("share.copied"));
    } catch {
      setFeedback("");
      setErrorMessage(t("share.copyFailed"));
    }
  }

  async function handleShare() {
    if (!canNativeShare) {
      await handleCopy();
      return;
    }

    try {
      setErrorMessage("");
      setFeedback(t("share.opened"));
      trackEvent("share_action", {
        action: "native_share",
        path,
        title
      });
      await navigator.share({
        title,
        text,
        url: absoluteUrl
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";

      if (name === "AbortError") {
        return;
      }

      setFeedback("");
      setErrorMessage(t("share.shareFailed"));
    }
  }

  const feedbackNode =
    feedback || errorMessage ? (
      <p
        className={cn(
          "text-xs font-medium",
          feedback ? "text-emerald-700" : "text-red-700",
          layout === "menu" ? "mt-2 px-2" : "mt-2"
        )}
      >
        {feedback || errorMessage}
      </p>
    ) : null;

  if (layout === "menu") {
    return (
      <div className={className}>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-medium text-stone-700 transition hover:bg-brand-50 hover:text-brand-800"
          onClick={() => void handleShare()}
        >
          <Share2 className="h-4 w-4" />
          <span>{t(canNativeShare ? "share.share" : "share.shareOrCopy")}</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm font-medium text-stone-700 transition hover:bg-brand-50 hover:text-brand-800"
          onClick={() => void handleCopy()}
        >
          <Copy className="h-4 w-4" />
          <span>{t("share.copy")}</span>
        </button>
        {feedbackNode}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={cn("flex flex-wrap items-center gap-2", compact && "gap-1.5")}>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "min-h-10 gap-2 rounded-full px-3.5 text-sm text-brand-800",
            compact && "min-h-9 px-3 text-xs"
          )}
          onClick={() => void handleShare()}
        >
          <Share2 className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
          {t("share.share")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "min-h-10 gap-2 rounded-full px-3.5 text-sm text-stone-600",
            compact && "min-h-9 px-3 text-xs"
          )}
          onClick={() => void handleCopy()}
        >
          <Copy className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
          {t("share.copy")}
        </Button>
      </div>
      {feedbackNode}
    </div>
  );
}
