-- Zema is radio + news. The social layer carried over from HabeshaGram
-- (posts, likes, comments, follows, notifications, moderation, editorial)
-- has no code left that uses it, and every table was empty when dropped.
-- `profiles` stays: Supabase Auth's signup trigger writes to it.

drop view if exists public.posts_with_author;

drop table if exists public.post_likes cascade;
drop table if exists public.comments cascade;
drop table if exists public.saved_posts cascade;
drop table if exists public.reports cascade;
drop table if exists public.notifications cascade;
drop table if exists public.posts cascade;
drop table if exists public.follows cascade;
drop table if exists public.daily_debates cascade;
drop table if exists public.curated_videos cascade;
drop table if exists public.editorial_highlights cascade;

-- Trigger functions that only served those tables.
drop function if exists public.sync_comment_count();
drop function if exists public.sync_follow_counts();
drop function if exists public.sync_like_count();

-- Profile columns that only made sense with posts and follows.
alter table public.profiles
  drop column if exists pinned_post_id,
  drop column if exists follower_count,
  drop column if exists following_count;
