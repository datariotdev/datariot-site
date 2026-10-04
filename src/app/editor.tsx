import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICE, INK, ON_VIDEO } from '../design-system/ui';
import { Txt } from '../components/core/Txt';
import { IconButton } from '../components/core/IconButton';
import { notify } from '../lib/utils/dialogs';

const clock = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * The look at a clip before it goes up. Trimming happens earlier, in the system
 * picker (it has its own trim bar); what this screen adds is a chance to watch the
 * whole thing, with sound, once.
 */
export default function EditorScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { videoUri, debateId, side } = useLocalSearchParams<{ videoUri?: string; debateId?: string; side?: string }>();

    const player = useVideoPlayer(videoUri || null, p => {
        p.loop = true;
        p.timeUpdateEventInterval = 0.25;
        p.play();
    });

    const [playing, setPlaying] = useState(true);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const barWidth = useRef(1);

    useEventListener(player, 'playingChange', ({ isPlaying }) => setPlaying(isPlaying));
    useEventListener(player, 'timeUpdate', ({ currentTime }) => setPosition(currentTime));
    useEventListener(player, 'statusChange', ({ status }) => {
        if (status === 'readyToPlay' && player.duration > 0) setDuration(player.duration);
    });

    useEffect(() => {
        if (!videoUri) {
            notify('No video', 'Pick or record a video first.');
            router.back();
        }
    }, [videoUri, router]);

    const toggle = () => (playing ? player.pause() : player.play());

    const seek = (x: number) => {
        if (duration <= 0) return;
        const t = Math.max(0, Math.min(1, x / barWidth.current)) * duration;
        player.currentTime = t;
        setPosition(t);
    };

    const next = () => {
        player.pause();
        router.push({
            pathname: '/publish',
            params: {
                videoUri,
                duration: duration > 0 ? String(Math.round(duration)) : '',
                ...(debateId ? { debateId, side } : {}),
            },
        });
    };

    const progress = duration > 0 ? Math.min(1, position / duration) : 0;

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <Pressable onPress={toggle} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'}>
                <VideoView player={player} style={{ flex: 1, width: '100%', height: '100%' }} contentFit="contain" nativeControls={false} />
                {!playing ? (
                    <View style={styles.center} pointerEvents="none">
                        <View style={styles.playDisc}>
                            <Ionicons name="play" size={30} color={ON_VIDEO.text} style={{ marginLeft: 3 }} />
                        </View>
                    </View>
                ) : null}
            </Pressable>

            <View style={[styles.top, { paddingTop: insets.top + 4 }]} pointerEvents="box-none">
                <IconButton variant="glass" name="close" label="Close" onPress={() => router.back()} />
                <Pressable onPress={next} accessibilityRole="button" accessibilityLabel="Next" style={styles.next}>
                    <Txt variant="bodyStrong" style={{ color: INK }}>Next</Txt>
                </Pressable>
            </View>

            <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
                <Pressable
                    onPress={e => seek(e.nativeEvent.locationX)}
                    onLayout={(e: LayoutChangeEvent) => { barWidth.current = e.nativeEvent.layout.width || 1; }}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Seek"
                    style={styles.seek}
                >
                    <View style={styles.track}>
                        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                    </View>
                </Pressable>
                <View style={styles.times}>
                    <Txt variant="caption" tone="onVideoDim">{clock(position)}</Txt>
                    <Txt variant="caption" tone="onVideoDim">{clock(duration)}</Txt>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    playDisc: { width: 76, height: 76, borderRadius: 38, backgroundColor: ON_VIDEO.glassStrong, alignItems: 'center', justifyContent: 'center' },
    top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
    next: { height: 40, paddingHorizontal: 20, borderRadius: 20, backgroundColor: ICE, alignItems: 'center', justifyContent: 'center' },
    bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
    seek: { height: 32, justifyContent: 'center' },
    track: { height: 3, borderRadius: 2, backgroundColor: ON_VIDEO.track, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#FFFFFF' },
    times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
});
