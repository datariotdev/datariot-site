import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMessages, ChatMessage } from '../../lib/supabase/hooks/useMessages';
import { supabase } from '../../lib/supabase/client';
import { FONT, NO_OUTLINE, ON_VIDEO, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { Avatar } from '../../components/core/Avatar';
import { IconButton } from '../../components/core/IconButton';
import { EmptyState } from '../../components/core/EmptyState';
import { VideoViewer } from '../../components/core/VideoViewer';
import { notify } from '../../lib/utils/dialogs';

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
    /** a date heading goes above this one */
    day?: string;
    /** first of a run from the same person */
    startsRun: boolean;
    /** last of a run: gets the tail and the time */
    endsRun: boolean;
}

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

export default function ChatScreen() {
    const { id, name, userId } = useLocalSearchParams<{ id: string; name?: string; userId?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();

    const { messages, loading, error, sendMessage } = useMessages(id as string);
    const [text, setText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [playing, setPlaying] = useState<string | null>(null);
    const listRef = useRef<FlatList<Row>>(null);
    const placed = useRef(false);

    const title = (Array.isArray(name) ? name[0] : name) || 'Chat';
    const rows = useMemo(() => toRows(messages), [messages]);
    const canSend = !!text.trim();

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

    const send = async () => {
        const body = text.trim();
        if (!body) return;
        setText('');
        const ok = await sendMessage(body);
        if (!ok) {
            // Give the words back so nothing typed is lost
            setText(current => current || body);
            notify('Message not sent', 'Check your connection and try again.');
        }
    };

    const attach = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });
        if (result.canceled || !result.assets?.[0]) return;
        await upload(result.assets[0].uri);
    };

    const upload = async (uri: string) => {
        try {
            setUploading(true);
            const response = await fetch(uri);
            const blob = await response.blob();

            const ext = uri.split('.').pop() || 'mp4';
            const path = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(path, blob, { contentType: `video/${ext === 'mov' ? 'quicktime' : ext}` });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
            const ok = await sendMessage('Video', data.publicUrl, 'video');
            if (!ok) throw new Error('send failed');
        } catch (e) {
            console.error('Upload error:', e);
            notify('Video not sent', 'Check your connection and try again.');
        } finally {
            setUploading(false);
        }
    };

    const renderRow = ({ item }: { item: Row }) => {
        const { message: m, day, startsRun, endsRun } = item;
        const mine = m.sender === 'me';
        const isVideo = !!m.media_url;

        return (
            <View>
                {day ? <Txt variant="caption" tone="tertiary" style={styles.day}>{day}</Txt> : null}
                <View style={[styles.line, { alignItems: mine ? 'flex-end' : 'flex-start', marginTop: day ? 0 : startsRun ? 14 : 3 }]}>
                    {isVideo ? (
                        <Pressable
                            onPress={() => setPlaying(m.media_url)}
                            accessibilityRole="button"
                            accessibilityLabel="Play video"
                            style={[styles.video, { backgroundColor: c.surfaceHigh, borderColor: c.hairline }]}
                        >
                            <View style={[styles.playDisc, { backgroundColor: ON_VIDEO.glassStrong }]}>
                                <Ionicons name="play" size={22} color={ON_VIDEO.text} style={{ marginLeft: 2 }} />
                            </View>
                            <Txt variant="caption" tone="secondary" style={{ marginTop: 10 }}>Video</Txt>
                        </Pressable>
                    ) : (
                        <View
                            style={[
                                styles.bubble,
                                mine ? { backgroundColor: c.accent } : { backgroundColor: c.surfaceHigh },
                                endsRun && (mine ? styles.tailRight : styles.tailLeft),
                            ]}
                        >
                            <Txt variant="body" selectable style={{ color: mine ? c.onAccent : c.text }}>{m.content}</Txt>
                        </View>
                    )}
                    {endsRun ? <Txt variant="micro" tone="tertiary" style={styles.time}>{m.time}</Txt> : null}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: c.hairline }]}>
                <IconButton name="chevron-back" label="Back" onPress={goBack} />
                <Pressable onPress={openProfile} disabled={!userId} accessibilityRole="button" accessibilityLabel={`${title}'s profile`} style={styles.who}>
                    <Avatar uri={avatar} name={title} size={34} />
                    <Txt variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Txt>
                </Pressable>
                <View style={{ width: 44 }} />
            </View>

            {error ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <EmptyState icon="alert-circle-outline" title="This chat did not load" body={error} actionLabel="Back to messages" onAction={goBack} />
                </View>
            ) : loading && rows.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator color={c.textSecondary} />
                </View>
            ) : rows.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <EmptyState icon="chatbubble-ellipses-outline" title={`Say hi to ${title}`} body="Your messages will show up here." />
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

            <View style={[styles.composer, { borderTopColor: c.hairline, paddingBottom: Math.max(insets.bottom, 12) }]}>
                <Pressable
                    onPress={attach}
                    disabled={uploading}
                    accessibilityRole="button"
                    accessibilityLabel="Send a video"
                    style={[styles.round, { backgroundColor: c.surface, borderColor: c.hairline, borderWidth: 1 }]}
                >
                    {uploading ? <ActivityIndicator size="small" color={c.textSecondary} /> : <Ionicons name="add" size={22} color={c.text} />}
                </Pressable>

                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Message"
                    placeholderTextColor={c.textTertiary}
                    multiline
                    numberOfLines={1}
                    maxLength={4000}
                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.hairline, color: c.text }, NO_OUTLINE]}
                    onFocus={() => setTimeout(() => toEnd(true), 120)}
                />

                <Pressable
                    onPress={send}
                    disabled={!canSend}
                    accessibilityRole="button"
                    accessibilityLabel="Send"
                    style={[styles.round, canSend ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderColor: c.hairline, borderWidth: 1 }]}
                >
                    <Ionicons name="arrow-up" size={20} color={canSend ? c.onAccent : c.textTertiary} />
                </Pressable>
            </View>

            {playing ? <VideoViewer url={playing} onClose={() => setPlaying(null)} /> : null}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
    who: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 44, paddingHorizontal: 8 },
    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexGrow: 1 },
    day: { textAlign: 'center', marginTop: 18, marginBottom: 6 },
    line: { gap: 4 },
    bubble: { maxWidth: '80%', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
    tailRight: { borderBottomRightRadius: 6 },
    tailLeft: { borderBottomLeftRadius: 6 },
    video: { width: 220, height: 148, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    playDisc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    time: { marginHorizontal: 4 },
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
        fontFamily: FONT.regular,
        fontSize: 16,
    },
});
