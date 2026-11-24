import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePalette } from '../../design-system/palette';
import { useArenaThread } from '../../lib/arena/useArenaData';
import { arenaThinkingPrompt, type ArenaPost, type ArenaSide } from '../../lib/arena/model';
import { OrvelisMark } from '../UI/OrvelisMark';

export const SIDES: { key: ArenaSide; label: string; icon: 'corner-up-right' | 'corner-up-left' | 'compass' }[] = [
    { key: 'FOR', label: 'For', icon: 'corner-up-right' }, { key: 'AGAINST', label: 'Against', icon: 'corner-up-left' }, { key: 'NEUTRAL', label: 'Open mind', icon: 'compass' },
];
export function ArenaAvatar({ name, uri, size = 28 }: { name: string; uri?: string; size?: number }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [uri]);
    return uri && !failed ? <Image accessible={false} onError={() => setFailed(true)} source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#DCE8F8', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'Inter_600SemiBold', color: '#506F96', fontSize: size * .37 }}>{name.charAt(0).toUpperCase()}</Text></View>;
}

export function ArenaThread({ post, initialSide, onClose, onPosted }: { post: ArenaPost; initialSide: ArenaSide; onClose: () => void; onPosted: () => void }) {
    const p = usePalette();
    const router = useRouter();
    const thread = useArenaThread(post.id);
    const [draft, setDraft] = useState('');
    const [side, setSide] = useState<ArenaSide>(initialSide);
    const input = useRef<React.ComponentRef<typeof TextInput>>(null);
    const alive = useRef(true);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    const blue = p.isDark ? '#AFCDF2' : '#4C719F';
    const submit = async () => {
        if (!thread.userId) { onClose(); router.push('/auth/login'); return; }
        const sent = await thread.postArgument(draft, side);
        if (sent && alive.current) { setDraft(''); onPosted(); }
    };
    const askOrvelis = () => {
        onClose();
        router.push({ pathname: '/(tabs)/ai', params: { question: arenaThinkingPrompt(post.content) } });
    };
    return <Modal visible transparent animationType="fade" onRequestClose={onClose} onShow={() => { if (initialSide !== 'NEUTRAL') input.current?.focus(); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close debate" onPress={onClose} style={StyleSheet.absoluteFill} />
            <View accessibilityViewIsModal style={[s.panel, { backgroundColor: p.bg }]}>
                <View style={s.top}><View style={s.row}><Feather name="git-merge" size={16} color={blue} /><Text style={[s.eyebrow, { color: blue }]}>THE OPEN FLOOR</Text></View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close debate" onPress={onClose} style={[s.close, { backgroundColor: p.soft }]}><Feather name="x" size={19} color={p.sub} /></Pressable></View>
                <ScrollView style={s.questionContainer} showsVerticalScrollIndicator={false}><Text accessibilityRole="header" aria-level={1} style={[s.question, { color: p.text }]}>{post.content}</Text></ScrollView>
                <View style={s.author}><ArenaAvatar name={post.authorName} uri={post.authorAvatar} size={22} /><Text style={[s.meta, { color: p.sub }]}>{post.authorName}</Text></View>
                <View style={[s.rule, { borderColor: p.border }]}><Text style={[s.section, { color: p.text }]}>Perspectives</Text><Pressable accessibilityRole="button" onPress={askOrvelis} style={s.row}><OrvelisMark size={19} color={blue} /><Text style={[s.small, { color: blue }]}>Think it through</Text><Feather name="arrow-up-right" size={13} color={blue} /></Pressable></View>
                <ScrollView style={s.arguments} contentContainerStyle={s.argumentsContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {thread.loading && !thread.argumentsList.length ? <View style={s.empty}><ActivityIndicator color={blue} /></View> : thread.error && !thread.argumentsList.length ? <View style={s.empty}><Text style={[s.copy, { color: p.sub }]}>{thread.error}</Text><Pressable accessibilityRole="button" onPress={thread.refresh}><Text style={[s.small, { color: blue }]}>Try again</Text></Pressable></View>
                        : !thread.argumentsList.length ? <View style={s.empty}><Feather name="message-circle" size={27} color={blue} /><Text style={[s.emptyTitle, { color: p.text }]}>A good argument starts somewhere.</Text><Text style={[s.copy, { color: p.sub }]}>Be the first to bring a reason, an example, or a different perspective.</Text></View>
                        : thread.argumentsList.map(argument => <View key={argument.id} style={[s.argument, { borderColor: p.border }]}>
                            <ArenaAvatar name={argument.author} uri={argument.avatar} size={32} />
                            <View style={{ flex: 1, minWidth: 0 }}><View style={s.argumentMeta}><Text style={[s.name, { color: p.text }]}>{argument.author}</Text><View style={[s.sideTag, { backgroundColor: p.cardHigh }]}><Text style={[s.sideTagText, { color: blue }]}>{SIDES.find(item => item.key === argument.side)?.label}</Text></View>{argument.aiAssisted && <Text style={[s.meta, { color: p.faint }]}>AI-assisted</Text>}</View>
                                <Text selectable style={[s.argumentText, { color: p.sub }]}>{argument.content}</Text>
                            </View>
                        </View>)}
                    {(thread.hasMore || thread.error && !!thread.argumentsList.length) && <Pressable accessibilityRole="button" disabled={thread.loading} onPress={thread.loadMore} style={s.more}><Text style={[s.small, { color: blue }]}>{thread.loading ? 'Loading…' : 'Read more perspectives'}</Text></Pressable>}
                </ScrollView>
                <View style={[s.composer, { backgroundColor: p.card, borderColor: p.border }]}>
                    <View accessibilityRole="tablist" accessibilityLabel="Your argument’s position" style={s.sides}>{SIDES.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: side === item.key }} onPress={() => { setSide(item.key); input.current?.focus(); }} style={[s.side, { backgroundColor: side === item.key ? p.cardHigh : 'transparent' }]}><Feather name={item.icon} size={14} color={side === item.key ? blue : p.faint} /><Text style={[s.small, { color: side === item.key ? blue : p.sub }]}>{item.label}</Text></Pressable>)}</View>
                    <TextInput ref={input} accessibilityLabel="Your argument" multiline value={draft} onChangeText={setDraft} maxLength={4000} placeholder={thread.userId ? 'Make your case. A reason, an example, or a source.' : 'Sign in to add your perspective.'} placeholderTextColor={p.faint} editable={!thread.posting && !!thread.userId} style={[s.input, { color: p.text }]} textAlignVertical="top" />
                    {!!thread.postError && <Text accessibilityRole="alert" style={[s.error, { color: p.sub }]}>{thread.postError}</Text>}
                    <View style={s.composerFooter}><Text style={[s.hint, { color: p.faint }]}>Challenge the idea. Respect the person.</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: thread.posting || !!thread.userId && !draft.trim() }} disabled={thread.posting || !!thread.userId && !draft.trim()} onPress={submit} style={[s.send, { backgroundColor: p.isDark ? '#C1D8F7' : '#223C5D', opacity: thread.userId && !draft.trim() ? .4 : 1 }]}>{thread.posting ? <ActivityIndicator color={p.isDark ? '#1E3551' : '#F3F7FE'} /> : <><Text style={[s.small, { color: p.isDark ? '#1E3551' : '#F3F7FE' }]}>{thread.userId ? 'Add argument' : 'Sign in to join'}</Text><Feather name="arrow-up-right" size={15} color={p.isDark ? '#1E3551' : '#F3F7FE'} /></>}</Pressable></View>
                </View>
            </View>
        </KeyboardAvoidingView>
    </Modal>;
}
const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(16,29,47,.48)', alignItems: 'center', justifyContent: 'center', padding: 16 },
    panel: { width: '100%', maxWidth: 820, maxHeight: '94%', height: '90%', borderRadius: 22, padding: 24, minHeight: 0 },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.6 }, close: { width: 33, height: 33, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    questionContainer: { flexGrow: 0, maxHeight: 145, marginTop: 16 },
    question: { fontFamily: 'Outfit_500Medium', fontSize: 27, lineHeight: 32, letterSpacing: -.7 }, author: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 13, marginBottom: 20 },
    meta: { fontFamily: 'Inter_400Regular', fontSize: 10 }, rule: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 14, borderTopWidth: 1 },
    section: { fontFamily: 'Outfit_500Medium', fontSize: 19 }, small: { fontFamily: 'Inter_500Medium', fontSize: 11 },
    arguments: { flex: 1, minHeight: 100 }, argumentsContent: { flexGrow: 1, paddingBottom: 8 }, empty: { flex: 1, minHeight: 130, gap: 11, justifyContent: 'center', alignItems: 'center', padding: 15 },
    emptyTitle: { fontFamily: 'Outfit_500Medium', fontSize: 20, textAlign: 'center' }, copy: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 20, textAlign: 'center', maxWidth: 400 },
    argument: { flexDirection: 'row', gap: 11, paddingVertical: 17, borderBottomWidth: StyleSheet.hairlineWidth }, argumentMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    name: { fontFamily: 'Inter_600SemiBold', fontSize: 11 }, sideTag: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 5 }, sideTagText: { fontFamily: 'Inter_500Medium', fontSize: 9 },
    argumentText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 21, marginTop: 9 }, more: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
    composer: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 11 }, sides: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' }, side: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 7, paddingHorizontal: 10, minHeight: 34 },
    input: { minHeight: 70, maxHeight: 130, paddingHorizontal: 4, paddingTop: 13, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 20, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) },
    composerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 }, hint: { fontFamily: 'Inter_400Regular', fontSize: 9 },
    send: { minHeight: 38, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, error: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, paddingVertical: 5 },
});
