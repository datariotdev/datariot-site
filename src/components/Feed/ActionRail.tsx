import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from '../../lib/supabase/hooks/useVideos';
import { formatCount } from '../../lib/utils/format';
import { Avatar } from '../core/Avatar';
import { Txt } from '../core/Txt';
import { useUI } from '../../design-system/ui';

type IconName = keyof typeof Ionicons.glyphMap;

const iconShadow = {
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
} as const;

interface RailButtonProps {
    icon: IconName;
    activeIcon: IconName;
    active?: boolean;
    activeColor: string;
    count?: number;
    /** Shown instead of a zero count, so the column keeps its rhythm and says what each icon does. */
    verb: string;
    label: string;
    onPress: () => void;
}

function RailButton({ icon, activeIcon, active = false, activeColor, count, verb, label, onPress }: RailButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const wasActive = useRef(active);

    useEffect(() => {
        if (active && !wasActive.current) {
            Animated.sequence([
                Animated.spring(scale, { toValue: 1.3, speed: 40, bounciness: 12, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 8, useNativeDriver: true }),
            ]).start();
        }
        wasActive.current = active;
    }, [active, scale]);

    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={styles.button}>
            <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name={active ? activeIcon : icon} size={30} color={active ? activeColor : '#FFFFFF'} style={iconShadow} />
            </Animated.View>
            <Txt variant="caption" tone="onVideo" style={[styles.count, !count && styles.verb]}>
                {count ? formatCount(count) : verb}
            </Txt>
        </Pressable>
    );
}

interface ActionRailProps {
    video: Video;
    isOwn: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onShare: () => void;
    onFollow: () => void;
    onOpenProfile: () => void;
}

/** The column of things you can do to a clip. Four verbs and the creator; nothing else. */
export function ActionRail({ video, isOwn, onLike, onComment, onSave, onShare, onFollow, onOpenProfile }: ActionRailProps) {
    const { c } = useUI();
    const showFollow = !isOwn && !video.isFollowing && !!video.authorId;

    return (
        <View style={styles.rail} pointerEvents="box-none">
            <View style={styles.creator}>
                <Pressable onPress={onOpenProfile} accessibilityRole="button" accessibilityLabel={`${video.author}'s profile`}>
                    <Avatar uri={video.avatarUrl} name={video.author} size={46} ring="#FFFFFF" />
                </Pressable>
                {showFollow ? (
                    <Pressable
                        onPress={onFollow}
                        accessibilityRole="button"
                        accessibilityLabel={`Follow ${video.author}`}
                        hitSlop={8}
                        style={[styles.follow, { backgroundColor: c.accent }]}
                    >
                        <Ionicons name="add" size={15} color={c.onAccent} />
                    </Pressable>
                ) : null}
            </View>

            <RailButton
                icon="heart-outline"
                activeIcon="heart"
                active={video.isLiked}
                activeColor={c.like}
                count={video.likes}
                verb="Like"
                label={video.isLiked ? 'Unlike' : 'Like'}
                onPress={onLike}
            />
            <RailButton
                icon="chatbubble-outline"
                activeIcon="chatbubble"
                activeColor="#FFFFFF"
                count={video.comments}
                verb="Comment"
                label="Comments"
                onPress={onComment}
            />
            <RailButton
                icon="bookmark-outline"
                activeIcon="bookmark"
                active={video.isSaved}
                activeColor={c.accent}
                count={video.saved}
                verb="Save"
                label={video.isSaved ? 'Remove from saved' : 'Save'}
                onPress={onSave}
            />
            <RailButton
                icon="arrow-redo-outline"
                activeIcon="arrow-redo"
                activeColor="#FFFFFF"
                verb="Share"
                label="Share"
                onPress={onShare}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    rail: {
        alignItems: 'center',
        gap: 18,
        width: 56,
    },
    creator: {
        alignItems: 'center',
        marginBottom: 14,
    },
    follow: {
        position: 'absolute',
        bottom: -11,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        alignItems: 'center',
        minWidth: 52,
    },
    count: {
        marginTop: 3,
        textShadowColor: 'rgba(0, 0, 0, 0.45)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    verb: {
        opacity: 0.7,
    },
});
