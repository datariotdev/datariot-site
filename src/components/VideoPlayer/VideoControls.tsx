import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { theme } from '@design-system/theme';

interface VideoControlsProps {
    title: string;
    hashtag?: string;
    currentTime: number;
    duration: number;
    onSeek: (value: number) => void;
    likes: number;
    comments: number;
    saved: number;
    isLiked: boolean;
    isSaved: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onComposeComment: () => void;
}

function formatTime(millis: number) {
    const seconds = Math.floor(millis / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const countFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function VideoControls({
    title, hashtag, currentTime, duration, onSeek, likes, comments, saved,
    isLiked, isSaved, onLike, onComment, onSave, onComposeComment,
}: VideoControlsProps) {
    const [expanded, setExpanded] = useState(false);
    const [hasLongCaption, setHasLongCaption] = useState(false);
    const [seekTime, setSeekTime] = useState<number | null>(null);
    const caption = hashtag ? `${title} #${hashtag}` : title;
    const displayTime = seekTime ?? currentTime;

    return (
        <View style={styles.container}>
            <Pressable
                accessibilityRole={hasLongCaption ? 'button' : undefined}
                accessibilityState={hasLongCaption ? { expanded } : undefined}
                onPress={hasLongCaption ? () => setExpanded(!expanded) : undefined}
                style={styles.captionBlock}
            >
                <Text
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    onTextLayout={({ nativeEvent }) => setHasLongCaption(nativeEvent.lines.length > 2)}
                    style={[styles.caption, styles.measureCaption]}
                >{caption}</Text>
                <Text numberOfLines={expanded ? 5 : 2} style={styles.caption}>{caption}</Text>
                {hasLongCaption && <Text style={styles.captionToggle}>{expanded ? 'less' : 'more'}</Text>}
            </Pressable>

            <View style={styles.actions}>
                <Pressable accessibilityRole="button" accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
                    accessibilityState={{ selected: isLiked }} style={styles.action} onPress={onLike}>
                    <Text style={[styles.star, isLiked && styles.selected]}>✦</Text>
                    <Text style={styles.count}>{countFormat.format(likes)}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Comments" style={styles.action} onPress={onComment}>
                    <Ionicons name="chatbubble" size={23} color="#FFF" />
                    <Text style={styles.count}>{countFormat.format(comments)}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
                    accessibilityState={{ selected: isSaved }} style={styles.action} onPress={onSave}>
                    <Ionicons name="bookmark" size={22} color={isSaved ? '#D9E4FF' : '#FFF'} />
                    <Text style={styles.count}>{countFormat.format(saved)}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Add a comment" onPress={onComposeComment} style={styles.commentBar}>
                    <Text numberOfLines={1} style={styles.placeholder}>Add a comment…</Text>
                    <View style={styles.sendIcon}>
                        <Ionicons name="arrow-up" size={17} color="#101521" />
                    </View>
                </Pressable>
            </View>

            <View style={styles.scrubber}>
                <Slider
                    accessibilityLabel="Video position"
                    style={styles.slider}
                    disabled={duration <= 0}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    value={Math.min(currentTime, duration)}
                    minimumTrackTintColor="#FFF"
                    maximumTrackTintColor="#55585F"
                    thumbTintColor="#FFF"
                    onSlidingStart={setSeekTime}
                    onValueChange={setSeekTime}
                    onSlidingComplete={(value) => {
                        onSeek(value);
                        setSeekTime(null);
                    }}
                />
                <Text style={styles.time}>{formatTime(displayTime)} / {formatTime(duration)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 14, paddingTop: 12, gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' },
    captionBlock: { paddingHorizontal: 4 },
    caption: { color: '#FFF', textAlign: 'center', fontSize: 17, lineHeight: 22, fontFamily: theme.typography.fontFamilies.medium },
    measureCaption: { position: 'absolute', left: 4, right: 4, opacity: 0 },
    captionToggle: { color: '#C3C5CC', textAlign: 'center', fontSize: 12, marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    action: { width: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 2 },
    star: { color: '#FFF', fontSize: 27, lineHeight: 26 },
    selected: { color: '#D9E4FF' },
    count: { color: '#FFF', fontSize: 11, fontFamily: theme.typography.fontFamilies.bold },
    commentBar: {
        flex: 1, minWidth: 0, minHeight: 44, borderRadius: 23, marginLeft: 4, paddingLeft: 12, paddingRight: 4,
        flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#53565E', backgroundColor: '#26282E',
    },
    placeholder: { flex: 1, minWidth: 0, color: '#C0C2CA', fontSize: 13 },
    sendIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    scrubber: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    slider: { flex: 1, height: 28 },
    time: { color: '#FFF', fontSize: 12, fontVariant: ['tabular-nums'], fontFamily: theme.typography.fontFamilies.medium },
});
