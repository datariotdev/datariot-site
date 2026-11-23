import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../supabase/hooks/useAuth';
import type { Video } from '../supabase/hooks/useVideos';
import { ANIMATED_SHORTS_CATEGORY } from '../constants/categories';
import { encodeVideoUrl } from '../utils/url';

export type CircleMode = 'explore' | 'following' | 'saved';
const PAGE_SIZE = 18;
const unavailable = /clipto-videos\.s3\.eu-north-1\.amazonaws\.com|BigBuckBunny|ElephantsDream|gtv-videos-bucket|commondatastorage\.googleapis\.com|\/sample\//i;

export function useCircleFeed(mode: CircleMode, category: string | null, search: string) {
    const { user } = useAuth();
    const userId = user?.id;
    const [videos, setVideos] = useState<Video[]>([]);
    const [following, setFollowing] = useState<string[]>([]);
    const [saved, setSaved] = useState<string[]>([]);
    const [liked, setLiked] = useState<string[]>([]);
    const [likeOffsets, setLikeOffsets] = useState<Record<string, number>>({});
    const [relationsLoading, setRelationsLoading] = useState(false);
    const [relationsError, setRelationsError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [pending, setPending] = useState<Set<string>>(new Set());
    const [revision, setRevision] = useState(0);
    const [query, setQuery] = useState('');
    const page = useRef(0);
    const request = useRef(0);
    const busy = useRef(false);
    const mutations = useRef(new Set<string>());
    const identity = useRef(userId);
    identity.current = userId;

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let current = true;
        setFollowing([]);
        setSaved([]);
        setLiked([]);
        setLikeOffsets({});
        setRelationsError(null);
        setActionError(null);
        mutations.current.clear();
        setPending(new Set());
        if (!userId || !supabase) { setRelationsLoading(false); return; }
        setRelationsLoading(true);
        (async () => {
            try {
                const [follows, saves, likes] = await Promise.all([
                    supabase.from('followers').select('followed_id').eq('follower_id', userId),
                    supabase.from('save_actions').select('video_id').eq('user_id', userId),
                    supabase.from('likes').select('video_id').eq('user_id', userId),
                ]);
                if (!current) return;
                if (follows.error || saves.error || likes.error) throw follows.error || saves.error || likes.error;
                setFollowing([...new Set<string>((follows.data || []).map((row: any) => row.followed_id))]);
                setSaved([...new Set<string>((saves.data || []).map((row: any) => row.video_id))]);
                setLiked([...new Set<string>((likes.data || []).map((row: any) => row.video_id))]);
            } catch {
                if (current) setRelationsError('Your follows and saved clips couldn’t load. Please try again.');
            } finally {
                if (current) setRelationsLoading(false);
            }
        })();
        return () => { current = false; };
    }, [userId, revision]);

    // Membership changes only refetch the view that depends on that membership.
    const membership = mode === 'following' ? following.join(',') : mode === 'saved' ? saved.join(',') : '';
    const waitingForRelations = mode !== 'explore' && relationsLoading;
    const relationFailure = mode !== 'explore' ? relationsError : null;
    const fetchPage = useCallback(async (nextPage: number, replace: boolean) => {
        const token = ++request.current;
        busy.current = true;
        setLoading(true);
        setError(null);
        if (replace) setVideos([]);
        try {
            if (!supabase) throw new Error('Circle is temporarily unavailable. Please try again.');
            if (waitingForRelations) return;
            if (relationFailure) throw new Error(relationFailure);
            if (mode !== 'explore' && (!userId || !membership)) {
                setVideos([]);
                setHasMore(false);
                return;
            }
            let dbQuery = supabase.from('videos').select('*')
                .or(`category.is.null,category.neq.${ANIMATED_SHORTS_CATEGORY}`)
                .order('created_at', { ascending: false }).order('id', { ascending: false });
            if (category) dbQuery = dbQuery.eq('category', category);
            if (mode === 'following') dbQuery = dbQuery.in('user_id', membership.split(','));
            if (mode === 'saved') dbQuery = dbQuery.in('id', membership.split(','));
            // Strip PostgREST filter syntax and wildcard characters from free text.
            const term = query.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
            if (term) dbQuery = dbQuery.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
            const result = await dbQuery.range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
            if (result.error) throw result.error;
            if (token !== request.current) return;
            const rows = result.data || [];
            const authorIds = [...new Set(rows.map((row: any) => row.user_id).filter(Boolean))];
            const profiles = authorIds.length
                ? await supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', authorIds)
                : { data: [], error: null };
            if (profiles.error) throw profiles.error;
            if (token !== request.current) return;
            const authors = new Map((profiles.data || []).map((profile: any) => [profile.id, profile]));
            const formatted: Video[] = rows.flatMap((row: any) => {
                const playback = [row.url, row.s3_url]
                    .filter(value => typeof value === 'string' && value.trim() && !unavailable.test(value))
                    .map(value => encodeVideoUrl(value)).find(Boolean);
                if (!playback || !row.user_id) return [];
                const author: any = authors.get(row.user_id);
                return [{
                    id: row.id, videoUrl: playback, title: row.title?.trim() || 'Something worth exploring',
                    description: row.description || '', author: author?.display_name || author?.username || 'Creator',
                    authorId: row.user_id, avatarUrl: author?.avatar_url || undefined,
                    thumbnailUrl: row.thumbnail_url || row.thumbnail || undefined, category: row.category || undefined,
                    duration: row.duration || undefined, likes: row.likes_count || row.likes || 0,
                    comments: row.comments_count || row.comments || 0, views: row.views_count || row.views || 0,
                    saved: row.saved_count || row.saved || 0, shares: row.shares_count || row.shares || 0,
                    isLiked: false, isSaved: false, isFollowing: false,
                }];
            });
            setVideos(previous => replace ? formatted : [...new Map([...previous, ...formatted].map(video => [video.id, video])).values()]);
            page.current = nextPage;
            setHasMore(rows.length === PAGE_SIZE);
        } catch (err) {
            if (token === request.current) setError(err instanceof Error ? err.message : 'Couldn’t load Circle. Please try again.');
        } finally {
            if (token === request.current) { busy.current = false; setLoading(false); }
        }
    }, [mode, category, query, membership, userId, waitingForRelations, relationFailure, revision]);

    useEffect(() => {
        page.current = 0;
        void fetchPage(0, true);
        return () => { request.current++; busy.current = false; };
    }, [fetchPage]);

    const toggleMembership = async (kind: 'follow' | 'save' | 'like', id: string) => {
        if (!userId || !supabase || mutations.current.has(`${kind}:${id}`)) return;
        const key = `${kind}:${id}`;
        const wasSelected = (kind === 'follow' ? following : kind === 'save' ? saved : liked).includes(id);
        const update = kind === 'follow' ? setFollowing : kind === 'save' ? setSaved : setLiked;
        const apply = (selected: boolean) => update(previous => selected ? [...new Set([...previous, id])] : previous.filter(value => value !== id));
        mutations.current.add(key);
        setPending(new Set(mutations.current));
        setActionError(null);
        apply(!wasSelected);
        if (kind === 'like') setLikeOffsets(previous => ({ ...previous, [id]: (previous[id] || 0) + (wasSelected ? -1 : 1) }));
        try {
            const table = kind === 'follow' ? 'followers' : kind === 'save' ? 'save_actions' : 'likes';
            const owner = kind === 'follow' ? 'follower_id' : 'user_id';
            const target = kind === 'follow' ? 'followed_id' : 'video_id';
            const result = wasSelected
                ? await supabase.from(table).delete().eq(owner, userId).eq(target, id)
                : await supabase.from(table).insert({ [owner]: userId, [target]: id });
            if (result.error) throw result.error;
        } catch {
            if (identity.current === userId) {
                apply(wasSelected);
                if (kind === 'like') setLikeOffsets(previous => ({ ...previous, [id]: (previous[id] || 0) + (wasSelected ? 1 : -1) }));
                setActionError(kind === 'follow' ? 'Couldn’t update your follow. Please try again.' : kind === 'save' ? 'Couldn’t update your saved clips. Please try again.' : 'Couldn’t update your like. Please try again.');
            }
        } finally {
            if (identity.current === userId) {
                mutations.current.delete(key);
                setPending(new Set(mutations.current));
            }
        }
    };

    const decorated = useMemo(() => videos.map(video => ({ ...video,
        isFollowing: following.includes(video.authorId), isSaved: saved.includes(video.id),
        isLiked: liked.includes(video.id), likes: Math.max(0, video.likes + (likeOffsets[video.id] || 0)),
    })), [videos, following, saved, liked, likeOffsets]);

    return {
        videos: decorated, loading: loading || waitingForRelations, error, actionError, relationsError,
        relationsLoading, hasMore, pending, userId,
        refresh: () => setRevision(value => value + 1),
        loadMore: () => { if (!busy.current && hasMore) void fetchPage(page.current + 1, false); },
        toggleFollow: (authorId: string) => { if (authorId !== userId) void toggleMembership('follow', authorId); },
        toggleLike: (videoId: string) => { void toggleMembership('like', videoId); },
        toggleSave: (videoId: string) => { void toggleMembership('save', videoId); },
    };
}
