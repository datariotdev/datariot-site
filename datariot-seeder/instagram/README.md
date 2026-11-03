# Instagram Reels for Datariot

This is an initial discovery queue and a native-video import tool, not a complete
index of Instagram or a working global Reels search API.

**Current state (2026-11-03):** 12 links screened, 8 shortlisted, 2 on hold,
2 rejected, **12 candidate records staged in Supabase, 0 approved for publication,
0 imported into the native video feed**. The original
Reels could not be played during research: Instagram throttled retrieval. Five
shortlisted items were screened using third-party automatic transcripts; three
using descriptions in a research article. Durations from transcript pages are
estimates; unknown durations are null. These are editorial candidates, not
fact-checked endorsements. Source links and verification notes are in
`candidates.json`.

## First shortlist

Titles below are editorial descriptions, not the creators' original captions.

| Topic | Creator | Length reported by transcript source | Original Reel |
| --- | --- | --- | --- |
| How a computer works | Charles Zheng | 2:21 | https://www.instagram.com/reel/Dev8BHVBea_/ |
| How Bluetooth works | Charles Zheng | 2:33 | https://www.instagram.com/reel/DeccP5hhLac/ |
| What happens when you message an LLM | AI Unpacked | 1:32 | https://www.instagram.com/reel/DePA-4SDdwY/ |
| Vector search explained (Persian) | Saleh Hashemi | 2:14 | https://www.instagram.com/reel/DfIfYrlB8Ue/ |
| Inside a NASA plant lab | Kellie Gerardi | Not verified | https://www.instagram.com/reel/C_bnaTAO2Ll/ |
| Research on a parabolic flight | Shawna Pandya | Not verified | https://www.instagram.com/reel/C_GN-faRhBE/ |
| Testing a spacesuit | Norah Patten | Not verified | https://www.instagram.com/reel/C-K6sq_McYI/ |
| Finding first users through conversations | Matt / Consumer App Growth | 0:48 | https://www.instagram.com/reel/De7w-tRpTyV/ |

## Preview without credentials or network writes

Python 3.11+; no pip dependencies.

```bash
python3 datariot-seeder/instagram/reels.py catalog
python3 datariot-seeder/instagram/reels.py publish
python3 -m unittest discover -s datariot-seeder/instagram -p 'test_*.py' -v
```

`publish` defaults to preview. `--apply` explicitly writes reviewed files. The
bundled manifest cannot publish anything in its current state.

## Supabase editorial queue

The connected `datariot` project was verified on 2026-11-03. Its existing
`videos` bucket is public and the native `videos` schema matches the importer.
Migration `add_external_video_candidates_queue` was applied from `queue.sql`.
All 12 source records were inserted into `public.external_video_candidates`:
8 shortlisted, 2 held and 2 rejected, all pending review with unknown rights.
This queue is separate from the native feed. The 15 existing native video rows
were unchanged; no Instagram videos were published.

The queue has RLS enabled and no access for `anon` or `authenticated`; server
administration uses `service_role`. The RLS linter's informational
`rls_enabled_no_policy` finding is expected here: there is intentionally no
mobile-client policy. Generated status columns reflect the JSON payload so they
cannot diverge from review data. Private license evidence should remain outside
the committed catalogue.

To stage another manifest through the connected SQL tool, apply `queue.sql` once
per new project, then generate the INSERT statement:

```bash
python3 datariot-seeder/instagram/reels.py queue-sql --input /private/reviewed.json
```

This command only prints SQL; it does not connect to a database or publish videos.
Execute its result against the intended project. Duplicate source URLs are
skipped without resetting existing reviews. A second insert of the initial
catalogue was verified to add 0 records.

## Discovery through the official API

The adapter reads the **authorising professional account's own media** using
Instagram Login. It does not search other accounts, recommendations or saved
posts. A different consenting creator needs their own OAuth access. Configure a
Meta app and the Instagram professional account's `instagram_business_basic`
permission; request the required access level for the actual deployment. Use a
currently supported API version from your Meta app configuration, not an invented
version. This live integration has not been tested here: no Meta credentials
were available.

