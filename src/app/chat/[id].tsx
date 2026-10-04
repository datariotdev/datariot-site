import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useMessages, ChatMessage } from '../../lib/supabase/hooks/useMessages';
import { supabase } from '../../lib/supabase/client';
import { usePalette } from '../../design-system/palette';
import { Avatar } from '../../components/UI/Avatar';

const RUN_GAP_MS = 5 * 60 * 1000;

function dayLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const days = Math.round((startOf(now) - startOf(d)) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

interface Row {
    message: ChatMessage;
    day?: string;
    startsRun: boolean;
    endsRun: boolean;
}

/** Group neighbours from the same person into runs, and mark where a new day begins. */
function toRows(messages: ChatMessage[]): Row[] {
    return messages.map((message, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const at = new Date(message.created_at).getTime();
        const sameAsPrev = !!prev && prev.sender === message.sender && at - new Date(prev.created_at).getTime() < RUN_GAP_MS;
        const sameAsNext = !!next && next.sender === message.sender && new Date(next.created_at).getTime() - at < RUN_GAP_MS;
        const day = !prev || dayLabel(prev.created_at) !== dayLabel(message.created_at) ? dayLabel(message.created_at) : undefined;
        return { message, day, startsRun: !sameAsPrev || !!day, endsRun: !sameAsNext };
    });
}

/** Full-screen playback for a received clip. Mounted only while open. */
function VideoViewer({ url, onClose }: { url: string; onClose: () => void }) {
    const insets = useSafeAreaInsets();
    const player = useVideoPlayer(url, pl => {
        pl.loop = false;
        pl.play();
    });
    return (
        <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <VideoView player={player} style={{ flex: 1, width: '100%', height: '100%' }} contentFit="contain" nativeControls />
                <Pressable
                    onPress={onClose}
                    accessibilityLabel="Close video"
                    style={{ position: 'absolute', top: insets.top + 8, left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Ionicons name="close" size={22} color="#FFF" />
                </Pressable>
            </View>
        </Modal>
    );
}

export default function ChatScreen() {
    const { id, name, userId } = useLocalSearchParams<{ id: string; name?: string; userId?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const p = usePalette();

    const { messages, loading, error, sendMessage } = useMessages(id as string);
    const [inputText, setInputText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [playing, setPlaying] = useState<string | null>(null);
    const listRef = useRef<FlatList<Row>>(null);
    const placed = useRef(false);

    const title = (Array.isArray(name) ? name[0] : name) || 'Chat';
    const rows = useMemo(() => toRows(messages), [messages]);
    const canSend = !!inputText.trim();

    // Their photo for the header, when we know who they are
    useEffect(() => {
        if (!supabase || !userId) return;
        let cancelled = false;
        supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle().then(({ data }: { data: { avatar_url?: string | null } | null }) => {
            if (!cancelled) setAvatar(data?.avatar_url ?? null);
        });
        return () => { cancelled = true; };
    }, [userId]);

    const toEnd = (animated: boolean) => listRef.current?.scrollToEnd({ animated });
    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));
    const openProfile = () => { if (userId) router.push(`/user/${userId}` as any); };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text) return;
        setInputText('');
        await sendMessage(text);
    };

    const attachMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            await uploadMedia(result.assets[0].uri);
        }
    };

    const uploadMedia = async (uri: string) => {
        try {
            setUploading(true);
            const response = await fetch(uri);
            const blob = await response.blob();

            const fileExt = uri.split('.').pop() || 'mp4';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(filePath, blob, { contentType: `video/${fileExt === 'mov' ? 'quicktime' : fileExt}` });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
            await sendMessage('Sent a video', data.publicUrl, 'video');
        } catch (e) {
            console.error('Upload Error: ', e);
            if (Platform.OS === 'web') window.alert('The video could not be sent. Try again.');
            else Alert.alert('Video not sent', 'Check your connection and try again.');
        } finally {
            setUploading(false);
        }
    };

    const renderRow = ({ item }: { item: Row }) => {
        const { message: m, day, startsRun, endsRun } = item;
        const mine = m.sender === 'me';

        return (
            <View>
                {day ? (
                    <View style={styles.dayWrap}>
                        <View style={[styles.dayPill, { backgroundColor: p.soft }]}>
                            <Text style={[styles.dayText, { color: p.sub, fontFamily: p.fonts.medium }]}>{day}</Text>
                        </View>
                    </View>
                ) : null}

                <View style={[styles.line, { alignItems: mine ? 'flex-end' : 'flex-start', marginTop: day ? 0 : startsRun ? 14 : 3 }]}>
                    {m.media_url ? (
                        <Pressable
                            onPress={() => setPlaying(m.media_url)}
                            accessibilityLabel="Play video"
                            style={[styles.video, { backgroundColor: p.cardHigh, borderColor: p.border }]}
                        >
                            <View style={[styles.playDisc, { backgroundColor: p.accent }]}>
                                <Ionicons name="play" size={22} color={p.onAccent} style={{ marginLeft: 2 }} />
                            </View>
                            <Text style={[styles.videoLabel, { color: p.sub, fontFamily: p.fonts.medium }]}>Video message</Text>
                        </Pressable>
                    ) : (
                        <View
                            style={[
                                styles.bubble,
                                mine ? { backgroundColor: p.accent } : { backgroundColor: p.card, borderWidth: 1, borderColor: p.border },
                                endsRun && (mine ? styles.tailRight : styles.tailLeft),
                            ]}
                        >
                            <Text selectable style={[styles.msgText, { color: mine ? p.onAccent : p.text, fontFamily: p.fonts.regular }]}>{m.content}</Text>
                        </View>
                    )}
                    {endsRun ? <Text style={[styles.time, { color: p.faint, fontFamily: p.fonts.regular }]}>{m.time}</Text> : null}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: p.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: p.border }]}>
                <Pressable onPress={goBack} hitSlop={8} accessibilityLabel="Back" style={styles.back}>
                    <Ionicons name="chevron-back" size={26} color={p.text} />
                </Pressable>
                <Pressable onPress={openProfile} disabled={!userId} style={styles.who}>
                    <Avatar uri={avatar} name={title} size={38} />
                    <View style={{ flexShrink: 1 }}>
                        <Text numberOfLines={1} style={[styles.whoName, { color: p.text, fontFamily: p.fonts.bold }]}>{title}</Text>
                        {userId ? <Text style={[styles.whoSub, { color: p.faint, fontFamily: p.fonts.regular }]}>View profile</Text> : null}
                    </View>
                </Pressable>
                <View style={{ width: 44 }} />
            </View>

            {error ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={40} color={p.sub} />
                    <Text style={[styles.emptyTitle, { color: p.text, fontFamily: p.fonts.bold }]}>This chat did not load</Text>
                    <Text style={[styles.emptySub, { color: p.sub, fontFamily: p.fonts.regular }]}>{error}</Text>
                    <Pressable onPress={goBack} style={[styles.cta, { backgroundColor: p.accent }]}>
                        <Text style={[styles.ctaText, { color: p.onAccent, fontFamily: p.fonts.semibold }]}>Back to messages</Text>
                    </Pressable>
                </View>
            ) : loading && rows.length === 0 ? (
                <View style={styles.center}><ActivityIndicator color={p.sub} /></View>
            ) : rows.length === 0 ? (
                <View style={styles.center}>
                    <Avatar uri={avatar} name={title} size={84} />
                    <Text style={[styles.emptyTitle, { color: p.text, fontFamily: p.fonts.bold }]}>Say hi to {title}</Text>
                    <Text style={[styles.emptySub, { color: p.sub, fontFamily: p.fonts.regular }]}>Your messages will show up here.</Text>
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={rows}
                    keyExtractor={r => r.message.id}
                    renderItem={renderRow}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => {
                        // Land on the latest message without animating the first time
                        toEnd(placed.current);
                        placed.current = true;
                    }}
                />
            )}

            <View style={[styles.composer, { borderTopColor: p.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
                <Pressable
                    onPress={attachMedia}
                    disabled={uploading}
                    accessibilityLabel="Send a video"
                    style={[styles.round, { backgroundColor: p.card, borderColor: p.border, borderWidth: 1 }]}
                >
                    {uploading ? <ActivityIndicator size="small" color={p.sub} /> : <Ionicons name="add" size={24} color={p.text} />}
                </Pressable>

                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Message"
                    placeholderTextColor={p.faint}
                    multiline
                    numberOfLines={1}
                    maxLength={4000}
                    style={[
                        styles.input,
                        { backgroundColor: p.card, borderColor: p.border, color: p.text, fontFamily: p.fonts.regular },
                        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                    ]}
                    onFocus={() => setTimeout(() => toEnd(true), 120)}
                />

                <Pressable
                    onPress={handleSend}
                    disabled={!canSend}
                    accessibilityLabel="Send"
                    style={[styles.round, canSend ? { backgroundColor: p.accent } : { backgroundColor: p.card, borderColor: p.border, borderWidth: 1 }]}
                >
                    <Ionicons name="arrow-up" size={21} color={canSend ? p.onAccent : p.faint} />
                </Pressable>
            </View>

            {playing ? <VideoViewer url={playing} onClose={() => setPlaying(null)} /> : null}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    who: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 44 },
    whoName: { fontSize: 16 },
    whoSub: { fontSize: 11.5, marginTop: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
    emptyTitle: { fontSize: 18, marginTop: 10 },
    emptySub: { fontSize: 14.5, textAlign: 'center' },
    cta: { marginTop: 14, height: 44, paddingHorizontal: 24, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 14.5 },
    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexGrow: 1 },
    dayWrap: { alignItems: 'center', marginTop: 20, marginBottom: 8 },
    dayPill: { paddingHorizontal: 12, height: 24, borderRadius: 12, justifyContent: 'center' },
    dayText: { fontSize: 11.5 },
    line: { gap: 4 },
    bubble: { maxWidth: '80%', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
    tailRight: { borderBottomRightRadius: 6 },
    tailLeft: { borderBottomLeftRadius: 6 },
    msgText: { fontSize: 15.5, lineHeight: 21 },
    time: { fontSize: 11, marginHorizontal: 4 },
    video: { width: 230, height: 150, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    playDisc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    videoLabel: { fontSize: 12.5 },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
    round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 12 : 9,
        paddingBottom: Platform.OS === 'ios' ? 12 : 9,
        fontSize: 16,
    },
});
