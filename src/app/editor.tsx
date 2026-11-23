/** @jsxImportSource react */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from '../components/UI/SafeAreaView';
import { ClipTimeline } from '../components/Editor/ClipTimeline';
import { ClipEdge, ClipRange, clamp, formatClipTime } from '../lib/editor/timeline';
import { usePalette } from '../design-system/palette';

export default function EditorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const videoUri = typeof params.videoUri === 'string' ? params.videoUri : '';
    const p = usePalette();
    const { width, height } = useWindowDimensions();
    const wide = Platform.OS === 'web' && width >= 1000;
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [range, setRange] = useState<ClipRange>({ start: 0, end: 0 });
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [error, setError] = useState('');
    const [aspect, setAspect] = useState(16 / 9);
    const rangeRef = useRef(range);
    const durationRef = useRef(0);
    const dragging = useRef(false);
    const resumeAfterDrag = useRef(false);
    const player = useVideoPlayer(videoUri || null, value => {
        value.timeUpdateEventInterval = 0.05;
        value.muted = false;
        value.loop = false;
    });
    const initialize = (seconds: number) => {
        const ms = Math.round(seconds * 1000);
        if (!Number.isFinite(ms) || ms <= 0) return;
        setError('');
        if (durationRef.current !== ms) {
            const full = { start: 0, end: ms };
            durationRef.current = ms; rangeRef.current = full;
            setDuration(ms); setRange(full); setPosition(0);
        }
    };
    useEffect(() => {
        durationRef.current = 0;
        rangeRef.current = { start: 0, end: 0 };
        setDuration(0); setRange(rangeRef.current); setPosition(0);
        dragging.current = false; resumeAfterDrag.current = false;
        if (player.status === 'readyToPlay') initialize(player.duration);
    }, [videoUri, player]);
    useEventListener(player, 'statusChange', ({ status }) => {
        if (status === 'readyToPlay') initialize(player.duration);
        if (status === 'error') setError('This video could not be opened. Select the original file again.');
    });
    useEventListener(player, 'sourceLoad', ({ duration: seconds, availableVideoTracks }) => {
        initialize(seconds);
        const size = availableVideoTracks[0]?.size;
        if (size?.width > 0 && size?.height > 0) setAspect(size.width / size.height);
    });
    useEventListener(player, 'playingChange', ({ isPlaying }) => setPlaying(isPlaying));
    useEventListener(player, 'timeUpdate', ({ currentTime }) => {
        if (dragging.current) return;
        const selected = rangeRef.current;
        const time = currentTime * 1000;
        if (player.playing && selected.end > selected.start && (time >= selected.end || time < selected.start - 60)) {
            player.currentTime = selected.start / 1000;
            setPosition(selected.start);
        } else setPosition(time);
    });
    useEventListener(player, 'playToEnd', () => {
        if (!dragging.current && rangeRef.current.end > rangeRef.current.start) {
            player.currentTime = rangeRef.current.start / 1000;
            player.play();
        }
    });
    const ready = duration > 0 && !error && !!videoUri;
    const seek = (ms: number) => {
        if (!durationRef.current) return;
        const value = clamp(ms, 0, durationRef.current);
        player.currentTime = value / 1000; setPosition(value);
    };
    const startDrag = () => {
        resumeAfterDrag.current = player.playing;
        dragging.current = true; player.pause();
    };
    const finishDrag = () => {
        dragging.current = false;
        if (resumeAfterDrag.current) {
            const r = rangeRef.current;
            if (player.currentTime * 1000 >= r.end - 100 || player.currentTime * 1000 < r.start) seek(r.start);
            player.play();
        }
        resumeAfterDrag.current = false;
    };
    const changeRange = (next: ClipRange, edge: ClipEdge) => {
        rangeRef.current = next; setRange(next);
        seek(edge === 'start' ? next.start : Math.max(next.start, next.end - 100));
    };
    const togglePlay = () => {
        if (!ready) return;
        if (player.playing) player.pause();
        else {
            if (position < range.start || position >= range.end - 50) seek(range.start);
            player.play();
        }
    };
    const reset = () => {
        if (!ready) return;
        player.pause();
        const full = { start: 0, end: duration };
        rangeRef.current = full; setRange(full); seek(0);
    };
    const next = () => {
        if (!ready || dragging.current || range.end <= range.start) return;
        player.pause();
        const extra: Record<string, string> = {};
        for (const key of ['category', 'debateId', 'side', 'thesis']) if (typeof params[key] === 'string') extra[key] = params[key];
        router.push({ pathname: '/publish', params: { ...extra, videoUri, trimStart: Math.round(range.start), trimEnd: Math.round(range.end) } });
    };
    const font = { fontFamily: p.fonts.regular, color: p.text };
    const bold = { fontFamily: p.fonts.semibold, color: p.text };
    const previewHeight = Math.min(wide ? 390 : 440, Math.max(210, height * (wide ? .45 : .4)));
    return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
            <View style={s.shell}>
                <View style={s.header}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Back to upload" onPress={() => { player.pause(); router.back(); }} style={s.back}><Feather name="arrow-left" size={19} color={p.text} /><Text style={[font, s.small]}>Create studio</Text></Pressable>
                    <Text style={[font, s.eyebrow, { color: p.faint }]}>VIDEO EDITOR</Text>
                    <Pressable accessibilityRole="button" disabled={!ready} accessibilityState={{ disabled: !ready }} onPress={next} style={[s.next, { opacity: ready ? 1 : .45 }]}><Text style={[bold, { color: '#23354F', fontSize: 13 }]}>Continue</Text><Feather name="arrow-right" size={16} color="#23354F" /></Pressable>
                </View>
                <View style={s.intro}><Text accessibilityRole="header" style={[bold, s.title, { fontFamily: p.fonts.bold, fontSize: wide ? 39 : 31 }]}>Find the good part.</Text><Text style={[font, s.subtitle, { color: p.sub }]}>Set your preview range. Give every second a reason to be here.</Text></View>
                <View style={[s.workspace, !wide && { flexDirection: 'column' }]}>
                    <View style={[s.editor, { backgroundColor: p.card }]}>
                        <View style={[s.preview, { height: previewHeight, backgroundColor: p.isDark ? '#172131' : '#EDF2FA' }]}>
                            <VideoView player={player} style={[s.video, { backgroundColor: p.isDark ? '#172131' : '#EDF2FA' }]} contentFit="contain" nativeControls={false} />
                            {!ready && <View style={[s.loading, { backgroundColor: p.isDark ? '#172131' : '#EDF2FA' }]}>{error || !videoUri ? <><Feather name="video-off" size={28} color={p.sub} /><Text style={[font, s.small, { color: p.sub, textAlign: 'center' }]}>{error || 'Choose a video to start editing.'}</Text><Pressable accessibilityRole="button" onPress={() => router.back()} style={s.next}><Text style={[bold, { color: '#23354F' }]}>Choose another video</Text></Pressable></> : <><ActivityIndicator color={p.sub} /><Text style={[font, s.small, { color: p.sub }]}>Opening your video…</Text></>}</View>}
                            {ready && <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause preview' : 'Play preview'} onPress={togglePlay} style={s.videoTap}>{!playing && <View style={s.bigPlay}><Feather name="play" size={27} color="#263A58" /></View>}</Pressable>}
                            <View pointerEvents="none" style={s.previewBadge}><Feather name="maximize" size={11} color="#304564" /><Text style={[font, { color: '#304564', fontSize: 10 }]}>Full frame</Text></View>
                        </View>
                        <View style={s.controls}>
                            <View style={s.transport}>
                                <View style={s.transportButtons}>
                                    <Pressable accessibilityRole="button" accessibilityLabel="Jump to selected start" disabled={!ready} onPress={() => seek(range.start)} style={s.iconButton}><Feather name="skip-back" size={17} color={p.text} /></Pressable>
                                    <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play selected range'} disabled={!ready} onPress={togglePlay} style={[s.iconButton, { backgroundColor: p.soft }]}><Feather name={playing ? 'pause' : 'play'} size={18} color={p.text} /></Pressable>
                                    <Text style={[bold, s.time]}>{formatClipTime(position, true)}<Text style={{ color: p.faint }}> / {formatClipTime(duration, true)}</Text></Text>
                                </View>
                                <Pressable accessibilityRole="button" accessibilityLabel={muted ? 'Unmute preview' : 'Mute preview'} disabled={!ready} onPress={() => { player.muted = !muted; setMuted(!muted); }} style={s.iconButton}><Feather name={muted ? 'volume-x' : 'volume-2'} size={18} color={p.sub} /></Pressable>
                            </View>
                            <Slider accessibilityLabel="Video playback position" disabled={!ready} minimumValue={0} maximumValue={Math.max(duration, 1)} value={position} step={50}
                                onSlidingStart={startDrag} onValueChange={seek} onSlidingComplete={value => { seek(value); finishDrag(); }}
                                minimumTrackTintColor="#AFC5EC" maximumTrackTintColor={p.isDark ? '#34415A' : '#E2E8F2'} thumbTintColor="#A8BFE7" style={s.seek} />
                            <View style={[s.trimHeader, { borderColor: p.border }]}><View><Text style={[bold, { fontSize: 16 }]}>Choose your preview range</Text><Text style={[font, s.hint, { color: p.sub }]}>Drag either handle. Fine-tune below in 0.1s steps.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Reset selected range" disabled={!ready} onPress={reset} style={s.reset}><Feather name="rotate-ccw" size={13} color={p.sub} /><Text style={[font, s.small, { color: p.sub }]}>Reset</Text></Pressable></View>
                            <ClipTimeline duration={duration} position={position} range={range} disabled={!ready} onChange={changeRange} onDragStart={startDrag} onDragEnd={finishDrag} />
                            <View style={s.selectionSummary}><View style={s.dot} /><Text style={[font, s.hint, { color: p.sub }]}>{formatClipTime(range.end - range.start, true)} selected · Preview loops this section</Text></View>
                        </View>
                    </View>
                    {wide && <View style={s.sidebar}>
                        <View style={[s.sideCard, { backgroundColor: p.isDark ? '#1B263A' : '#E9F0FC' }]}><View style={s.sideIcon}><Feather name="scissors" size={22} color="#344F78" /></View><Text style={[bold, s.sideTitle]}>A stronger beginning.{'\n'}A cleaner ending.</Text><Text style={[font, s.sideText, { color: p.sub }]}>Play your clip, move the range handles, then replay the section you picked.</Text><View style={[s.sideRule, { backgroundColor: p.border }]} /><Text style={[font, s.eyebrow, { color: p.sub }]}>YOUR VIDEO</Text><View style={s.detail}><Text style={[font, { color: p.sub }]}>Original length</Text><Text style={bold}>{formatClipTime(duration, true)}</Text></View><View style={s.detail}><Text style={[font, { color: p.sub }]}>Selected range</Text><Text style={bold}>{formatClipTime(range.end - range.start, true)}</Text></View><View style={s.detail}><Text style={[font, { color: p.sub }]}>Format</Text><Text style={bold}>{aspect < .9 ? 'Portrait' : aspect > 1.1 ? 'Landscape' : 'Square'}</Text></View></View>
                        <View style={s.keyboardNote}><Feather name="move" size={16} color={p.sub} /><Text style={[font, s.hint, { flex: 1, color: p.sub }]}>Keyboard works too. Focus a handle and use arrow keys. Hold Shift for one-second steps.</Text></View>
                    </View>}
                </View>
                <Text style={[font, s.footnote, { color: p.faint }]}>This range controls the preview. The original video file is passed to publishing.</Text>
            </View>
        </ScrollView>
    </SafeAreaView>;
}
const s = StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 }, shell: { width: '100%', maxWidth: 1100, alignSelf: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 20 }, back: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 }, small: { fontSize: 12 }, eyebrow: { fontSize: 9, letterSpacing: 1.8 },
    next: { paddingVertical: 12, paddingHorizontal: 19, borderRadius: 23, backgroundColor: '#D9E4FF', flexDirection: 'row', alignItems: 'center', gap: 10 },
    intro: { paddingTop: 12, paddingBottom: 27 }, title: { lineHeight: 46, letterSpacing: -1.2 }, subtitle: { fontSize: 14, lineHeight: 22, marginTop: 6 },
    workspace: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' }, editor: { flex: 1, minWidth: 0, width: '100%', borderRadius: 22, overflow: 'hidden' },
    preview: { width: '100%', minHeight: 210, position: 'relative' }, video: { width: '100%', height: '100%' }, videoTap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
    bigPlay: { width: 64, height: 64, paddingLeft: 4, borderRadius: 32, backgroundColor: '#E6EEFCED', alignItems: 'center', justifyContent: 'center' },
    previewBadge: { position: 'absolute', left: 16, top: 16, borderRadius: 13, backgroundColor: '#E6EEFCED', paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', gap: 6, alignItems: 'center' },
    loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28, zIndex: 2 },
    controls: { padding: 20 }, transport: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, transportButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 }, iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, time: { fontSize: 13, fontVariant: ['tabular-nums'] },
    seek: { width: '100%', height: 36, marginTop: 7 }, trimHeader: { borderTopWidth: 1, marginTop: 8, paddingTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, hint: { fontSize: 11, lineHeight: 18, marginTop: 3 },
    reset: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 9 }, selectionSummary: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#9EB9E7' },
    sidebar: { width: 268, gap: 20 }, sideCard: { borderRadius: 22, padding: 25 }, sideIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#D9E4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 23 }, sideTitle: { fontSize: 23, lineHeight: 30, letterSpacing: -.5 }, sideText: { fontSize: 13, lineHeight: 22, marginTop: 15 },
    sideRule: { height: 1, marginVertical: 25 }, detail: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 }, keyboardNote: { flexDirection: 'row', gap: 10, paddingHorizontal: 10 }, footnote: { fontSize: 11, lineHeight: 18, marginTop: 17, paddingHorizontal: 4 },
});
