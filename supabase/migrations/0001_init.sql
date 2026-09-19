-- HabeshaGram Web — initial Supabase schema
-- Replaces the Firestore data model. Web-only: this project is independent of
-- the iOS app's Firebase project and shares no users or content with it.
--
-- Design notes (the "why", so future edits don't undo the point):
--   * All counts (likes, comments, followers) are maintained by triggers.
--     Clients have no UPDATE path to them at all, so the Firestore holes where
--     any signed-in user could set likeCount or followerCount to an arbitrary
--     number are not expressible here.
--   * posts.is_system may only be set by the service role. The "Breaking Desk"
--     impersonation vector is closed by RLS rather than by a rule predicate.
--   * profiles deliberately has NO email column. The old users collection was
--     world-readable and carried every member's email address.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  username        text not null,
  bio             text not null default 'Happy to be part of the Habesha community.',
  avatar_url      text not null default '',
  pinned_post_id  uuid,
  follower_count  integer not null default 0 check (follower_count >= 0),
  following_count integer not null default 0 check (following_count >= 0),
  created_at      timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9._]{3,30}$')
);

-- Case-insensitive uniqueness without depending on the citext extension, whose
-- schema placement differs between a local Postgres and a Supabase project.
create unique index profiles_username_lower_idx on public.profiles (lower(username));

comment on table public.profiles is
  'Public profile per auth user. Email lives only in auth.users and is never exposed.';

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------

create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid references public.profiles (id) on delete cascade,
  text          text not null check (char_length(text) between 1 and 5000),
  image_url     text not null default '',
  hashtags      text[] not null default '{}',
  summary       text not null default '',
  source_label  text not null default '',
  source_url    text not null default '',
  is_system     boolean not null default false,
  dedupe_key    text unique,
  like_count    integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at    timestamptz not null default now(),
  -- A system post has no human author; a human post must have one.
  constraint posts_authorship check (
    (is_system and author_id is null) or (not is_system and author_id is not null)
  )
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_author_created_idx on public.posts (author_id, created_at desc);
create index posts_hashtags_idx on public.posts using gin (hashtags);

comment on column public.posts.dedupe_key is
  'Stable key for service-role ingested system posts, so re-running the news sync cannot duplicate them.';

-- ---------------------------------------------------------------------------
-- post_likes  (replaces the likedBy array)
-- ---------------------------------------------------------------------------

create table public.post_likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_idx on public.post_likes (user_id);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index comments_post_created_idx on public.comments (post_id, created_at);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- saved_posts
-- ---------------------------------------------------------------------------

