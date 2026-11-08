const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(path) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', 'module', code)(mod.exports, mod);
  return mod.exports;
}
const { communityEvents, isUpcoming } = load('lib/events/catalogue.ts');
const { eventCalendar } = load('lib/events/calendar.ts');
const [coffee, music, holiday] = communityEvents;
assert.equal(isUpcoming(coffee, new Date('2026-11-15T01:59:59Z')), true);
assert.equal(isUpcoming(coffee, new Date('2026-11-15T02:00:00Z')), false);
assert.equal(isUpcoming(music, new Date('2026-11-29T07:59:59Z')), true);
assert.equal(isUpcoming(music, new Date('2026-11-29T08:00:00Z')), false);
assert.equal(isUpcoming(holiday, new Date('2026-12-20T07:59:59Z')), true);
assert.equal(isUpcoming(holiday, new Date('2026-12-20T08:00:00Z')), false);
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
assert.equal(new Set(communityEvents.map(e=>e.id)).size, communityEvents.length);
for(const event of communityEvents) {
  assert.equal(new URL(event.sourceUrl).protocol, 'https:');
  assert.ok(event.checkedOn <= event.date);
  if(event.end) assert.ok(Date.parse(event.end) > Date.parse(event.start));
}
console.log('PASS: expiry boundaries, local time zones, timed and date-only ICS, escaping, UTF-8 folding, catalogue integrity.');
