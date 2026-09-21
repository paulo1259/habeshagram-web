export type Lang = "en" | "am";

export const LANGS: Lang[] = ["en", "am"];
export const DEFAULT_LANG: Lang = "en";

/** Read by the server layout, so the first paint is already in the right language. */
export const LANG_COOKIE = "zema-lang";

export function parseLang(value: string | undefined | null): Lang {
  return value === "am" ? "am" : "en";
}
