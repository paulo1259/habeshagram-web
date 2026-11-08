-- Tighten 0008: the pending-suggestion counter was in the public schema, so it
-- was also reachable as /rest/v1/rpc/pending_event_suggestions and would
-- report anyone's count. Move it to a schema the API doesn't expose, and have
-- it count only the caller's own suggestions.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.my_pending_event_suggestions()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.community_events
  where submitted_by = (select auth.uid()) and status = 'pending';
$$;

revoke all on function private.my_pending_event_suggestions() from public, anon;
grant execute on function private.my_pending_event_suggestions() to authenticated;

drop policy community_events_suggest on public.community_events;

create policy community_events_suggest on public.community_events
  for insert to authenticated
  with check (
    status = 'pending'
    and submitted_by = (select auth.uid())
    and private.my_pending_event_suggestions() < 5
  );

drop function public.pending_event_suggestions(uuid);
