-- Community events, moved out of the code so listings can be added without a
-- deploy.
--
-- Anyone can read approved events. Signed-in listeners can suggest an event;
-- it arrives as 'pending' and stays invisible until an editor approves it.
--
-- To review suggestions: Supabase dashboard → Table Editor → community_events,
-- filter status = pending. Check the source link, then set status to
-- 'approved' and checked_on to today (or 'rejected'). An approved row must have
-- checked_on — the date someone last confirmed it against the source.
--
-- Times: start_at/end_at are exact instants. The display time zone comes from
-- the city (see cityTimeZone in lib/events/catalogue.ts), so the city list
-- here and eventCities there must change together.

create table public.community_events (
  id           text primary key check (id ~ '^[a-z0-9-]{3,100}$'),
  title        text not null check (char_length(title) between 1 and 160),
  city         text not null check (city in ('Washington, DC', 'Seattle')),
  category     text not null check (category in ('culture', 'music', 'community')),
  event_date   date not null,
  start_at     timestamptz,
  end_at       timestamptz,
  venue        text not null check (char_length(venue) between 1 and 200),
  address      text check (char_length(address) <= 300),
  organizer    text not null check (char_length(organizer) between 1 and 200),
  summary      text not null check (char_length(summary) between 1 and 1000),
  source_name  text not null check (char_length(source_name) between 1 and 120),
  source_url   text not null check (source_url ~ '^https://' and char_length(source_url) <= 500),
  checked_on   date,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  check (end_at is null or (start_at is not null and end_at > start_at)),
  check (status <> 'approved' or checked_on is not null)
);

comment on table public.community_events is
  'Community event listings. Public reads see approved rows only; signed-in users may suggest pending rows.';

create index community_events_status_date_idx on public.community_events (status, event_date);
create index community_events_submitted_by_idx on public.community_events (submitted_by);

alter table public.community_events enable row level security;

revoke all on public.community_events from anon, authenticated;
grant select on public.community_events to anon, authenticated;
-- Suggesters can fill in the listing itself, never its status, review date or owner.
grant insert (id, title, city, category, event_date, start_at, end_at, venue, address,
              organizer, summary, source_name, source_url)
  on public.community_events to authenticated;

create policy community_events_public_read on public.community_events
  for select to anon, authenticated
  using (status = 'approved');

-- Counts a user's suggestions still waiting for review. Security definer so it
-- can see pending rows, which the read policy hides.
create or replace function public.pending_event_suggestions(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.community_events
  where submitted_by = p_user and status = 'pending';
$$;

revoke all on function public.pending_event_suggestions(uuid) from public, anon;
grant execute on function public.pending_event_suggestions(uuid) to authenticated;

-- At most five suggestions waiting per person keeps the review queue sane.
create policy community_events_suggest on public.community_events
  for insert to authenticated
  with check (
    status = 'pending'
    and submitted_by = (select auth.uid())
    and public.pending_event_suggestions((select auth.uid())) < 5
  );

-- The listings that used to live in lib/events/catalogue.ts.
insert into public.community_events
  (id, title, city, category, event_date, start_at, end_at, venue, address, organizer,
   summary, source_name, source_url, checked_on, status, submitted_by)
values
  ('taste-of-ethiopian-coffee-2026', 'Taste of Ethiopian Coffee', 'Washington, DC', 'culture',
   '2026-11-14', '2026-11-14T17:00:00-05:00', '2026-11-14T21:00:00-05:00',
   'Embassy of Ethiopia', '3506 International Dr NW, Washington, DC 20008', 'Robe Coffee',
   'An evening exploring Ethiopian coffee through tastings, ceremony and conversations with the coffee community.',
   'Ethiopique', 'https://ethiopique.com/event/taste-of-ethiopian-coffee-2/', '2026-11-07', 'approved', null),
  ('meet-the-eris-seattle-november-2026', 'Meet The Eri’s Seattle', 'Seattle', 'music',
   '2026-11-28', '2026-11-28T22:00:00-08:00', null,
   'Union N Eritrean and Ethiopian Bar and Restaurant', '8824 Renton Avenue South, Seattle, WA 98118', '3ritreanRaider',
   'A Seattle nightlife gathering for Eritreans and friends. Check the ticket listing for admission requirements and availability.',
   'Eventbrite', 'https://www.eventbrite.com/e/meet-the-eris-seattle-1128-tickets-2004029421948', '2026-11-07', 'approved', null),
  ('tigray-seattle-christmas-2026', 'Christmas Celebration', 'Seattle', 'community',
   '2026-12-19', null, null,
   'Tigray Community Center, Seattle', null, 'Tigray Community Seattle',
   'A community holiday gathering with food, cultural performances and activities for children. The organizer has published the date; the start time is not yet listed.',
   'Tigray Community Seattle', 'https://tcseattle.org/events', '2026-11-07', 'approved', null);
