/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Stack, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../components/UI/SafeAreaView';
import { usePalette } from '../design-system/palette';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/supabase/hooks/useAuth';

type Clip = {
    id: string; title: string; starts: number; avg_ratio: number; complete: number;
    quick_exits: number; likes: number; saves: number; comments: number;
};
type Studio = {
    published: number; uniqueViewers: number; feedExposures: number;
    watchMs: number; completionRate: number | null;
    sources: Partial<Record<'feed' | 'profile' | 'other', number>>;
    daily: { date: string; viewers: number; feedExposures: number }[];
    videos: Clip[]; retention: number[];
};

const formatNumber = new Intl.NumberFormat().format;
const percent = (rate: number | null) => rate === null ? '—' : String(Math.round(100 * rate)) + '%';
function watchTime(ms: number) {
    const seconds = Math.round(ms / 1000);
    if (seconds >= 3600) return Math.floor(seconds / 3600) + 'h ' + Math.floor(seconds / 60) % 60 + 'm';
    if (seconds >= 60) return Math.floor(seconds / 60) + 'm ' + seconds % 60 + 's';
    return seconds + 's';
}
const formatDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

function Panel({ title, children }: React.PropsWithChildren<{ title: string }>) {
    const p = usePalette();
    return <View style={[styles.panel, { backgroundColor: p.card, borderColor: p.border }]}>
        <Text accessibilityRole="header" style={{ color: p.text, fontSize: 19, fontFamily: p.fonts.semibold }}>{title}</Text>
        {children}
    </View>;
}

function Hint({ children }: React.PropsWithChildren) {
    const p = usePalette();
    return <Text style={{ color: p.sub, fontSize: 13, lineHeight: 19, fontFamily: p.fonts.regular }}>{children}</Text>;
}

function Metrics({ values }: { values: [string, string][] }) {
    const p = usePalette();
    return <View style={styles.metrics}>{values.map(([label, value]) => (
        <View key={label} style={[styles.metric, { backgroundColor: p.card, borderColor: p.border }]}>
            <Text style={{ color: p.sub, fontSize: 12, fontFamily: p.fonts.medium }}>{label}</Text>
            <Text style={{ color: p.text, fontSize: 29, fontFamily: p.fonts.semibold }}>{value}</Text>
        </View>
    ))}</View>;
}

function Bars({ values, labels, share = false }: { values: number[]; labels: string[]; share?: boolean }) {
    const p = usePalette();
    const [picked, setPicked] = useState<number>();
    const selected = Math.min(picked ?? values.length - 1, values.length - 1);
    const max = share ? 1 : Math.max(1, ...values);
    const format = share ? percent : formatNumber;
    const ice = p.isDark ? '#AEC7F4' : '#41699A';
    return <>
        <View style={styles.bars}>
            {values.map((value, index) => (
                <Pressable key={index} accessibilityRole="button" accessibilityLabel={labels[index] + ', ' + format(value)}
                    accessibilityState={{ selected: selected === index }} onPress={() => setPicked(index)} style={styles.barButton}>
                    <View style={{
                        height: Math.max(2, Math.round(105 * value / max)),
                        width: '100%', maxWidth: 30, borderRadius: 4,
                        backgroundColor: selected === index ? ice : p.soft,
                    }} />
                </Pressable>
            ))}
        </View>
        <View style={styles.row}>
            <Hint>{labels[0]}</Hint>
            {selected >= 0 && <Text style={{ color: p.text, fontFamily: p.fonts.semibold, fontSize: 12 }}>
                {labels[selected]} · {format(values[selected])}
            </Text>}
            <Hint>{labels[labels.length - 1]}</Hint>
        </View>
    </>;
}

function nextTake(clip: Clip, retention: number[]) {
    if (clip.starts < 20) return 'Compare your retention once 20 different viewers have watched this clip.';
    if (clip.quick_exits / clip.starts >= 0.40) {
        return 'Many viewers leave in the opening seconds. Try putting your strongest example or question in the first frame.';
    }
    let drop = 0;
    let largest = 0;
    for (let i = 1; i < retention.length - 1; i++) {
        const change = retention[i - 1] - retention[i];
        if (change > largest) { largest = change; drop = i; }
    }
    if (largest / clip.starts >= 0.15) {
        return 'The largest drop appears around ' + drop * 5 + '–' + (drop + 1) * 5 +
            '% of the clip. Review that transition and try moving the next example earlier.';
    }
    return 'Try a follow-up that shows a different example or answers a common question.';
}

