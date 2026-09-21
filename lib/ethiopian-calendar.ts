/**
 * Ethiopian calendar, Ethiopian time and the holidays Zema's listeners keep.
 *
 * Pure arithmetic — no library, no network. Conversions go through the Julian
 * Day Number, which both calendars map onto exactly.
 *
 * The Ethiopian year has twelve 30-day months plus Pagume (5 days, 6 in the
 * year before a Gregorian leap year), and runs about 7–8 years behind the
 * Gregorian count. New Year (Enkutatash) falls on 11 September, or the 12th
 * before a Gregorian leap year.
 */

export type EthiopianDate = { year: number; month: number; day: number };

/** JDN of 1 Meskerem, year 1 (Amete Mihret), minus the 365-day offset used below. */
const ETHIOPIC_EPOCH = 1723856;

export const ETHIOPIAN_MONTHS = [
  { en: "Meskerem", am: "መስከረም" },
  { en: "Tikimt", am: "ጥቅምት" },
  { en: "Hidar", am: "ኅዳር" },
  { en: "Tahsas", am: "ታኅሣሥ" },
  { en: "Tir", am: "ጥር" },
  { en: "Yekatit", am: "የካቲት" },
  { en: "Megabit", am: "መጋቢት" },
  { en: "Miyazia", am: "ሚያዝያ" },
  { en: "Ginbot", am: "ግንቦት" },
  { en: "Sene", am: "ሰኔ" },
  { en: "Hamle", am: "ሐምሌ" },
  { en: "Nehase", am: "ነሐሴ" },
  { en: "Pagume", am: "ጳጉሜን" }
] as const;

export const ETHIOPIAN_WEEKDAYS = [
  { en: "Sunday", am: "እሑድ" },
  { en: "Monday", am: "ሰኞ" },
  { en: "Tuesday", am: "ማክሰኞ" },
  { en: "Wednesday", am: "ረቡዕ" },
  { en: "Thursday", am: "ሐሙስ" },
  { en: "Friday", am: "ዓርብ" },
  { en: "Saturday", am: "ቅዳሜ" }
] as const;

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  );
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10)
  };
}

function ethiopianToJdn({ year, month, day }: EthiopianDate): number {
  return ETHIOPIC_EPOCH + 365 + 365 * (year - 1) + Math.floor(year / 4) + 30 * month + day - 31;
}

function jdnToEthiopian(jdn: number): EthiopianDate {
  const r = (jdn - ETHIOPIC_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  return {
    year: 4 * Math.floor((jdn - ETHIOPIC_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460),
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1
  };
}

/** Calendar date in Addis Ababa (UTC+3, no daylight saving) for an instant. */
function addisParts(now: Date) {
  const shifted = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay()
  };
}

export function toEthiopian(year: number, month: number, day: number): EthiopianDate {
  return jdnToEthiopian(gregorianToJdn(year, month, day));
}

export function toGregorian(date: EthiopianDate) {
  return jdnToGregorian(ethiopianToJdn(date));
}

export function todayInEthiopia(now = new Date()) {
  const parts = addisParts(now);
  return { ...toEthiopian(parts.year, parts.month, parts.day), weekday: parts.weekday };
}

/**
 * Ethiopian time counts the day from sunrise: 7 a.m. is 1 o'clock "in the
 * morning", noon is 6, and 6 p.m. is 12 — the hour hand sits opposite the
 * one on a Western clock face.
 */
export function ethiopianTime(now = new Date()) {
  const { hours, minutes } = addisParts(now);
  const hour = (hours + 6) % 12 || 12;
  const period =
    hours >= 6 && hours < 12
      ? { en: "morning", am: "ጠዋት" }
      : hours >= 12 && hours < 18
        ? { en: "afternoon", am: "ከሰዓት" }
        : hours >= 18
          ? { en: "evening", am: "ምሽት" }
          : { en: "night", am: "ሌሊት" };
  return { hour, minutes, period, addisHours: hours };
}

// ── holidays ─────────────────────────────────────────────────────────────────

export type Holiday = {
  id: string;
  en: string;
  am: string;
  country: "Ethiopia" | "Eritrea";
  /** Gregorian date, YYYY-MM-DD. */
  date: string;
  /** Moon-sighted feasts can move by a day; shown with a note. */
  approximate?: boolean;
};

type HolidayRule = Omit<Holiday, "date" | "approximate"> & {
  ethiopian?: { month: number; day: number };
  gregorian?: { month: number; day: number };
};

const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const RULES: HolidayRule[] = [
  { id: "enkutatash", en: "Enkutatash · New Year", am: "እንቁጣጣሽ", country: "Ethiopia", ethiopian: { month: 1, day: 1 } },
  { id: "meskel", en: "Meskel", am: "መስቀል", country: "Ethiopia", ethiopian: { month: 1, day: 17 } },
  { id: "genna", en: "Genna · Christmas", am: "ገና", country: "Ethiopia", gregorian: { month: 1, day: 7 } },
  { id: "timket", en: "Timket · Epiphany", am: "ጥምቀት", country: "Ethiopia", ethiopian: { month: 5, day: 11 } },
  { id: "adwa", en: "Adwa Victory Day", am: "የዓድዋ ድል በዓል", country: "Ethiopia", ethiopian: { month: 6, day: 23 } },
  { id: "labour", en: "Labour Day", am: "የሠራተኞች ቀን", country: "Ethiopia", gregorian: { month: 5, day: 1 } },
  { id: "patriots", en: "Patriots' Victory Day", am: "የአርበኞች ቀን", country: "Ethiopia", ethiopian: { month: 8, day: 27 } },
  { id: "fenkil", en: "Fenkil Day", am: "ፈንቅል", country: "Eritrea", gregorian: { month: 2, day: 10 } },
  { id: "er-independence", en: "Independence Day", am: "የነጻነት ቀን", country: "Eritrea", gregorian: { month: 5, day: 24 } },
  { id: "er-martyrs", en: "Martyrs' Day", am: "የሰማዕታት ቀን", country: "Eritrea", gregorian: { month: 6, day: 20 } },
  { id: "er-struggle", en: "Start of the Armed Struggle", am: "የትጥቅ ትግል መጀመሪያ", country: "Eritrea", gregorian: { month: 9, day: 1 } }
];

/**
 * Orthodox Easter (Fasika) for a Gregorian year: the Julian-calendar Easter
 * computus (Meeus), shifted onto the Gregorian calendar.
 */
function fasika(year: number): string {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const g = jdnToGregorian(
    // Julian date -> JDN, then read back as Gregorian.
    (() => {
      const aa = Math.floor((14 - month) / 12);
      const y = year + 4800 - aa;
      const m = month + 12 * aa - 3;
      return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    })()
  );
  return iso(g.year, g.month, g.day);
}

function shiftDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const g = jdnToGregorian(gregorianToJdn(y, m, d) + days);
  return iso(g.year, g.month, g.day);
}

