import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    ScrollView,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatWithAI } from '../../lib/ai/client';
import { usePersistedState } from '../../lib/hooks/usePersistedState';
import { useTabBarHeight } from '../../lib/hooks/useTabBarHeight';
import { FONT, NO_OUTLINE, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { RichText } from '../../components/core/RichText';
import { IconButton } from '../../components/core/IconButton';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Things worth asking. Ones that end in a colon wait for you to finish the sentence;
 * the others go straight out. All of them are ordinary chat: nothing here pretends
 * to be a separate engine.
 */
const STARTERS: { icon: IconName; title: string; prompt: string; send?: boolean }[] = [
    { icon: 'search-outline', title: 'Find the flaw in an argument', prompt: 'Find the logical fallacies in this argument: ' },
    { icon: 'swap-horizontal-outline', title: 'Argue the other side', prompt: 'Make the strongest case against this view: ' },
    { icon: 'bulb-outline', title: 'Explain it simply', prompt: 'Explain this simply, with one good example: ' },
    { icon: 'create-outline', title: 'Sharpen my thesis', prompt: 'Help me turn this into a sharp one-sentence thesis for a debate: ' },
    { icon: 'sparkles-outline', title: 'Tell me something worth knowing', prompt: 'Tell me one surprising thing worth knowing today, and why it matters.', send: true },
];

const STORAGE_KEY = '@datariot_ai_chat';
const KEEP = 40;

let seq = 0;
const uid = () => `m_${Date.now()}_${++seq}`;

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
        <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 8 }}>
            {dots.map((d, i) => (
                <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.textSecondary, opacity: d }} />
            ))}
        </View>
    );
}

