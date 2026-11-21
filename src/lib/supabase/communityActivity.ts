import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityUpload {
    id: string;
    authorId: string;
    author: string;
    username: string;
    avatarUrl: string | null;
    thumbnailUrl: string | null;
    title: string;
    createdAt: string;
    views: number;
    likes: number;
}

const retiredHost = /^https?:\/\/clipto-videos\.s3\.eu-north-1\.amazonaws\.com(?:\/|$)/i;
const count = (value: unknown) => Math.max(0, Number(value) || 0);

/** Read public uploads through the viewer's RLS policy; never create synthetic notifications. */
export async function fetchCommunityUploads(client: SupabaseClient): Promise<CommunityUpload[]> {
    const { data, error } = await client.from('videos').select('id,user_id,title,url,s3_url,thumbnail_url,created_at,likes_count,views_count,likes,views')
        .order('created_at', { ascending: false }).limit(300);
    if (error) throw error;
    const playable = (data ?? []).filter(video => {
        const urls = [video.url, video.s3_url];
        return video.user_id && urls.some(url => typeof url === 'string' && url.trim() && !retiredHost.test(url.trim()));
    });
    const ids = [...new Set(playable.map(video => video.user_id))];
    if (!ids.length) return [];
    const profiles = await client.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
    if (profiles.error) throw profiles.error;
    const authors = new Map((profiles.data ?? []).map(profile => [profile.id, profile]));
    // Rank recent uploads by actual engagement with an age decay, one clip per creator.
    const score = (video: typeof playable[number]) => {
        const ageDays = Math.max(0, (Date.now() - new Date(video.created_at).getTime()) / 86400000) || 0;
        return (1 + Math.log1p(count(video.views_count ?? video.views)) + 2 * Math.log1p(count(video.likes_count ?? video.likes))) / Math.pow(1 + ageDays, 0.7);
    };
    const seen = new Set<string>();
    return [...playable].sort((a, b) => score(b) - score(a)).flatMap(video => {
        const profile = authors.get(video.user_id);
        if (!profile || seen.has(video.user_id)) return [];
        seen.add(video.user_id);
        const thumbnail = video.thumbnail_url || video.thumbnail;
        return [{
            id: video.id, authorId: video.user_id,
            author: profile.display_name || profile.username || 'Creator', username: profile.username || '',
            avatarUrl: profile.avatar_url || null,
            thumbnailUrl: typeof thumbnail === 'string' && !retiredHost.test(thumbnail) ? thumbnail : null,
            title: video.title?.trim() || 'Watch the clip', createdAt: video.created_at,
            views: count(video.views_count ?? video.views), likes: count(video.likes_count ?? video.likes),
        }];
    }).slice(0, 4);
}
