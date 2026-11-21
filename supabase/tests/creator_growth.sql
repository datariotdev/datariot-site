-- Run after the migration in a test database or inside a rolled-back transaction.
do $$
declare
    creator uuid;
    viewer uuid;
    published uuid;
    unrelated uuid;
    stats jsonb;
    first_page integer[];
begin
    select id into creator from auth.users where is_anonymous is not true order by id limit 1;
    select id into viewer from auth.users where is_anonymous is not true and id <> creator order by id limit 1;
    if creator is null or viewer is null then raise exception 'Two signed-in fixtures are required'; end if;

    insert into public.videos(user_id, url, title, category, created_at, duration)
    values (creator, 'https://example.com/videos/fixture.mp4', 'Fixture', 'growth-test', now(), 40)
    returning id into published;
    insert into public.videos(user_id, url, title, category, created_at, duration)
    values (viewer, 'https://example.com/videos/another.mp4', 'Other creator', 'growth-test', now() - interval '8 days', 30)
    returning id into unrelated;

    insert into public.videos(user_id, url, title, category, created_at)
    select creator, 'https://example.com/videos/fixture-' || n || '.mp4', 'Older fixture', 'growth-test', now() - interval '8 days'
    from generate_series(1, 10) n;

    perform set_config('request.jwt.claims', jsonb_build_object('sub', viewer, 'role', 'authenticated', 'is_anonymous', false)::text, true);
    if public.creator_video_studio(7, published) is not null then raise exception 'Another creator can read clip analytics'; end if;
    select array_agg(rank_index) into first_page from public.ranked_video_feed('growth-test') where video_id = published;
    if first_page is distinct from array[3] then raise exception 'Expected the first exploration slot at rank 3: %', first_page; end if;

    perform public.record_video_sample(published, 'invalid', 0, 0, 0);
    perform public.record_video_sample(unrelated, 'feed', 0, 0, 0);
    perform public.record_video_sample(published, 'feed', 0, 0, 0);
    perform public.record_video_sample(published, 'feed', 0, 0, 0);
    perform public.record_video_sample(published, 'feed', 40000, 40000, 1048575);
    if (select count(*) from creator_growth.video_daily where video_id in (published, unrelated)) <> 1
        then raise exception 'Exposure is duplicated or invalid/self traffic was written'; end if;
    if (select watched_ms from creator_growth.video_daily where video_id = published) > 6000
        then raise exception 'Watch time exceeded its elapsed-time bound'; end if;
    if (select sections from creator_growth.video_daily where video_id = published) <> 0
        then raise exception 'Invalid coverage was accepted'; end if;

    update creator_growth.video_daily set created_at = clock_timestamp() - interval '45 seconds' where video_id = published;
    perform public.record_video_sample(published, 'feed', 38000, 40000, 1048575);
    perform public.record_video_sample(published, 'feed', 2000, 40000, 3);
    perform public.record_video_sample(published, 'profile', 4000, 40000, 1);

    perform set_config('request.jwt.claims', jsonb_build_object('sub', creator, 'role', 'authenticated', 'is_anonymous', false)::text, true);
    stats := public.creator_video_studio(7, published);
    if (stats->>'uniqueViewers')::integer is distinct from 1 or (stats->>'feedExposures')::integer is distinct from 1
       or (stats->>'watchMs')::integer is distinct from 38000 or (stats #>> '{videos,0,complete}')::integer is distinct from 1
       or (stats #>> '{retention,19}')::integer is distinct from 1 or jsonb_array_length(stats->'daily') is distinct from 7
       or (stats #>> '{sources,profile}')::integer is distinct from 1 then
        raise exception 'Unexpected analytics: %', stats;
    end if;
    if has_table_privilege('authenticated', 'creator_growth.video_daily', 'select')
       or has_function_privilege('anon', 'public.creator_video_studio(integer, uuid)', 'execute')
       or has_function_privilege('anon', 'public.record_video_sample(uuid, text, integer, integer, integer)', 'execute') then
        raise exception 'Private analytics grants are too broad';
    end if;
end $$;
