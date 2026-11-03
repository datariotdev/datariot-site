-- Editorial queue only. Source-page links never enter the native videos table.
create table public.external_video_candidates (
  source_url text primary key
    check (source_url ~ '^https://www[.]instagram[.]com/reel/[A-Za-z0-9_-]+/$'),
  payload jsonb not null
    check (jsonb_typeof(payload) = 'object')
    check (payload->>'source_url' is not null and payload->>'source_url' = source_url),
  screening_decision text generated always as (payload #>> '{screening,decision}') stored not null
    check (screening_decision in ('pending', 'shortlist', 'hold', 'reject')),
  review_status text generated always as (payload #>> '{review,status}') stored not null
    check (review_status in ('pending', 'approved', 'rejected')),
  rights_status text generated always as (payload #>> '{rights,status}') stored not null
    check (rights_status in ('unknown', 'owned', 'licensed')),
  created_at timestamptz not null default now()
);

alter table public.external_video_candidates enable row level security;
revoke all on table public.external_video_candidates from public, anon, authenticated;
grant select, insert, update, delete on table public.external_video_candidates to service_role;

comment on table public.external_video_candidates is
  'Internal editorial queue. Links are candidates, not approved or published videos. No mobile-client access.';
