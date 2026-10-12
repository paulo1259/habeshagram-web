-- "Aired today": a log of what each station has actually played.
--
-- None of the stations publish a programme schedule, so Zema writes its own
-- from the live stream titles. Every couple of minutes the `record-airplay`
-- Edge Function reads each station's current title and calls
-- record_airplay(); consecutive sightings of the same title extend one row
-- instead of adding a new one, so each row is one song or show.
--
-- Reads are public (it is the same information the stream broadcasts).
-- Writes only happen through record_airplay(), which only the service role
-- may call.

create table public.station_airplay (
  id           bigint generated always as identity primary key,
  station_id   text not null check (station_id ~ '^[a-z0-9-]{1,64}$'),
  title        text not null check (char_length(title) between 1 and 200),
  started_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index station_airplay_station_started_idx
  on public.station_airplay (station_id, started_at desc);

alter table public.station_airplay enable row level security;

revoke all on public.station_airplay from anon, authenticated;
grant select on public.station_airplay to anon, authenticated;

create policy station_airplay_public_read on public.station_airplay
  for select to anon, authenticated
  using (true);

-- How long a title can go unseen and still count as the same airing. A bit
-- more than two recorder intervals, so one missed run does not split a song.
create or replace function public.record_airplay(p_station_id text, p_title text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest public.station_airplay;
begin
  select * into latest
  from public.station_airplay
  where station_id = p_station_id
  order by started_at desc
  limit 1;

  if latest.id is not null
     and latest.title = p_title
     and latest.last_seen_at > now() - interval '7 minutes' then
    update public.station_airplay set last_seen_at = now() where id = latest.id;
  else
    insert into public.station_airplay (station_id, title) values (p_station_id, p_title);
  end if;
end;
$$;

revoke all on function public.record_airplay(text, text) from public, anon, authenticated;
grant execute on function public.record_airplay(text, text) to service_role;

-- Keep a week: enough for "today" in every timezone plus some slack.
create or replace function public.prune_station_airplay()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.station_airplay where started_at < now() - interval '8 days';
$$;

revoke all on function public.prune_station_airplay() from public, anon, authenticated;
