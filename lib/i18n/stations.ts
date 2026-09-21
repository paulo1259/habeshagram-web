import type { Lang } from "@/lib/i18n/config";
import type { RadioStation } from "@/types";

/**
 * Station copy in Amharic. Station names stay as the stations write them;
 * only the descriptive text and place names are translated.
 */
const DESCRIPTIONS_AM: Record<string, string> = {
  "sheger-1021": "ዜና፣ ውይይት እና መዝናኛ",
  "ethio-fm-1078": "መዝናኛ፣ ዜና እና ስፖርት",
  "fm-addis-971": "የኢቢሲ ኤፍ ኤም አዲስ የቀጥታ ሥርጭት",
  "wengel-fm": "ከአዲስ አበባ በአማርኛ እና በእንግሊዝኛ የሚተላለፍ የሃይማኖት ሬዲዮ።",
  "orthodox-radio": "የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝሙር",
  "voice-of-grace-radio": "የክርስትና ትምህርት፣ ጸሎት እና የአምልኮ መዝሙር"
};

const PLACES_AM: Record<string, string> = {
  "Addis Ababa": "አዲስ አበባ",
  "Addis Ababa, Ethiopia": "አዲስ አበባ፣ ኢትዮጵያ",
  Ethiopia: "ኢትዮጵያ",
  Online: "በመስመር ላይ"
};

export function stationDescription(station: RadioStation, lang: Lang) {
  return (lang === "am" && DESCRIPTIONS_AM[station.id]) || station.description;
}

export function stationPlace(value: string, lang: Lang) {
  return (lang === "am" && PLACES_AM[value]) || value;
}

/** "107.8 FM · Addis Ababa", with the place (and "Online") translated. */
export function stationMeta(station: RadioStation, lang: Lang) {
  return `${stationPlace(station.frequency, lang)} · ${stationPlace(station.city, lang)}`;
}