Set `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` and `INSTAGRAM_API_VERSION` in
the server environment. Never put access tokens or service-role keys into
`EXPO_PUBLIC_*`, source files, manifest files or the mobile bundle.

```bash
python3 datariot-seeder/instagram/reels.py discover \
  --creator 'Consenting creator name' --pages 2 --output /private/new-reels.json
```

Discovery deduplicates links, handles cursor pagination on a fixed Graph API
host, selects only videos marked REELS and leaves all review/rights fields
pending. It does not request or persist Instagram CDN video URLs. API access
alone does not establish permission to republish a video, music or other assets.
No scraping, bypassing login walls or oEmbed-derived analytics are involved.

Official references:

- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
- https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api
- https://developers.facebook.com/docs/instagram-platform/oembed/

Meta's developer pages returned 429 during this work; the official Meta Postman
collection was accessible. Reconfirm app permissions and version against Meta's
current documentation before connecting production.

## Editorial selection

Screen for a specific thing the viewer learns, a mechanism or worked example,
understandable explanation and checkable claims. Reject unsupported universal
claims, misleading health/finance promises, footage without explanation,
advertising with no standalone educational value and duplicate clips. Likes and
view counts are not evidence of factual accuracy.

For each shortlisted item, watch the original and check speech **and on-screen
content**, context and duration. Obtain creator-approved files and permission
covering all included assets. Do not treat a transcript or AI judgement as a
completed fact check. Record external references in `review.checked_sources`;
change `review.status` to `approved` and set `review.reviewer` only after review.

Use a private copy of the manifest to enter permissions and local file paths.
Keep full license evidence there; it is never sent to public video rows.
Set `rights.status` to `owned` or `licensed`, `rights.evidence` to a private audit
reference and `author_id` to a real existing Datariot profile. An editorial
publisher profile may publish licensed work, with original creator attribution
preserved in the description; the script never creates fake creator accounts.

## Native publication

Datariot's current `useVideos` hook consumes `videos.url` as a video file and
filters out missing/zero author IDs. An Instagram webpage URL will not play in
that player. This importer uploads **local authorised MP4s** into an existing
public Supabase bucket and inserts rows using the columns in
`full_db_schema.json`. It does not change the app UI, database schema or RLS.

Server configuration:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Intended Datariot project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database/storage access |
| `SUPABASE_BUCKET` | Existing public bucket; default `videos` |

Install FFmpeg/ffprobe. Provide H.264/AAC MP4 files of 1–180 seconds and at most
100 MiB. `media_file` resolves relative to the private manifest. The actual file
duration and codecs are probed; videos are never automatically cut. A middle
frame becomes the thumbnail.

```bash
python3 datariot-seeder/instagram/reels.py publish --input /private/reviewed.json
python3 datariot-seeder/instagram/reels.py publish --input /private/reviewed.json --apply
```

Stable IDs derive from canonical source URLs. Reruns skip existing video rows;
concurrent inserts ignore the duplicate ID instead of overwriting it. Imported
rows preserve original creator and source in `description`. No engagement
numbers, author identities or AI scores are fabricated. Current English title
handling in the app replaces Cyrillic titles, so `title` is English and
`title_ru` remains editorial metadata in the queue.

Storage uploads and database inserts are not one transaction. If an upload
succeeds but a later step fails, content-addressed orphan assets may remain;
rerun after fixing the cause. No existing records or files are deleted. Validate
playback in a staging project before the first production import.

## Validation performed

Eight unit tests cover pending-review publication blocking with no network calls,
source deduplication, missing profiles, invalid media, fixed-host pagination,
repeat imports and original-source attribution without leaking private license
evidence, and safe SQL export preserving existing reviews. A local generated
fixture also exercises real ffprobe/FFmpeg; it is not source content and is not
uploaded. Live Supabase schema, public bucket, queue insertion, duplicate
handling and access restrictions were verified. Live Meta calls, actual video
uploads and mobile playback remain untested.
