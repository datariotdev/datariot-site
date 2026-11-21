import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';

const COLLAPSED_KEY = '@datariot/platform-notes/activity-hub-v1';
const NOTES: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }[] = [
    { icon: 'planet-outline', title: 'Find your next rabbit hole', body: 'Explore short videos in Feed and Discover. Follow the creators who make you stop and think.' },
    { icon: 'sparkles-outline', title: 'Go beyond the clip', body: 'Ask Orvelis AI for context, an explanation or a different perspective on what you just watched.' },
    { icon: 'chatbubbles-outline', title: 'Keep the conversation going', body: 'Exchange ideas in Arena and Circle, or start a private conversation with another creator.' },
];

function useMotionAllowed() {
    const [reduced, setReduced] = useState(true);
    const [active, setActive] = useState(AppState.currentState !== 'background');
    const [focused, setFocused] = useState(true);
    useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
    useEffect(() => {
        let alive = true;
        void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive) setReduced(value); }).catch(() => {});
        const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
        const app = AppState.addEventListener('change', state => setActive(state === 'active'));
        const media = Platform.OS === 'web' && typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : undefined;
        const update = () => setReduced(media?.matches ?? false);
        if (media) { update(); media.addEventListener?.('change', update); }
        return () => { alive = false; motion.remove(); app.remove(); media?.removeEventListener?.('change', update); };
    }, []);
    return !reduced && active && focused;
}

function SignalSculpture({ animate, compact }: { animate: boolean; compact: boolean }) {
    const [phase] = useState(() => new Animated.Value(0));
    useEffect(() => {
        if (!animate) { phase.setValue(0); return; }
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(phase, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
            Animated.timing(phase, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [animate, phase]);
    return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.art, compact && s.artCompact]}>
        <View style={s.halo} />
        {[0, 1, 2].map(index => <Animated.View key={index} style={[s.orbit, {
            width: 182 - index * 36, height: 182 - index * 36,
            borderColor: index === 1 ? 'rgba(138,175,219,0.6)' : 'rgba(149,177,214,0.32)',
            transform: [{ translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [index * 8, -12 - index * 3] }) },
                { rotate: phase.interpolate({ inputRange: [0, 1], outputRange: [`${-30 + index * 30}deg`, `${-12 + index * 30}deg`] }) },
                { scaleY: 0.7 }],
        }]} />)}
        <Animated.View style={[s.signal, { transform: [{ translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [2, -12] }) }, { rotate: '-16deg' }] }]}>
            <LinearGradient colors={['#F9FDFF', '#DCEAF6', '#ACC6E2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.signalFace}>
                <View style={s.signalInset}><Ionicons name="play" size={30} color="#597795" /></View>
            </LinearGradient>
        </Animated.View>
        <Animated.View style={[s.satellite, { transform: [{ translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [-4, 14] }) }, { rotate: '16deg' }] }]}>
            <Ionicons name="sparkles-outline" size={21} color="#6485A5" />
        </Animated.View>
        <View style={s.dotOne} /><View style={s.dotTwo} />
    </View>;
}

