/** @jsxImportSource react */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { OrvelisMark } from '../UI/OrvelisMark';
import { askAboutClip, ClipAnalysis, DeepDiveMessage, getClipAnalysis, OrvelisError, orvelisErrorMessage, VideoAction } from '../../lib/ai/client';

type Tab = 'understand' | 'examine' | 'ask';
interface Props {
    visible: boolean; video: { id: string; title?: string } | null; onClose: () => void;
    seconds?: number; onSeek?: (seconds: number) => void;
}
const stamp = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
const reasoningLabels: Record<ClipAnalysis['reasoning'], string> = {
    supported_in_clip: 'Evidence presented in the clip', needs_context: 'Needs more context',
    opinion: 'Opinion or interpretation', no_checkable_claim: 'No factual claim to check',
};

// Search suggestions must be displayed when the provider returns grounded results.
function SearchSuggestions({ html }: { html: string }) {
    if (Platform.OS === 'web') return React.createElement('iframe', {
        srcDoc: html, title: 'Google Search suggestions', sandbox: 'allow-popups allow-popups-to-escape-sandbox',
        style: { width: '100%', height: 120, border: 0 },
    });
    return <WebView originWhitelist={['*']} source={{ html }} javaScriptEnabled={false} style={{ height: 120, backgroundColor: 'transparent' }}
        onShouldStartLoadWithRequest={request => {
            if (request.url === 'about:blank') return true;
            if (request.url.startsWith('https://')) Linking.openURL(request.url).catch(() => {});
            return false;
        }} />;
}

