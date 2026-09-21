import { NextResponse, type NextRequest } from "next/server";
import { getConfiguredAiProvider } from "@/services/ai-service";
import type { WorldNewsDigestPayload } from "@/services/ai-digest-client-service";
import { getDigest, parseDigestLang, type DigestLang } from "@/services/digest-service";
import { isBriefAudioConfigured } from "@/services/tts-service";

export const dynamic = "force-dynamic";

// Last good brief per language on this instance, shown if a refresh fails.
const lastGood: Partial<Record<DigestLang, WorldNewsDigestPayload>> = {};

function withAudio(payload: WorldNewsDigestPayload): WorldNewsDigestPayload {
  if (!payload.version || !payload.lang || !isBriefAudioConfigured()) return payload;
  return { ...payload, audioUrl: `/api/world-news/digest/audio?lang=${payload.lang}&v=${payload.version}` };
}

export async function GET(request: NextRequest) {
  const lang = parseDigestLang(request.nextUrl.searchParams.get("lang"));

  if (!getConfiguredAiProvider()) {
    return NextResponse.json({
      aiConfigured: false,
      message:
        "AI digest is not configured yet. Add ANTHROPIC_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY and redeploy."
    } satisfies WorldNewsDigestPayload);
  }

  try {
    const payload = await getDigest(lang);
    if (payload.headline) lastGood[lang] = payload;
    return NextResponse.json(withAudio(payload) satisfies WorldNewsDigestPayload);
  } catch (error) {
    const previous = lastGood[lang];
    if (previous) {
      return NextResponse.json({
        ...withAudio(previous),
        stale: true,
        message: "Showing the most recent AI digest while a fresh one is prepared."
      } satisfies WorldNewsDigestPayload);
    }

    const rawMessage = error instanceof Error ? error.message : "";
    let friendly = "The AI digest is temporarily unavailable. It will retry automatically.";

    if (rawMessage.includes("429") || /credit|quota|billing|rate/i.test(rawMessage)) {
      friendly =
        "The AI provider rejected the request (out of credits or rate-limited). Check your API key's billing or quota, then reload.";
    } else if (rawMessage.includes("401") || rawMessage.includes("403")) {
      friendly = "The AI API key was rejected. Check the key in your Vercel environment variables.";
    }

    const detail =
      process.env.NODE_ENV === "development" && rawMessage ? ` [dev detail: ${rawMessage.slice(0, 300)}]` : "";

    return NextResponse.json({
      aiConfigured: true,
      provider: getConfiguredAiProvider() ?? undefined,
      stale: true,
      message: `${friendly}${detail}`
    } satisfies WorldNewsDigestPayload);
  }
}
