import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    FlatList,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Animated,
    Share,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { chatWithAI, analyzeArgument, ArgumentAnalysis } from '../../lib/ai/client';

type Mode = 'chat' | 'analyze';
type IconName = keyof typeof Ionicons.glyphMap;

interface Topic {
    q: string;
    tag: string;
    forPoint: string;
    againstPoint: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    kind: 'text' | 'analysis' | 'topic';
    content: string;
    data?: ArgumentAnalysis | Topic;
}

const STORAGE_KEY = '@datariot_ai_chat_v2';
const KEEP = 40;

let seq = 0;
const uid = () => `m_${Date.now()}_${++seq}`;

/** Questions worth arguing about, one per day. A fixed list: it works offline and never invents anything. */
const TOPICS: Topic[] = [
    { q: 'Is remote work better than the office?', tag: 'Work', forPoint: 'Fewer interruptions, more hours of real focus.', againstPoint: 'Ideas spark in hallway conversations.' },
    { q: 'Should social media require ID verification?', tag: 'Tech', forPoint: 'Real names cut harassment and bots.', againstPoint: 'Anonymity protects dissidents and the vulnerable.' },
    { q: 'Should schools ban smartphones?', tag: 'Society', forPoint: 'Phones fragment attention and fuel bullying.', againstPoint: 'Bans skip skills kids need and push the problem home.' },
    { q: 'Is a four-day work week realistic?', tag: 'Work', forPoint: 'Trials show the same output in fewer hours.', againstPoint: 'Many jobs cannot compress their hours.' },
    { q: 'Can an AI ever be truly creative?', tag: 'Tech', forPoint: 'Novel combinations are what creativity is.', againstPoint: 'Without experience or intent it only remixes.' },
    { q: 'Should voting be mandatory?', tag: 'Society', forPoint: 'Results then represent everyone.', againstPoint: 'Forced votes add noise, not wisdom.' },
    { q: 'Does free will exist?', tag: 'Philosophy', forPoint: 'We experience choosing, and it changes what we do.', againstPoint: 'Brains follow physics; choices are consequences.' },
    { q: 'Is nuclear power the answer to climate change?', tag: 'Energy', forPoint: 'Reliable low-carbon power at scale.', againstPoint: 'Cost, waste and builds that take decades.' },
    { q: 'Should university be free?', tag: 'Education', forPoint: 'Talent should not depend on family money.', againstPoint: 'Someone pays, and free tuition tends to favour the already advantaged.' },
    { q: 'Is space exploration worth the money?', tag: 'Science', forPoint: 'It drives technology and a future beyond Earth.', againstPoint: 'Problems at home need that funding first.' },
    { q: 'Should AI art be allowed in competitions?', tag: 'Art', forPoint: 'Tools always changed art; judge the result.', againstPoint: 'It devalues the human craft being rewarded.' },
    { q: 'Is it ethical to eat meat?', tag: 'Ethics', forPoint: 'It can be done responsibly and humans are omnivores.', againstPoint: 'Animal suffering outweighs our taste.' },
    { q: 'Should billionaires exist?', tag: 'Economy', forPoint: 'Concentrated wealth funds bold bets that help everyone.', againstPoint: 'Extreme wealth buys extreme political power.' },
    { q: 'Is cancel culture justice or mob rule?', tag: 'Society', forPoint: 'It gives the powerless a way to hold the powerful to account.', againstPoint: 'No trial, no proportion, no way back.' },
];

const todaysTopic = (): Topic => TOPICS[Math.floor(Date.now() / 86400000) % TOPICS.length];

const QUICK: { icon: IconName; title: string; sub: string; mode: Mode; prefill: string }[] = [
    { icon: 'search-outline', title: 'Find the flaw', sub: 'Spot weak logic in any argument', mode: 'analyze', prefill: '' },
    { icon: 'git-compare-outline', title: 'Argue the other side', sub: 'The strongest case against your view', mode: 'chat', prefill: 'Make the strongest case against this view: ' },
    { icon: 'bulb-outline', title: 'Explain it simply', sub: 'Any idea, with one clear example', mode: 'chat', prefill: 'Explain this simply, with one good example: ' },
    { icon: 'create-outline', title: 'Sharpen my thesis', sub: 'Turn a rough idea into a debate-ready claim', mode: 'chat', prefill: 'Help me turn this into a sharp one-sentence thesis for a debate: ' },
];