create table public.saved_posts (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  post_id  uuid not null references public.posts (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create type public.notification_type as enum ('like', 'comment', 'follow');

create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  recipient_id   uuid not null references public.profiles (id) on delete cascade,
  actor_id       uuid not null references public.profiles (id) on delete cascade,
  type           public.notification_type not null,
  target_post_id uuid references public.posts (id) on delete cascade,
  message        text not null default '',
  is_read        boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint notifications_no_self check (recipient_id <> actor_id)
);

create index notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx
  on public.notifications (recipient_id) where not is_read;

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------

create type public.report_reason as enum ('spam', 'harassment', 'hate', 'other');
create type public.report_status as enum ('open', 'reviewed', 'dismissed', 'escalated');

create table public.reports (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid references public.posts (id) on delete set null,
  reported_user_id  uuid references public.profiles (id) on delete set null,
  reporter_id       uuid not null references public.profiles (id) on delete cascade,
  reason            public.report_reason not null,
  details           text not null default '',
  status            public.report_status not null default 'open',
  post_text_preview text not null default '',
  post_image_url    text not null default '',
  created_at        timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin-managed discovery content (service role writes; everyone reads)
-- ---------------------------------------------------------------------------

create table public.daily_debates (
  id             text primary key,
  prompt         text not null,
  category       text not null,
  hashtag        text,
  suggested_text text not null default '',
  featured       boolean not null default false,
  active         boolean not null default true,
  publish_label  text,
  created_at     timestamptz not null default now()
);

create table public.curated_videos (
  id            text primary key,
  title         text not null,
  category      text not null,
  source        text not null default '',
  summary       text not null default '',
  thumbnail_url text not null default '',
  video_url     text not null default '',
  embed_url     text not null default '',
  duration      text not null default '',
  hashtags      text[] not null default '{}',
  featured      boolean not null default false,
  publish_label text,
  created_at    timestamptz not null default now()
);

create table public.editorial_highlights (
  id            text primary key,
  headline      text not null,
  source        text not null default '',
  summary       text not null default '',
  category      text not null default '',
  image_url     text not null default '',
  link          text not null default '',
  featured      boolean not null default false,
  publish_label text,
  hashtags      text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- ===========================================================================
-- Triggers: counts are derived, never client-written
-- ===========================================================================

create or replace function public.sync_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  else
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
    return old;
  end if;
end;
$$;

create trigger post_likes_sync_count
after insert or delete on public.post_likes
for each row execute function public.sync_like_count();

create or replace function public.sync_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  else
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
end;
$$;

create trigger comments_sync_count
after insert or delete on public.comments
for each row execute function public.sync_comment_count();

create or replace function public.sync_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count  = follower_count  + 1 where id = new.following_id;
    return new;
  else
    update public.profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
    update public.profiles set follower_count  = greatest(0, follower_count  - 1) where id = old.following_id;
    return old;
  end if;
end;
$$;

create trigger follows_sync_counts
after insert or delete on public.follows
for each row execute function public.sync_follow_counts();

-- Create a profile automatically whenever an auth user is created.
-- Username comes from signup metadata, falling back to the email local part,
-- with a numeric suffix if that is already taken.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  desired text;
  candidate text;
  suffix integer := 0;
begin
  desired := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1),
    'habesha_user'
  );

  desired := regexp_replace(desired, '[^a-zA-Z0-9._]', '', 'g');
  if char_length(desired) < 3 then
    desired := 'habesha_user';
  end if;
  desired := left(desired, 26);

  candidate := desired;
  while exists (
    select 1 from public.profiles p where lower(p.username) = lower(candidate)
  ) loop
    suffix := suffix + 1;
    candidate := desired || suffix::text;
  end loop;

  insert into public.profiles (id, username)
  values (new.id, candidate);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===========================================================================
-- Feed view — keeps the app's existing Post shape (author fields inlined)
-- ===========================================================================

create view public.posts_with_author
with (security_invoker = true)
as
select
  p.id,
  p.author_id,
  coalesce(pr.username, 'Breaking Desk') as username,
  coalesce(pr.avatar_url, '')            as user_profile_image_url,
  p.text,
  p.image_url,
  p.hashtags,
  p.summary,
  p.source_label,
  p.source_url,
  p.is_system,
  p.like_count,
  p.comment_count,
  p.created_at
from public.posts p
left join public.profiles pr on pr.id = p.author_id;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.profiles             enable row level security;
alter table public.posts                enable row level security;
alter table public.post_likes           enable row level security;
alter table public.comments             enable row level security;
alter table public.follows              enable row level security;
alter table public.saved_posts          enable row level security;
alter table public.notifications        enable row level security;
alter table public.reports              enable row level security;
alter table public.daily_debates        enable row level security;
alter table public.curated_videos       enable row level security;
alter table public.editorial_highlights enable row level security;

-- profiles ------------------------------------------------------------------
create policy profiles_read_all on public.profiles
  for select using (true);

create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Counts are trigger-owned: revoke them from the client grant entirely.
revoke update on public.profiles from authenticated;
grant update (username, bio, avatar_url, pinned_post_id) on public.profiles to authenticated;

-- posts ---------------------------------------------------------------------
create policy posts_read_all on public.posts
  for select using (true);

-- A client may only insert a post authored by itself, and never a system post.
create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and is_system = false);

create policy posts_delete_own on public.posts
  for delete to authenticated
  using (author_id = (select auth.uid()));

-- No UPDATE policy: posts are immutable to clients. Counts move only by trigger.

-- post_likes ----------------------------------------------------------------
create policy post_likes_read_all on public.post_likes
  for select using (true);

create policy post_likes_insert_self on public.post_likes
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy post_likes_delete_self on public.post_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- comments ------------------------------------------------------------------
create policy comments_read_all on public.comments
  for select using (true);

create policy comments_insert_self on public.comments
  for insert to authenticated with check (author_id = (select auth.uid()));

-- Comment author, or the owner of the post being commented on.
create policy comments_delete_own_or_post_owner on public.comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.posts p
      where p.id = comments.post_id and p.author_id = (select auth.uid())
    )
  );

-- follows -------------------------------------------------------------------
create policy follows_read_all on public.follows
  for select using (true);

create policy follows_insert_self on public.follows
  for insert to authenticated with check (follower_id = (select auth.uid()));

create policy follows_delete_self on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

-- saved_posts ---------------------------------------------------------------
create policy saved_posts_own on public.saved_posts
  for select to authenticated using (user_id = (select auth.uid()));

create policy saved_posts_insert_self on public.saved_posts
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy saved_posts_delete_self on public.saved_posts
  for delete to authenticated using (user_id = (select auth.uid()));

-- notifications -------------------------------------------------------------
create policy notifications_read_own on public.notifications
  for select to authenticated using (recipient_id = (select auth.uid()));

create policy notifications_insert_as_actor on public.notifications
  for insert to authenticated with check (actor_id = (select auth.uid()));

create policy notifications_mark_read on public.notifications
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- Recipients may flip is_read and nothing else.
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

-- reports -------------------------------------------------------------------
-- Write-only for users; reading and triage happen through the service role.
create policy reports_insert_self on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');

-- admin-managed content -----------------------------------------------------
create policy daily_debates_read_all on public.daily_debates
  for select using (true);
create policy curated_videos_read_all on public.curated_videos
  for select using (true);
create policy editorial_highlights_read_all on public.editorial_highlights
  for select using (true);

-- ===========================================================================
-- Realtime
-- ===========================================================================

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.post_likes;
