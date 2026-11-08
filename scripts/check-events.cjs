// Checks the pure event helpers: expiry, time zones, and calendar (.ics) output.
// The listings themselves live in Supabase; these fixtures mirror real ones.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(path) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', 'module', code)(mod.exports, mod);
  return mod.exports;
}
const { isUpcoming, zonedTimeToIso, cityTimeZone } = load('lib/events/catalogue.ts');
const { eventCalendar } = load('lib/events/calendar.ts');

const base = { venue: 'Venue', organizer: 'Organizer', summary: 'Summary', sourceName: 'Source', sourceUrl: 'https://example.org/event', checkedOn: '2026-11-07' };
const coffee = { ...base, id: 'coffee', title: 'Taste of Ethiopian Coffee', city: 'Washington, DC', category: 'culture', date: '2026-11-14', timeZone: 'America/New_York', start: '2026-11-14T22:00:00.000Z', end: '2026-11-15T02:00:00.000Z', address: '3506 International Dr NW' };
const music = { ...base, id: 'music', title: 'Meet The Eri’s Seattle', city: 'Seattle', category: 'music', date: '2026-11-28', timeZone: 'America/Los_Angeles', start: '2026-11-29T06:00:00.000Z' };
const holiday = { ...base, id: 'holiday', title: 'Christmas Celebration', city: 'Seattle', category: 'community', date: '2026-12-19', timeZone: 'America/Los_Angeles' };

// Expiry: published end, else end of the local calendar day.
assert.equal(isUpcoming(coffee, new Date('2026-11-15T01:59:59Z')), true);
assert.equal(isUpcoming(coffee, new Date('2026-11-15T02:00:00Z')), false);
assert.equal(isUpcoming(music, new Date('2026-11-29T07:59:59Z')), true);
assert.equal(isUpcoming(music, new Date('2026-11-29T08:00:00Z')), false);
assert.equal(isUpcoming(holiday, new Date('2026-12-20T07:59:59Z')), true);
assert.equal(isUpcoming(holiday, new Date('2026-12-20T08:00:00Z')), false);

// Local wall-clock time to an instant, either side of DST and across midnight UTC.
assert.equal(zonedTimeToIso('2026-11-14', '17:00', 'America/New_York'), '2026-11-14T22:00:00.000Z');
assert.equal(zonedTimeToIso('2026-07-04', '17:00', 'America/New_York'), '2026-07-04T21:00:00.000Z');
assert.equal(zonedTimeToIso('2026-11-28', '22:00', 'America/Los_Angeles'), '2026-11-29T06:00:00.000Z');
assert.equal(zonedTimeToIso('2026-03-08', '03:30', 'America/Los_Angeles'), '2026-03-08T10:30:00.000Z');
assert.equal(zonedTimeToIso('2026-11-01', '00:30', 'America/New_York'), '2026-11-01T04:30:00.000Z');
assert.deepEqual(Object.keys(cityTimeZone).sort(), ['Seattle', 'Washington, DC']);

// Calendar files.
const timed = eventCalendar(coffee);
assert.ok(timed.includes('DTSTART:20261114T220000Z\r\n'));
assert.ok(timed.includes('DTEND:20261115T020000Z\r\n'));
const dateOnly = eventCalendar(holiday);
assert.ok(dateOnly.includes('DTSTART;VALUE=DATE:20261219\r\n'));
assert.ok(dateOnly.includes('DTEND;VALUE=DATE:20261220\r\n'));
assert.ok(!eventCalendar(music).includes('DTEND:'));
const tricky = eventCalendar({ ...coffee, title: 'ሰላም'.repeat(70) + ', tea; coffee\nline\\end' });
for (const line of tricky.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
assert.ok(tricky.replace(/\r\n /g, '').includes('\\, tea\\; coffee\\nline\\\\end'));

console.log('PASS: expiry boundaries, local time conversion, timed and date-only ICS, escaping, UTF-8 folding.');
