create table public.curated_reels (
  source_url text primary key
    check (source_url ~ '^https://www[.]instagram[.]com/(reel|p)/[A-Za-z0-9_-]+/$'),
  title text not null,
  title_ru text,
  creator text not null,
  category text not null,
  topic text,
  language text,
  duration_seconds integer check (duration_seconds > 0),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index curated_reels_shortcode_key
  on public.curated_reels (split_part(source_url, '/', 5));
alter table public.curated_reels enable row level security;
revoke all on public.curated_reels from public, anon, authenticated;
grant select on public.curated_reels to anon, authenticated;
grant select, insert, update, delete on public.curated_reels to service_role;
create policy "Published Instagram selection is readable"
  on public.curated_reels for select to anon, authenticated
  using (is_active);
comment on table public.curated_reels is
  'Published source metadata for official Instagram embeds. No copied media, private review notes or license evidence.';
