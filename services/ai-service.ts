import "server-only";

/**
 * Minimal, dependency-free AI text generation for HabeshaGram.
 *
 * Provider is auto-detected from environment variables:
 *  - ANTHROPIC_API_KEY  → Claude (claude-haiku-4-5) — highest quality per dollar
 *  - GEMINI_API_KEY     → Google Gemini (gemini-2.5-flash) — has a free tier
 *
 * Both are called through plain REST so no SDK dependency is needed.
 */

type GenerateInput = {
  system: string;
  prompt: string;
  maxTokens?: number;
  responseSchema?: Record<string, unknown>;
};

export type AiProvider = "anthropic" | "gemini";

export function getConfiguredAiProvider(): AiProvider | null {
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return "anthropic";
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    return "gemini";
  }

  return null;
}

export function isAiConfigured() {
  return getConfiguredAiProvider() !== null;
}

async function generateWithAnthropic({ system, prompt, maxTokens = 1500 }: GenerateInput) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL?.trim() || "claude-haiku-4-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Anthropic request failed with ${response.status}. ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = payload.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return text;
}

async function generateWithGemini(
  { system, prompt, maxTokens = 1500, responseSchema }: GenerateInput,
  modelOverride?: string
) {
  const model = modelOverride || process.env.AI_MODEL?.trim() || "gemini-3.5-flash";
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens
  };

  if (model.startsWith("gemini-3")) {
    generationConfig.thinkingConfig = { thinkingLevel: "low" };
  }

  if (responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseJsonSchema = responseSchema;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? ""
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini request failed with ${response.status}. ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

const RETRYABLE_STATUS = /\b(429|500|503|529)\b/;
const RETRY_DELAYS_MS = [2000, 6000];

// If the primary Gemini model is overloaded, fall back to the stable lite model.
const GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateAiText(input: GenerateInput): Promise<string> {
  const provider = getConfiguredAiProvider();

  if (!provider) {
    throw new Error(
      "No AI provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env.local."
    );
  }

  const attemptsPlan: Array<{ model?: string; delayBeforeMs: number }> =
    provider === "gemini"
      ? [
          { delayBeforeMs: 0 },
          { delayBeforeMs: 2000 },
          { model: GEMINI_FALLBACK_MODEL, delayBeforeMs: 1000 },
          { model: GEMINI_FALLBACK_MODEL, delayBeforeMs: 4000 }
        ]
      : [
          { delayBeforeMs: 0 },
          { delayBeforeMs: RETRY_DELAYS_MS[0] },
          { delayBeforeMs: RETRY_DELAYS_MS[1] }
        ];

  let lastError: unknown;

  for (const attempt of attemptsPlan) {
    if (attempt.delayBeforeMs) {
      await sleep(attempt.delayBeforeMs);
    }

    try {
      if (provider === "anthropic") {
        return await generateWithAnthropic(input);
      }

      return await generateWithGemini(input, attempt.model);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";

      // Keep walking the plan on transient overload/rate/model-availability
      // errors — fail fast on auth or bad-request errors.
      if (RETRYABLE_STATUS.test(message) || message.includes("404")) {
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI request failed.");
}

/**
 * Ask the model for strict JSON and parse it defensively — models sometimes
 * wrap output in code fences or add stray prose.
 */
export async function generateAiJson<T>(input: GenerateInput): Promise<T> {
  const raw = await generateAiText(input);

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain a JSON object.");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
