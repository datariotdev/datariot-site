-- Apply after the original add_external_video_candidates_queue migration.
-- Some creator-verified short-form videos use Instagram's /p/ share URLs.
alter table public.external_video_candidates
  drop constraint external_video_candidates_source_url_check;
alter table public.external_video_candidates
  add constraint external_video_candidates_source_url_check
  check (source_url ~ '^https://www[.]instagram[.]com/(reel|p)/[A-Za-z0-9_-]+/$');

create unique index external_video_candidates_shortcode_key
  on public.external_video_candidates (split_part(source_url, '/', 5));
