"use client";

/**
 * Live "now playing" for Zeno.fm stations.
 *
 * Every mount exposes a Server-Sent Events endpoint that pushes the current
 * stream title as it changes:
 *
 *   https://api.zeno.fm/mounts/metadata/subscribe/<mountId>
 *   -> {"mount":"72y045deqeruv","streamTitle":"asibihalehu"}
 *
 * One subscription is held for the station currently playing. Subscribing to
 * all six at once would mean six permanent connections for information the
 * listener cannot see, so the player opens and closes this as stations change.
 */

const METADATA_BASE = "https://api.zeno.fm/mounts/metadata/subscribe";

/** The mount id is the last path segment of a Zeno stream URL. */
export function getMountId(streamUrl: string): string | null {
  const match = streamUrl.trim().match(/stream\.zeno\.fm\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Station titles arrive as raw encoder output, which is often a filename:
 *   "TEDDY_TADESSE_Adegedgalehu__አደገድጋለሁ-_ቴዲ_ታደሰ_#አዲስ_#መዝሙር_2012(128k).m4a"
 * Strip the file noise so it reads as a track, and bail out to an empty string
 * when nothing meaningful survives rather than showing debris.
 */
export function cleanStreamTitle(raw: string): string {
  if (!raw) {
    return "";
  }

  let title = raw.trim();

  title = title.replace(/\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i, "");
  title = title.replace(/\((?:\d{2,4})\s*k(?:bps)?\)/gi, " ");
  title = title.replace(/[_]+/g, " ");
  title = title.replace(/#/g, " ");
  title = title.replace(/\s*-\s*$/g, "");
  title = title.replace(/\s{2,}/g, " ").trim();

  // Encoders commonly idle on the mount name or a placeholder.
  if (!title || /^(unknown|unknow|n\/a|null|undefined|-+)$/i.test(title)) {
    return "";
  }

  // A bare mount id is not a track title.
  if (/^[a-z0-9]{10,}$/i.test(title) && !/\s/.test(title)) {
    return "";
  }

  return title.length > 120 ? `${title.slice(0, 117).trimEnd()}...` : title;
}

export type NowPlayingHandle = { close: () => void };

/**
 * Subscribe to one mount. Returns a handle whose `close()` tears the
 * connection down. Errors are swallowed deliberately: losing the track title
 * must never affect audio playback, and EventSource reconnects by itself.
 */
export function subscribeToNowPlaying(
  streamUrl: string,
  onTitle: (title: string) => void
): NowPlayingHandle {
  const mount = getMountId(streamUrl);

  if (!mount || typeof window === "undefined" || typeof EventSource === "undefined") {
    return { close: () => undefined };
  }

  let source: EventSource | null = null;

  try {
    source = new EventSource(`${METADATA_BASE}/${mount}`);
  } catch {
    return { close: () => undefined };
  }

  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as { streamTitle?: string };
      onTitle(cleanStreamTitle(payload.streamTitle ?? ""));
    } catch {
      // A malformed frame is not worth surfacing.
    }
  };

  source.onerror = () => {
    // EventSource retries on its own; nothing to do but keep quiet.
  };

  return {
    close: () => {
      try {
        source?.close();
      } catch {
        // Already closed.
      }
    }
  };
}
