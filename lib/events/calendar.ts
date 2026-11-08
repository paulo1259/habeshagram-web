import type { CommunityEvent } from "./catalogue";

const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
const utc = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
// RFC 5545 lines are limited by UTF-8 octets, not JavaScript string length.
function fold(line: string) {
  const encoder = new TextEncoder();
  let result = "", bytes = 0;
  for (const char of line) {
    const length = encoder.encode(char).length;
    if (bytes + length > 75) { result += "\r\n "; bytes = 1; }
    result += char; bytes += length;
  }
  return result;
}
export function eventCalendar(event: CommunityEvent) {
  const dateOnly = !event.start;
  const nextDay = new Date(`${event.date}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zema//Community Events//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${event.id}@habeshagram.today`, `DTSTAMP:${utc(`${event.checkedOn}T00:00:00Z`)}`,
    dateOnly ? `DTSTART;VALUE=DATE:${event.date.replace(/-/g, "")}` : `DTSTART:${utc(event.start!)}`,
    ...(dateOnly ? [`DTEND;VALUE=DATE:${nextDay.toISOString().slice(0,10).replace(/-/g, "")}`] : event.end ? [`DTEND:${utc(event.end)}`] : []),
    `SUMMARY:${escapeText(event.title)}`, `LOCATION:${escapeText(event.address || event.venue)}`,
    `DESCRIPTION:${escapeText(`${event.summary}\n${dateOnly ? "Date reminder only. Start time not announced.\n" : ""}Check the source for changes: ${event.sourceUrl}`)}`,
    `URL:${event.sourceUrl}`, "END:VEVENT", "END:VCALENDAR"];
  return lines.map(fold).join("\r\n") + "\r\n";
}
