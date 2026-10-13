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
  "voice-of-grace-radio": "የክርስትና ትምህርት፣ ጸሎት እና የአምልኮ መዝሙር",
  "bisrat-fm-1011": "ሙዚቃ፣ መዝናኛ እና ዕለታዊ ዝግጅቶች ከብሥራት",
  "ahadu-radio-943": "ዜና፣ ወቅታዊ ጉዳዮች እና ውይይት ከአሐዱ",
  "ebc-fm-1047": "ብሔራዊ ጣቢያው በቀጥታ ከአዲስ አበባ",
  "arada-fm-951": "ሙዚቃ እና መዝናኛ በአራዳ ለዛ",
  "tirita-fm-976": "የኢትዮጵያ ሙዚቃ ቀኑን ሙሉ",
  "qesht-fm-1053": "መዝናኛ እና የአኗኗር ዝግጅቶች ከአዲስ አበባ",
  "taem-radio": "ጣዕም ሬድዮ — ባህል፣ ውይይት እና ሙዚቃ",
  "amhara-fm-969": "ክልላዊ ዝግጅቶች በቀጥታ ከባሕር ዳር",
  "amhara-radio": "የአማራ ሚዲያ ኮርፖሬሽን ዋና የክልል ሬዲዮ",
  "debre-birhan-fm-914": "የማኅበረሰብ ሬዲዮ ከደብረ ብርሃን"
};

const PLACES_AM: Record<string, string> = {
  "Addis Ababa": "አዲስ አበባ",
  "Addis Ababa, Ethiopia": "አዲስ አበባ፣ ኢትዮጵያ",
  Ethiopia: "ኢትዮጵያ",
  Online: "በመስመር ላይ",
  "AM/Online": "ኤኤም/በመስመር ላይ",
  "Bahir Dar": "ባሕር ዳር",
  "Debre Birhan": "ደብረ ብርሃን"
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
