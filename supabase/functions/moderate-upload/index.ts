import { ClipError, mediaPart, takeBudget } from '../orvelis-ai/clip.ts';
import { moderationGuidance, normalizeReview, validateDetails } from './policy.ts';
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-retry-count, traceparent, tracestate, baggage' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { ...cors, 'cache-control': 'no-store' } });
const schema = { type: 'object', additionalProperties: false,
    properties: {
        decision: { type: 'string', enum: ['approved', 'rejected', 'review'] }, contentAvailable: { type: 'boolean' },
        hasSubstantiveValue: { type: 'boolean' }, disallowedContent: { type: 'boolean' },
        reason: { type: 'string' }, summary: { type: 'string' }, suggestedTitle: { type: 'string' },
        suggestedCaption: { type: 'string' }, duration: { type: 'number' },
    }, required: ['decision', 'contentAvailable', 'hasSubstantiveValue', 'disallowedContent', 'reason', 'summary', 'suggestedTitle', 'suggestedCaption', 'duration'] };
export async function handleUpload(req: Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
    const base = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = { apikey: service, authorization: `Bearer ${service}`, 'content-type': 'application/json' };
    const admin = async (path: string, method = 'GET', body?: unknown) => {
        const response = await fetch(`${base}/${path}`, { method, headers: { ...headers, Prefer: 'return=representation' },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000), redirect: 'error' });
        if (!response.ok) throw new ClipError('SERVICE_UNAVAILABLE');
        return response.status === 204 ? null : response.json();
    };
    try {
        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) return json({ error: 'SIGN_IN_REQUIRED' }, 401);
        const auth = await fetch(`${base}/auth/v1/user`, { headers: { authorization, apikey: Deno.env.get('SUPABASE_ANON_KEY')! }, signal: AbortSignal.timeout(5000) });
        if (!auth.ok) return json({ error: 'SIGN_IN_REQUIRED' }, 401);
        const user = await auth.json();
        if (!user.id || user.is_anonymous) return json({ error: 'SIGN_IN_REQUIRED' }, 401);
        const raw = await req.text();
        if (raw.length > 20000) return json({ error: 'INVALID_REQUEST' }, 400);
        let input: any;
        try { input = JSON.parse(raw); } catch { return json({ error: 'INVALID_REQUEST' }, 400); }
        if (input.action === 'publish') {
            if (typeof input.reviewId !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.reviewId)) return json({ error: 'INVALID_REQUEST' }, 400);
            const rows = await admin(`rest/v1/upload_reviews?id=eq.${input.reviewId}&user_id=eq.${user.id}&select=*`);
            const review = rows?.[0];
            if (!review || review.decision !== 'approved' || Date.parse(review.created_at) < Date.now() - 86400000) return json({ error: 'REVIEW_REQUIRED' }, 409);
            if (review.video_id) return json({ videoId: review.video_id });
            const ext = review.source_path.split('.').pop();
            const destination = `${user.id}/${review.id}.${ext}`;
            // The source is immutable; the promoted bucket has no client write permissions.
            const copied = await fetch(`${base}/storage/v1/object/copy`, { method: 'POST', headers,
                body: JSON.stringify({ bucketId: 'upload-review', sourceKey: review.source_path, destinationBucket: 'approved-videos', destinationKey: destination }), signal: AbortSignal.timeout(20000) });
            if (!copied.ok) {
                // Retry after a timeout may find that the copy already succeeded.
                const exists = await fetch(`${base}/storage/v1/object/info/approved-videos/${destination}`, { headers, signal: AbortSignal.timeout(8000) });
                if (!exists.ok) throw new ClipError('SERVICE_UNAVAILABLE');
            }
            const url = `${base}/storage/v1/object/public/approved-videos/${destination}`;
            const videoId = await admin('rest/v1/rpc/publish_reviewed_upload', 'POST', { p_review: review.id, p_user: user.id, p_url: url });
            return json({ videoId });
        }
        if (input.action !== 'review' || !validateDetails(input.details) || typeof input.path !== 'string' ||
            !new RegExp(`^${user.id}/[a-zA-Z0-9-]+\\.(mp4|mov|webm)$`).test(input.path)) return json({ error: 'INVALID_REQUEST' }, 400);
        const { path, details } = input;
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ policy: 1, path, details })));
        const fingerprint = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
        const cached = await admin(`rest/v1/upload_reviews?user_id=eq.${user.id}&source_path=eq.${encodeURIComponent(path)}&fingerprint=eq.${fingerprint}&created_at=gt.${new Date(Date.now()-86400000).toISOString()}&select=id,result`);
        if (cached?.[0]) return json({ ...cached[0].result, id: cached[0].id });
        await takeBudget(user.id);
        const key = Deno.env.get('GEMINI_API_KEY')?.trim();
        if (!key) throw new ClipError('VIDEO_PROVIDER_UNAVAILABLE');
        const signed = await admin(`storage/v1/object/sign/upload-review/${path}`, 'POST', { expiresIn: 600 });
        const url = new URL(signed.signedURL.startsWith('/object/') ? base + '/storage/v1' + signed.signedURL : signed.signedURL, base);
        if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/storage/v1/object/sign/upload-review/')) throw new ClipError('MEDIA_UNAVAILABLE');
        const media = await mediaPart({ id: crypto.randomUUID(), title: details.title, description: details.description, duration: 0, url: '', s3_url: '', updated_at: '', size: 0 }, url);
        try {
            const model = Deno.env.get('ORVELIS_GEMINI_MODEL') || 'gemini-3.5-flash-lite';
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
                method: 'POST', headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
                body: JSON.stringify({ systemInstruction: { parts: [{ text: moderationGuidance }] },
                    contents: [{ role: 'user', parts: [media.part, { text: `Review this actual video and its publication metadata: ${JSON.stringify(details)}` }] }],
                    generationConfig: { maxOutputTokens: 2200, thinkingConfig: { thinkingLevel: 'LOW' }, responseMimeType: 'application/json', responseJsonSchema: schema } }),
                signal: AbortSignal.timeout(65000), redirect: 'error',
            });
            if (!response.ok) throw new ClipError(response.status === 429 ? 'RATE_LIMITED' : 'VIDEO_PROVIDER_UNAVAILABLE', response.status === 429 ? 429 : 503);
            const candidate = (await response.json()).candidates?.[0];
            // A safety-blocked or truncated response is never treated as approval.
            if (candidate?.finishReason !== 'STOP') throw new ClipError('INCOMPLETE_REVIEW');
            const result = normalizeReview(JSON.parse((candidate.content?.parts || []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join('')));
            const saved = await admin('rest/v1/upload_reviews?on_conflict=user_id,source_path,fingerprint', 'POST', {
                user_id: user.id, source_path: path, fingerprint, details, result, decision: result.decision,
            }).catch(async () => await admin(`rest/v1/upload_reviews?user_id=eq.${user.id}&source_path=eq.${encodeURIComponent(path)}&fingerprint=eq.${fingerprint}&select=id,result`));
            if (!saved?.[0]) throw new ClipError('SERVICE_UNAVAILABLE');
            return json({ ...saved[0].result, id: saved[0].id });
        } finally { await media.cleanup(); }
    } catch (error) {
        console.error('Upload moderation failed', error instanceof ClipError ? error.code : 'UNAVAILABLE');
        return json({ error: error instanceof ClipError ? error.code : 'SERVICE_UNAVAILABLE' }, error instanceof ClipError ? error.status : 503);
    }
}
if (import.meta.main) Deno.serve(handleUpload);