export default function CreatorStudioScreen() {
    const router = useRouter();
    const p = usePalette();
    const { user, loading: authLoading } = useAuth();
    const focused = useIsFocused();
    const { video } = useLocalSearchParams<{ video?: string }>();
    const selectedId = typeof video === 'string' ? video : undefined;
    const [days, setDays] = useState<7 | 28>(7);
    const [retry, setRetry] = useState(0);
    const [chart, setChart] = useState<'viewers' | 'feedExposures'>('viewers');
    const [result, setResult] = useState<{ key: string; data?: Studio; error?: string }>();
    const viewerId = user?.is_anonymous ? undefined : user?.id;
    const requestKey = [viewerId, days, selectedId, retry].join(':');
    const current = result?.key === requestKey ? result : undefined;
    const data = current?.data;

    useEffect(() => {
        if (!focused || !viewerId) return;
        const controller = new AbortController();
        (async () => {
            try {
                if (!supabase) throw new Error();
                const response = await supabase.rpc('creator_video_studio', { p_days: days, p_video: selectedId ?? null })
                    .abortSignal(controller.signal);
                if (controller.signal.aborted) return;
                if (response.error) throw response.error;
                setResult(response.data
                    ? { key: requestKey, data: response.data as Studio }
                    : { key: requestKey, error: 'This clip is unavailable in your studio.' });
            } catch {
                if (!controller.signal.aborted) setResult({ key: requestKey, error: 'Analytics could not load.' });
            }
        })();
        return () => controller.abort();
    }, [days, selectedId, requestKey, focused, viewerId]);

    const clip = selectedId ? data?.videos[0] : undefined;
    const create = () => router.push('/(tabs)/create');
    const ice = p.isDark ? '#AEC7F4' : '#41699A';
    const traffic = [
        ['Feed', data?.sources.feed ?? 0],
        ['Profiles', data?.sources.profile ?? 0],
        ['Other in-app screens', data?.sources.other ?? 0],
    ] as const;
    const action = (label: string, onPress: () => void) => (
        <Pressable accessibilityRole="button" onPress={onPress} style={[styles.action, { backgroundColor: p.accent }]}>
            <Text style={{ color: p.onAccent, fontFamily: p.fonts.semibold }}>{label}</Text>
        </Pressable>
    );

    return <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: p.bg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.nav, { borderColor: p.border }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back"
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.back}>
                <Feather name="arrow-left" size={22} color={p.text} />
            </Pressable>
            <Text style={{ color: p.text, fontFamily: p.fonts.semibold }}>Creator Studio</Text>
            <View style={styles.back} />
        </View>
        <ScrollView key={selectedId ?? 'studio'} contentContainerStyle={styles.content}>
            <View style={styles.row}>
                <Text accessibilityRole="header" style={[styles.title, { color: p.text, fontFamily: p.fonts.bold }]}>
                    {clip?.title || (selectedId ? 'Video insights' : 'Video analytics')}
                </Text>
                {!selectedId && !!viewerId && action('Upload a clip', create)}
            </View>
            {authLoading ? <ActivityIndicator color={ice} />
                : !viewerId ? <Panel title="Sign in to see your analytics">{action('Sign in', () => router.push('/auth/login'))}</Panel>
                : <>
                    <View style={styles.period}>
                        {([7, 28] as const).map(value => (
                            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: days === value }}
                                onPress={() => setDays(value)} style={[styles.segment, { backgroundColor: days === value ? p.cardHigh : p.card, borderColor: p.border }]}>
                                <Text style={{ color: p.text, fontFamily: p.fonts.medium }}>{value} days</Text>
                            </Pressable>
                        ))}
                    </View>
                    {!current ? <ActivityIndicator accessibilityLabel="Loading video analytics" color={ice} />
                        : current.error ? <Panel title={current.error}>{action('Retry', () => setRetry(n => n + 1))}</Panel>
                        : data && <>
                            <Metrics values={[
                                ['Unique viewers', formatNumber(data.uniqueViewers)],
                                ['Feed exposures', formatNumber(data.feedExposures)],
                                ['Watch time', watchTime(data.watchMs)],
                                ['Completion', percent(data.completionRate)],
                            ]} />
                            {data.published === 0 ? <Panel title="Publish your first clip">
                                <Hint>For you reserves space for new clips. Your results will appear here after viewers watch.</Hint>
                            </Panel> : <>
                                <Panel title="Audience over time">
                                    <Pressable accessibilityRole="button" onPress={() => setChart(chart === 'viewers' ? 'feedExposures' : 'viewers')}
                                        style={[styles.segment, { alignSelf: 'flex-start', borderColor: p.border }]}>
                                        <Text style={{ color: ice, fontFamily: p.fonts.semibold }}>{chart === 'viewers' ? 'Viewers' : 'Feed exposures'} ↕</Text>
                                    </Pressable>
                                    <Bars key={days + ':' + chart} values={data.daily.map(day => day[chart])}
                                        labels={data.daily.map(day => formatDate.format(new Date(day.date + 'T00:00:00Z')))} />
                                </Panel>
                                <Panel title="Where viewers came from">
                                    {traffic.map(([label, count]) => <View key={label} style={styles.row}>
                                        <Hint>{label}</Hint><Text style={{ color: p.text, fontFamily: p.fonts.semibold }}>{formatNumber(count)}</Text>
                                    </View>)}
                                    <Hint>A viewer can appear in more than one source.</Hint>
                                </Panel>
                                {clip ? <>
                                    <Panel title="Audience retention">
                                        <Hint>{formatNumber(clip.starts)} viewers with recorded watch time. Tap a bar to see the share that watched that part.</Hint>
                                        {clip.starts > 0 && <Bars key={clip.id + ':' + days} share values={data.retention.map(n => n / clip.starts)}
                                            labels={data.retention.map((_, i) => (i * 5) + '–' + ((i + 1) * 5) + '%')} />}
                                    </Panel>
                                    <Metrics values={[
                                        ['Average clip covered', percent(clip.starts ? clip.avg_ratio : null)],
                                        ['Early exits', percent(clip.starts ? clip.quick_exits / clip.starts : null)],
                                        ['Likes', formatNumber(clip.likes)], ['Saves', formatNumber(clip.saves)], ['Comments', formatNumber(clip.comments)],
                                    ]} />
                                    <Panel title="What to try next"><Hint>{nextTake(clip, data.retention)}</Hint></Panel>
                                </> : <Panel title="Recent clips">
                                    {data.videos.map(item => <Pressable key={item.id} accessibilityRole="button"
                                        accessibilityLabel={'View analytics for ' + (item.title || 'Untitled video')}
                                        onPress={() => router.push({ pathname: '/creator-studio', params: { video: item.id } })}
                                        style={[styles.clip, { borderColor: p.border }]}>
                                        <View style={{ flex: 1, gap: 4 }}>
                                            <Text numberOfLines={1} style={{ color: p.text, fontFamily: p.fonts.semibold }}>{item.title || 'Untitled video'}</Text>
                                            <Hint>{formatNumber(item.starts)} viewers · {percent(item.starts ? item.complete / item.starts : null)} completed</Hint>
                                        </View>
                                        <Feather name="chevron-right" size={19} color={p.sub} />
                                    </Pressable>)}
                                </Panel>}
                            </>}
                            <Hint>Watch metrics cover signed-in viewers in supported Datariot players. Feed exposures count once per viewer, clip and day. Watch time counts the longest measured play per viewer, clip and day. Playback data accrues from launch.</Hint>
                        </>}
                </>}
        </ScrollView>
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8 },
    back: { alignItems: 'center', justifyContent: 'center', height: 52, width: 48 },
    content: { width: '100%', maxWidth: 930, alignSelf: 'center', padding: 20, paddingBottom: 60, gap: 18 },
    title: { flexShrink: 1, fontSize: 32, lineHeight: 38, letterSpacing: -0.7 },
    action: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingHorizontal: 14, borderRadius: 12 },
    period: { flexDirection: 'row', gap: 8 },
    segment: { alignItems: 'center', justifyContent: 'center', minHeight: 42, paddingHorizontal: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    panel: { padding: 16, borderWidth: 1, borderRadius: 17, gap: 12 },
    metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metric: { flexGrow: 1, flexBasis: '46%', padding: 15, borderWidth: 1, borderRadius: 14, gap: 4 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
    bars: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', marginTop: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#748197' },
    barButton: { flex: 1, height: 109, justifyContent: 'flex-end', alignItems: 'center' },
    clip: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
