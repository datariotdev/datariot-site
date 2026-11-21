create schema if not exists creator_growth;
revoke all on schema creator_growth from public;
grant usage on schema creator_growth to anon, authenticated;

-- One observation per viewer, video, day and surface. The client never sends a viewer ID.
create table creator_growth.video_daily (
    video_id uuid not null references public.videos(id) on delete cascade,
    viewer_id uuid not null references auth.users(id) on delete cascade,
    day date not null default (now() at time zone 'UTC')::date,
    surface text not null check (surface in ('feed', 'profile', 'other')),
    created_at timestamptz not null default now(),
    watched_ms integer not null default 0 check (watched_ms between 0 and 900000),
    ratio real not null default 0 check (ratio between 0 and 1),
    sections integer not null default 0 check (sections between 0 and 1048575),
    primary key (video_id, viewer_id, day, surface)
);
alter table creator_growth.video_daily enable row level security;
revoke all on creator_growth.video_daily from public, anon, authenticated;
create index video_daily_viewer_day_idx on creator_growth.video_daily (viewer_id, day desc);
create index video_daily_day_idx on creator_growth.video_daily (day);

create function creator_growth.record_sample(p_video uuid, p_surface text, p_watch_ms integer, p_duration_ms integer, p_sections integer)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
    viewer uuid := auth.uid();
    today date := (now() at time zone 'UTC')::date;
    bounded_watch integer;
begin
    if viewer is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, true) then return; end if;
    if p_surface is null or p_surface not in ('feed','profile','other')
       or p_watch_ms is null or p_watch_ms not between 0 and 900000
       or p_sections is null or p_sections not between 0 and 1048575 then return; end if;
    if not exists (
        select 1 from public.videos v where v.id = p_video
        and v.user_id is distinct from viewer
        and coalesce(nullif(v.url, ''), nullif(v.s3_url, '')) is not null
    ) then return; end if;

    insert into creator_growth.video_daily(video_id, viewer_id, day, surface)
    values (p_video, viewer, today, p_surface)
    on conflict do nothing;

    if p_watch_ms < 250 or p_duration_ms is null or p_duration_ms not between 250 and 3600000 then return; end if;
    update creator_growth.video_daily d
      set watched_ms = greatest(d.watched_ms, bounded.ms),
          ratio = greatest(d.ratio, bit_count(coverage.mask::bit(20)) / 20.0),
          sections = d.sections | coverage.mask
    from (
        select least(p_watch_ms, (extract(epoch from (clock_timestamp() - dd.created_at)) * 1000)::integer + 5000)
        as ms
        from creator_growth.video_daily dd
        where dd.video_id = p_video and dd.viewer_id = viewer and dd.day = today and dd.surface = p_surface
    ) bounded
    cross join lateral (
        select case when p_watch_ms <= bounded.ms + 2000
            and bit_count(p_sections::bit(20)) * p_duration_ms * 0.0325 <= bounded.ms + 1000
            then p_sections else 0 end as mask
    ) coverage
    where d.video_id = p_video and d.viewer_id = viewer and d.day = today and d.surface = p_surface;
