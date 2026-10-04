import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Video } from '../../lib/supabase/hooks/useVideos';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useFeedPrefs } from '../../lib/hooks/useFeedPrefs';
import { shareVideo } from '../../lib/utils/shareVideo';
import { CommentsModal } from '../VideoFeed/CommentsModal';
import { DeepDiveModal } from '../VideoFeed/DeepDiveModal';
import { IconButton } from '../core/IconButton';
import { ImmersiveFeed } from './ImmersiveFeed';
import { ItemHandlers } from './ImmersiveItem';
import { FeedToast } from './FeedToast';

interface FeedStageProps {
    videos: Video[];
    loading: boolean;
    hasMore: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onEndReached: () => void;
    toggleLike: (id: string) => void;
    likeOnly: (id: string) => boolean;
    toggleSave: (id: string) => void;
    toggleFollow: (authorId: string) => void;
    /** This screen is the one being looked at. */
    focused: boolean;
    /** Where the header ends: the sound button and toasts sit just under it. */
    topInset: number;
    /** Height of the tab bar (or the home-indicator margin on a screen without one). */
    bottomInset: number;
    initialIndex?: number;
    /** Shown when the feed has nothing in it. */
    empty: React.ReactNode;
    /** A last page, when there is nothing more to load. */
    footer?: React.ReactNode;
}

/**
 * The feed and everything that hangs off a clip: sound, comments, Deep Dive,
 * share, the little confirmations. Home and the single-clip player both use it,
 * so a clip behaves the same wherever you meet it.
 */
export function FeedStage({
    videos, loading, hasMore, refreshing, onRefresh, onEndReached,
    toggleLike, likeOnly, toggleSave, toggleFollow,
    focused, topInset, bottomInset, initialIndex, empty, footer,
}: FeedStageProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { muted, soundOn, setSoundOn, autoplay } = useFeedPrefs();

    const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
    const [deepDiveVideo, setDeepDiveVideo] = useState<Video | null>(null);
    const [toast, setToast] = useState({ id: 0, message: '' });
    const toastSeq = useRef(0);
    const say = useCallback((message: string) => {
        toastSeq.current += 1;
        setToast({ id: toastSeq.current, message });
    }, []);

    const videosRef = useRef(videos);
    videosRef.current = videos;

    const handlers: ItemHandlers = {
        like: toggleLike,
        likeOnly: id => { likeOnly(id); },
        comment: setCommentsVideoId,
        save: id => {
            const v = videosRef.current.find(x => x.id === id);
            toggleSave(id);
            if (user && v) say(v.isSaved ? 'Removed from saved' : 'Saved');
        },
        share: async v => {
            const result = await shareVideo(v);
            if (result === 'copied') say('Link copied');
            else if (result === 'failed') say("Couldn't share this one");
        },
        follow: authorId => {
            const v = videosRef.current.find(x => x.authorId === authorId);
            toggleFollow(authorId);
            if (user && v) say(v.isFollowing ? 'Unfollowed' : `Following @${v.author}`);
        },
        openProfile: authorId => {
            if (!authorId) return;
            router.push(authorId === user?.id ? '/profile' : (`/user/${authorId}` as any));
        },
        openCategory: category => router.push({ pathname: '/discover', params: { category } }),
        deepDive: setDeepDiveVideo,
    };

    const covered = commentsVideoId !== null || deepDiveVideo !== null;

    return (
        <View style={styles.root}>
            {loading && videos.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#FFFFFF" />
                </View>
            ) : videos.length === 0 ? (
                <View style={styles.center}>{empty}</View>
            ) : (
                <ImmersiveFeed
                    videos={videos}
                    handlers={handlers}
                    muted={muted}
                    autoplay={autoplay}
                    focused={focused && !covered}
                    bottomInset={bottomInset}
                    topInset={topInset}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    onEndReached={onEndReached}
                    viewerId={user?.id}
                    footer={!hasMore ? footer : undefined}
                    initialIndex={initialIndex}
                />
            )}

            {videos.length > 0 ? (
                <IconButton
                    variant="glass"
                    name={muted ? 'volume-mute' : 'volume-high'}
                    size={19}
                    label={muted ? 'Turn sound on' : 'Turn sound off'}
                    onPress={() => setSoundOn(!soundOn)}
                    style={[styles.sound, { top: topInset + 4 }]}
                />
            ) : null}

            <FeedToast id={toast.id} message={toast.message} top={topInset + 8} />

            <CommentsModal visible={!!commentsVideoId} videoId={commentsVideoId} onClose={() => setCommentsVideoId(null)} />
            <DeepDiveModal visible={deepDiveVideo !== null} video={deepDiveVideo} onClose={() => setDeepDiveVideo(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sound: { position: 'absolute', right: 6, zIndex: 40 },
});
