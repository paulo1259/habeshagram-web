-- Runs the "Aired today" recorder every two minutes and prunes old rows daily.
--
-- The recorder (Edge Function `record-airplay`) is protected by a random
-- secret generated here and kept in Supabase Vault. It never appears in the
-- repo: the cron job reads it from Vault, and the function checks it through
-- airplay_secret_matches().

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- One random secret, created once.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'airplay_cron_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'airplay_cron_secret',
      'Shared secret between pg_cron and the record-airplay Edge Function'
    );
  end if;
end;
$$;

create or replace function public.airplay_secret_matches(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'airplay_cron_secret' and decrypted_secret = p_secret
  );
$$;

revoke all on function public.airplay_secret_matches(text) from public, anon, authenticated;
grant execute on function public.airplay_secret_matches(text) to service_role;

-- Every 2 minutes: record what each station is playing.
select cron.schedule(
  'record-airplay',
  '*/2 * * * *',
  $job$
    select net.http_post(
      url := 'https://vtsjcggzqzxquglxvudj.supabase.co/functions/v1/record-airplay',
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'airplay_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 20000
    );
  $job$
);

-- Daily at 03:17 UTC: drop rows older than eight days.
select cron.schedule('prune-airplay', '17 3 * * *', 'select public.prune_station_airplay();');
