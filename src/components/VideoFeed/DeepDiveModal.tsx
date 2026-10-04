import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateDeepDive, chatWithVideo, DeepDiveData, DeepDiveMessage } from '../../lib/ai/client';
import { FONT, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../core/Txt';
import { RichText } from '../core/RichText';
import { Skeleton } from '../core/Skeleton';
import { Tabs } from '../core/Tabs';
import { MAX_CONTENT_WIDTH } from '../../lib/constants/layout';

interface DeepDiveModalProps {
    visible: boolean;
    video: any | null;
    onClose: () => void;
}

type TabType = 'summary' | 'resources' | 'chat';

const TABS: { key: TabType; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'resources', label: 'Resources' },
    { key: 'chat', label: 'Ask' },
];

/** Three dots that breathe while the answer is on its way. */
function Typing() {
    const { c } = useUI();
    const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

    useEffect(() => {
        const loops = dots.map((d, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 140),
                    Animated.timing(d, { toValue: 1, duration: 360, useNativeDriver: true }),
                    Animated.timing(d, { toValue: 0.3, duration: 360, useNativeDriver: true }),
                ]),
            ),
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [dots]);

    return (
        <View style={[styles.bubble, styles.aiBubble, { backgroundColor: c.surfaceHigh, flexDirection: 'row', gap: 5, alignSelf: 'flex-start' }]}>
            {dots.map((d, i) => (
                <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.textSecondary, opacity: d }} />
            ))}
        </View>
    );
}

const RESOURCE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    Video: 'play-circle-outline',
    Podcast: 'mic-outline',
    Article: 'document-text-outline',
};

/**
 * Orvelis reads the clip and hands back the point: a short summary, the terms worth
 * knowing, what to watch or read next, and a chat that knows what you just watched.
 */
