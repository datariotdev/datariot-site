/** @jsxImportSource react */
import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '../../design-system/palette';
import type { Video } from '../../lib/supabase/hooks/useVideos';
import { downloadableVideo, downloadVideo } from '../../lib/utils/videoDownload';

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

interface Props {
    video: Video;
    muted: boolean;
    rate: number;
    onClose: () => void;
    onClearDisplay: () => void;
    onRestart: () => void;
    onToggleMute: () => void;
    onRateChange: (rate: number) => void;
    onComments: () => void;
    onAuthor?: () => void;
    onInsights?: () => void;
    onDeepDive: () => void;
}

export function MoreOptionsModal({
    video, muted, rate, onClose, onClearDisplay, onRestart, onToggleMute, onRateChange, onComments, onAuthor, onDeepDive, onInsights,
}: Props) {
    const p = usePalette();
    const insets = useSafeAreaInsets();
    const ice = p.isDark ? '#263952' : '#E9F1FD';
    const accent = p.isDark ? '#D9E4FF' : '#355983';
    const file = downloadableVideo(video.videoUrl);
    const pending = useRef(false);
    const [downloadState, setDownloadState] = useState<'idle' | 'pending' | 'done' | 'failed'>('idle');

    const download = async () => {
        if (!file || pending.current) return;
        pending.current = true;
        setDownloadState('pending');
        try {
            setDownloadState(await downloadVideo(file, video.title) ? 'done' : 'idle');
        } catch {
            setDownloadState('failed');
        } finally {
            pending.current = false;
        }
    };

    let downloadDetail = Platform.OS === 'web' ? undefined : 'Choose where to save the file';
    if (!file) downloadDetail = 'No downloadable file for this video';
    else if (downloadState === 'failed') downloadDetail = 'Download failed. Tap to try again.';
    else if (downloadState === 'done') downloadDetail = Platform.OS === 'web'
        ? 'Download sent to your browser.'
        : 'Video saved to the selected folder.';

    const actions: {
        icon: React.ComponentProps<typeof Feather>['name']; title: string; detail?: string; onPress: () => void; disabled?: boolean;
    }[] = [
        { icon: 'maximize', title: 'Clear display', detail: 'Watch with the controls hidden', onPress: onClearDisplay },
        {
            icon: 'download',
            title: downloadState === 'pending' ? 'Downloading video…' : 'Download video',
            detail: downloadDetail,
            onPress: download,
            disabled: !file || downloadState === 'pending',
        },
        { icon: 'rotate-ccw', title: 'Restart video', onPress: onRestart },
        { icon: muted ? 'volume-2' : 'volume-x', title: muted ? 'Unmute video' : 'Mute video', onPress: onToggleMute },
        { icon: 'message-circle', title: 'View comments', onPress: onComments },
        ...(onInsights ? [{ icon: 'bar-chart-2' as const, title: 'Video insights', onPress: onInsights }] : []),
        ...(onAuthor ? [{ icon: 'user' as const, title: 'View creator profile', onPress: onAuthor }] : []),
        { icon: 'zap', title: 'Orvelis AI Deep Dive', onPress: onDeepDive },
    ];

    return (
        <View style={styles.overlay} accessibilityViewIsModal>
            <Pressable accessibilityRole="button" accessibilityLabel="Close video options" style={styles.backdrop} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: p.card, paddingBottom: Math.max(insets.bottom, 14) }]}>
                <View style={styles.header}>
                    <View style={styles.heading}>
                        <Text accessibilityRole="header" style={[styles.title, { color: p.text }]}>Video options</Text>
                        <Text numberOfLines={1} style={[styles.detail, { color: p.sub }]}>{video.title}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close options" onPress={onClose} style={styles.close}>
                        <Feather name="x" size={21} color={p.text} />
                    </Pressable>
                </View>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={[styles.speedGroup, { backgroundColor: p.bg }]}>
                        <Text style={[styles.label, { color: p.text }]}>Playback speed</Text>
                        <View style={styles.speeds}>
                            {SPEEDS.map(speed => (
                                <Pressable key={speed} accessibilityRole="button" accessibilityLabel={`${speed} times speed`}
                                    accessibilityState={{ selected: rate === speed }} onPress={() => onRateChange(speed)}
                                    style={[styles.speed, { backgroundColor: rate === speed ? ice : p.card, borderColor: p.border }]}>
                                    <Text style={[styles.detail, { color: rate === speed ? accent : p.sub }]}>{speed}×</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                    {actions.map(item => (
                        <Pressable key={item.icon} accessibilityRole="button" accessibilityState={{ disabled: item.disabled }}
                            disabled={item.disabled} onPress={item.onPress}
                            style={({ pressed }) => [styles.row, {
                                backgroundColor: pressed ? p.bg : p.card,
                                opacity: item.disabled ? 0.65 : 1,
                            }]}>
                            <View style={[styles.icon, { backgroundColor: ice }]}><Feather name={item.icon} size={17} color={accent} /></View>
                            <View style={styles.heading}>
                                <Text style={[styles.label, { color: p.text }]}>{item.title}</Text>
                                {item.detail && <Text accessibilityLiveRegion="polite" style={[styles.detail, { color: p.sub }]}>{item.detail}</Text>}
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFill, zIndex: 300, justifyContent: 'flex-end', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(6, 10, 19, 0.58)' },
    sheet: { width: '100%', maxWidth: 490, flexShrink: 1, maxHeight: '84%', overflow: 'hidden', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
    header: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
    heading: { flex: 1, minWidth: 0, gap: 3 },
    title: { fontFamily: 'Outfit_600SemiBold', fontSize: 23, letterSpacing: -0.4 },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
    detail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
    close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    scroll: { flexGrow: 0, flexShrink: 1, minHeight: 0 },
    content: { paddingHorizontal: 14, paddingBottom: 4, gap: 1 },
    speedGroup: { padding: 9, paddingHorizontal: 11, borderRadius: 11, gap: 7, marginBottom: 4 },
    speeds: { flexDirection: 'row', gap: 4 },
    speed: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 7, borderWidth: 1 },
    row: { flexDirection: 'row', alignItems: 'center', minHeight: 45, paddingHorizontal: 5, gap: 9, borderRadius: 8 },
    icon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
