-- Restrictive policies enforce moderation even with old permissive insert policies.
create policy "New video rows require server review" on public.videos as restrictive for insert to anon,authenticated with check(false);
create or replace function public.guard_reviewed_video_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if current_user in ('anon','authenticated') and
    (new.url is distinct from old.url or new.s3_url is distinct from old.s3_url or new.s3_key is distinct from old.s3_key or
     new.title is distinct from old.title or new.description is distinct from old.description or
     new.category is distinct from old.category or new.user_id is distinct from old.user_id or
     new.upload_metadata is distinct from old.upload_metadata) then
    raise exception 'Video content changes require a new Orvelis review' using errcode='42501';
  end if;
  return new;
end;
$$;
create trigger guard_reviewed_video_fields before update on public.videos for each row execute function public.guard_reviewed_video_fields();

-- Posts cannot be used as an alternate entry point for unreviewed video URLs.
create or replace function public.guard_post_video()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if current_user in ('anon','authenticated') and nullif(new.video_url,'') is not null and
    (tg_op='INSERT' or new.video_url is distinct from old.video_url) and
    not exists(select 1 from public.videos v where v.url=new.video_url or v.s3_url=new.video_url) then
    raise exception 'Video must pass Orvelis review before sharing' using errcode='42501';
  end if;
  return new;
end;
$$;
create trigger guard_post_video before insert or update on public.posts for each row execute function public.guard_post_video();

-- Retire legacy SECURITY DEFINER upload entry points that bypass table policies.
revoke all on function public.create_video_safe(text,text,text,text,text,text[],text,bigint,integer,text[]) from public,anon,authenticated;
revoke all on function public.create_video_safe(text,text,text,text,text,text,text,bigint,integer) from public,anon,authenticated;
grant execute on function public.create_video_safe(text,text,text,text,text,text[],text,bigint,integer,text[]) to service_role;
grant execute on function public.create_video_safe(text,text,text,text,text,text,text,bigint,integer) to service_role;
