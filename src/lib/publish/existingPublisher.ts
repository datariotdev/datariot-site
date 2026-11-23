import { supabase } from '../supabase/client';
import { readVideoFile, UploadDetails } from './client';

export interface ExistingUpload { path?: string; url?: string; videoId?: string; details?: string; shared?: boolean }

/** Keep the existing upload path available while mandatory moderation is not deployed.
 * This function never assigns an AI approval or sends media to an AI provider.
 */
export async function publishWithExistingFlow(uri: string, userId: string, details: UploadDetails, duration: number, progress: ExistingUpload) {
    if (!Number.isFinite(duration) || duration <= 0 || duration > 600) throw new Error('Wait for the video to load. Videos can be up to 10 minutes.');
    if (!details.title.trim() || !details.rightsConfirmed) throw new Error('Add a title and confirm your permission to share this video.');
    const fingerprint = JSON.stringify(details);
    if (progress.videoId && progress.details !== fingerprint) throw new Error('This video was already saved. Restore the original details and retry, or open your profile.');
    if (!progress.url) {
        const { body, mime, ext } = await readVideoFile(uri);
        progress.path ||= `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('videos').upload(progress.path, body, { contentType: mime, upsert: false });
        if (error && String(error.statusCode) !== '409') throw new Error('The video could not be uploaded. Please try again.');
        progress.url = supabase.storage.from('videos').getPublicUrl(progress.path).data.publicUrl;
    }
    if (!progress.videoId) {
        // A stable client-generated ID makes retries safe after a lost insert response.
        progress.videoId = globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.floor(Math.random() * 16); return (c === 'x' ? r : (r & 3) | 8).toString(16);
        });
        progress.details = fingerprint;
    }
    const { data: existing, error: lookupError } = await supabase.from('videos').select('id,user_id').eq('id', progress.videoId).maybeSingle();
    if (lookupError) throw new Error('Could not confirm the video status. Retry with the same details.');
    if (existing && existing.user_id !== userId) throw new Error('This video could not be saved.');
    if (!existing) {
        const { error } = await supabase.from('videos').insert({
            id: progress.videoId, user_id: userId, title: details.title, description: details.description,
            url: progress.url, category: details.category, duration, hashtags: details.tags,
            upload_metadata: { sources: details.sources, language: details.language, moderation: 'not_checked', rights_confirmed: true },
        });
        if (error) throw new Error('The video could not be saved. Retry with the same details.');
    }
    if (!progress.shared && (details.shareToCircle || details.debateId)) {
        if (details.debateId) {
            const text = `${details.side === 'AGAINST' ? 'AGAINST' : 'FOR'}:|${details.title}\n${details.description}`;
            const { data: match, error: lookup } = await supabase.from('comments').select('id').eq('video_id', progress.videoId).eq('post_id', details.debateId).eq('user_id', userId).limit(1);
            if (lookup) throw new Error('Your video was saved. Retry to attach the reply without uploading again.');
            if (!match?.length) {
                const { error } = await supabase.from('comments').insert({ post_id: details.debateId, user_id: userId, video_id: progress.videoId, text });
                if (error) throw new Error('Your video was saved. Retry to attach the reply without uploading again.');
            }
        } else {
            const { data: match, error: lookup } = await supabase.from('posts').select('id').eq('video_url', progress.url).eq('user_id', userId).limit(1);
            if (lookup) throw new Error('Your video was saved. Retry to finish sharing it to Circle.');
            if (!match?.length) {
                const { error } = await supabase.from('posts').insert({ user_id: userId, content: `${details.title}\n${details.description}`, video_url: progress.url, is_published: true });
                if (error) throw new Error('Your video was saved. Retry to finish sharing it to Circle.');
            }
        }
        progress.shared = true;
    }
    return { videoId: progress.videoId };
}
