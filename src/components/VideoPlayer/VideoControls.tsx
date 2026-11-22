import React, { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@design-system/theme';

interface VideoControlsProps {
    docked?: boolean;
    dark?: boolean;
    attribution: ReactNode;
    companion?: ReactNode;
    bottomPadding: number;
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
    onMore: () => void;
}

function formatTime(millis: number) {
    const seconds = Math.floor(millis / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const countFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function VideoControls({
    docked = false, dark = true, attribution, companion, bottomPadding, title, hashtag, currentTime, duration, onSeek, likes, comments, saved,
    isLiked, isSaved, onLike, onComment, onSave, onComposeComment, onMore,
}: VideoControlsProps) {
    const ink = docked ? dark ? '#E4ECF9' : '#182334' : '#FFFFFF';
    const secondaryInk = docked ? dark ? '#A2AEC1' : '#64748A' : '#D2D4DB';
    const accent = dark ? '#B5D3FA' : '#4A73A7';
    const textColor = { color: ink };
    const secondaryColor = { color: secondaryInk };
    const [expanded, setExpanded] = useState(false);
    const [hasLongCaption, setHasLongCaption] = useState(false);
    const [seekTime, setSeekTime] = useState<number | null>(null);
    const caption = hashtag ? `${title} #${hashtag}` : title;
    const displayTime = Math.min(seekTime ?? currentTime, duration);
    const progress = duration > 0 ? displayTime / duration : 0;

    return (
        <View pointerEvents="box-none" style={[styles.container, docked && styles.dockedContainer]}>
            <View pointerEvents="box-none">
                {!docked && <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.82)']}
                    locations={[0, 0.55, 1]}
                    style={styles.scrim}
                    pointerEvents="none"
                />}
                <View pointerEvents="box-none" style={[styles.details, docked && styles.dockedDetails]}>
                    {companion}
                    {attribution}
                    <Pressable
                        accessibilityRole={hasLongCaption ? 'button' : undefined}
                        accessibilityState={hasLongCaption ? { expanded } : undefined}
                        onPress={hasLongCaption ? () => setExpanded(!expanded) : undefined}
                    >
                        <Text
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            onTextLayout={({ nativeEvent }) => setHasLongCaption(nativeEvent.lines.length > 2)}
                            style={[styles.caption, textColor, styles.measureCaption]}
                        >{caption}</Text>
                        <Text numberOfLines={expanded ? 5 : 2} style={[styles.caption, textColor]}>{caption}</Text>
                        {hasLongCaption && <Text style={[styles.captionToggle, secondaryColor]}>{expanded ? 'less' : 'more'}</Text>}
                    </Pressable>

                    <View style={styles.actions}>
                        <Pressable accessibilityRole="button" accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
                            accessibilityState={{ selected: isLiked }} style={styles.action} onPress={onLike}>
                            <Text style={[styles.star, textColor, isLiked && { color: accent }]}>✦</Text>
                            <Text style={[styles.actionLabel, secondaryColor]}>Like</Text>
                            <Text style={[styles.count, textColor]}>{countFormat.format(likes)}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel="Comments" style={styles.action} onPress={onComment}>
                            <Ionicons name="chatbubble" size={23} color={ink} />
                            <Text style={[styles.actionLabel, secondaryColor]}>Comment</Text>
                            <Text style={[styles.count, textColor]}>{countFormat.format(comments)}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
                            accessibilityState={{ selected: isSaved }} style={styles.action} onPress={onSave}>
                            <Ionicons name="bookmark" size={23} color={isSaved ? accent : ink} />
                            <Text style={[styles.actionLabel, secondaryColor]}>Save</Text>
                            <Text style={[styles.count, textColor]}>{countFormat.format(saved)}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel="More options" style={styles.action} onPress={onMore}>
                            <Ionicons name="ellipsis-horizontal" size={23} color={ink} />
                            <Text style={[styles.actionLabel, secondaryColor]}>More</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel="Add a comment" onPress={onComposeComment} style={[styles.commentBar, docked && { borderWidth: 0, backgroundColor: dark ? "#202C3E" : "#EDF2F8" }]}>
                            <Text numberOfLines={1} style={[styles.placeholder, secondaryColor]}>Add a comment…</Text>
                            <View style={styles.sendIcon}>
                                <Ionicons name="arrow-up" size={15} color="#101521" />
                            </View>
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={[styles.progressBar, { paddingBottom: bottomPadding }, docked && { backgroundColor: "transparent" }]}>
                <View style={[styles.scrubber, docked && styles.dockedScrubber]}>
                    <View style={styles.sliderArea}>
                        <View pointerEvents="none" style={[styles.track, docked && { backgroundColor: dark ? "#2F3C50" : "#DFE7F1" }]}>
                            <View style={[styles.trackFill, { width: `${progress * 100}%` }, docked && { backgroundColor: accent }]} />
                        </View>
                        <Slider
                            accessibilityLabel="Video position"
                            style={styles.slider}
                            disabled={duration <= 0}
                            minimumValue={0}
                            maximumValue={duration || 1}
                            value={Math.min(currentTime, duration)}
                            minimumTrackTintColor="transparent"
                            maximumTrackTintColor="transparent"
                            thumbTintColor={docked ? accent : "transparent"}
                            tapToSeek
                            onSlidingStart={setSeekTime}
                            onValueChange={setSeekTime}
                            onSlidingComplete={(value) => {
                                onSeek(value);
                                setSeekTime(null);
                            }}
                        />
                    </View>
                    <Text style={[styles.time, docked && styles.dockedTime, textColor]}>{formatTime(displayTime)}{docked ? ` / ${formatTime(duration)}` : ""}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    dockedContainer: { position: 'relative', flexShrink: 0, paddingTop: 8 },
    dockedDetails: { maxWidth: 720 },
    dockedScrubber: { maxWidth: 720 },
    dockedTime: { fontFamily: 'Inter_500Medium', fontSize: 11 },
    scrim: { position: 'absolute', top: -52, left: 0, right: 0, bottom: 0 },
    details: { paddingHorizontal: 14, paddingBottom: 4, gap: 9, width: '100%', maxWidth: 560, alignSelf: 'center' },
    caption: { color: '#FFF', fontSize: 15, lineHeight: 20, fontFamily: theme.typography.fontFamilies.medium },
    measureCaption: { position: 'absolute', left: 0, right: 0, opacity: 0 },
    captionToggle: { color: '#D9DBE1', fontSize: 12, marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    action: { flexBasis: '12%', flexGrow: 0, minWidth: 40, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 2 },
    star: { color: '#FFF', fontSize: 24, lineHeight: 23, includeFontPadding: false },
    selected: { color: '#D9E4FF' },
    actionLabel: { color: '#FFF', fontSize: 9, fontFamily: theme.typography.fontFamilies.medium },
    count: { color: '#FFF', fontSize: 11, lineHeight: 13, fontFamily: theme.typography.fontFamilies.bold },
    commentBar: {
        flex: 1, minWidth: 0, minHeight: 40, borderRadius: 22, marginLeft: 4, paddingLeft: 9, paddingRight: 5,
        flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.19)', backgroundColor: 'rgba(255,255,255,0.12)',
    },
    placeholder: { flex: 1, minWidth: 0, color: '#D2D4DB', fontSize: 12 },
    sendIcon: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#DCE8FF', alignItems: 'center', justifyContent: 'center' },
    progressBar: { backgroundColor: '#000' },
    scrubber: {
        flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 43,
        paddingHorizontal: 14, width: '100%', maxWidth: 560, alignSelf: 'center',
    },
    sliderArea: { flex: 1, height: 43, justifyContent: 'center' },
    slider: { ...StyleSheet.absoluteFill },
    track: { height: 4, borderRadius: 2, backgroundColor: '#303236', overflow: 'hidden' },
    trackFill: { height: '100%', borderRadius: 2, backgroundColor: '#E3EEFF' },
    time: { color: '#FFF', fontSize: 15, fontVariant: ['tabular-nums'], fontFamily: 'Orbitron_500Medium' },
});