export function DeepDiveModal({ visible, video, onClose }: DeepDiveModalProps) {
    const { c } = useUI();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState<TabType>('summary');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DeepDiveData | null>(null);

    const [chat, setChat] = useState<DeepDiveMessage[]>([]);
    const [input, setInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const listRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!visible || !video) return;
        setLoading(true);
        setData(null);
        setActiveTab('summary');
        setChat([
            {
                role: 'assistant',
                content: `I've read **${video.title || 'this clip'}**. Ask me anything about it, or look through Summary and Resources.`,
            },
        ]);

        generateDeepDive(video.title || 'Educational Topic', video.description || '')
            .then(setData)
            .catch(err => console.error('Deep Dive fetch error:', err))
            .finally(() => setLoading(false));
    }, [visible, video]);

    const send = async () => {
        if (!input.trim() || !video || chatLoading) return;
        const question = input.trim();
        const history = chat.map(h => ({ role: h.role, content: h.content }));
        setChat(prev => [...prev, { role: 'user', content: question }]);
        setInput('');
        setChatLoading(true);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const reply = await chatWithVideo(video.title || 'Video Topic', video.description || '', question, history);
            setChat(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (e) {
            console.error('Video chat error:', e);
            setChat(prev => [...prev, { role: 'assistant', content: "I couldn't answer that just now. Try asking again in a moment." }]);
        } finally {
            setChatLoading(false);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
        }
    };

    const renderBubble = ({ item }: { item: DeepDiveMessage }) => {
        const mine = item.role === 'user';
        return (
            <View
                style={[
                    styles.bubble,
                    mine ? styles.userBubble : styles.aiBubble,
                    { backgroundColor: mine ? c.accent : c.surfaceHigh, alignSelf: mine ? 'flex-end' : 'flex-start' },
                ]}
            >
                <RichText tone={mine ? 'onAccent' : 'primary'} color={mine ? c.onAccent : undefined}>{item.content}</RichText>
            </View>
        );
    };

    const canSend = !!input.trim() && !chatLoading;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modal}>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close deep dive" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.sheet, { backgroundColor: c.surface }]}
                >
                    <View style={[styles.handle, { backgroundColor: c.hairline }]} />

                    <View style={styles.header}>
                        <View style={[styles.mark, { backgroundColor: c.surfaceHigh }]}>
                            <Ionicons name="sparkles" size={18} color={c.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Txt variant="headline">Deep dive</Txt>
                            <Txt variant="caption" tone="secondary" numberOfLines={1}>{video?.title || 'This clip'}</Txt>
                        </View>
                        <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close">
                            <Ionicons name="close" size={22} color={c.textSecondary} />
                        </Pressable>
                    </View>

                    <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
                    <View style={[styles.divider, { backgroundColor: c.hairline }]} />

                    {loading ? (
                        <View style={styles.loading}>
                            <Skeleton style={{ height: 18, width: '92%' }} />
                            <Skeleton style={{ height: 18, width: '78%' }} />
                            <Skeleton style={{ height: 18, width: '86%' }} />
                            <Skeleton style={{ height: 18, width: '60%' }} />
                            <Txt variant="caption" tone="tertiary" style={{ marginTop: 6 }}>Reading the clip…</Txt>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            {activeTab === 'summary' && (
                                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                                    <Txt variant="micro" tone="tertiary" style={styles.eyebrow}>THE POINT</Txt>
                                    <RichText variant="body">{data?.summary || "I couldn't put a summary together for this one."}</RichText>

                                    {data?.keyTerms?.length ? (
                                        <>
                                            <Txt variant="micro" tone="tertiary" style={[styles.eyebrow, { marginTop: 28 }]}>WORTH KNOWING</Txt>
                                            <View style={{ gap: 0 }}>
                                                {data.keyTerms.map((t, i) => (
                                                    <View key={i} style={[styles.term, { borderTopColor: c.hairline }]}>
                                                        <Txt variant="bodyStrong">{t.term}</Txt>
                                                        <Txt variant="body" tone="secondary" style={{ marginTop: 2 }}>{t.definition}</Txt>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    ) : null}
                                </ScrollView>
                            )}

                            {activeTab === 'resources' && (
                                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                                    <Txt variant="micro" tone="tertiary" style={styles.eyebrow}>KEEP GOING</Txt>
                                    {data?.recommendations?.length ? (
                                        data.recommendations.map((r, i) => (
                                            <View key={i} style={[styles.resource, { borderTopColor: c.hairline }]}>
                                                <View style={[styles.resourceIcon, { backgroundColor: c.surfaceHigh }]}>
                                                    <Ionicons name={RESOURCE_ICON[r.type] || 'document-text-outline'} size={20} color={c.text} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Txt variant="bodyStrong">{r.title}</Txt>
                                                    <Txt variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                                                        {r.type}{r.readTime || r.duration ? `  ·  ${r.readTime || r.duration}` : ''}
                                                    </Txt>
                                                    <Txt variant="body" tone="secondary" style={{ marginTop: 6 }}>{r.reason}</Txt>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Txt variant="body" tone="secondary">Nothing to suggest for this one yet.</Txt>
                                    )}
                                </ScrollView>
                            )}

                            {activeTab === 'chat' && (
                                <View style={{ flex: 1 }}>
                                    <FlatList
                                        ref={listRef}
                                        data={chat}
                                        keyExtractor={(_, i) => String(i)}
                                        renderItem={renderBubble}
                                        contentContainerStyle={styles.chatList}
                                        showsVerticalScrollIndicator={false}
                                        ListFooterComponent={chatLoading ? <Typing /> : null}
                                        keyboardShouldPersistTaps="handled"
                                    />
                                    <View style={[styles.composer, { borderTopColor: c.hairline, paddingBottom: Math.max(insets.bottom, 10) }]}>
                                        <TextInput
                                            value={input}
                                            onChangeText={setInput}
                                            placeholder="Ask about this clip…"
                                            placeholderTextColor={c.textTertiary}
                                            style={[styles.input, { backgroundColor: c.surfaceHigh, color: c.text }]}
                                            returnKeyType="send"
                                            onSubmitEditing={send}
                                        />
                                        <Pressable
                                            onPress={send}
                                            disabled={!canSend}
                                            accessibilityRole="button"
                                            accessibilityLabel="Send"
                                            style={[styles.send, { backgroundColor: canSend ? c.accent : c.surfaceHigh }]}
                                        >
                                            {chatLoading ? (
                                                <ActivityIndicator size="small" color={c.onAccent} />
                                            ) : (
                                                <Ionicons name="arrow-up" size={19} color={canSend ? c.onAccent : c.textTertiary} />
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: { height: '82%', width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
    handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
    mark: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    divider: { height: StyleSheet.hairlineWidth },
    loading: { padding: 20, gap: 12 },
    scroll: { padding: 20, paddingBottom: 40 },
    eyebrow: { letterSpacing: 1.2, marginBottom: 10 },
    term: { paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
    resource: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
    resourceIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    chatList: { padding: 16, gap: 10, flexGrow: 1 },
    bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 10 },
    userBubble: { borderRadius: 20, borderBottomRightRadius: 6 },
    aiBubble: { borderRadius: 20, borderBottomLeftRadius: 6 },
    composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
    input: { flex: 1, height: 42, borderRadius: 21, paddingHorizontal: 16, fontFamily: FONT.regular, fontSize: 15 },
    send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
