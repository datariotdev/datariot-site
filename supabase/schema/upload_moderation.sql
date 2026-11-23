-- New uploads stay private until actual-video moderation succeeds.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('upload-review','upload-review',false,140000000,array['video/mp4','video/quicktime','video/webm']),
       ('approved-videos','approved-videos',true,140000000,array['video/mp4','video/quicktime','video/webm'])
on conflict(id) do nothing;
create policy "Stage own video" on storage.objects for insert to authenticated
with check(bucket_id='upload-review' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Read staged own video" on storage.objects for select to authenticated
using(bucket_id='upload-review' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Staging ownership is mandatory" on storage.objects as restrictive for insert to anon,authenticated
with check(bucket_id<>'upload-review' or (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Staged originals are immutable" on storage.objects as restrictive for update to anon,authenticated
using(bucket_id not in ('upload-review','approved-videos')) with check(bucket_id not in ('upload-review','approved-videos'));
create policy "Reviewed objects cannot be replaced" on storage.objects as restrictive for delete to anon,authenticated
using(bucket_id not in ('upload-review','approved-videos'));
create policy "Only server promotes video" on storage.objects as restrictive for insert to anon,authenticated
with check(bucket_id<>'approved-videos');
create policy "Approved videos are readable" on storage.objects for select to anon,authenticated using(bucket_id='approved-videos');

create table public.upload_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_path text not null,
  fingerprint text not null,
  details jsonb not null,
  result jsonb not null,
  decision text not null check(decision in ('approved','rejected','review')),
  created_at timestamptz not null default now(),
  video_id uuid references public.videos(id) on delete set null,
  unique(user_id,source_path,fingerprint)
);
alter table public.upload_reviews enable row level security;
revoke all on public.upload_reviews from public,anon,authenticated;
grant all on public.upload_reviews to service_role;
alter table public.videos add column if not exists upload_metadata jsonb;

-- Only the authenticated Edge Function may call this atomic, idempotent publisher.
create or replace function public.publish_reviewed_upload(p_review uuid,p_user uuid,p_url text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare r public.upload_reviews; vid uuid; meta jsonb; expected text; public_path text;
begin
  select * into r from public.upload_reviews where id=p_review and user_id=p_user for update;
  if not found or r.decision<>'approved' then raise exception 'REVIEW_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(r.source_path,0));
  select video_id into vid from public.upload_reviews where user_id=p_user and source_path=r.source_path and video_id is not null limit 1;
  if vid is not null then return vid; end if;
  if r.created_at < now()-interval '24 hours' then raise exception 'REVIEW_REQUIRED'; end if;
  public_path:=p_user::text||'/'||r.id::text||'.'||split_part(r.source_path,'.',array_length(string_to_array(r.source_path,'.'),1));
  expected:='https://uycrtobdewnscwazshcu.supabase.co/storage/v1/object/public/approved-videos/'||public_path;
  if p_url<>expected then raise exception 'INVALID_MEDIA'; end if;
  meta:=r.details;
  insert into public.videos(user_id,title,description,url,category,duration,hashtags,upload_metadata)
  values(p_user,meta->>'title',meta->>'description',p_url,meta->>'category',(r.result->>'duration')::numeric,
    array(select jsonb_array_elements_text(meta->'tags')),
    jsonb_build_object('sources',meta->'sources','language',meta->>'language','review_id',r.id,'reviewed_at',r.created_at)) returning id into vid;
  if nullif(meta->>'debateId','') is not null then
    if not exists(select 1 from public.posts where id=(meta->>'debateId')::uuid and is_published=true) then raise exception 'DEBATE_UNAVAILABLE'; end if;
    insert into public.comments(post_id,user_id,text,video_id)
    values((meta->>'debateId')::uuid,p_user,coalesce(meta->>'side','FOR')||':|'||(meta->>'title')||E'\n'||(meta->>'description'),vid);
  elsif coalesce((meta->>'shareToCircle')::boolean,false) then
    insert into public.posts(user_id,content,video_url,is_published)
    values(p_user,(meta->>'title')||E'\n'||(meta->>'description'),p_url,true);
  end if;
  update public.upload_reviews set video_id=vid where id=r.id;
  return vid;
end;
$$;
revoke all on function public.publish_reviewed_upload(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.publish_reviewed_upload(uuid,uuid,text) to service_role;