export function PlatformUpdates() {
    const { theme, mode } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const compact = width < 600;
    const dark = mode === 'dark';
    const motion = useMotionAllowed();
    const [collapsed, setCollapsed] = useState(false);
    const [details, setDetails] = useState(false);
    const [ready, setReady] = useState(false);
    const [disclosure] = useState(() => new Animated.Value(0));
    const [detailHeight, setDetailHeight] = useState(0);
    const [heroHeight, setHeroHeight] = useState(310);
    const [expanded] = useState(() => new Animated.Value(1));
    useEffect(() => {
        const animation = Animated.timing(expanded, { toValue: collapsed ? 0 : 1, duration: motion ? 460 : 0, easing: Easing.inOut(Easing.cubic), useNativeDriver: false });
        animation.start();
        return () => animation.stop();
    }, [collapsed, expanded, motion]);
    const changed = useRef(false);
    useEffect(() => {
        let alive = true;
        void AsyncStorage.getItem(COLLAPSED_KEY).then(value => {
            if (alive && !changed.current) setCollapsed(value === '1');
        }).catch(() => {}).finally(() => { if (alive) setReady(true); });
        return () => { alive = false; };
    }, []);
    useEffect(() => {
        const animation = Animated.timing(disclosure, { toValue: details ? 1 : 0, duration: motion ? 420 : 0, easing: Easing.out(Easing.cubic), useNativeDriver: false });
        animation.start();
        return () => animation.stop();
    }, [details, disclosure, motion]);
    const toggleCollapsed = () => {
        const next = !collapsed;
        changed.current = true;
        setCollapsed(next);
        if (next) setDetails(false);
        void AsyncStorage.setItem(COLLAPSED_KEY, next ? '1' : '0').catch(() => {});
    };
    return <View style={[s.card, { backgroundColor: dark ? '#182331' : '#EDF4FA', borderColor: dark ? '#34495F' : '#DCE7F1' }]}>
        {collapsed ? <Pressable accessibilityRole="button" accessibilityLabel="Expand Datariot platform updates" accessibilityState={{ expanded: false }} onPress={toggleCollapsed} style={s.collapsed}>
            <View style={[s.miniMark, { backgroundColor: dark ? '#283C51' : '#DFEBF5' }]}><Ionicons name="sparkles-outline" size={18} color={dark ? '#B9CEE3' : '#52728F'} /></View>
            <View style={{ flex: 1 }}><Text style={[s.collapsedTitle, { color: theme.colors.text.primary }]}>What’s new at Datariot</Text><Text style={[s.collapsedHint, { color: theme.colors.text.secondary }]}>Platform notes & a closer look</Text></View>
            <Ionicons name="chevron-down" size={18} color={theme.colors.text.secondary} />
        </Pressable> : null}
        <Animated.View style={{ height: Animated.multiply(expanded, Animated.add(heroHeight + 42, Animated.multiply(disclosure, detailHeight))), opacity: expanded, overflow: 'hidden' }} accessibilityElementsHidden={collapsed} importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'} {...(Platform.OS === 'web' && collapsed ? { inert: true } : {})}>
          <View style={s.bodyMeasure}>
            <View onLayout={event => setHeroHeight(event.nativeEvent.layout.height)} style={[s.hero, compact && s.heroCompact]}>
                <LinearGradient pointerEvents="none" colors={dark ? ['#1C3042', '#182331'] : ['#F4F9FD', '#E5EFF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <SignalSculpture animate={motion && ready && !collapsed} compact={compact} />
                <View style={[s.copy, compact && s.copyCompact]}>
                    <View style={s.eyebrowRow}><View style={s.statusDot} /><Text style={[s.eyebrow, { color: dark ? '#AFC6DD' : '#58738D' }]}>DATARIOT / WHAT’S NEW</Text></View>
                    <Text style={[s.heroTitle, compact && s.heroTitleCompact, { color: theme.colors.text.primary }]}>Stay curious.{'\n'}Stay connected.</Text>
                    <Text style={[s.heroBody, { color: theme.colors.text.secondary }]}>Your people, fresh ideas and{compact ? '\n' : ' '}everything happening at Datariot.</Text>
                    <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} accessibilityLabel={details ? 'Hide platform details' : 'Show platform details'} onPress={() => setDetails(value => !value)}
                        style={({ pressed }) => [s.detailsButton, { backgroundColor: dark ? '#38536B' : '#23394D', opacity: pressed ? 0.8 : 1 }]}>
                        <Text style={s.detailsLabel}>{details ? 'Less detail' : 'Details'}</Text><Ionicons name={details ? 'arrow-up' : 'arrow-forward'} size={16} color="#F4F9FE" />
                    </Pressable>
                </View>
            </View>
            <Animated.View style={{ height: disclosure.interpolate({ inputRange: [0, 1], outputRange: [0, detailHeight] }), opacity: disclosure, overflow: 'hidden' }}>
                <View style={s.detailsMeasure} onLayout={event => setDetailHeight(event.nativeEvent.layout.height)} accessibilityElementsHidden={!details} importantForAccessibility={details ? 'auto' : 'no-hide-descendants'}
                    {...(Platform.OS === 'web' && !details ? { inert: true } : {})}>
                    <View style={[s.detailsContent, { borderTopColor: dark ? '#34495F' : '#DCE7F1' }]}>
                        <Text style={[s.detailHeading, { color: theme.colors.text.primary }]}>More than the next swipe.</Text>
                        <Text style={[s.detailIntro, { color: theme.colors.text.secondary }]}>Datariot brings short videos, thoughtful conversations and Orvelis AI together. Here’s where to start.</Text>
                        {NOTES.map(note => <View key={note.title} style={s.note}>
                            <View style={[s.noteIcon, { backgroundColor: dark ? '#283C51' : '#DFEAF4' }]}><Ionicons name={note.icon} size={20} color={dark ? '#B9CEE3' : '#52728F'} /></View>
                            <View style={{ flex: 1 }}><Text style={[s.noteTitle, { color: theme.colors.text.primary }]}>{note.title}</Text><Text style={[s.noteBody, { color: theme.colors.text.secondary }]}>{note.body}</Text></View>
                        </View>)}
                        <View style={[s.releaseNote, { backgroundColor: dark ? '#223447' : '#E0EBF5' }]}>
                            <Text style={[s.noteTitle, { color: theme.colors.text.primary }]}>New here: your activity hub</Text>
                            <Text style={[s.noteBody, { color: theme.colors.text.secondary }]}>Platform notes now live at the top. Discover real uploads from the community below, with your personal notifications in their own space.</Text>
                        </View>
                        <Pressable accessibilityRole="button" onPress={() => router.push('/discover')} style={s.discoverLink}>
                            <Text style={[s.noteTitle, { color: theme.colors.text.primary }]}>Find something worth watching</Text><Ionicons name="arrow-forward" size={18} color={theme.colors.text.primary} />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
            <Pressable accessibilityRole="button" accessibilityLabel="Collapse platform updates" accessibilityState={{ expanded: true }} onPress={toggleCollapsed} style={[s.collapseButton, { borderTopColor: dark ? '#34495F' : '#DCE7F1' }]}>
                <Text style={[s.collapseLabel, { color: theme.colors.text.secondary }]}>Collapse update</Text><Ionicons name="chevron-up" size={14} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
        </Animated.View>
    </View>;
}

const s = StyleSheet.create({
    bodyMeasure: { position: 'absolute', top: 0, left: 0, right: 0 },
    card: { borderWidth: 1, borderRadius: 26, overflow: 'hidden', marginBottom: 30 },
    hero: { minHeight: 264, overflow: 'hidden' }, heroCompact: { minHeight: 270 },
    copy: { padding: 30, width: '71%', zIndex: 1 }, copyCompact: { padding: 22, width: '83%' },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, statusDot: { height: 5, width: 5, borderRadius: 3, backgroundColor: '#7396BA' },
    eyebrow: { fontSize: 10, letterSpacing: 1.65, fontWeight: '700' },
    heroTitle: { fontSize: 37, lineHeight: 40, letterSpacing: -1.5, fontWeight: '700', marginTop: 20 }, heroTitleCompact: { fontSize: 30, lineHeight: 34, letterSpacing: -1.1 },
    heroBody: { fontSize: 13, lineHeight: 20, marginTop: 12, maxWidth: 300 },
    detailsButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, minHeight: 42, borderRadius: 13, marginTop: 20 },
    detailsLabel: { fontSize: 12, fontWeight: '700', color: '#F4F9FE' },
    art: { position: 'absolute', width: 240, height: 240, right: -6, top: 24, alignItems: 'center', justifyContent: 'center' },
    artCompact: { right: -104, top: 34, opacity: 0.65 },
    halo: { width: 214, height: 214, borderRadius: 107, backgroundColor: 'rgba(164,193,220,0.12)', position: 'absolute' },
    orbit: { position: 'absolute', borderWidth: 1, borderRadius: 42 },
    signal: { width: 104, height: 126, borderRadius: 27, shadowColor: '#486D91', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 6, height: 16 }, elevation: 7 },
    signalFace: { flex: 1, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
    signalInset: { width: 57, height: 57, borderRadius: 19, borderWidth: 1, borderColor: '#FAFDFF', backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
    satellite: { position: 'absolute', right: 24, top: 39, width: 48, height: 48, borderRadius: 16, borderWidth: 1, borderColor: '#FFF', backgroundColor: '#E6F0F9', alignItems: 'center', justifyContent: 'center' },
    dotOne: { position: 'absolute', left: 40, top: 43, height: 7, width: 7, borderRadius: 4, backgroundColor: '#9CB9D4' }, dotTwo: { position: 'absolute', right: 37, bottom: 39, height: 5, width: 5, borderRadius: 3, backgroundColor: '#AEC8DF' },
    collapseButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderTopWidth: 1 }, collapseLabel: { fontSize: 11, fontWeight: '500' },
    collapsed: { minHeight: 78, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, miniMark: { height: 38, width: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    collapsedTitle: { fontSize: 13, fontWeight: '700' }, collapsedHint: { fontSize: 11, marginTop: 4 },
    detailsMeasure: { position: 'absolute', top: 0, left: 0, right: 0 }, detailsContent: { padding: 24, borderTopWidth: 1 },
    detailHeading: { fontSize: 23, fontWeight: '700', letterSpacing: -0.6 }, detailIntro: { fontSize: 13, lineHeight: 21, marginTop: 8, marginBottom: 23, maxWidth: 540 },
    note: { flexDirection: 'row', gap: 13, marginBottom: 22 }, noteIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    noteTitle: { fontSize: 13, fontWeight: '700', lineHeight: 19 }, noteBody: { fontSize: 12, lineHeight: 20, marginTop: 4 },
    releaseNote: { padding: 16, borderRadius: 16 }, discoverLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 48, marginTop: 12 },
});
