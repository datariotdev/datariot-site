import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';
import { promptSignIn } from '../../utils/promptSignIn';

export interface PersonResult {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    isFollowing: boolean;
}

/** PostgREST treats , ( ) as syntax inside an or() filter, and % * as wildcards. */
export const cleanSearch = (q: string) => q.replace(/[,()%*\\]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * People whose name or handle matches. With no query, a handful of people to
 * start from, so the screen is never empty.
 */
export function useSearchProfiles(query: string) {
    const { user, loading: authLoading } = useAuth();
    const [people, setPeople] = useState<PersonResult[]>([]);
    const [loading, setLoading] = useState(false);

    const q = cleanSearch(query);

    useEffect(() => {
        if (authLoading || !supabase) return;
        let alive = true;

        (async () => {
            setLoading(true);
            try {
                let req = supabase.from('profiles').select('id, username, display_name, avatar_url, bio').limit(q ? 30 : 12);
                if (q) req = req.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
                if (user) req = req.neq('id', user.id);
                const { data, error } = await req;
                if (error) throw error;

                let followed = new Set<string>();
                if (user && data?.length) {
                    const { data: rows } = await supabase
                        .from('follows')
                        .select('following_id')
                        .eq('follower_id', user.id)
                        .in('following_id', data.map((p: any) => p.id));
                    followed = new Set((rows || []).map((r: any) => r.following_id));
                }

                if (!alive) return;
                setPeople((data || []).map((p: any) => ({
                    id: p.id,
                    username: p.username || 'user',
                    displayName: p.display_name || p.username || 'User',
                    avatarUrl: p.avatar_url || undefined,
                    bio: p.bio || undefined,
                    isFollowing: followed.has(p.id),
                })));
            } catch (e) {
                console.error('Error searching people:', e);
                if (alive) setPeople([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [q, user, authLoading]);

    const toggleFollow = useCallback(async (id: string) => {
        if (!user) { promptSignIn('follow people'); return; }
        const current = people.find(p => p.id === id);
        if (!current || !supabase) return;
        const was = current.isFollowing;
        const apply = (v: boolean) => setPeople(prev => prev.map(p => (p.id === id ? { ...p, isFollowing: v } : p)));
        apply(!was);
        try {
            const { error } = was
                ? await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id)
                : await supabase.from('follows').insert({ follower_id: user.id, following_id: id });
            if (error) throw error;
        } catch (e) {
            console.error('Error toggling follow:', e);
            apply(was);
        }
    }, [people, user]);

    return { people, loading, toggleFollow };
}
