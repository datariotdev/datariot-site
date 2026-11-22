/** @jsxImportSource react */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    FlatList,
    StatusBar,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useIsFocused } from 'expo-router';
import { encodeVideoUrl } from '../../lib/utils/url';
import { VideoControls } from '../VideoPlayer/VideoControls';
import { DesktopVideoViewer } from './DesktopVideoViewer';
import { CommentsModal } from './CommentsModal';
import { DeepDiveModal } from './DeepDiveModal';
import { LiveAnalysisButton } from './LiveAnalysisButton';
import { MoreOptionsModal } from './MoreOptionsModal';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { FeedType, Video as FeedVideo } from '../../lib/supabase/hooks/useVideos';

const FEED_TABS = [
    { key: 'ai', label: 'ARENA' },
    { key: 'trending', label: 'FEED' },
    { key: 'following', label: 'CIRCLE' },
] as const;

export interface FullScreenVideoModalProps {
    visible: boolean;
    videos: FeedVideo[];
    initialVideoId: string | null;
    onClose: () => void;
    onLike: (id: string) => void;
    onSave: (id: string) => void;
    openOptionsOnMount?: boolean;
    activeTab?: FeedType;
    onSelectTab?: (tab: FeedType) => void;
    onEndReached?: () => void;
}

function FullScreenVideoItem({
    item,
    isActive,
    height,
    topPadding,
    bottomPadding,
    clearDisplay,
    muted,
    rate,
    restart,
    onToggleMute,
    onLike,
    onComment,
    onSave,
    onComposeComment,
    onMore,
    onPlaybackTime,
    seekTo,
}: {
    item: FeedVideo;
    isActive: boolean;
    height: number;
    topPadding: number;
    bottomPadding: number;
    clearDisplay: boolean;
    muted: boolean;
    rate: number;
    restart: { id: string } | null;
    onToggleMute: () => void;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onComposeComment: () => void;
    onMore: () => void;
    onPlaybackTime: (videoId: string, seconds: number) => void;
    seekTo?: { seconds: number; nonce: number };
}) {
    const router = useRouter();
    const author = item.author.split(' | ')[0];
    const [isPaused, setIsPaused] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const player = useVideoPlayer(encodeVideoUrl(item.videoUrl) || '', (p) => {
        p.loop = true;
        p.muted = muted;
        p.playbackRate = rate;
        p.timeUpdateEventInterval = 0.2;
        if (isActive && !isPaused) {
            p.play();
        }
    });

    useEffect(() => {
        if (isActive && !isPaused) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, isPaused, player]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability -- Expo VideoPlayer is an imperative SharedObject.
        player.muted = muted;
        player.playbackRate = rate;
    }, [muted, player, rate]);

    useEffect(() => {
        if (!restart) return;
        player.currentTime = 0;
        setIsPaused(false);
    }, [player, restart]);

    useEffect(() => { if (seekTo) { player.currentTime = seekTo.seconds; setIsPaused(false); } }, [player, seekTo]);

    useEventListener(player, 'timeUpdate', (event: any) => {
        const current = Number(event?.currentTime ?? player.currentTime ?? 0);
        const total = Number(player.duration ?? 0);
        setCurrentTime(Number.isFinite(current) && current >= 0 ? current * 1000 : 0);
        setDuration(Number.isFinite(total) && total > 0 ? total * 1000 : 0);
        if (isActive) onPlaybackTime(item.id, Number.isFinite(current) && current >= 0 ? Math.floor(current) : 0);
    });

    const togglePlayback = () => {
        setIsPaused(!isPaused);
    };

    const handleSeek = (value: number) => {
        try {
            // eslint-disable-next-line react-hooks/immutability -- Seeking is part of Expo's imperative player API.
            player.currentTime = value / 1000;
        } catch (e) {
            console.warn('Video seek failed:', e);
        }
    };

    // Double tap to like gesture
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .runOnJS(true)
        .onEnd(() => { onLike(); });

    return (
        <View style={[styles.page, { height }]}>
            {item.thumbnailUrl && (
                <Image source={{ uri: item.thumbnailUrl }} blurRadius={32} style={styles.ambientPoster} />
            )}
            <LinearGradient
                colors={['rgba(11,13,20,0.25)', 'rgba(8,10,16,0.72)', '#08090D']}
                locations={[0, 0.67, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            <View style={styles.stage}>
                <GestureDetector gesture={doubleTap}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={isPaused ? 'Play video' : 'Pause video'}
                        style={StyleSheet.absoluteFill}
                        onPress={togglePlayback}
                    >
                        <VideoView
                            player={player}
                            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
                            contentFit="contain"
                            nativeControls={false}
                            surfaceType="textureView"
                        />
                        {isPaused && !clearDisplay && (
                            <View style={styles.pauseOverlay}>
                                <Ionicons name="play" size={54} color="#FFF" />
                            </View>
                        )}
                    </Pressable>
                </GestureDetector>

                {!clearDisplay && (
                    <Pressable accessibilityRole="button" accessibilityLabel={muted ? 'Unmute video' : 'Mute video'}
                        style={[styles.iconButton, styles.muteButton]} onPress={onToggleMute}>
                        <Ionicons name={muted ? 'volume-mute' : 'volume-medium'} size={19} color="#FFF" />
                    </Pressable>
                )}
            </View>

            {!clearDisplay && <VideoControls
                attribution={(
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${author}'s profile`}
                        disabled={!item.authorId}
                        onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.authorId } })}
                        style={styles.attribution}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{author[0]?.toUpperCase()}</Text>
                            {item.avatarUrl && !avatarFailed && (
                                <Image source={{ uri: item.avatarUrl }} onError={() => setAvatarFailed(true)} style={StyleSheet.absoluteFill} />
                            )}
                        </View>
                        <Text style={styles.author} numberOfLines={1}>@{author}</Text>
                    </Pressable>
                )}
                bottomPadding={bottomPadding}
                title={item.title}
                hashtag={item.hashtag}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                likes={item.likes}
                comments={item.comments}
                saved={item.saved}
                isLiked={item.isLiked}
                isSaved={item.isSaved}
                onLike={onLike}
                onComment={onComment}
                onSave={onSave}
                onComposeComment={onComposeComment}
                onMore={onMore}
            />}
        </View>
    );
}