end;
$$;
revoke all on function creator_growth.record_sample(uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function creator_growth.record_sample(uuid, text, integer, integer, integer) to authenticated;

create function public.record_video_sample(p_video uuid, p_surface text, p_watch_ms integer, p_duration_ms integer, p_sections integer)
returns void language sql security invoker set search_path = ''
as $$ select creator_growth.record_sample(p_video, p_surface, p_watch_ms, p_duration_ms, p_sections); $$;
revoke all on function public.record_video_sample(uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.record_video_sample(uuid, text, integer, integer, integer) to authenticated;

create function creator_growth.feed_order(p_category text)
returns table(video_id uuid, rank_index integer)
language sql stable security definer set search_path = ''
as $$
    with candidates as materialized (
        select v.id, v.user_id, v.category, v.created_at
        from public.videos v
        where v.user_id is not null
          and v.user_id <> '00000000-0000-0000-0000-000000000000'::uuid
          and v.category is distinct from 'animated-shorts'
          and (p_category is null or v.category = p_category)
          and exists (
              select 1 from unnest(array[v.url, v.s3_url]) as u(media)
              where u.media ~ '^https?://'
                and u.media !~* '(clipto-videos\.s3\.eu-north-1\.amazonaws\.com|commondatastorage\.googleapis\.com|/sample/|placeholder)'
          )
        order by v.created_at desc nulls last, v.id
        limit 600
    ), samples as (
        select d.video_id, d.viewer_id,
               max(d.watched_ms) as watch_ms, max(d.ratio) as ratio,
               bool_or((d.sections & 524288) <> 0 and d.ratio >= 0.90) as completed
        from creator_growth.video_daily d join candidates c on c.id = d.video_id
        where d.surface = 'feed' and d.day >= (now() at time zone 'UTC')::date - 13
        group by d.video_id, d.viewer_id
    ), statistics as (
        select s.video_id, count(*) as reach,
               count(*) filter(where s.watch_ms > 0) as starts,
               sum(s.ratio) as ratios, count(*) filter(where s.completed) as completions,
               count(*) filter(where s.watch_ms between 1 and 2499 and not s.completed) as skips
        from samples s group by s.video_id
    ), interactions as (
        select v.id, (
            select count(distinct l.user_id) from public.likes l
            where l.video_id = v.id and l.user_id <> v.user_id and l.created_at >= now() - interval '14 days'
        ) + (
            select 2 * count(distinct s.user_id) from public.save_actions s
            where s.video_id = v.id and s.user_id <> v.user_id and s.created_at >= now() - interval '14 days'
        ) + (
            select 2 * count(distinct c.user_id) from public.comments c
            where c.video_id = v.id and c.user_id <> v.user_id and c.created_at >= now() - interval '14 days'
        ) as intent
        from candidates v
    ), viewer_history as materialized (
        select d.video_id, max(d.watched_ms) as watch_ms, max(d.ratio) as ratio
        from creator_growth.video_daily d
        where d.viewer_id = auth.uid() and d.day >= (now() at time zone 'UTC')::date - 13
        group by d.video_id
    ), interests as (
        select v.category, least(1.0, sum(h.ratio) / 4.0) as affinity
        from viewer_history h join public.videos v on h.video_id = v.id
        where h.watch_ms >= 2500 and h.ratio >= 0.25
        group by v.category
    ), scored as (
        select c.*, coalesce(s.reach, 0) as reach, coalesce(h.watch_ms, 0) >= 2500 as seen,
               c.created_at > now() - interval '7 days' and coalesce(s.reach, 0) < 40
                   and coalesce(h.watch_ms, 0) < 2500 as explore,
               0.36 * (coalesce(s.ratios, 0) + 12 * 0.38) / (coalesce(s.starts, 0) + 12)
             + 0.23 * (coalesce(s.completions, 0) + 12 * 0.25) / (coalesce(s.starts, 0) + 12)
             - 0.19 * (coalesce(s.skips, 0) + 12 * 0.28) / (coalesce(s.starts, 0) + 12)
             + 0.12 * least(1.0, (coalesce(a.intent, 0) + 1.0) / (coalesce(s.starts, 0) + 12))
             + 0.17 * coalesce(i.affinity, 0)
             + 0.14 * exp(-greatest(0, extract(epoch from (now() - c.created_at))) / 345600)
             - case when coalesce(h.watch_ms, 0) >= 2500 then 0.30 else 0 end as score
        from candidates c
        left join statistics s on s.video_id = c.id
        left join viewer_history h on h.video_id = c.id
        left join interests i on i.category = c.category
        left join interactions a on a.id = c.id
    ), author_slots as (
        select s.*,
            row_number() over(partition by s.explore, s.user_id order by
                case when s.explore then s.reach end asc nulls last, s.score desc, s.id) as author_slot
        from scored s
    ), first_exploration as (
        select s.id
        from author_slots s where s.explore
        order by s.author_slot, s.reach, s.score desc, s.id
        limit 150
    ), lanes as (
        select s.*, e.id is not null as test_slot,
            row_number() over(partition by (e.id is not null) order by
                case when e.id is not null then s.author_slot end asc nulls last,
                case when e.id is not null then s.reach end asc nulls last,
                s.score - least(s.author_slot - 1, 8) * 0.05 desc, s.id) - 1 as lane_index
        from author_slots s left join first_exploration e on e.id = s.id
    )
    select l.id, row_number() over(order by
        case when l.test_slot then l.lane_index * 4 + 2
             else (l.lane_index / 3) * 4 + case when l.lane_index % 3 = 2 then 3 else l.lane_index % 3 end
        end, l.id)::integer
    from lanes l order by 2;
$$;
revoke all on function creator_growth.feed_order(text) from public, anon, authenticated;
grant execute on function creator_growth.feed_order(text) to anon, authenticated;

create function public.ranked_video_feed(p_category text default null)
returns table(video_id uuid, rank_index integer)
language sql stable security invoker set search_path = ''
as $$ select * from creator_growth.feed_order(p_category); $$;
revoke all on function public.ranked_video_feed(text) from public, anon, authenticated;
grant execute on function public.ranked_video_feed(text) to anon, authenticated;

create function creator_growth.studio(p_days integer, p_video uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
    with bounds as (
        select (now() at time zone 'UTC')::date - (p_days - 1) as first_day,
               (now() at time zone 'UTC')::date as today
        where p_days in (7, 28) and auth.uid() is not null
    ), owned as materialized (
        select v.id, v.title, v.created_at, v.duration
        from public.videos v where v.user_id = auth.uid() and (p_video is null or v.id = p_video)
    ), samples as materialized (
        select d.*, (d.sections & 524288) <> 0 and d.ratio >= 0.90 as completed
        from creator_growth.video_daily d
        join owned o on o.id = d.video_id cross join bounds b
        where d.day between b.first_day and b.today and d.viewer_id <> auth.uid()
    ), by_viewer as (
        select s.video_id, s.viewer_id,
            max(s.watched_ms) as watch_ms, max(s.ratio) as ratio,
            bit_or(s.sections) as sections, bool_or(s.completed) as completed
        from samples s group by s.video_id, s.viewer_id
    ), video_totals as (
        select v.video_id, count(*) as reach, count(*) filter(where v.watch_ms > 0) as starts,
            coalesce(sum(v.watch_ms), 0) as watch_ms,
            coalesce(avg(v.ratio) filter(where v.watch_ms > 0), 0) as avg_ratio,
            count(*) filter(where v.completed) as complete,
            count(*) filter(where v.watch_ms between 1 and 2499 and not v.completed) as quick_exits
        from by_viewer v group by v.video_id
    ), daily as (
        select s.day, count(distinct s.viewer_id) filter(where s.watched_ms > 0) as viewers,
            count(*) filter(where s.surface = 'feed') as feed_exposures
        from samples s group by s.day
    ), engagement as (
        select o.id, o.title, o.duration, o.created_at,
               coalesce(t.reach, 0) as reach, coalesce(t.starts, 0) as starts, coalesce(t.watch_ms, 0) as watch_ms,
               coalesce(t.avg_ratio, 0) as avg_ratio, coalesce(t.complete, 0) as complete, coalesce(t.quick_exits, 0) as quick_exits,
               (select count(distinct l.user_id) from public.likes l where l.video_id = o.id and l.user_id <> auth.uid() and l.created_at >= b.first_day::timestamp at time zone 'UTC') as likes,
               (select count(distinct s.user_id) from public.save_actions s where s.video_id = o.id and s.user_id <> auth.uid() and s.created_at >= b.first_day::timestamp at time zone 'UTC') as saves,
               (select count(*) from public.comments c where c.video_id = o.id and c.user_id <> auth.uid() and c.created_at >= b.first_day::timestamp at time zone 'UTC') as comments
        from owned o cross join bounds b left join video_totals t on t.video_id = o.id
    )
    select case when not exists(select 1 from bounds) or (p_video is not null and not exists(select 1 from owned)) then null else
        jsonb_build_object(
            'published', (select count(*) from owned),
            'starts', (select count(*) from by_viewer v where v.watch_ms > 0),
            'watchMs', (select coalesce(sum(v.watch_ms), 0) from (
                select max(s.watched_ms) as watch_ms from samples s group by s.day, s.video_id, s.viewer_id
            ) v),
            'completionRate', (select avg(v.completed::integer) from by_viewer v where v.watch_ms > 0),
            'uniqueViewers', (select count(distinct v.viewer_id) from by_viewer v where v.watch_ms > 0),
            'feedExposures', (select count(*) from samples s where s.surface = 'feed'),
            'sources', coalesce((select jsonb_object_agg(a.surface, a.starts) from (
                select s.surface, count(distinct s.viewer_id) filter(where s.watched_ms > 0) as starts
                from samples s group by s.surface
            ) a), '{}'::jsonb),
            'daily', (select jsonb_agg(jsonb_build_object('date', days.ts::date, 'viewers', coalesce(d.viewers, 0), 'feedExposures', coalesce(d.feed_exposures, 0)) order by days.ts)
                 from bounds b cross join lateral generate_series(b.first_day, b.today, '1 day') days(ts)
                 left join daily d on d.day = days.ts::date),
            'videos', coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at desc nulls last, e.id)
               from (select * from engagement order by created_at desc nulls last, id limit 24) e), '[]'::jsonb),
            'retention', case when p_video is null then '[]'::jsonb else (select jsonb_agg((select count(*) from by_viewer v where (v.sections & (1 << step)) <> 0) order by step) from generate_series(0, 19) step) end
        ) end;
$$;
revoke all on function creator_growth.studio(integer, uuid) from public, anon, authenticated;
grant execute on function creator_growth.studio(integer, uuid) to authenticated;

create function public.creator_video_studio(p_days integer, p_video uuid default null)
returns jsonb
language sql stable security invoker set search_path = ''
as $$ select creator_growth.studio(p_days, p_video); $$;
revoke all on function public.creator_video_studio(integer, uuid) from public, anon, authenticated;
grant execute on function public.creator_video_studio(integer, uuid) to authenticated;

-- Keep only the rolling 28-day dashboard window plus seven days.
do $$
begin
    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        perform cron.schedule('creator-growth-expire-samples', '23 3 * * *',
            'delete from creator_growth.video_daily where day < (now() at time zone ''UTC'')::date - 34');
    end if;
end $$;
