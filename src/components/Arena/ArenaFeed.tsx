import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cancelAnimation, Easing, FadeInDown, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { usePalette } from '../../design-system/palette';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useArenaFeed } from '../../lib/arena/useArenaData';
import { ARENA_TOPICS, arenaThinkingPrompt, filterArenaPosts, spotlightPost, type ArenaFilter, type ArenaPost, type ArenaSide, type ArenaTopic } from '../../lib/arena/model';
import { ArenaAvatar, ArenaThread } from './ArenaThread';
import { OrvelisMark } from '../UI/OrvelisMark';

const FILTERS: { key: ArenaFilter; label: string }[] = [
    { key: 'latest', label: 'Open floor' }, { key: 'unanswered', label: 'Needs a reply' }, { key: 'mine', label: 'My debates' },
];
const STARTERS = [
    { tag: 'AI & EDUCATION', question: 'Should AI tools be allowed in exams?' },
    { tag: 'SOCIETY & ETHICS', question: 'Is privacy worth trading for convenience?' },
    { tag: 'SCIENCE & THE WORLD', question: 'Should space exploration be publicly funded?' },
];
function PerspectiveArtwork() {
    const position = useSharedValue(0);
    useEffect(() => {
        position.value = withRepeat(withTiming(9, { duration: 4700, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }), -1, true, undefined, ReduceMotion.System);
        return () => cancelAnimation(position);
    }, [position]);
    const left = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }, { rotate: '-28deg' }] }));
    const right = useAnimatedStyle(() => ({ transform: [{ translateX: -position.value }, { rotate: '28deg' }] }));
    return <View accessible={false} pointerEvents="none" style={s.artwork}>
        <Animated.View style={[s.arc, { left: 20, top: 37, borderColor: '#80A6D5', borderRightColor: 'transparent', borderBottomColor: 'transparent' }, left]} />
        <Animated.View style={[s.arc, { right: 20, bottom: 38, borderColor: '#D5E5FB', borderLeftColor: 'transparent', borderTopColor: 'transparent' }, right]} />
        <View style={s.artCenter}><Feather name="git-merge" size={36} color="#D9E9FF" /></View>
        <Text style={[s.artLabel, { top: 12, left: 25 }]}>A DIFFERENT ANGLE</Text>
        <Text style={[s.artLabel, { bottom: 15, right: 4 }]}>A STRONGER IDEA</Text>
    </View>;
}
const dateLabel = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }); };

