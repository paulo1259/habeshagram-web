-- Covering indexes for foreign keys that had none.
--
-- Without these, a cascading delete (removing a user, or a post with comments)
-- has to sequentially scan the referencing table, and reverse lookups such as
-- "every comment this person wrote" do the same. Cheap now, painful later.

create index comments_author_idx       on public.comments (author_id);
create index notifications_actor_idx   on public.notifications (actor_id);
create index notifications_target_idx  on public.notifications (target_post_id);
create index reports_post_idx          on public.reports (post_id);
create index reports_reported_user_idx on public.reports (reported_user_id);
create index reports_reporter_idx      on public.reports (reporter_id);
create index saved_posts_post_idx      on public.saved_posts (post_id);
