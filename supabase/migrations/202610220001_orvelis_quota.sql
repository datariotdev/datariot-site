-- Apply before enabling /api/orvelis. No video/content data is stored here.
begin;
create table if not exists public.orvelis_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  minute_start timestamptz not null, minute_count integer not null,
  day_start timestamptz not null, day_count integer not null
);
alter table public.orvelis_usage enable row level security;
revoke all on public.orvelis_usage from public, anon, authenticated;
create or replace function public.consume_orvelis_quota()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  minute_bucket timestamptz := date_trunc('minute', now());
  day_bucket timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  accepted uuid;
begin
  if caller is null then return false; end if;
  insert into public.orvelis_usage as usage (user_id, minute_start, minute_count, day_start, day_count)
  values (caller, minute_bucket, 1, day_bucket, 1)
  on conflict (user_id) do update set
    minute_start = minute_bucket,
    minute_count = case when usage.minute_start = minute_bucket then usage.minute_count + 1 else 1 end,
    day_start = day_bucket,
    day_count = case when usage.day_start = day_bucket then usage.day_count + 1 else 1 end
  where (usage.minute_start <> minute_bucket or usage.minute_count < 6)
    and (usage.day_start <> day_bucket or usage.day_count < 60)
  returning user_id into accepted;
  return accepted is not null;
end;
$$;
revoke all on function public.consume_orvelis_quota() from public, anon;
grant execute on function public.consume_orvelis_quota() to authenticated;
commit;