export function FullScreenVideoModal(props: FullScreenVideoModalProps) {
    const { width } = useWindowDimensions();
    if (!props.visible) return null;
    if (Platform.OS === 'web' && width > 768) {
        return <DesktopVideoViewer key={props.initialVideoId ?? 'feed'} {...props} />;
    }
    return <FullScreenVideoSession key={props.initialVideoId ?? 'feed'} {...props} />;
}

function FullScreenVideoSession({
    videos,
    initialVideoId,
    onClose,
    onLike,
    onSave,
    openOptionsOnMount = false,
    activeTab = 'trending',
    onSelectTab,
    onEndReached,
}: FullScreenVideoModalProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width, height: windowHeight } = useWindowDimensions();
    const desktop = Platform.OS === 'web' && width > 768;
    const frameHeight = desktop ? windowHeight : Math.max(1, Math.min(480, (windowHeight - 32) * 9 / 16, width - 32)) * 16 / 9;
    const frameWidth = desktop ? Math.max(1, Math.min(520, windowHeight * 9 / 16, width)) : Math.max(1, Math.min(480, (windowHeight - 32) * 9 / 16, width - 32));
    const [viewportHeight, setViewportHeight] = useState(0);
    const initialIndex = Math.max(0, videos.findIndex((video) => video.id === initialVideoId));
    const [viewableIndex, setViewableIndex] = useState<number | null>(null);
    const activeIndex = viewableIndex ?? initialIndex;
    const [commentSheet, setCommentSheet] = useState<{ videoId: string; compose: boolean } | null>(null);
    const [deepDiveVideo, setDeepDiveVideo] = useState<FeedVideo | null>(null);
    const [analysisSeconds, setAnalysisSeconds] = useState(0);
    const playbackTime = useRef({ videoId: '', seconds: 0 });
    const rememberPlaybackTime = useCallback((videoId: string, seconds: number) => {
        playbackTime.current = { videoId, seconds };
    }, []);
    const [seekRequest, setSeekRequest] = useState<{ id: string; seconds: number; nonce: number }>();
    const [moreOptionsId, setMoreOptionsId] = useState(openOptionsOnMount ? initialVideoId : null);
    const [clearDisplay, setClearDisplay] = useState(false);
    const [muted, setMuted] = useState(Platform.OS === 'web');
    const [rate, setRate] = useState(1);
    const [restart, setRestart] = useState<{ id: string } | null>(null);
    const moreOptionsVideo = videos.find(item => item.id === moreOptionsId);
    const playerIsVisible = !commentSheet && !moreOptionsVideo && !deepDiveVideo;
    const closeOptions = () => setMoreOptionsId(null);
    const toggleMute = () => setMuted(current => !current);
    const openAnalysis = (video: FeedVideo) => {
        setAnalysisSeconds(playbackTime.current.videoId === video.id ? playbackTime.current.seconds : 0);
        setDeepDiveVideo(video);
    };

    const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);
    const isFocused = useIsFocused();

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index != null) {
            setViewableIndex(viewableItems[0].index);
        }
    }, []);

    const handleBack = () => {
        if (moreOptionsVideo) closeOptions();
        else if (clearDisplay) setClearDisplay(false);
        else onClose();
    };

    useEffect(() => {
        if (!desktop || !isFocused) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [desktop, isFocused, onClose]);

    return (
        <Modal
            visible={isFocused}
            transparent={desktop}
            animationType="fade"
            onRequestClose={handleBack}
        >
            <StatusBar barStyle="light-content" />
            <GestureHandlerRootView style={[styles.container, desktop && styles.desktopContainer]}>
                {desktop && (
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Close video"
                    />
                )}
                <View style={[styles.frame, desktop ? { width: frameWidth, height: frameHeight, flexShrink: 0, borderRadius: 0 } : styles.mobileFrame]}
                    accessibilityElementsHidden={!!moreOptionsVideo} importantForAccessibility={moreOptionsVideo ? 'no-hide-descendants' : 'auto'}
                    aria-hidden={!!moreOptionsVideo} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
                {clearDisplay ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Restore video controls" onPress={() => setClearDisplay(false)}
                        style={[styles.iconButton, styles.restoreButton, { top: Math.max(insets.top, 8) }]}>
                        <Ionicons name="scan-outline" size={20} color="#FFF" />
                    </Pressable>
                ) : <View style={[styles.header, { top: Math.max(insets.top, 8) }]}>
                    <View style={!onSelectTab && styles.balancedLeading}>
                        <Pressable accessibilityRole="button" accessibilityLabel="Close full-screen feed" style={styles.iconButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </Pressable>
                    </View>
                    <View style={styles.tabs}>
                        {(onSelectTab ? FEED_TABS : FEED_TABS.slice(1, 2)).map((tab) => (
                            <Pressable
                                key={tab.key}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: activeTab === tab.key }}
                                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                                onPress={onSelectTab ? () => {
                                    if (tab.key !== activeTab) onSelectTab(tab.key);
                                } : undefined}
                            >
                                <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>{tab.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={styles.headerActions}>
                        <LiveAnalysisButton dark active={isFocused && playerIsVisible} disabled={!videos[activeIndex]}
                            onOpen={() => { if (videos[activeIndex]) openAnalysis(videos[activeIndex]); }} />
                        <Pressable accessibilityRole="button" accessibilityLabel="More options" style={styles.iconButton}
                            disabled={!videos[activeIndex]} onPress={() => setMoreOptionsId(videos[activeIndex]?.id ?? null)}>
                            <Ionicons name="ellipsis-horizontal" size={23} color="#FFF" />
                        </Pressable>
                    </View>
                </View>}

                {viewportHeight > 0 && <FlatList
                    initialScrollIndex={initialIndex}
                    data={videos}
                    keyExtractor={item => item.id}
                    pagingEnabled
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    showsVerticalScrollIndicator={false}
                    getItemLayout={(_, index) => ({
                        length: viewportHeight,
                        offset: viewportHeight * index,
                        index,
                    })}
                    viewabilityConfig={viewabilityConfig}
                    onViewableItemsChanged={onViewableItemsChanged}
                    renderItem={({ item, index }) => (
                        <FullScreenVideoItem
                            item={item}
                            isActive={index === activeIndex && isFocused && playerIsVisible}
                            height={viewportHeight}
                            topPadding={clearDisplay ? 0 : Math.max(insets.top, 8) + 52}
                            bottomPadding={clearDisplay ? 0 : Math.max(insets.bottom, 8)}
                            clearDisplay={clearDisplay}
                            muted={muted}
                            rate={rate}
                            restart={restart?.id === item.id ? restart : null}
                            onToggleMute={toggleMute}
                            onLike={() => onLike(item.id)}
                            onComment={() => setCommentSheet({ videoId: item.id, compose: false })}
                            onComposeComment={() => setCommentSheet({ videoId: item.id, compose: true })}
                            onSave={() => onSave(item.id)}
                            onMore={() => setMoreOptionsId(item.id)}
                            onPlaybackTime={rememberPlaybackTime}
                            seekTo={seekRequest?.id === item.id ? seekRequest : undefined}
                        />
                    )}
                />}
                </View>
                {moreOptionsVideo && (
                    <MoreOptionsModal
                        key={moreOptionsVideo.id}
                        video={moreOptionsVideo}
                        muted={muted}
                        rate={rate}
                        onClose={closeOptions}
                        onClearDisplay={() => { closeOptions(); setClearDisplay(true); }}
                        onRestart={() => { closeOptions(); setRestart({ id: moreOptionsVideo.id }); }}
                        onToggleMute={() => { closeOptions(); toggleMute(); }}
                        onRateChange={speed => { setRate(speed); closeOptions(); }}
                        onComments={() => { closeOptions(); setCommentSheet({ videoId: moreOptionsVideo.id, compose: false }); }}
                        onAuthor={moreOptionsVideo.authorId ? () => {
                            closeOptions();
                            onClose();
                            router.push({ pathname: '/user/[id]', params: { id: moreOptionsVideo.authorId } });
                        } : undefined}
                        onDeepDive={() => { closeOptions(); openAnalysis(moreOptionsVideo); }}
                    />
                )}
            </GestureHandlerRootView>
            <CommentsModal
                visible={!!commentSheet}
                videoId={commentSheet?.videoId ?? null}
                focusComposer={commentSheet?.compose}
                onClose={() => setCommentSheet(null)}
            />
            <DeepDiveModal
                visible={deepDiveVideo !== null}
                video={deepDiveVideo}
                seconds={analysisSeconds}
                onSeek={seconds => {
                    if (deepDiveVideo) setSeekRequest({ id: deepDiveVideo.id, seconds, nonce: Date.now() });
                    setDeepDiveVideo(null);
                }}
                onClose={() => setDeepDiveVideo(null)}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090D' },
    desktopContainer: { alignItems: 'center', justifyContent: 'center' },
    frame: { minHeight: 0, position: 'relative', overflow: 'hidden', backgroundColor: '#08090D' },
    mobileFrame: { flex: 1, width: '100%' },
    page: { width: '100%', backgroundColor: '#08090D', overflow: 'hidden' },
    ambientPoster: { ...StyleSheet.absoluteFill, opacity: 0.54 },
    header: {
        position: 'absolute', left: 10, right: 10, zIndex: 200,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    balancedLeading: { width: 88 },
    tab: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#FFF' },
    tabLabel: { color: '#C1C2C7', fontSize: 12, fontWeight: '700', letterSpacing: 1.7 },
    activeTabLabel: { color: '#FFF' },
    iconButton: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(8,9,13,0.45)',
    },
    restoreButton: { position: 'absolute', right: 10, zIndex: 200 },
    muteButton: {
        position: 'absolute',
        right: 14,
        bottom: 12,
        zIndex: 20,
    },
    stage: { ...StyleSheet.absoluteFill },
    stageFooter: {
        position: 'absolute', left: 14, right: 14, bottom: 9,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    },
    attribution: { flexDirection: 'row', flexShrink: 1, alignItems: 'center', gap: 8, minHeight: 44 },
    avatar: {
        width: 37, height: 37, borderRadius: 19, borderWidth: 1, borderColor: '#FFF', overflow: 'hidden',
        backgroundColor: '#D9E4FF', alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: '#101521', fontSize: 15, fontWeight: '700' },
    author: {
        flexShrink: 1, color: '#FFF', fontSize: 17, fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    pauseOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
});
