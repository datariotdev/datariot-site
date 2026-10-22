# Orvelis: grounded conversations and server API

This change replaces client-side provider calls and canned fallback answers. Deep Dive now explains the available text, offers follow-up questions and related learning topics, and identifies missing context. The general Analyze tool requires pasted text. It does not inspect uploaded media, verify facts, or approve videos.

## Required setup before release

1. Apply `supabase/migrations/202610220001_orvelis_quota.sql` to the project's Supabase database. It creates a private usage table and an authenticated RPC. Default limits are 6 requests per minute and 60 per UTC day, per user, including failed upstream attempts. Adjust these numbers deliberately in the migration. Requests fail closed when the RPC is unavailable.
2. In the Vercel project serving `datariot.xyz`, configure server-only `OPENAI_API_KEY`, `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The existing `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` can also supply the latter two values. A Supabase service-role key is not needed. Use Vercel's environment settings for secrets, never a repository file or chat message.
3. `ORVELIS_MODEL` optionally overrides the existing `gpt-4o` default. The configured model must support Chat Completions, `max_completion_tokens` and strict JSON Schema. Model quality has not been evaluated with a live key in this change.
4. `ORVELIS_ALLOWED_ORIGINS` is a comma-separated allowlist, defaulting to `https://datariot.xyz`. Add the exact preview/localhost origin when testing. Native apps may omit Origin but still require a valid non-anonymous Supabase user session.
5. `EXPO_PUBLIC_ORVELIS_API_URL` is a public endpoint URL, defaulting to `https://datariot.xyz/api/orvelis`. Set it to your preview API when testing. Do not put a provider key in an `EXPO_PUBLIC_*` variable. Remove the previous `EXPO_PUBLIC_OPENAI_API_KEY` from future build environments. If a real key was included in a public app build, rotate it in the provider dashboard.
6. Build with Node 22 or newer. Run `npm ci`, `npm run test:orvelis`, then `npm run build:web` with the normal public Supabase variables configured. The repository serves **pre-exported** web files; changing TypeScript alone does not update `datariot.xyz`. The build script updates `datariot-xyz` and synchronizes the script reference in `xyz.html`. Deploy the new export and `/api/orvelis` together. Android/iOS require new application builds with the endpoint setting.
7. With a signed-in test account, check a Russian and an English question, an empty description, a follow-up question, the pasted-text Analyze tool, expired authentication, and an unavailable provider. Verify `/api/orvelis` returns JSON rather than the SPA HTML. Unauthenticated POSTs should return 401 without a provider request.

Do not release the new client before the backend, quota migration and environment settings are ready. No production credentials or database were accessed to prepare this change.

## Context and limits

- Actual author titles are retained, including Cyrillic. Missing titles are not replaced with invented educational topics.
- Deep Dive accepts a title (500 characters), description (8,000), and optional plain-text transcript (24,000). The feed passes `transcript` through when present. This change does not create a transcript column, generate speech transcripts or read audio/video frames. Existing videos continue to use their title and description.
- Chat takes the last 12 conversational messages, capped at 12,000 history characters. A question is capped at 6,000 characters. Request bodies are limited to 256 KiB. Structured output is validated before returning it to the app; refusals and incomplete output become explicit errors.
- Related topics are suggestions to discuss, not purported publications or verified citations. There is no web retrieval yet.
- Closing or changing a video cancels local requests and ignores late results. Failed questions stay editable for retry. History is scoped to the current view; there is no cross-session memory.
- Daily exercises contain no invented activity score. AI-generated debate arguments start with zero votes. The old `AI Verified` publishing badge and its ineffective blocking check are removed; a real moderation pipeline remains separate work.
- Auth is checked against Supabase Auth, and quotas are consumed atomically in PostgreSQL. CORS is not used as authentication. Per-account quotas are not a global spending cap; configure a provider project budget separately if required.

## Validation

`npm run test:orvelis` runs request/response, auth, quota, timeout and failure regression tests without calling a paid provider. SQL tests use an isolated PGlite PostgreSQL instance, not production. A separate Expo web export validates bundling. Browser QA of the actual DeepDiveModal uses simulated responses for interaction/error checks; it is not a model-quality evaluation.

The repository currently has pre-existing TypeScript errors in `publish.tsx` (web `outlineStyle`), `CreatorCard.tsx` (`backdropFilter`) and `WebSidebar.tsx` (`position: fixed`). These are unrelated to the AI request contracts; no new TypeScript errors were observed.

## API references

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat)
- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Supabase verified user lookup](https://supabase.com/docs/reference/javascript/auth-getuser)