export default function AIScreen() {
    const { c, isDark } = useUI();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();

    const [messages, setMessages, loaded] = usePersistedState<Message[]>(STORAGE_KEY, []);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const listRef = useRef<FlatList<Message>>(null);
    const inputRef = useRef<TextInput>(null);

    // The tab bar floats over this screen and hides itself while the keyboard is up
    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const show = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
        const hide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
        return () => { show.remove(); hide.remove(); };
    }, []);

    const scrollToEnd = useCallback((animated = true) => {
        setTimeout(() => listRef.current?.scrollToEnd({ animated }), 60);
    }, []);

    const ask = async (text: string, base: Message[] = messages) => {
        const question = text.trim();
        if (!question || loading) return;

        const mine: Message = { id: uid(), role: 'user', content: question };
        const withMine = [...base, mine];
        setMessages(withMine.slice(-KEEP));
        setInput('');
        setLoading(true);
        scrollToEnd();

        try {
            const history = base.slice(-12).map(m => ({ role: m.role, content: m.content }));
            const answer = await chatWithAI(question, history);
            setMessages([...withMine, { id: uid(), role: 'assistant' as const, content: answer }].slice(-KEEP));
        } catch (e) {
            console.error(e);
            setMessages([...withMine, { id: uid(), role: 'assistant' as const, content: "I couldn't reach my reasoning just now. Try again in a moment." }].slice(-KEEP));
        } finally {
            setLoading(false);
            scrollToEnd();
        }
    };

    const startFrom = (s: typeof STARTERS[number]) => {
        if (s.send) {
            ask(s.prompt);
        } else {
            setInput(s.prompt);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const reset = () => {
        setMessages([]);
        setInput('');
    };

    const shareAnswer = (text: string) => {
        Share.share({ message: text }).catch(() => { });
    };

    const empty = loaded && messages.length === 0;
    const canSend = !!input.trim() && !loading;

    const renderMessage = ({ item }: { item: Message }) => {
        if (item.role === 'user') {
            return (
                <View style={[styles.mine, { backgroundColor: c.surfaceHigh }]}>
                    <Txt variant="body">{item.content}</Txt>
                </View>
            );
        }
        return (
            <View style={styles.theirs}>
                <RichText variant="body">{item.content}</RichText>
                <Pressable onPress={() => shareAnswer(item.content)} hitSlop={10} style={styles.shareBtn} accessibilityRole="button" accessibilityLabel="Share this answer">
                    <Ionicons name="share-outline" size={16} color={c.textTertiary} />
                </Pressable>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.root, { backgroundColor: c.bg }]}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.titleWrap}>
                    <Ionicons name="sparkles" size={20} color={c.text} />
                    <Txt variant="title">Orvelis</Txt>
                </View>
                {messages.length > 0 ? (
                    <IconButton variant="soft" name="create-outline" size={20} label="New chat" onPress={reset} />
                ) : (
                    <View style={{ width: 44, height: 44 }} />
                )}
            </View>

            {empty ? (
                <ScrollView
                    style={styles.emptyWrap}
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
                        <View style={[styles.mark, { backgroundColor: c.surface, borderColor: c.hairline }]}>
                            <Ionicons name="sparkles" size={26} color={c.text} />
                        </View>
                        <Txt variant="display" style={{ marginTop: 20 }}>Think it through.</Txt>
                        <Txt variant="body" tone="secondary" style={{ marginTop: 8, maxWidth: 320 }}>
                            Orvelis helps you test an argument, see the other side and say what you mean.
                        </Txt>
                    </View>

                    <View style={styles.starters}>
                        {STARTERS.map(s => (
                            <Pressable
                                key={s.title}
                                onPress={() => startFrom(s)}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.starter, { backgroundColor: c.surface, borderColor: c.hairline }, pressed && { opacity: 0.7 }]}
                            >
                                <Ionicons name={s.icon} size={18} color={c.textSecondary} />
                                <Txt variant="callout" style={{ flex: 1 }}>{s.title}</Txt>
                                <Ionicons name="arrow-up" size={15} color={c.textTertiary} style={{ transform: [{ rotate: '45deg' }] }} />
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={m => m.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chat}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => scrollToEnd(false)}
                    ListFooterComponent={loading ? <Typing /> : null}
                />
            )}

            <View
                style={[
                    styles.composer,
                    { borderTopColor: c.hairline, backgroundColor: c.bg, paddingBottom: keyboardOpen ? 10 : tabBarHeight + 10 },
                ]}
            >
                <TextInput
                    ref={inputRef}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask Orvelis anything"
                    placeholderTextColor={c.textTertiary}
                    style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.hairline }, NO_OUTLINE]}
                    multiline
                    numberOfLines={1}
                    maxLength={2000}
                    returnKeyType="send"
                    blurOnSubmit
                    onSubmitEditing={() => ask(input)}
                />
                <Pressable
                    onPress={() => ask(input)}
                    disabled={!canSend}
                    accessibilityRole="button"
                    accessibilityLabel="Send"
                    style={[styles.send, { backgroundColor: canSend ? c.accent : c.surface, borderColor: c.hairline, borderWidth: canSend ? 0 : 1 }]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={c.textSecondary} />
                    ) : (
                        <Ionicons name="arrow-up" size={20} color={canSend ? c.onAccent : c.textTertiary} />
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 10, paddingBottom: 6 },
    titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    emptyWrap: { flex: 1 },
    mark: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    starters: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
    starter: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, paddingHorizontal: 16, borderRadius: RADIUS.md, borderWidth: 1 },
    chat: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 18, flexGrow: 1 },
    mine: { alignSelf: 'flex-end', maxWidth: '84%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, borderBottomRightRadius: 6 },
    theirs: { alignSelf: 'stretch', paddingRight: 12 },
    shareBtn: { alignSelf: 'flex-start', marginTop: 8, padding: 2 },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
    input: {
        flex: 1,
        minHeight: 46,
        maxHeight: 120,
        borderRadius: 23,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 13 : 10,
        paddingBottom: Platform.OS === 'ios' ? 13 : 10,
        fontFamily: FONT.regular,
        fontSize: 16,
    },
    send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
