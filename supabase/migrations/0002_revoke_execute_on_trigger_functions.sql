-- Trigger functions are not meant to be callable over PostgREST.
--
-- They are SECURITY DEFINER because they write count columns that the calling
-- user deliberately has no privilege on. But PostgREST exposes every function
-- in the `public` schema at /rest/v1/rpc/<name>, and CREATE FUNCTION grants
-- EXECUTE to PUBLIC implicitly — so revoking from anon/authenticated alone is
-- not enough. The grant must be revoked from PUBLIC.
--
-- Only the table triggers need to invoke these; triggers run as the table
-- owner and are unaffected by this revoke.

revoke execute on function public.handle_new_user()    from public, anon, authenticated;
revoke execute on function public.sync_like_count()    from public, anon, authenticated;
revoke execute on function public.sync_comment_count() from public, anon, authenticated;
revoke execute on function public.sync_follow_counts() from public, anon, authenticated;
