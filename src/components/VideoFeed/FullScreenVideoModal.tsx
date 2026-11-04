import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    FlatList,
    ViewToken,
    StatusBar,
    Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import type { Video as FeedVideo } from '../../lib/supabase/hooks/useVideos';

interface FullScreenVideoModalProps {
    visible: boolean;
    videos: FeedVideo[];
    initialVideoId: string | null;
    onClose: () => void;
    onLike: (id: string) => void;
    onSave: (id: string) => void;
    onFollow: (id: string) => void;
}

function FullScreenVideoItem({
    item,
    isActive,
    height,
    onLike,
    onComment,
    onSave,
    onMore,
    onFollow,
}: {
    item: FeedVideo;
    isActive: boolean;
    height: number;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onFollow: () => void;
}) {
    const playerRef = useRef<Video>(null);
    const [isPaused, setIsPaused] = useState(false);
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
        <GestureDetector gesture={doubleTap}>
            <View style={{ width: '100%', height, backgroundColor: '#000' }}>
                <Pressable style={StyleSheet.absoluteFill} onPress={togglePlayback}>
                    <Video
                        ref={playerRef}
                        source={{ uri: encodeVideoUrl(item.videoUrl) || '' }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.CONTAIN}
                        posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
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

                    {isPaused && (
                        <View style={styles.pauseOverlay}>
                            <Ionicons name="pause" size={64} color="white" />
                        </View>
                    )}
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
                    onPress={() => setIsMuted((muted) => !muted)}
                    style={styles.muteButton}
                >
                    <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={22} color="#FFF" />
                </Pressable>

                <VideoControls
                    isPlaying={isActive && !isPaused}
                    title={item.title || ''}
                    author={item.author}
                    authorId={item.authorId || ''}
                    avatarUrl={item.avatarUrl}
                    hashtag={item.hashtag}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                    likes={item.likes || 0}
                    comments={item.comments || 0}
                    saved={item.saved || 0}
                    isLiked={item.isLiked || false}
                    isSaved={item.isSaved || false}
                    isFollowing={item.isFollowing || false}
                    onLike={onLike}
                    onComment={onComment}
                    onSave={onSave}
                    onMore={onMore}
                    onFollow={onFollow}
                />
            </View>
        </GestureDetector>
    );
}

export function FullScreenVideoModal({
    visible,
    videos,
    initialVideoId,
    onClose,
    onLike,
    onSave,
    onFollow,
}: FullScreenVideoModalProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [viewportHeight, setViewportHeight] = useState(0);
    const initialIndex = Math.max(0, videos.findIndex((video) => video.id === initialVideoId));
    const [viewableIndex, setViewableIndex] = useState<number | null>(null);
    const activeIndex = viewableIndex ?? initialIndex;
    const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
    const [deepDiveVideo, setDeepDiveVideo] = useState<any | null>(null);
    const [moreOptionsVideo, setMoreOptionsVideo] = useState<any | null>(null);
    const playerIsVisible = !commentsVideoId && !moreOptionsVideo && !deepDiveVideo;

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
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.container} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent']}
                    style={[styles.statusShadow, { height: insets.top + 30 }]}
                    pointerEvents="none"
                />
                <View style={[styles.headerWrapper, { top: Math.max(insets.top, 20) }]}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                            onClose();
                            router.push('/ai');
                        }}
                        style={styles.aiLogoContainer}
                    >
                        <View style={[
                            styles.aiLogoWrapper,
                            {
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                borderWidth: 1,
                                borderColor: 'rgba(217, 228, 255, 0.15)',
                                backgroundColor: 'rgba(0, 8, 20, 0.5)',
                                shadowColor: '#D9E4FF',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                                elevation: 3,
                            }
                        ]}>
                            <MaterialCommunityIcons name="robot-excited" size={18} color="#D9E4FF" />
                        </View>
                    </TouchableOpacity>
                </View>

                {viewportHeight > 0 && <FlatList
                    initialScrollIndex={initialIndex}
                    data={videos}
                    keyExtractor={item => item.id}
                    pagingEnabled
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
                            onLike={() => onLike(item.id)}
                            onComment={() => setCommentsVideoId(item.id)}
                            onSave={() => onSave(item.id)}
                            onMore={() => setMoreOptionsVideo(item)}
                            onFollow={() => onFollow(item.authorId)}
                        />
                    )}
                />}
            </View>
            <CommentsModal
                visible={!!commentsVideoId}
                videoId={commentsVideoId}
                onClose={() => setCommentsVideoId(null)}
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
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    headerWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 200,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    muteButton: {
        position: 'absolute',
        top: '24%',
        right: 16,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 1,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    aiLogoContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiLogoWrapper: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiLogo: {
        width: 32,
        height: 32,
    },
    statusShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 160,
    },
});
