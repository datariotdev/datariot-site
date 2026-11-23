# Video publishing and moderation

The publish screen now separates video publishing from text/image/audio posts. Videos have a title, description, topic, tags, source links, spoken language, optional Circle sharing, locally saved details and a full-frame preview. Rights and Gemini processing consent are required. Saved details do not preserve local video files or blob URLs. The uploader processes the original file; the editor's trim parameters do not transcode it.

## Moderation

`moderate-upload` authenticates the real user, accepts only that user's immutable private `upload-review` object and sends its actual video/audio to Google Gemini using the Files API. Review results are stored server-side and tied to the exact metadata and source path. Changing any details invalidates the UI's approval. No keys are shipped to the client.

The policy rejects sexualized attention bait, empty dance/lip-sync trends, meme spam and clips without substantive content. Useful explanations, interviews, tutorials, substantive humor and dance instruction can qualify. A woman's presence, gender or appearance alone is never a rejection reason. Model/provider errors, safety blocks and uncertain results cannot approve publication. Passing moderation is not factual verification.

Approved files are copied into a public bucket clients cannot write. A service-only database function publishes the reviewed metadata and the video/post or debate reply in one transaction. Repeated publication returns the existing video ID.

## Rollout status

- `supabase/schema/upload_moderation.sql`: additive setup applied to project `uycrtobdewnscwazshcu`. Existing publishing routes remain unchanged by this setup.
- `supabase/schema/upload_moderation_enforcement.sql`: **not applied**. Requires approval because it blocks direct video inserts, protects published media/content fields, prevents unreviewed post video URLs and revokes two legacy upload RPCs. Old clients must update before uploading.
- `moderate-upload`: deployment **blocked pending approval** to send unpublished video and audio to Google Gemini. Source code and mocked-provider tests are ready.
- Existing `orvelis-ai` must be redeployed with the new `clip.ts` so it recognizes the approved-videos bucket. Preserve its existing index/config.
- Frontend changes are prepared for review; do not roll out the new uploader until the moderation function is deployed.

Apply enforcement only after the function is live and the new frontend is available. Until enforcement is approved and applied, old clients/direct database writes can bypass the new flow. Existing feed videos are not retroactively moderated by this change.

## Verification

`node tests/upload-moderation.test.cjs` covers input validation, foreign file rejection, real-media request construction, fail-closed provider failures, rejected/missing/expired reviews, approval and retry idempotency. `node scripts/test-orvelis.cjs` covers existing Orvelis behavior. Both pass (24 tests total). Web export passes. Frontend type checking has three pre-existing errors in CreatorCard and WebRightPanel; no errors occur in the new publishing files. Edge Function source passes a strict TypeScript check with Deno environment declarations.

Live end-to-end Gemini classification and authenticated publication remain unverified because deployment is blocked. The additive setup was verified for private staging, RLS, client-denied review access and service-only publication. Review policy and model output cannot guarantee perfect classification.
