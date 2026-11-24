import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../supabase/hooks/useAuth';
import { feedSearchTerm } from '../utils/feed';
import { ARENA_TOPICS, arenaTopic, parseArenaArgument, uniqueArenaItems, type ArenaPost, type ArenaSide, type ArenaTopic } from './model';

const PAGE_SIZE = 24;
export function useArenaFeed(search: string, topic: ArenaTopic) {
    const [posts, setPosts] = useState<ArenaPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [hasMore, setHasMore] = useState(false);
    const [revision, setRevision] = useState(0);
    const page = useRef(0), request = useRef(0), busy = useRef(false);
    useEffect(() => { const timer = setTimeout(() => setQuery(feedSearchTerm(search)), 280); return () => clearTimeout(timer); }, [search]);
    const fetchPage = useCallback(async (nextPage: number, replace: boolean) => {
        const token = ++request.current;
        busy.current = true;
        setLoading(true); setError(null);
        if (replace) setPosts([]);
        try {
            if (!supabase) throw new Error('Arena is temporarily unavailable.');
            let dbQuery = supabase.from('posts').select('*,comments(count)').eq('is_published', true)
                .order('created_at', { ascending: false }).order('id', { ascending: false });
            if (query) dbQuery = dbQuery.ilike('content', `%${query}%`);
            const terms = ARENA_TOPICS.find(item => item.key === topic)?.terms || [];
            if (terms.length) dbQuery = dbQuery.or(terms.map(term => `content.ilike.%${term}%`).join(','));
            const result = await dbQuery.range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
            if (result.error) throw result.error;
            if (token !== request.current) return;
            const rows = result.data || [];
            const ids = [...new Set(rows.map((row: any) => row.user_id).filter(Boolean))];
            const profiles = ids.length ? await supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', ids) : { data: [], error: null };
            if (profiles.error) throw profiles.error;
            if (token !== request.current) return;
            const authors = new Map((profiles.data || []).map((profile: any) => [profile.id, profile]));
            const formatted: ArenaPost[] = rows.map((row: any) => {
                const author: any = authors.get(row.user_id);
                return {
                    id: row.id, userId: row.user_id, content: row.content?.trim() || 'An idea worth discussing',
                    authorName: author?.display_name || author?.username || 'Creator', authorAvatar: author?.avatar_url || undefined,
                    imageUrl: row.image_url || undefined, videoUrl: row.video_url || undefined,
                    likes: row.likes_count || 0, comments: Number(row.comments?.[0]?.count ?? row.comments_count ?? 0),
                    isLiked: false, createdAt: row.created_at, timestamp: '', topic: arenaTopic(row.content || ''),
                };
            });
            setPosts(previous => uniqueArenaItems(replace ? [] : previous, formatted));
            page.current = nextPage; setHasMore(rows.length === PAGE_SIZE);
        } catch {
            if (token === request.current) setError('Couldn’t load the debates. Please try again.');
        } finally {
            if (token === request.current) { setLoading(false); busy.current = false; }
        }
    }, [query, topic, revision]);
    useEffect(() => { page.current = 0; void fetchPage(0, true); return () => { request.current++; busy.current = false; }; }, [fetchPage]);
    return { posts, loading, error, hasMore,
        refresh: () => setRevision(value => value + 1),
        loadMore: () => { if (hasMore && !busy.current) void fetchPage(page.current + 1, false); },
    };
}

export type ArenaArgument = { id: string; authorId: string; author: string; avatar?: string; createdAt: string; content: string; side: ArenaSide; aiAssisted: boolean };
export function useArenaThread(postId: string | null) {
    const { user } = useAuth();
    const [argumentsList, setArguments] = useState<ArenaArgument[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const request = useRef(0), page = useRef(0), busy = useRef(false), sending = useRef(false);
    const currentPost = useRef(postId); currentPost.current = postId;
    const fetchPage = useCallback(async (nextPage: number, replace: boolean) => {
        const token = ++request.current;
        if (!postId) { setArguments([]); setLoading(false); return; }
        busy.current = true; setLoading(true); setError(null);
        if (replace) setArguments([]);
        try {
            if (!supabase) throw new Error('Unavailable');
            const result = await supabase.from('comments').select('id,user_id,text,created_at').eq('post_id', postId)
                .order('created_at', { ascending: false }).order('id', { ascending: false }).range(nextPage * 40, (nextPage + 1) * 40 - 1);
            if (result.error) throw result.error;
            if (token !== request.current) return;
            const rows = result.data || [];
            const ids = [...new Set(rows.map((row: any) => row.user_id).filter(Boolean))];
            const profiles = ids.length ? await supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', ids) : { data: [], error: null };
            if (profiles.error) throw profiles.error;
            if (token !== request.current) return;
            const authors = new Map((profiles.data || []).map((profile: any) => [profile.id, profile]));
            const formatted = rows.map((row: any) => {
                const author: any = authors.get(row.user_id);
                return { id: row.id, authorId: row.user_id, author: author?.display_name || author?.username || 'Creator', avatar: author?.avatar_url || undefined,
                    createdAt: row.created_at, ...parseArenaArgument(row.text || '') };
            });
            setArguments(previous => uniqueArenaItems(replace ? [] : previous, formatted));
            page.current = nextPage; setHasMore(rows.length === 40);
        } catch { if (token === request.current) setError('Couldn’t load the arguments. Please try again.'); }
        finally { if (token === request.current) { setLoading(false); busy.current = false; } }
    }, [postId]);
    useEffect(() => { currentPost.current = postId; setPostError(null); setPosting(false); void fetchPage(0, true); return () => { request.current++; busy.current = false; if (currentPost.current === postId) currentPost.current = null; }; }, [fetchPage, postId]);
    const postArgument = async (content: string, side: ArenaSide): Promise<boolean> => {
        if (!postId || !user || !supabase || sending.current || !content.trim() || content.trim().length > 4000) return false;
        const targetPost = postId;
        sending.current = true; setPosting(true); setPostError(null);
        try {
            const text = (side === 'NEUTRAL' ? '' : `${side}:|`) + content.trim();
            const result = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, text });
            if (result.error) throw result.error;
            if (currentPost.current === targetPost) await fetchPage(0, true);
            return true;
        } catch {
            if (currentPost.current === targetPost) setPostError('Your argument wasn’t posted. Your draft is still here — please try again.');
            return false;
        } finally { sending.current = false; if (currentPost.current === targetPost) setPosting(false); }
    };
    return { argumentsList, loading, error, posting, postError, userId: user?.id, hasMore, postArgument,
        refresh: () => { void fetchPage(0, true); }, loadMore: () => { if (hasMore && !busy.current) void fetchPage(page.current + 1, false); },
    };
}
