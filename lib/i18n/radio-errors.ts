import type { MessageKey } from "@/lib/i18n/messages";

/**
 * The radio hook reports errors as English sentences (they also go to logs
 * and analytics). This maps each one to its translation key for display;
 * anything unrecognised is shown as-is.
 */
const RADIO_ERROR_KEYS: Record<string, MessageKey> = {
  "This station does not currently expose a playable web stream.": "radio.err.noStream",
  "Your browser blocked playback. Tap play once more to start the live stream.": "radio.err.blocked",
  "The live stream could not start. Try reconnecting or choose another station.": "radio.err.couldNotStart",
  "The live stream could not start. Check your connection and try again.": "radio.err.checkConnection",
  "The station stream could not be reached. Try another station.": "radio.err.unreachable",
  "The stream kept dropping. It may be off air — try again or pick another station.": "radio.err.dropping"
};

export function radioErrorText(message: string, t: (key: MessageKey) => string) {
  const key = RADIO_ERROR_KEYS[message];
  return key ? t(key) : message;
}
