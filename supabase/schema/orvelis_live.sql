-- Shared analysis contains only clip content. Personal chats are never cached.
create table if not exists public.orvelis_clip_cache (
  video_id uuid not null references public.videos(id) on delete cascade,
  revision text not null,
  analysis jsonb,
  lease_until timestamptz not null default now() + interval '90 seconds',
  expires_at timestamptz not null default now() + interval '7 days',
  primary key (video_id, revision)
);
alter table public.orvelis_clip_cache enable row level security;
revoke all on public.orvelis_clip_cache from public, anon, authenticated;
grant all on public.orvelis_clip_cache to service_role;

create table if not exists public.orvelis_request_budget (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  kind text not null check (kind in ('minute', 'day')),
  requests integer not null default 1,
  primary key (user_id, window_start, kind)
);
alter table public.orvelis_request_budget enable row level security;
revoke all on public.orvelis_request_budget from public, anon, authenticated;
grant all on public.orvelis_request_budget to service_role;

create or replace function public.orvelis_take_budget(p_user uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare minute_count integer; day_count integer;
begin
  insert into public.orvelis_request_budget(user_id, window_start, kind)
  values (p_user, date_trunc('minute', now()), 'minute')
  on conflict (user_id, window_start, kind) do update
  set requests = public.orvelis_request_budget.requests + 1 returning requests into minute_count;
  insert into public.orvelis_request_budget(user_id, window_start, kind)
  values (p_user, date_trunc('day', now()), 'day')
  on conflict (user_id, window_start, kind) do update
  set requests = public.orvelis_request_budget.requests + 1 returning requests into day_count;
  delete from public.orvelis_request_budget where user_id = p_user and window_start < now() - interval '2 days';
  return minute_count <= 12 and day_count <= 120;
end;
$$;
revoke all on function public.orvelis_take_budget(uuid) from public, anon, authenticated;
grant execute on function public.orvelis_take_budget(uuid) to service_role;