const FOLLOW_UPS = ['Go deeper', 'Give a counterexample', 'Make it shorter'];

/** Bold (**x**) and bullet lines: all the formatting the answers use. */
function Markdown({ text, color, accent }: { text: string; color: string; accent: string }) {
    const { theme } = useTheme();
    const fonts = theme.typography.fontFamilies;
    return (
        <View style={{ gap: 7 }}>
            {text.split('\n').map((line, i) => {
                if (!line.trim()) return <View key={i} style={{ height: 3 }} />;
                const bullet = /^\s*([-•*]|\d+\.)\s+/.test(line);
                const body = line.replace(/^\s*([-•*]|\d+\.)\s+/, '');
                const parts = body.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
                return (
                    <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                        {bullet ? <View style={[styles.bulletDot, { backgroundColor: accent }]} /> : null}
                        <Text style={[styles.body, { color, fontFamily: fonts.regular, flex: 1 }]}>
                            {parts.map((part, j) =>
                                part.startsWith('**') && part.endsWith('**')
                                    ? <Text key={j} style={{ fontFamily: fonts.semibold }}>{part.slice(2, -2)}</Text>
                                    : part,
                            )}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

/** Three dots that breathe while the answer is on its way. */
function Typing({ color }: { color: string }) {
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
        <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 10 }}>
            {dots.map((d, i) => <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity: d }} />)}
        </View>
    );
}

export default function AIScreen() {
    const { theme, mode: themeMode } = useTheme();
    const isDark = themeMode === 'dark';
    const fonts = theme.typography.fontFamilies;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();

    // Palette: black / the logo's ice, with the logo's ice or ink as the one accent
    const c = {
        bg: theme.colors.background.primary,
        card: isDark ? '#0E1017' : '#FFFFFF',
        cardHigh: isDark ? '#161922' : '#EEF3FC',
        border: isDark ? 'rgba(217, 228, 255, 0.09)' : 'rgba(7, 8, 12, 0.07)',
        text: isDark ? '#F1F2F5' : '#07080C',
        sub: isDark ? 'rgba(241, 242, 245, 0.62)' : 'rgba(7, 8, 12, 0.62)',
        faint: isDark ? 'rgba(241, 242, 245, 0.38)' : 'rgba(7, 8, 12, 0.42)',
        accent: isDark ? '#D9E4FF' : '#07080C',
        onAccent: isDark ? '#07080C' : '#DAE6F7',
        soft: isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(7, 8, 12, 0.06)',
    };

    const [messages, setMessages] = useState<Message[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<Mode>('chat');
    const [loading, setLoading] = useState(false);
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const listRef = useRef<FlatList<Message>>(null);
    const inputRef = useRef<TextInput>(null);

    // Keep the conversation between visits
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then(raw => { if (raw) setMessages(JSON.parse(raw)); })
            .catch(() => { })
            .finally(() => setLoaded(true));
    }, []);

    const commit = useCallback((next: Message[]) => {
        const trimmed = next.slice(-KEEP);
        setMessages(trimmed);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)).catch(() => { });
    }, []);

    // The tab bar floats over this screen and steps aside while the keyboard is up
    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const show = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
        const hide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
        return () => { show.remove(); hide.remove(); };
    }, []);

    const toEnd = useCallback((animated = true) => {
        setTimeout(() => listRef.current?.scrollToEnd({ animated }), 80);
    }, []);

    /** `shown` is what the person sees as their message; `prompt` is what the model gets, when it differs. */
    const ask = async (shown: string, prompt?: string, base: Message[] = messages) => {
        const text = shown.trim();
        if (!text || loading) return;

        const mine: Message = { id: uid(), role: 'user', kind: 'text', content: text };
        const withMine = [...base, mine];
        commit(withMine);
        setInput('');
        setLoading(true);
        toEnd();

        try {
            const history = base.filter(m => m.kind === 'text').slice(-12).map(m => ({ role: m.role, content: m.content }));
            const answer = await chatWithAI(prompt || text, history);
            commit([...withMine, { id: uid(), role: 'assistant', kind: 'text', content: answer }]);
        } catch (e) {
            console.error(e);
            commit([...withMine, { id: uid(), role: 'assistant', kind: 'text', content: "I couldn't reach my reasoning just now. Try again in a moment." }]);
        } finally {
            setLoading(false);
            toEnd();
        }
    };

    const analyze = async (text: string) => {
        const body = text.trim();
        if (!body || loading) return;

        const mine: Message = { id: uid(), role: 'user', kind: 'text', content: body };
        const withMine = [...messages, mine];
        commit(withMine);
        setInput('');
        setLoading(true);
        toEnd();

        try {
            const result = await analyzeArgument(body);
            commit([...withMine, { id: uid(), role: 'assistant', kind: 'analysis', content: result.claim, data: result }]);
        } catch (e) {
            console.error(e);
            commit([...withMine, { id: uid(), role: 'assistant', kind: 'text', content: "I couldn't analyze that just now: Orvelis can't be reached. Check your connection and send it again." }]);
        } finally {
            setLoading(false);
            toEnd();
        }
    };

    const send = () => (mode === 'analyze' ? analyze(input) : ask(input));

    const startFrom = (q: typeof QUICK[number]) => {
        setMode(q.mode);
        setInput(q.prefill);
        setTimeout(() => inputRef.current?.focus(), 60);
    };

    const showTopic = () => {
        commit([...messages, { id: uid(), role: 'assistant', kind: 'topic', content: todaysTopic().q, data: todaysTopic() }]);
        toEnd();
    };

    const argueTopic = (t: Topic) => {
        setMode('chat');
        ask(
            `Let's debate: ${t.q}`,
            `Let's debate this question: "${t.q}". Open with the strongest short case for ONE side, then ask me which side I take. Once I answer, argue the opposite of whatever I choose, keep each reply under 120 words, and name any weak logic in my replies.`,
            messages,
        );
    };

    const startDebate = (thesis: string) => router.push({ pathname: '/publish', params: { thesis } });

    const reset = () => {
        commit([]);
        setInput('');
        setMode('chat');
    };

    const empty = loaded && messages.length === 0;
    const canSend = !!input.trim() && !loading;
    const lastIsAnswer = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].kind === 'text';

    const TopicCard = ({ topic, compact }: { topic: Topic; compact?: boolean }) => (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.cardTop}>
                <View style={styles.row}>
                    <Ionicons name="flame-outline" size={16} color={c.accent} />
                    <Text style={[styles.label, { color: c.sub, fontFamily: fonts.medium }]}>Today&apos;s question</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: c.soft }]}>
                    <Text style={[styles.tagText, { color: c.sub, fontFamily: fonts.medium }]}>{topic.tag}</Text>
                </View>
            </View>
            <Text style={[styles.topicQ, { color: c.text, fontFamily: fonts.bold }]}>{topic.q}</Text>
            <View style={{ gap: 8, marginTop: 14 }}>
                <View style={styles.sideRow}>
                    <Text style={[styles.sideLabel, { color: c.accent, fontFamily: fonts.semibold }]}>For</Text>
                    <Text style={[styles.sideText, { color: c.sub, fontFamily: fonts.regular }]}>{topic.forPoint}</Text>
                </View>
                <View style={styles.sideRow}>
                    <Text style={[styles.sideLabel, { color: c.sub, fontFamily: fonts.semibold }]}>Against</Text>
                    <Text style={[styles.sideText, { color: c.sub, fontFamily: fonts.regular }]}>{topic.againstPoint}</Text>
                </View>
            </View>
            <View style={[styles.buttons, compact && { marginTop: 14 }]}>
                <Pressable onPress={() => argueTopic(topic)} style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={c.onAccent} />
                    <Text style={[styles.btnText, { color: c.onAccent, fontFamily: fonts.semibold }]}>Argue it with me</Text>
                </Pressable>
                <Pressable onPress={() => startDebate(topic.q)} style={({ pressed }) => [styles.ghostBtn, { borderColor: c.border }, pressed && { opacity: 0.7 }]}>
                    <Text style={[styles.btnText, { color: c.text, fontFamily: fonts.semibold }]}>Start a debate</Text>
                </Pressable>
            </View>
        </View>
    );

    const renderMessage = ({ item }: { item: Message }) => {
        if (item.kind === 'topic') return <View style={styles.msg}><TopicCard topic={item.data as Topic} compact /></View>;

        if (item.kind === 'analysis') {
            const a = item.data as ArgumentAnalysis;
            return (
                <View style={styles.msg}>
                    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                        <View style={styles.row}>
                            <Ionicons name="search-outline" size={16} color={c.accent} />
                            <Text style={[styles.label, { color: c.sub, fontFamily: fonts.medium }]}>Argument check</Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: c.faint, fontFamily: fonts.medium }]}>The claim</Text>
                        <Text style={[styles.claim, { color: c.text, fontFamily: fonts.semibold }]}>{a.claim}</Text>

                        {a.weakSpots.length > 0 ? (
                            <>
                                <Text style={[styles.sectionTitle, { color: c.faint, fontFamily: fonts.medium }]}>Weak spots</Text>
                                <View style={{ gap: 8 }}>
                                    {a.weakSpots.map((w, i) => (
                                        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={[styles.bulletDot, { backgroundColor: c.accent }]} />
                                            <Text style={[styles.body, { color: c.sub, fontFamily: fonts.regular, flex: 1 }]}>{w}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : null}

                        {a.counter ? (
                            <>
                                <Text style={[styles.sectionTitle, { color: c.faint, fontFamily: fonts.medium }]}>Strongest counter</Text>
                                <Text style={[styles.body, { color: c.sub, fontFamily: fonts.regular }]}>{a.counter}</Text>
                            </>
                        ) : null}

                        {a.improve ? (
                            <View style={[styles.tip, { backgroundColor: c.soft }]}>
                                <Ionicons name="trending-up-outline" size={16} color={c.accent} />
                                <Text style={[styles.body, { color: c.text, fontFamily: fonts.regular, flex: 1 }]}>
                                    <Text style={{ fontFamily: fonts.semibold }}>Make it stronger: </Text>{a.improve}
                                </Text>
                            </View>
                        ) : null}

                        <View style={styles.buttons}>
                            <Pressable onPress={() => startDebate(a.claim)} style={({ pressed }) => [styles.ghostBtn, { borderColor: c.border }, pressed && { opacity: 0.7 }]}>
                                <Text style={[styles.btnText, { color: c.text, fontFamily: fonts.semibold }]}>Debate this claim</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => Share.share({ message: `${a.claim}\n\nWeak spots:\n${a.weakSpots.map(w => `- ${w}`).join('\n')}\n\nStrongest counter: ${a.counter}` }).catch(() => { })}
                                hitSlop={8}
                                accessibilityLabel="Share this analysis"
                                style={styles.iconBtn}
                            >
                                <Ionicons name="share-outline" size={19} color={c.sub} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            );
        }

        if (item.role === 'user') {
            return (
                <View style={[styles.msg, { alignItems: 'flex-end' }]}>
                    <View style={[styles.mine, { backgroundColor: c.accent }]}>
                        <Text style={[styles.body, { color: c.onAccent, fontFamily: fonts.regular }]}>{item.content}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.msg}>
                <View style={styles.row}>
                    <View style={[styles.miniMark, { backgroundColor: c.soft }]}>
                        <Ionicons name="sparkles" size={11} color={c.accent} />
                    </View>
                    <Text style={[styles.label, { color: c.sub, fontFamily: fonts.medium }]}>Orvelis</Text>
                </View>
                <View style={{ marginTop: 8, paddingRight: 8 }}>
                    <Markdown text={item.content} color={c.text} accent={c.accent} />
                </View>
                <Pressable
                    onPress={() => Share.share({ message: item.content }).catch(() => { })}
                    hitSlop={10}
                    accessibilityLabel="Share this answer"
                    style={{ alignSelf: 'flex-start', marginTop: 10, padding: 2 }}
                >
                    <Ionicons name="share-outline" size={16} color={c.faint} />
                </Pressable>
            </View>
        );
    };

    const footer = (
        <View>
            {loading ? <Typing color={c.sub} /> : null}
            {!loading && lastIsAnswer ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 6 }}>
                    {FOLLOW_UPS.map(f => (
                        <Pressable key={f} onPress={() => ask(f)} style={({ pressed }) => [styles.followUp, { borderColor: c.border, backgroundColor: c.card }, pressed && { opacity: 0.7 }]}>
                            <Text style={[styles.followUpText, { color: c.text, fontFamily: fonts.medium }]}>{f}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            ) : null}
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg }]}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.row}>
                    <View style={[styles.mark, { backgroundColor: c.accent }]}>
                        <Ionicons name="sparkles" size={18} color={c.onAccent} />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: c.text, fontFamily: fonts.bold }]}>Orvelis</Text>
                        <Text style={[styles.subtitle, { color: c.sub, fontFamily: fonts.regular }]}>Your partner for sharper thinking</Text>
                    </View>
                </View>
                {messages.length > 0 ? (
                    <Pressable onPress={reset} hitSlop={10} accessibilityLabel="New chat" style={[styles.newChat, { backgroundColor: c.card, borderColor: c.border }]}>
                        <Ionicons name="create-outline" size={18} color={c.text} />
                    </Pressable>
                ) : null}
            </View>

            {empty ? (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.emptyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={[styles.hero, { color: c.text, fontFamily: fonts.bold }]}>What are we thinking through?</Text>
                    <Text style={[styles.heroSub, { color: c.sub, fontFamily: fonts.regular }]}>
                        Test an argument, see the other side, or turn a rough idea into a claim worth debating.
                    </Text>

                    <View style={{ marginTop: 22 }}><TopicCard topic={todaysTopic()} /></View>

                    <Text style={[styles.sectionTitle, { color: c.faint, fontFamily: fonts.medium, marginTop: 26 }]}>Try</Text>
                    <View style={styles.grid}>
                        {QUICK.map(q => (
                            <Pressable
                                key={q.title}
                                onPress={() => startFrom(q)}
                                style={({ pressed }) => [styles.quick, { backgroundColor: c.card, borderColor: c.border }, pressed && { opacity: 0.75 }]}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: c.soft }]}>
                                    <Ionicons name={q.icon} size={19} color={c.accent} />
                                </View>
                                <Text style={[styles.quickTitle, { color: c.text, fontFamily: fonts.semibold }]}>{q.title}</Text>
                                <Text style={[styles.quickSub, { color: c.sub, fontFamily: fonts.regular }]}>{q.sub}</Text>
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
                    ListFooterComponent={footer}
                    contentContainerStyle={styles.chat}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => toEnd(false)}
                />
            )}

            <View style={[styles.composer, { backgroundColor: c.bg, borderTopColor: c.border, paddingBottom: keyboardOpen ? 10 : tabBarHeight + 8 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modes}>
                    {([
                        { key: 'chat' as Mode, icon: 'chatbubble-ellipses-outline' as IconName, label: 'Chat' },
                        { key: 'analyze' as Mode, icon: 'search-outline' as IconName, label: 'Check argument' },
                    ]).map(m => {
                        const on = mode === m.key;
                        return (
                            <Pressable
                                key={m.key}
                                onPress={() => { setMode(m.key); setTimeout(() => inputRef.current?.focus(), 40); }}
                                style={[styles.modeChip, { backgroundColor: on ? c.accent : c.soft }]}
                            >
                                <Ionicons name={m.icon} size={14} color={on ? c.onAccent : c.sub} />
                                <Text style={[styles.modeText, { color: on ? c.onAccent : c.sub, fontFamily: on ? fonts.semibold : fonts.medium }]}>{m.label}</Text>
                            </Pressable>
                        );
                    })}
                    <Pressable onPress={showTopic} style={[styles.modeChip, { backgroundColor: c.soft }]}>
                        <Ionicons name="flame-outline" size={14} color={c.sub} />
                        <Text style={[styles.modeText, { color: c.sub, fontFamily: fonts.medium }]}>Today&apos;s question</Text>
                    </Pressable>
                </ScrollView>

                <View style={styles.inputRow}>
                    <TextInput
                        ref={inputRef}
                        value={input}
                        onChangeText={setInput}
                        placeholder={mode === 'analyze' ? 'Paste an argument or a claim to check' : 'Ask Orvelis anything'}
                        placeholderTextColor={c.faint}
                        style={[
                            styles.input,
                            { backgroundColor: c.card, borderColor: c.border, color: c.text, fontFamily: fonts.regular },
                            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                        ]}
                        multiline
                        numberOfLines={1}
                        maxLength={mode === 'analyze' ? 4000 : 2000}
                        returnKeyType="send"
                        blurOnSubmit
                        onSubmitEditing={send}
                    />
                    <Pressable
                        onPress={send}
                        disabled={!canSend}
                        accessibilityLabel="Send"
                        style={[styles.send, canSend ? { backgroundColor: c.accent } : { backgroundColor: c.card, borderColor: c.border, borderWidth: 1 }]}
                    >
                        {loading ? <ActivityIndicator size="small" color={c.sub} /> : <Ionicons name="arrow-up" size={20} color={canSend ? c.onAccent : c.faint} />}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
    mark: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    title: { fontSize: 20, letterSpacing: -0.3 },
    subtitle: { fontSize: 12.5, marginTop: 1 },
    newChat: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

    emptyContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
    hero: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
    heroSub: { fontSize: 15, lineHeight: 22, marginTop: 8 },
    sectionTitle: { fontSize: 12.5, letterSpacing: 0.4, marginTop: 18, marginBottom: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quick: { width: '48.4%', padding: 14, borderRadius: 18, borderWidth: 1, minHeight: 124 },
    quickIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    quickTitle: { fontSize: 14.5 },
    quickSub: { fontSize: 12.5, lineHeight: 17, marginTop: 3 },

    card: { padding: 18, borderRadius: 22, borderWidth: 1 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 13 },
    tag: { paddingHorizontal: 10, height: 24, borderRadius: 12, justifyContent: 'center' },
    tagText: { fontSize: 11.5 },
    topicQ: { fontSize: 21, lineHeight: 27, letterSpacing: -0.4, marginTop: 14 },
    sideRow: { flexDirection: 'row', gap: 10 },
    sideLabel: { width: 54, fontSize: 13 },
    sideText: { flex: 1, fontSize: 13.5, lineHeight: 19 },
    buttons: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
    primaryBtn: { flex: 1, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    ghostBtn: { height: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 14 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },

    chat: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18, flexGrow: 1 },
    msg: { marginTop: 18 },
    mine: { maxWidth: '84%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, borderBottomRightRadius: 6 },
    body: { fontSize: 15, lineHeight: 22 },
    miniMark: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
    claim: { fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
    tip: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, marginTop: 16, alignItems: 'flex-start' },
    followUp: { paddingHorizontal: 14, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center' },
    followUpText: { fontSize: 13 },

    composer: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
    modes: { flexDirection: 'row', gap: 8, paddingRight: 8 },
    modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 16 },
    modeText: { fontSize: 12.5 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    input: {
        flex: 1,
        minHeight: 46,
        maxHeight: 120,
        borderRadius: 23,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 13 : 10,
        paddingBottom: Platform.OS === 'ios' ? 13 : 10,
        fontSize: 16,
    },
    send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
