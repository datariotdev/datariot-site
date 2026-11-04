import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    FlatList,
    ViewToken,
    StatusBar,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { encodeVideoUrl } from '../../lib/utils/url';
import { VideoControls } from '../VideoPlayer/VideoControls';
import { CommentsModal } from './CommentsModal';
import { DeepDiveModal } from './DeepDiveModal';
import { MoreOptionsModal } from './MoreOptionsModal';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { FeedType, Video as FeedVideo } from '../../lib/supabase/hooks/useVideos';

const FEED_TABS = [
    { key: 'ai', label: 'ARENA' },
    { key: 'trending', label: 'FEED' },
    { key: 'following', label: 'CIRCLE' },
] as const;

interface FullScreenVideoModalProps {
    visible: boolean;
    videos: FeedVideo[];
    initialVideoId: string | null;
    onClose: () => void;
    onLike: (id: string) => void;
    onSave: (id: string) => void;
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
    onLike,
    onComment,
    onSave,
    onComposeComment,
    onMore,
}: {
    item: FeedVideo;
    isActive: boolean;
    height: number;
    topPadding: number;
    bottomPadding: number;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onComposeComment: () => void;
    onMore: () => void;
}) {
    const router = useRouter();
    const author = item.author.replace(/^@/, '');
    const playerRef = useRef<Video>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [isMuted, setIsMuted] = useState(Platform.OS === 'web');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlayback = () => {
        setIsPaused(!isPaused);
    };

    const handleSeek = (value: number) => {
        playerRef.current?.setPositionAsync(value).catch((error) => {
            console.warn('Video seek failed:', error);
        });
    };

    // Double tap to like gesture
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .runOnJS(true)
        .onEnd(() => { onLike(); });

    return (
        <View style={[styles.page, { height, paddingTop: topPadding }]}>
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
                    <Pressable accessibilityRole="button" accessibilityLabel={isPaused ? 'Play video' : 'Pause video'}
                        style={StyleSheet.absoluteFill} onPress={togglePlayback}>
                        <Video
                            ref={playerRef}
                            source={{ uri: encodeVideoUrl(item.videoUrl) || '' }}
                            style={StyleSheet.absoluteFill}
                            videoStyle={Platform.OS === 'web' ? styles.webVideo : undefined}
                            resizeMode={ResizeMode.CONTAIN}
                            posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
                            posterStyle={{ resizeMode: 'contain' }}
                            usePoster={!!item.thumbnailUrl}
                            shouldPlay={isActive && !isPaused}
                            isLooping
                            isMuted={isMuted}
                            onPlaybackStatusUpdate={(status) => {
                                if (status.isLoaded) {
                                    setCurrentTime(status.positionMillis);
                                    setDuration(status.durationMillis ?? 0);
                                }
                            }}
                        />
                        {isPaused && <View style={styles.pauseOverlay}><Ionicons name="play" size={54} color="#FFF" /></View>}
                    </Pressable>
                </GestureDetector>

                <Pressable accessibilityRole="button" accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
                    style={[styles.iconButton, styles.muteButton]} onPress={() => setIsMuted((muted) => !muted)}>
                    <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={19} color="#FFF" />
                </Pressable>
            </View>

            <VideoControls
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
            />
        </View>
    );
}

export function FullScreenVideoModal({
    visible,
    videos,
    initialVideoId,
    onClose,
    onLike,
    onSave,
    activeTab = 'trending',
    onSelectTab,
    onEndReached,
}: FullScreenVideoModalProps) {
    const insets = useSafeAreaInsets();
    const [viewportHeight, setViewportHeight] = useState(0);
    const initialIndex = Math.max(0, videos.findIndex((video) => video.id === initialVideoId));
    const [viewableIndex, setViewableIndex] = useState<number | null>(null);
    const activeIndex = viewableIndex ?? initialIndex;
    const [commentSheet, setCommentSheet] = useState<{ videoId: string; compose: boolean } | null>(null);
    const [deepDiveVideo, setDeepDiveVideo] = useState<FeedVideo | null>(null);
    const [moreOptionsVideo, setMoreOptionsVideo] = useState<FeedVideo | null>(null);
    const playerIsVisible = !commentSheet && !moreOptionsVideo && !deepDiveVideo;

    const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);
    const isFocused = useIsFocused();

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setViewableIndex(viewableItems[0].index);
        }
    }, []);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={() => {
                if (playerIsVisible) onClose();
            }}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <GestureHandlerRootView style={styles.container} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
                <View style={[styles.header, { top: Math.max(insets.top, 8) }]}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close full-screen feed" style={styles.iconButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </Pressable>
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
                    <View style={styles.headerSpacer} />
                </View>

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
                            topPadding={Math.max(insets.top, 8) + 52}
                            bottomPadding={Math.max(insets.bottom, 8)}
                            onLike={() => onLike(item.id)}
                            onComment={() => setCommentSheet({ videoId: item.id, compose: false })}
                            onComposeComment={() => setCommentSheet({ videoId: item.id, compose: true })}
                            onSave={() => onSave(item.id)}
                            onMore={() => setMoreOptionsVideo(item)}
                        />
                    )}
                />}
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
                onClose={() => setDeepDiveVideo(null)}
            />
            <MoreOptionsModal
                visible={moreOptionsVideo !== null}
                onClose={() => setMoreOptionsVideo(null)}
                onDeepDive={() => {
                    setDeepDiveVideo(moreOptionsVideo);
                }}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090D' },
    page: { width: '100%', backgroundColor: '#08090D', overflow: 'hidden' },
    ambientPoster: { ...StyleSheet.absoluteFillObject, opacity: 0.54 },
    header: {
        position: 'absolute', left: 10, right: 10, zIndex: 200,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    tabs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tab: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#FFF' },
    tabLabel: { color: '#C1C2C7', fontSize: 12, fontWeight: '700', letterSpacing: 1.7 },
    activeTabLabel: { color: '#FFF' },
    headerSpacer: { width: 44 },
    iconButton: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(8,9,13,0.45)',
    },
    stage: { flex: 1, minHeight: 0 },
    webVideo: { width: '100%', height: '100%' },
    muteButton: { position: 'absolute', top: 8, right: 14 },
    attribution: { flexDirection: 'row', alignSelf: 'flex-start', maxWidth: '100%', alignItems: 'center', gap: 10, minHeight: 44 },
    avatar: {
        width: 37, height: 37, borderRadius: 19, borderWidth: 1, borderColor: '#FFF', overflow: 'hidden',
        backgroundColor: '#D9E4FF', alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: '#101521', fontSize: 15, fontWeight: '700' },
    author: {
        flexShrink: 1, color: '#FFF', fontSize: 17, fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    pauseOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
});