/**
 * Islamic feasts follow the lunar calendar and are fixed by moon sighting,
 * so they are listed from published expected dates rather than computed.
 * Extend this table each year.
 */
const ISLAMIC: Array<Pick<Holiday, "id" | "en" | "am" | "date">> = [
  { id: "eid-fitr-2027", en: "Eid al-Fitr", am: "ኢድ አል ፈጥር", date: "2027-03-10" },
  { id: "eid-adha-2027", en: "Eid al-Adha", am: "ኢድ አል አድሃ", date: "2027-05-17" },
  { id: "mawlid-2027", en: "Mawlid", am: "መውሊድ", date: "2027-08-15" },
  { id: "eid-fitr-2028", en: "Eid al-Fitr", am: "ኢድ አል ፈጥር", date: "2028-02-27" },
  { id: "eid-adha-2028", en: "Eid al-Adha", am: "ኢድ አል አድሃ", date: "2028-05-05" },
  { id: "mawlid-2028", en: "Mawlid", am: "መውሊድ", date: "2028-08-03" }
];

/** Holidays from today (Addis time) onward, soonest first. */
export function upcomingHolidays(now = new Date(), limit = 3): Array<Holiday & { daysAway: number }> {
  const today = addisParts(now);
  const todayJdn = gregorianToJdn(today.year, today.month, today.day);
  const all: Holiday[] = [];

  for (const year of [today.year, today.year + 1]) {
    for (const rule of RULES) {
      let date: string;
      if (rule.gregorian) {
        date = iso(year, rule.gregorian.month, rule.gregorian.day);
      } else {
        // The Ethiopian year that has this month in Gregorian `year`.
        const ethYear = rule.ethiopian!.month <= 4 ? year - 7 : year - 8;
        const g = toGregorian({ year: ethYear, ...rule.ethiopian! });
        date = iso(g.year, g.month, g.day);
      }
      all.push({ id: `${rule.id}-${year}`, en: rule.en, am: rule.am, country: rule.country, date });
    }
    const easter = fasika(year);
    all.push({ id: `siklet-${year}`, en: "Siklet · Good Friday", am: "ስቅለት", country: "Ethiopia", date: shiftDays(easter, -2) });
    all.push({ id: `fasika-${year}`, en: "Fasika · Easter", am: "ፋሲካ", country: "Ethiopia", date: easter });
  }

  for (const feast of ISLAMIC) all.push({ ...feast, country: "Ethiopia", approximate: true });

  return all
    .map((holiday) => {
      const [y, m, d] = holiday.date.split("-").map(Number);
      return { ...holiday, daysAway: gregorianToJdn(y, m, d) - todayJdn };
    })
    .filter((holiday) => holiday.daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/** Western digits in Ge'ez numerals are rarely used day to day; Arabic digits are standard. */
export function formatEthiopianDate(date: EthiopianDate, lang: "en" | "am") {
  const month = ETHIOPIAN_MONTHS[date.month - 1];
  return lang === "am" ? `${month.am} ${date.day}, ${date.year} ዓ.ም.` : `${month.en} ${date.day}, ${date.year}`;
}