export function DeepDiveModal({ visible, video, onClose, seconds = 0, onSeek }: Props) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const reducedMotion = useReducedMotion();
    const [reveal] = useState(() => new Animated.Value(0));
    const [presented, setPresented] = useState(visible);
    const [tab, setTab] = useState<Tab>('understand');
    const [analysis, setAnalysis] = useState<ClipAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [signIn, setSignIn] = useState(false);
    const [retry, setRetry] = useState(0);
    const [history, setHistory] = useState<DeepDiveMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [chatError, setChatError] = useState('');
    const [answer, setAnswer] = useState<number | null>(null);
    const [moment, setMoment] = useState(seconds);
    const generation = useRef(0);
    const list = useRef<FlatList>(null);
    const busy = useRef(false);

    useEffect(() => {
        // Keep the native modal mounted until its exit animation finishes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (visible) setPresented(true);
        const animation = visible && !reducedMotion
            ? Animated.spring(reveal, { toValue: 1, damping: 26, stiffness: 230, mass: 0.9, overshootClamping: true, useNativeDriver: true })
            : Animated.timing(reveal, { toValue: visible ? 1 : 0, duration: reducedMotion ? 0 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true });
        animation.start(({ finished }) => { if (finished && !visible) setPresented(false); });
        return () => animation.stop();
    }, [visible, reducedMotion, reveal]);

    useEffect(() => {
        const current = ++generation.current;
        busy.current = false; setSending(false); setHistory([]); setInput(''); setChatError('');
        setAnalysis(null); setError(''); setAnswer(null); setTab('understand'); setMoment(seconds);
        if (!visible || !video?.id) { setLoading(false); return; }
        setLoading(true); setSignIn(false);
        getClipAnalysis(video.id).then(value => {
            if (generation.current === current) setAnalysis(value);
        }).catch(e => {
            if (generation.current === current) { setError(orvelisErrorMessage(e)); setSignIn(e instanceof OrvelisError && e.code === 'SIGN_IN_REQUIRED'); }
        }).finally(() => { if (generation.current === current) setLoading(false); });
        return () => { generation.current++; };
    }, [visible, video?.id, retry]);

    async function send(question: string, action: VideoAction = 'ask') {
        if (!video?.id || !question.trim() || busy.current) return;
        const current = generation.current;
        busy.current = true; setSending(true); setChatError(''); setTab('ask'); setInput('');
        const previous = history;
        setHistory(h => [...h, { role: 'user', content: question }]);
        try {
            const response = await askAboutClip(video.id, question.trim(), previous, moment, action);
            if (generation.current === current) setHistory(h => [...h, { role: 'assistant', content: response.content, sources: response.sources, searchEntryPoint: response.searchEntryPoint }]);
        } catch (e) {
            if (generation.current === current) { setChatError(orvelisErrorMessage(e)); setInput(question); }
        } finally {
            if (generation.current === current) { busy.current = false; setSending(false); }
        }
    }
    const jump = (value: number) => { setMoment(value); if (onSeek) onSeek(value); else { setTab('ask'); setInput(`Explain the moment at ${stamp(value)}.`); } };
    const actionButton = (label: string, icon: keyof typeof Ionicons.glyphMap, action: VideoAction, prompt: string) => (
        <Pressable key={action} disabled={sending || !analysis} onPress={() => send(prompt, action)} accessibilityRole="button" style={styles.action}>
            <Ionicons name={icon} size={17} color="#385E91" /><Text style={styles.actionText}>{label}</Text>
        </Pressable>
    );
    return (
        <Modal visible={presented} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dimmer, { opacity: reveal }]} />
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Orvelis" />
                <Animated.View accessibilityViewIsModal pointerEvents={visible ? 'auto' : 'none'} style={[styles.sheet, {
                    width: Math.min(width, 680), marginTop: Math.max(insets.top, 28), opacity: reveal,
                    transform: reducedMotion ? [] : [
                        { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) },
                        { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
                    ],
                }]}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, paddingBottom: insets.bottom }}>
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <View style={styles.mark}><OrvelisMark size={25} color="#587EB5" /></View>
                        <View style={{ flex: 1, gap: 3 }}><Text style={styles.brand}>Orvelis</Text><Text style={styles.caption} numberOfLines={1}>{video?.title || 'Explore this video'}</Text></View>
                        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close analysis" style={styles.iconButton}><Ionicons name="close" size={23} color="#40536D" /></Pressable>
                    </View>
                    <View style={styles.tabs}>
                        {(['understand', 'examine', 'ask'] as Tab[]).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }}
                            onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}>
                            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{value === 'understand' ? 'Understand' : value === 'examine' ? 'Examine the claim' : 'Ask Orvelis'}</Text>
                        </Pressable>)}
                    </View>
                    {loading ? <View style={styles.empty}><ActivityIndicator color="#587EB5" /><Text style={styles.body}>Watching the video and listening to the audio…</Text><Text style={styles.caption}>The first analysis can take a little longer.</Text></View>
                    : error ? <View style={styles.empty}><Text style={styles.body}>{error}</Text><Pressable style={styles.action} accessibilityRole="button" onPress={() => {
                        if (signIn) { onClose(); router.push('/auth/login'); } else setRetry(v => v + 1);
                    }}><Text style={styles.actionText}>{signIn ? 'Sign in' : 'Try again'}</Text></Pressable></View>
                    : tab === 'ask' ? <View style={{ flex: 1 }}>
                        <FlatList<DeepDiveMessage> ref={list} data={history} keyExtractor={(_, i) => String(i)} contentContainerStyle={styles.scroll}
                            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
                            ListEmptyComponent={<View style={{ gap: 12 }}><Text style={styles.title}>What made you curious?</Text>
                                <Text style={styles.body}>Ask about the idea, the evidence, or the moment at {stamp(moment)}.</Text>
                                {analysis?.questions.map(q => <Pressable key={q} onPress={() => send(q)} accessibilityRole="button" style={styles.prompt}><Text style={styles.body}>{q}</Text><Ionicons name="arrow-forward" size={17} color="#587EB5" /></Pressable>)}
                            </View>}
                            renderItem={({ item }) => <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                                <Text style={styles.speaker}>{item.role === 'user' ? 'YOU' : 'ORVELIS'}</Text><Text selectable style={styles.body}>{item.content}</Text>
                                {!!item.sources?.length && <View style={{ gap: 8, marginTop: 12 }}><Text style={styles.label}>SOURCES RETURNED BY SEARCH</Text>{item.sources.map((source, i) =>
                                    <Pressable key={`${source.url}-${i}`} accessibilityRole="link" onPress={() => Linking.openURL(source.url).catch(() => setChatError('Could not open this source.'))}>
                                        <Text style={styles.source}>{i + 1}. {source.title} ↗</Text>
                                    </Pressable>)}</View>}
                                {item.searchEntryPoint && <SearchSuggestions html={item.searchEntryPoint} />}
                            </View>}
                            ListFooterComponent={sending ? <View style={{ padding: 16 }}><ActivityIndicator color="#587EB5" /></View> : undefined} />
                        {!!chatError && <Text accessibilityRole="alert" style={styles.error}>{chatError}</Text>}
                        <View style={styles.inputRow}><TextInput value={input} onChangeText={setInput} placeholder={`Ask about ${stamp(moment)} or the whole clip…`}
                            placeholderTextColor="#7B899C" style={styles.input} maxLength={4000} multiline accessibilityLabel="Question about this video" />
                            <Pressable disabled={sending || !input.trim()} onPress={() => send(input)} accessibilityRole="button" accessibilityLabel="Send question" style={[styles.send, (sending || !input.trim()) && { opacity: 0.4 }]}><Ionicons name="arrow-up" size={23} color="#FFF" /></Pressable>
                        </View>
                    </View> : <ScrollView contentContainerStyle={styles.scroll}>
                        {analysis && <>
                            <View style={styles.context}><Ionicons name="videocam-outline" size={15} color="#587EB5" /><Text style={styles.caption}>Based on the video and audio · AI interpretation</Text></View>
                            {tab === 'understand' ? <>
                                <Text style={styles.title}>The idea, unpacked.</Text><Text style={styles.body}>{analysis.summary}</Text>
                                <View style={styles.note}><Text style={styles.label}>WHAT YOU CAN TAKE AWAY</Text><Text style={styles.body}>{analysis.learningValue}</Text></View>
                                <View style={styles.actionRow}>
                                    {actionButton('Explain simply', 'bulb-outline', 'explain', `Explain the moment at ${stamp(moment)} simply, with a concrete example.`)}
                                    {actionButton('Check sources', 'search-outline', 'check', 'Check the main factual claim in this clip against authoritative sources.')}
                                    {actionButton('Build a reply', 'videocam-outline', 'reply', 'Help me structure a thoughtful 30-second video reply to this clip.')}
                                </View>
                                <Text style={styles.label}>FOLLOW THE VIDEO</Text>
                                {analysis.moments.map((m, i) => <Pressable key={i} onPress={() => jump(m.seconds)} accessibilityRole="button" accessibilityLabel={`Explore moment at ${stamp(m.seconds)}`} style={styles.moment}>
                                    <Text style={styles.time}>{stamp(m.seconds)}</Text><View style={{ flex: 1, gap: 4 }}><Text style={styles.label}>{m.kind.toUpperCase()}</Text><Text style={styles.body}>{m.text}</Text></View>
                                    <Ionicons name={onSeek ? 'play-outline' : 'chatbubble-outline'} color="#587EB5" size={17} />
                                </Pressable>)}
                                {!!analysis.keyTerms.length && <Text style={styles.label}>KEY IDEAS</Text>}
                                {analysis.keyTerms.map(term => <View key={term.term} style={{ gap: 4 }}><Text style={styles.term}>{term.term}</Text><Text style={styles.body}>{term.definition}</Text></View>)}
                                <View style={styles.note}><Text style={styles.label}>DID IT CLICK?</Text><Text style={styles.term}>{analysis.quiz.question}</Text>
                                    {analysis.quiz.options.map((option, i) => <Pressable key={i} disabled={answer !== null} accessibilityRole="button" accessibilityState={{ selected: answer === i }} onPress={() => setAnswer(i)}
                                        style={[styles.option, answer === i && { borderColor: '#587EB5', backgroundColor: '#E6EEFC' }]}><Text style={styles.body}>{option}</Text></Pressable>)}
                                    {answer !== null && <Text accessibilityLiveRegion="polite" style={styles.body}>{answer === analysis.quiz.correctIndex ? 'Exactly. ' : 'Take another look. '}{analysis.quiz.explanation}</Text>}
                                </View>
                            </> : <>
                                <Text style={styles.title}>Look behind the claim.</Text><Text style={styles.reasoning}>{reasoningLabels[analysis.reasoning]}</Text>
                                <Text style={styles.label}>THE CLAIM</Text><Text style={styles.body}>{analysis.claim}</Text>
                                <Text style={styles.label}>EVIDENCE IN THE VIDEO</Text><Text style={styles.body}>{analysis.evidence}</Text>
                                <View style={styles.note}><Text style={styles.label}>WHAT IS MISSING?</Text><Text style={styles.body}>{analysis.missingContext}</Text></View>
                                <Text style={styles.caption}>This examines the argument. Use Check sources for independent evidence.</Text>
                                {actionButton('Check the claim with sources', 'search-outline', 'check', 'Check the main factual claim in this clip against authoritative sources. Explain what is known and what remains uncertain.')}
                                <Text style={styles.label}>YOUR 30-SECOND VIDEO REPLY</Text>
                                {analysis.replyOutline.map((line, i) => <View key={i} style={styles.moment}><Text style={styles.time}>0{i + 1}</Text><Text style={[styles.body, { flex: 1 }]}>{line}</Text></View>)}
                                {actionButton('Develop my reply', 'videocam-outline', 'reply', 'Help me turn this outline into a thoughtful 30-second video reply. Ask for my position if needed.')}
                            </>}
                        </>}
                    </ScrollView>}
                </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
}
const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    dimmer: { backgroundColor: 'rgba(14,24,40,0.48)' },
    handle: { width: 32, height: 3, borderRadius: 2, backgroundColor: '#D4DFEE', alignSelf: 'center', marginTop: 10 },
    sheet: { height: '90%', maxHeight: 900, backgroundColor: '#FCFDFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 }, mark: { padding: 9, borderRadius: 16, backgroundColor: '#EAF0FC' },
    brand: { fontSize: 22, color: '#18283F', fontWeight: '700', letterSpacing: -0.6 }, caption: { fontSize: 11, lineHeight: 16, color: '#67788F' },
    iconButton: { padding: 10 }, tabs: { flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#E7EDF6' },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderColor: 'transparent' }, tabActive: { borderColor: '#587EB5' },
    tabText: { fontSize: 11, color: '#738198', fontWeight: '600' }, tabTextActive: { color: '#264C83' },
    scroll: { padding: 22, gap: 18, paddingBottom: 40 }, empty: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 15 },
    title: { fontSize: 26, lineHeight: 31, letterSpacing: -0.7, fontWeight: '700', color: '#192A43' },
    body: { fontSize: 14, lineHeight: 22, color: '#34475F' }, label: { fontSize: 9, lineHeight: 14, letterSpacing: 1.1, fontWeight: '700', color: '#6B7F9B' },
    term: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: '#1C3555' }, context: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    note: { padding: 18, borderRadius: 17, backgroundColor: '#EFF4FC', gap: 12 }, actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 13, borderWidth: 1, borderColor: '#D8E4F5', borderRadius: 12 },
    actionText: { fontSize: 11, color: '#385E91', fontWeight: '600' }, moment: { flexDirection: 'row', gap: 14, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderColor: '#E8EEF6' },
    time: { fontSize: 12, fontWeight: '600', color: '#557DB3', minWidth: 36 }, option: { padding: 12, borderWidth: 1, borderColor: '#D7E2F1', borderRadius: 11 },
    reasoning: { fontSize: 12, color: '#456389', backgroundColor: '#EDF2FA', padding: 12, borderRadius: 10 },
    prompt: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#DCE5F2', borderRadius: 12 },
    bubble: { gap: 6, padding: 16, borderRadius: 17, maxWidth: '98%' }, userBubble: { backgroundColor: '#E5EDFA', alignSelf: 'flex-end' }, aiBubble: { backgroundColor: '#F2F5F9', alignSelf: 'flex-start' },
    speaker: { fontSize: 9, color: '#6F829D', fontWeight: '700', letterSpacing: 1 }, source: { color: '#385E91', fontSize: 12, lineHeight: 18 },
    inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderTopWidth: 1, borderColor: '#E7EDF6' },
    input: { flex: 1, minHeight: 44, maxHeight: 110, padding: 12, borderRadius: 14, backgroundColor: '#F0F4FA', color: '#243A56', fontSize: 13 },
    send: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#587EB5', alignItems: 'center', justifyContent: 'center' }, error: { color: '#815B51', fontSize: 12, paddingHorizontal: 18, paddingTop: 8 },
});
