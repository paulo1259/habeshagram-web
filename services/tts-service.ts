/**
 * Spoken version of the daily brief, via OpenAI's text-to-speech.
 *
 * Only OpenAI is wired up for audio: it is the provider already paid for, and
 * a spoken minute costs around a cent. Each version of the brief is voiced
 * once and then served from Vercel's CDN, so the cost does not grow with the
 * number of listeners.
 */

const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE = "sage";

export function isBriefAudioConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function synthesizeSpeech(text: string, lang: "en" | "am"): Promise<ArrayBuffer> {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`
    },
    body: JSON.stringify({
      model: process.env.TTS_MODEL?.trim() || DEFAULT_TTS_MODEL,
      voice: process.env.TTS_VOICE?.trim() || DEFAULT_TTS_VOICE,
      input: text.slice(0, 4000),
      response_format: "mp3",
      instructions:
        lang === "am"
          ? "Read this in Amharic as a calm, warm radio news presenter. Clear, unhurried, neutral."
          : "Read this as a calm, warm radio news presenter. Clear, unhurried, neutral; natural pauses between paragraphs."
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Text-to-speech failed with ${response.status}: ${detail.slice(0, 200)}`);
  }

  return response.arrayBuffer();
}
