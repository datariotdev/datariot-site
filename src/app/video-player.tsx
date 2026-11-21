/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useIsFocused } from 'expo-router';
import { CoubClassicFeed } from '@components/VideoFeed/CoubClassicFeed';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos, FeedType } from '@lib/supabase/hooks/useVideos';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '../design-system/palette';
import { CommentsModal } from '../components/VideoFeed/CommentsModal';
import { FullScreenVideoModal } from '../components/VideoFeed/FullScreenVideoModal';

export default function VideoPlayerScreen() {
    const focused = useIsFocused();
    const { user } = useAuth();
    const viewerId = user?.is_anonymous ? undefined : user?.id;
    const params = useLocalSearchParams<{
        type?: FeedType; userId?: string; hashtag?: string; searchQuery?: string;
        initialVideoId?: string; videoId?: string; openComments?: string; sort?: 'recent' | 'popular';
    }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const p = usePalette();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [commentsId, setCommentsId] = useState<string | null>(null);
    const [openOptionsOnMount, setOpenOptionsOnMount] = useState(false);
    const openPlayer = (id: string, options = false) => {
        setOpenOptionsOnMount(options);
        setSelectedId(id);
    };
    const value = (param: string | string[] | undefined) => {
        const text = Array.isArray(param) ? param[0] : param;
        return text && text !== 'undefined' ? text : undefined;
    };
    const type = (value(params.type) || 'trending') as FeedType;
    const analyticsSurface = type === 'user' ? 'profile' : 'other';
    const search = value(params.searchQuery);
    const videoId = value(params.videoId);
    const initialId = value(params.initialVideoId) || videoId;
    const openComments = value(params.openComments);

    useEffect(() => {
        if (openComments && (videoId || initialId)) {
            setCommentsId(videoId || initialId || null);
        }
    }, [openComments, videoId, initialId]);

    const { videos, loading, error, loadMore, refresh, toggleLike, toggleFollow, toggleSave } = useVideos(
        videoId
            ? { type: 'trending', videoId }
            : {
                type,
                userId: value(params.userId),
                hashtag: value(params.hashtag),
                searchQuery: search,
                sort: value(params.sort) as 'recent' | 'popular' | undefined,
            }
    );
    const back = () => router.canGoBack() ? router.back() : router.replace('/(tabs)');
    const background = p.isDark ? '#08090D' : '#F7F8FA';
    const initialIndex = Math.max(0, videos.findIndex(video => video.id === initialId));
    const title = type === 'user' ? 'Video library' : search ? 'Search results' : 'Latest videos';
    return <View style={[s.root, { backgroundColor: background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={p.isDark ? 'light-content' : 'dark-content'} />
        <View style={[s.toolbar, { paddingTop: insets.top + 4 }]}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Go back" style={s.back} hitSlop={4}>
                <Feather name="arrow-left" size={22} color={p.text} />
            </Pressable>
            <Text style={[s.wordmark, { color: p.text, fontFamily: p.fonts.semibold }]}>datariot<Text style={{ color: p.faint, fontFamily: p.fonts.regular }}> / watch</Text></Text>
            <View style={{ width: 44 }} />
        </View>
        {loading && videos.length === 0 ? <View style={s.center}><ActivityIndicator color={p.accent} /></View>
            : videos.length === 0 ? <View style={s.center}>
                <Feather name="play-circle" size={34} color={p.faint} />
                <Text style={[s.emptyTitle, { color: p.text, fontFamily: p.fonts.semibold }]}>{error ? 'Couldn’t load these videos' : 'Nothing here yet'}</Text>
                <Text style={[s.emptyText, { color: p.sub, fontFamily: p.fonts.regular }]}>{error ? 'Give it another try.' : 'New videos will appear here.'}</Text>
                <Pressable onPress={error ? refresh : back} accessibilityRole="button" style={[s.retry, { backgroundColor: p.accent }]}>
                    <Text style={{ color: p.onAccent, fontFamily: p.fonts.medium }}>{error ? 'Try again' : 'Explore videos'}</Text>
                </Pressable>
            </View> : <CoubClassicFeed videos={videos} viewerId={viewerId} analyticsSurface={analyticsSurface} collection title={title} paddingBottom={insets.bottom + 12}
                isScreenFocused={focused && !selectedId && !commentsId}
                onEndReached={loadMore} onLike={toggleLike} onComment={setCommentsId} onSave={toggleSave}
                onMore={id => openPlayer(id, true)} onFollow={toggleFollow} onSelect={openPlayer} initialScrollIndex={initialIndex} />}
        <CommentsModal visible={!!commentsId} videoId={commentsId} onClose={() => setCommentsId(null)} />
        <FullScreenVideoModal viewerId={viewerId} analyticsSurface={analyticsSurface} visible={!!selectedId} videos={videos} initialVideoId={selectedId} onClose={() => setSelectedId(null)}
            onLike={toggleLike} onSave={toggleSave} openOptionsOnMount={openOptionsOnMount} />
    </View>;
}
const s = StyleSheet.create({
    root: { flex: 1 },
    toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 4 },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    wordmark: { fontSize: 15, letterSpacing: -0.4 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyTitle: { fontSize: 23, letterSpacing: -0.5, textAlign: 'center', marginTop: 18 },
    emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
    retry: { paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, marginTop: 24 },
});
