import { NextResponse, type NextRequest } from "next/server";
import { getDigest, parseDigestLang } from "@/services/digest-service";
import { isBriefAudioConfigured, synthesizeSpeech } from "@/services/tts-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/world-news/digest/audio?lang=en&v=<version>
 *
 * Voices the current brief. The `v` must match the brief being served right
 * now; anything else is refused before any money is spent, so the URL cannot
 * be used to run up a text-to-speech bill. A matching URL always yields the
 * same audio, so the CDN keeps it for a day and OpenAI is called once per
 * brief rather than once per listener.
 */
export async function GET(request: NextRequest) {
  if (!isBriefAudioConfigured()) {
    return new NextResponse("Audio is not configured.", { status: 404 });
  }

  const lang = parseDigestLang(request.nextUrl.searchParams.get("lang"));
  const version = request.nextUrl.searchParams.get("v") ?? "";

  const digest = await getDigest(lang).catch(() => null);

  if (!digest?.version || !digest.headline || !digest.paragraphs?.length) {
    return new NextResponse("No brief to read yet.", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  if (digest.version !== version) {
    return new NextResponse("That version of the brief has been replaced.", {
      status: 410,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const intro = lang === "am" ? "የዜማ የዕለቱ አጭር ዜና።" : "This is the Zema brief.";
  const script = [intro, `${digest.headline}.`, ...digest.paragraphs].join("\n\n");

  try {
    const audio = await synthesizeSpeech(script, lang);
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable"
      }
    });
  } catch (error) {
    console.error("Brief audio failed", error);
    return new NextResponse("Audio is temporarily unavailable.", {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