function DebateRow({ post, onRead, onSide, onThink, index }: { post: ArenaPost; onRead: () => void; onSide: (side: ArenaSide) => void; onThink: () => void; index: number }) {
    const p = usePalette();
    const [hovered, setHovered] = useState(false);
    const topic = ARENA_TOPICS.find(item => item.key === post.topic);
    const blue = p.isDark ? '#B2CFF4' : '#597BA4';
    return <View style={[s.debateCard, { backgroundColor: p.card, borderColor: hovered ? (p.isDark ? '#3C587A' : '#C9D9ED') : 'transparent' }]}>
        <View style={s.debateTop}><View style={s.category}><Text style={[s.index, { color: p.faint }]}>{String(index + 1).padStart(2, '0')}</Text><View style={[s.smallDot, { backgroundColor: '#91AED2' }]} /><Text style={[s.categoryText, { color: blue }]}>{post.topic === 'all' ? 'An open question' : topic?.label}</Text></View><Text style={[s.date, { color: p.faint }]}>{dateLabel(post.createdAt)}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Read debate: ${post.content}`} onPress={onRead} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={s.questionButton}>
            <Text numberOfLines={3} style={[s.debateQuestion, { color: p.text }]}>{post.content}</Text><View style={[s.openArrow, { backgroundColor: hovered ? p.cardHigh : 'transparent' }]}><Feather name="arrow-up-right" size={21} color={blue} /></View>
        </Pressable>
        <View style={s.author}><ArenaAvatar name={post.authorName} uri={post.authorAvatar} size={24} /><Text numberOfLines={1} style={[s.authorName, { color: p.sub }]}>{post.authorName}</Text><View style={[s.smallDot, { backgroundColor: p.faint, width: 3, height: 3 }]} /><Text style={[s.authorName, { color: p.faint }]}>{post.comments ? `${post.comments} ${post.comments === 1 ? 'perspective' : 'perspectives'}` : 'The floor is open'}</Text></View>
        <View style={[s.cardFooter, { borderColor: p.border }]}><View style={s.positions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Argue for: ${post.content}`} onPress={() => onSide('FOR')} style={[s.position, { backgroundColor: p.cardHigh }]}><Feather name="corner-up-right" size={14} color={blue} /><Text style={[s.positionText, { color: blue }]}>Argue for</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Argue against: ${post.content}`} onPress={() => onSide('AGAINST')} style={[s.position, { backgroundColor: p.soft }]}><Feather name="corner-up-left" size={14} color={p.sub} /><Text style={[s.positionText, { color: p.sub }]}>Argue against</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={onRead} style={s.readButton}><Text style={[s.positionText, { color: p.faint }]}>Read first</Text></Pressable>
        </View><Pressable accessibilityRole="button" accessibilityLabel={`Think through this debate with Orvelis: ${post.content}`} onPress={onThink} style={s.thinkButton}><OrvelisMark size={21} color={blue} /><Text style={[s.positionText, { color: p.sub }]}>Orvelis</Text></Pressable></View>
    </View>;
}

export function ArenaFeed({ desktop = false, paddingTop = 0 }: { desktop?: boolean; paddingTop?: number }) {
    const p = usePalette();
    const router = useRouter();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [topic, setTopic] = useState<ArenaTopic>('all');
    const [filter, setFilter] = useState<ArenaFilter>('latest');
    const [width, setWidth] = useState(0);
    const [thread, setThread] = useState<{ post: ArenaPost; side: ArenaSide } | null>(null);
    const feed = useArenaFeed(search, topic);
    const posts = useMemo(() => filterArenaPosts(feed.posts, filter, user?.id), [feed.posts, filter, user?.id]);
    const featured = spotlightPost(feed.posts);
    const wide = desktop && width >= 1000;
    const blue = p.isDark ? '#B4CFF2' : '#52749D';
    const browsing = !search.trim() && topic === 'all' && filter === 'latest';
    const open = (post: ArenaPost, side: ArenaSide = 'NEUTRAL') => setThread({ post, side });
    const think = (post?: ArenaPost) => router.push(post ? { pathname: '/(tabs)/ai', params: { question: arenaThinkingPrompt(post.content) } } : '/(tabs)/ai');
    const start = (question?: string) => router.push(user ? { pathname: '/publish', params: question ? { thesis: question } : {} } : '/auth/login');
    const reset = () => { setSearch(''); setTopic('all'); setFilter('latest'); };

    return <View style={s.root} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        <ScrollView contentContainerStyle={[s.content, { paddingTop: paddingTop + (desktop ? 26 : 16), paddingHorizontal: desktop ? 0 : 16 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInDown.duration(420).reduceMotion(ReduceMotion.System)}>
                <View style={s.heading}><View style={s.headingCopy}><Text accessibilityRole="header" aria-level={1} style={[s.title, { color: p.text }]}>Arena<Text style={{ color: '#8EADD5' }}>.</Text></Text>{width > 650 && <Text style={[s.headingNote, { color: p.faint }]}>Where ideas meet their match.</Text>}</View>
                    <Pressable accessibilityRole="button" onPress={() => start()} style={[s.start, { backgroundColor: p.card }]}><Feather name="plus" size={16} color={p.text} /><Text style={[s.smallBold, { color: p.text }]}>Start a debate</Text></Pressable></View>
                {browsing && <LinearGradient colors={p.isDark ? ['#13263F', '#243E61'] : ['#1D304A', '#2D4D74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, !desktop && { padding: 24 }]}>
                    <View style={[s.heroCopy, width > 830 && { maxWidth: '70%' }]}>
                        <View style={s.heroEyebrow}><View style={[s.smallDot, { backgroundColor: '#A1C2ED' }]} /><Text style={s.heroLabel}>{featured ? 'A QUESTION WORTH CHALLENGING' : 'GOOD QUESTIONS. BETTER ARGUMENTS.'}</Text></View>
                        <Text accessibilityRole="header" aria-level={2} style={[s.heroQuestion, { fontSize: desktop ? 37 : 29, lineHeight: desktop ? 42 : 34 }]}>{featured?.content || 'Some ideas deserve more than a quick take.'}</Text>
                        <Text style={s.heroDescription}>{featured ? 'Pick a perspective. Bring your reasoning. Leave room to rethink.' : 'Meet a different perspective, challenge an assumption, and make a stronger case.'}</Text>
                        <View style={s.heroActions}>{featured ? <>
                            <Pressable accessibilityRole="button" onPress={() => open(featured, 'FOR')} style={s.heroPrimary}><Feather name="corner-up-right" size={15} color="#233D60" /><Text style={[s.smallBold, { color: '#233D60' }]}>Make the case for</Text></Pressable>
                            <Pressable accessibilityRole="button" onPress={() => open(featured, 'AGAINST')} style={s.heroSecondary}><Text style={[s.smallBold, { color: '#D2E4FD' }]}>Challenge the idea</Text><Feather name="arrow-up-right" size={15} color="#D2E4FD" /></Pressable>
                        </> : <Pressable accessibilityRole="button" onPress={() => start()} style={s.heroPrimary}><Text style={[s.smallBold, { color: '#233D60' }]}>Put an idea to the test</Text><Feather name="arrow-up-right" size={15} color="#233D60" /></Pressable>}</View>
                        <View style={s.heroBottom}><Feather name="message-circle" size={13} color="#9FB9DB" /><Text style={s.heroBottomText}>{featured?.comments ? `${featured.comments} perspectives to consider` : 'The strongest argument hasn’t been made yet.'}</Text></View>
                    </View>
                    {width > 830 && <PerspectiveArtwork />}
                </LinearGradient>}
            </Animated.View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.topics}>{ARENA_TOPICS.map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: topic === item.key }} onPress={() => setTopic(item.key)} style={[s.topic, { backgroundColor: topic === item.key ? (p.isDark ? '#D3E3F9' : '#243A56') : p.card }]}><Feather name={item.icon} size={15} color={topic === item.key ? (p.isDark ? '#1C3554' : '#EFF5FE') : p.sub} /><Text style={[s.topicLabel, { color: topic === item.key ? (p.isDark ? '#1C3554' : '#EFF5FE') : p.sub }]}>{item.label}</Text></Pressable>)}</ScrollView>
            <View style={[s.columns, !wide && { flexDirection: 'column' }]}>
                <View style={s.main}>
                    <View style={[s.toolbar, width < 630 && { flexDirection: 'column', alignItems: 'stretch', gap: 12 }, { borderColor: p.border }]}>
                        <View accessibilityRole="tablist" style={s.tabs}>{FILTERS.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: filter === item.key }} onPress={() => setFilter(item.key)} style={[s.tab, { borderBottomColor: filter === item.key ? blue : 'transparent' }]}><Text style={[s.tabLabel, { color: filter === item.key ? p.text : p.faint }]}>{item.label}</Text></Pressable>)}</View>
                        <View style={[s.search, { backgroundColor: p.cardHigh }, width < 630 && { width: '100%', marginBottom: 13 }]}><Feather name="search" size={15} color={p.faint} /><TextInput accessibilityLabel="Search Arena debates" placeholder="Find a question…" value={search} onChangeText={setSearch} placeholderTextColor={p.faint} style={[s.searchInput, { color: p.text }]} returnKeyType="search" />{!!search && <Pressable accessibilityRole="button" accessibilityLabel="Clear debate search" onPress={() => setSearch('')} hitSlop={8}><Feather name="x" size={14} color={p.sub} /></Pressable>}</View>
                    </View>
                    <View style={s.sectionHeading}><View><Text accessibilityRole="header" aria-level={2} style={[s.sectionTitle, { color: p.text }]}>{filter === 'mine' ? 'Your ideas, out in the open.' : filter === 'unanswered' ? 'Bring the first perspective.' : 'The floor is yours.'}</Text><Text style={[s.sectionDescription, { color: p.faint }]}>{filter === 'mine' ? 'Questions you have put to the community.' : filter === 'unanswered' ? 'A fresh point of view could start something.' : 'Read a different take. Make a thoughtful case.'}</Text></View><View style={[s.floorIcon, { backgroundColor: p.cardHigh }]}><Feather name="git-merge" size={20} color={blue} /></View></View>
                    {feed.loading && !feed.posts.length ? <View style={s.empty}><ActivityIndicator color={blue} /><Text style={[s.emptyCopy, { color: p.sub }]}>Opening the floor…</Text></View>
                        : !posts.length ? <View style={[s.empty, { backgroundColor: p.card, borderRadius: 16 }]}><Feather name={feed.error ? 'wifi-off' : filter === 'mine' ? 'edit-3' : 'message-circle'} size={27} color={blue} /><Text style={[s.emptyTitle, { color: p.text }]}>{feed.error ? 'The floor is quiet for a moment.' : filter === 'mine' && !user ? 'Your ideas belong here, too.' : filter === 'mine' ? 'Put your first idea to the test.' : search || topic !== 'all' ? 'That question is still waiting to be asked.' : filter === 'unanswered' ? 'Every question has a perspective.' : 'A good debate starts with one question.'}</Text><Text style={[s.emptyCopy, { color: p.sub }]}>{feed.error || (filter === 'mine' && !user ? 'Sign in to start a debate and see your questions here.' : search || topic !== 'all' ? 'Try another topic, broaden your search, or bring a question of your own.' : filter === 'unanswered' ? 'Explore the open floor and add a fresh angle to an existing discussion.' : 'Ask something people can meaningfully disagree about.')}</Text>
                            <Pressable accessibilityRole="button" onPress={feed.error ? feed.refresh : filter === 'mine' || !search.trim() && topic === 'all' && filter === 'latest' ? () => start() : reset} style={[s.emptyButton, { backgroundColor: p.cardHigh }]}><Text style={[s.smallBold, { color: blue }]}>{feed.error ? 'Try again' : filter === 'mine' ? user ? 'Start a debate' : 'Sign in' : !search.trim() && topic === 'all' && filter === 'latest' ? 'Start a debate' : 'Explore all questions'}</Text><Feather name="arrow-right" size={15} color={blue} /></Pressable>
                        </View> : <View style={s.debates}>{posts.map((post, index) => <DebateRow key={post.id} post={post} index={index} onRead={() => open(post)} onSide={side => open(post, side)} onThink={() => think(post)} />)}</View>}
                    {!!feed.error && !!posts.length && <Text accessibilityRole="alert" style={[s.emptyCopy, { color: p.sub, marginTop: 14 }]}>{feed.error}</Text>}
                    {(feed.hasMore || feed.error && !!posts.length) && <Pressable accessibilityRole="button" onPress={feed.loadMore} disabled={feed.loading} style={[s.loadMore, { backgroundColor: p.card }]}>{feed.loading ? <ActivityIndicator color={blue} /> : <><Text style={[s.smallBold, { color: p.sub }]}>{feed.error ? 'Try loading more' : 'More questions to consider'}</Text><Feather name="arrow-down" size={14} color={p.sub} /></>}</Pressable>}
                </View>
                <View style={[s.sidebar, { width: wide ? 278 : '100%' }]}>
                    <View style={[s.orvelis, { backgroundColor: p.isDark ? '#1B2C43' : '#E9F1FC' }]}><View style={s.between}><OrvelisMark size={30} color={blue} /><Text style={[s.orvelisLabel, { color: blue }]}>YOUR THINKING PARTNER</Text></View><Text style={[s.orvelisTitle, { color: p.text }]}>A second thought{'\n'}can change everything.</Text><Text style={[s.sidebarCopy, { color: p.sub }]}>Ask Orvelis to find assumptions, strengthen a counterargument, or explain what evidence is missing.</Text><Pressable accessibilityRole="button" onPress={() => think(featured)} style={s.orvelisAction}><Text style={[s.smallBold, { color: blue }]}>{featured ? 'Think through this question' : 'Think with Orvelis'}</Text><Feather name="arrow-up-right" size={16} color={blue} /></Pressable></View>
                    <View style={s.starters}><View style={s.sidebarHeading}><Feather name="edit-3" size={17} color={blue} /><Text accessibilityRole="header" aria-level={2} style={[s.sidebarTitle, { color: p.text }]}>Bring a better question.</Text></View><Text style={[s.sidebarCopy, { color: p.faint, marginTop: 8 }]}>A few starting points. Make one your own.</Text>{STARTERS.map(item => <Pressable key={item.question} accessibilityRole="button" accessibilityLabel={`Draft a debate: ${item.question}`} onPress={() => start(item.question)} style={[s.starter, { borderColor: p.border }]}><View style={{ flex: 1 }}><Text style={[s.starterTag, { color: blue }]}>{item.tag}</Text><Text style={[s.starterQuestion, { color: p.sub }]}>{item.question}</Text></View><Feather name="arrow-up-right" size={14} color={p.faint} /></Pressable>)}</View>
                    <View style={[s.betterArguments, { borderColor: p.border }]}><Text style={[s.sidebarTitle, { color: p.text }]}>Make the argument count.</Text>{[['01', 'Bring a reason', 'An example or a source goes further than a louder opinion.'], ['02', 'Find the strongest counterpoint', 'Understand a position before you challenge it.'], ['03', 'Leave room to rethink', 'Changing your mind is part of the conversation.']].map(([number, title, copy]) => <View key={number} style={s.tip}><Text style={[s.tipNumber, { color: '#8DA9CC' }]}>{number}</Text><View style={{ flex: 1 }}><Text style={[s.tipTitle, { color: p.sub }]}>{title}</Text><Text style={[s.tipCopy, { color: p.faint }]}>{copy}</Text></View></View>)}</View>
                </View>
            </View>
            <Text style={[s.endnote, { color: p.faint }]}>Strong opinions. Open minds.</Text>
        </ScrollView>
        {thread && <ArenaThread key={thread.post.id} post={thread.post} initialSide={thread.side} onClose={() => setThread(null)} onPosted={feed.refresh} />}
    </View>;
}
const s = StyleSheet.create({
    root: { flex: 1, minWidth: 0, minHeight: 0 }, content: { paddingBottom: 100 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 13, marginBottom: 24 },
    headingCopy: { flexDirection: 'row', alignItems: 'center', gap: 22 }, title: { fontFamily: 'Outfit_600SemiBold', fontSize: 39, lineHeight: 45, letterSpacing: -1.6 }, headingNote: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6 },
    start: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 39, paddingHorizontal: 14, borderRadius: 9 }, smallBold: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    hero: { minHeight: 270, borderRadius: 22, paddingVertical: 30, paddingHorizontal: 33, overflow: 'hidden' }, heroCopy: { zIndex: 1 }, heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    heroLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 1.5, color: '#AEC9ED' }, heroQuestion: { fontFamily: 'Outfit_500Medium', color: '#F0F6FF', letterSpacing: -1.1, marginTop: 19 },
    heroDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 20, color: '#B6C9E3', marginTop: 12 }, heroActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 18, marginTop: 24 },
    heroPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#D5E5FC', paddingHorizontal: 16, minHeight: 40, borderRadius: 9 }, heroSecondary: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 40 },
    heroBottom: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17 }, heroBottomText: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#9FB9DB' },
    artwork: { position: 'absolute', right: 13, top: 24, bottom: 22, width: 275, alignItems: 'center', justifyContent: 'center' }, arc: { position: 'absolute', width: 178, height: 178, borderRadius: 110, borderWidth: 21, opacity: .7 },
    artCenter: { width: 74, height: 74, borderRadius: 25, backgroundColor: 'rgba(208,228,254,.08)', justifyContent: 'center', alignItems: 'center' }, artLabel: { position: 'absolute', fontFamily: 'Inter_500Medium', fontSize: 8, letterSpacing: 1.7, color: '#8EADD4' },
    topics: { flexDirection: 'row', gap: 8, paddingVertical: 24 }, topic: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 39, paddingHorizontal: 15, borderRadius: 22 }, topicLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
    columns: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' }, main: { flex: 1, width: '100%', minWidth: 0 }, toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, gap: 12 },
    tabs: { flexDirection: 'row', gap: 23 }, tab: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, paddingVertical: 13 }, tabLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    search: { width: 205, height: 32, borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11 }, searchInput: { flex: 1, minWidth: 0, padding: 0, height: 32, fontFamily: 'Inter_400Regular', fontSize: 11, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 24, marginBottom: 20 }, sectionTitle: { fontFamily: 'Outfit_500Medium', fontSize: 24, lineHeight: 29, letterSpacing: -.65 }, sectionDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 18, marginTop: 4 }, floorIcon: { width: 37, height: 37, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    debates: { gap: 14 }, debateCard: { borderWidth: 1, paddingHorizontal: 21, paddingTop: 18, paddingBottom: 12, borderRadius: 14 }, debateTop: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
    category: { flexDirection: 'row', gap: 8, alignItems: 'center' }, index: { fontFamily: 'Inter_500Medium', fontSize: 10, marginRight: 4 }, smallDot: { width: 4, height: 4, borderRadius: 3 }, categoryText: { fontFamily: 'Inter_500Medium', fontSize: 10 }, date: { fontFamily: 'Inter_400Regular', fontSize: 9 },
    questionButton: { flexDirection: 'row', alignItems: 'flex-start', gap: 17, marginTop: 14 }, debateQuestion: { flex: 1, fontFamily: 'Outfit_500Medium', fontSize: 25, lineHeight: 31, letterSpacing: -.6 }, openArrow: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    author: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17, marginBottom: 17, flexWrap: 'wrap' }, authorName: { fontFamily: 'Inter_400Regular', fontSize: 10 },
    cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 11, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', gap: 7 }, positions: { flexDirection: 'row', gap: 7, alignItems: 'center', flexWrap: 'wrap' },
    position: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32, paddingHorizontal: 10, borderRadius: 7 }, positionText: { fontFamily: 'Inter_500Medium', fontSize: 10 }, readButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 5 }, thinkButton: { flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 32 },
    sidebar: { flexShrink: 0, gap: 26, paddingTop: 6 }, orvelis: { padding: 21, borderRadius: 15 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }, orvelisLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 7, letterSpacing: 1.1 },
    orvelisTitle: { fontFamily: 'Outfit_500Medium', fontSize: 26, lineHeight: 29, letterSpacing: -.7, marginTop: 19 }, sidebarCopy: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 19, marginTop: 13 }, orvelisAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, minHeight: 33, marginTop: 19 },
    starters: {}, sidebarHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sidebarTitle: { fontFamily: 'Outfit_500Medium', fontSize: 18, letterSpacing: -.4 },
    starter: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingVertical: 17, borderBottomWidth: StyleSheet.hairlineWidth }, starterTag: { fontFamily: 'Inter_600SemiBold', fontSize: 7, letterSpacing: 1 }, starterQuestion: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 19, marginTop: 7 },
    betterArguments: { borderTopWidth: 1, paddingTop: 22 }, tip: { flexDirection: 'row', gap: 12, marginTop: 19 }, tipNumber: { fontFamily: 'Inter_500Medium', fontSize: 10, paddingTop: 2 }, tipTitle: { fontFamily: 'Inter_500Medium', fontSize: 11 }, tipCopy: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 17, marginTop: 5 },
    empty: { paddingVertical: 45, paddingHorizontal: 24, gap: 15, alignItems: 'center' }, emptyTitle: { fontFamily: 'Outfit_500Medium', fontSize: 24, lineHeight: 28, textAlign: 'center', letterSpacing: -.5 }, emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 20, textAlign: 'center', maxWidth: 370 },
    emptyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, minHeight: 42, paddingHorizontal: 19, borderRadius: 8, marginTop: 6 }, loadMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 42, alignSelf: 'center', marginTop: 24, borderRadius: 9, paddingHorizontal: 22 },
    endnote: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 42 },
});
