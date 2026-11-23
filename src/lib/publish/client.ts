import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../supabase/client';

export interface UploadDetails {
    title: string; description: string; category: string; tags: string[]; sources: string[]; language: string;
    rightsConfirmed: boolean; aiConsent: boolean; shareToCircle: boolean; debateId?: string; side?: string;
}
export interface UploadReview {
    id: string; decision: 'approved' | 'rejected' | 'review'; reason: string;
    summary: string; suggestedTitle: string; suggestedCaption: string; duration: number;
}
export const MAX_UPLOAD_BYTES = 140_000_000;
export async function readVideoFile(uri: string): Promise<{ body: Blob | ArrayBuffer; mime: string; ext: string }> {
    let body: Blob | ArrayBuffer;
    let mime = 'video/mp4';
    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        if (!response.ok) throw new Error('Could not read this video. Select the file again.');
        body = await response.blob();
        mime = body.type.split(';')[0] || mime;
        if (body.size > MAX_UPLOAD_BYTES || !body.size) throw new Error('Choose a video smaller than 140 MB.');
    } else {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || !info.size || info.size > MAX_UPLOAD_BYTES) throw new Error('Choose a video smaller than 140 MB.');
        if (/\.mov$/i.test(uri)) mime = 'video/quicktime';
        if (/\.webm$/i.test(uri)) mime = 'video/webm';
        body = decode(await FileSystem.readAsStringAsync(uri, { encoding: 'base64' }));
    }
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(mime)) throw new Error('Use an MP4, MOV or WebM video.');
    const ext = mime === 'video/webm' ? 'webm' : mime === 'video/quicktime' ? 'mov' : 'mp4';
    return { body, mime, ext };
}
export async function stageVideo(uri: string, userId: string): Promise<string> {
    const { body, mime, ext } = await readVideoFile(uri);
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('upload-review').upload(path, body, { contentType: mime, upsert: false });
    if (error) throw new Error('Video upload failed. Please try again.');
    return path;
}
export async function uploadAction(body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke('moderate-upload', { body });
    if (error) {
        const detail = await error.context?.json?.().catch(() => null);
        const messages: Record<string, string> = {
            RATE_LIMITED: 'Too many checks. Wait a minute and try again.',
            REVIEW_REQUIRED: 'Run the Orvelis check before publishing.',
            SIGN_IN_REQUIRED: 'Sign in to publish your video.',
            INVALID_REQUEST: 'Check your title, topic and source links.',
            MEDIA_UNSUPPORTED: 'Use a readable MP4, MOV or WebM video under 140 MB.',
            MEDIA_PROCESSING: 'The video is still processing. Try the check again shortly.',
        };
        throw new Error(messages[detail?.error] || 'Orvelis could not finish the check. Your video has not been published. Try again.');
    }
    if (!data || data.error) throw new Error('Could not complete this request. Try again.');
    return data;
}
