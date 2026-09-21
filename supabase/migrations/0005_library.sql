-- What an account is for on Zema: favourite stations, the station you were
-- last listening to (so any device can pick up where you left off), and
-- stories saved for later.
--
-- Every row belongs to one user and only that user can see or change it.
-- Station ids are the slugs in services/discovery-data.ts; they are not
-- foreign keys because stations live in code, not the database.

-- favourite stations ----------------------------------------------------------
create table public.favorite_stations (
  user_id    uuid not null references auth.users (id) on delete cascade,
  station_id text not null check (station_id ~ '^[a-z0-9-]{1,64}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, station_id)
);

-- last station ----------------------------------------------------------------
create table public.listening_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  station_id text not null check (station_id ~ '^[a-z0-9-]{1,64}$'),
  updated_at timestamptz not null default now()
);

-- saved stories ---------------------------------------------------------------
-- A snapshot of the story, because the news feed only holds the last day or
-- two; a story saved last week has to be readable without the feed.
create table public.saved_stories (
  user_id      uuid not null references auth.users (id) on delete cascade,
  story_id     text not null check (char_length(story_id) between 1 and 300),
  headline     text not null check (char_length(headline) between 1 and 500),
  source       text not null default '' check (char_length(source) <= 200),
  -- Rendered as a link, so only web URLs: no javascript: or data: schemes.
  link         text not null check (link ~* '^https?://' and char_length(link) <= 2000),
  image_url    text check (image_url is null or (image_url ~* '^https?://' and char_length(image_url) <= 2000)),
  section      text not null default 'top' check (section in ('top', 'ethiopia', 'eastafrica', 'diaspora')),
  published_at timestamptz,
  saved_at     timestamptz not null default now(),
  primary key (user_id, story_id)
);

create index saved_stories_user_saved_at_idx on public.saved_stories (user_id, saved_at desc);

-- Row Level Security ----------------------------------------------------------
alter table public.favorite_stations enable row level security;
alter table public.listening_state   enable row level security;
alter table public.saved_stories     enable row level security;

-- Signed-out visitors get nothing, not even an empty read.
revoke all on public.favorite_stations, public.listening_state, public.saved_stories from anon;

create policy favorite_stations_own on public.favorite_stations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy listening_state_own on public.listening_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy saved_stories_own on public.saved_stories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
