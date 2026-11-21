/** @jsxImportSource react */
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePalette } from '../../design-system/palette';
import { useMessages } from '../../lib/supabase/hooks/useMessages';
import { supabase } from '../../lib/supabase/client';
import { Avatar } from '../UI/Avatar';

export interface ChatTarget {
    id: string;
    name?: string;
    userId?: string;
    avatarUrl?: string | null;
}

export function ChatThread({ id, name, userId, avatarUrl, onBack }: ChatTarget & { onBack?: () => void }) {
    const p = usePalette();
    const ice = p.isDark ? '#253850' : '#E7F0FD';
    const accent = p.isDark ? '#D9E4FF' : '#34577D';
    const [inputText, setInputText] = useState('');
    const { chatId, messages, loading, error, retry, sendMessage } = useMessages(id, userId);
    const [sendError, setSendError] = useState('');
    const [sending, setSending] = useState(false);
    const busy = React.useRef(false);
    const [uploading, setUploading] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    const handleSend = async () => {
        const draft = inputText;
        if (!draft.trim() || !chatId || busy.current) return;

        busy.current = true;
        setSending(true);
        setSendError('');
        try {
            await sendMessage(draft.trim());
            setInputText(current => current === draft ? '' : current);
        } catch {
            setSendError('Message couldn’t be sent. Tap send to try again.');
        } finally {
            busy.current = false;
            setSending(false);
        }
    };

    const attachMedia = async () => {
        if (!chatId || !supabase || busy.current) return;
        busy.current = true;
        setUploading(true);
        setSendError('');
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 0.8,
            });
            const asset = result.assets?.[0];
            if (result.canceled || !asset) return;

            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const fileExt = asset.uri.split('.').pop() || 'mp4';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${chatId}/${fileName}`;
            const bucket = supabase.storage.from('chat-media');
            const { error: uploadError } = await bucket.upload(filePath, blob, {
                contentType: asset.mimeType || `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`,
            });
            if (uploadError) throw uploadError;

            await sendMessage('Sent a video', bucket.getPublicUrl(filePath).data.publicUrl, 'video');
        } catch {
            setSendError('Video couldn’t be sent. Please try again.');
        } finally {
            busy.current = false;
            setUploading(false);
        }
    };

    const canSend = Boolean(chatId && inputText.trim() && !uploading && !sending);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: p.card }]} edges={onBack ? ['top'] : []}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <View style={styles.header}>
                    {onBack && (
                        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.iconButton}>
                            <Feather name="arrow-left" size={20} color={p.text} />
                        </Pressable>
                    )}
                    <Avatar name={name} uri={avatarUrl} size={40} />
                    <Text numberOfLines={1} accessibilityRole="header" aria-level={2} style={[styles.title, { color: p.text }]}>
                        {name || 'Conversation'}
                    </Text>
                </View>

                {error ? (
                    <View style={styles.empty}>
                        <Text style={[styles.secondary, { color: p.sub }]}>{error}</Text>
                        <Pressable accessibilityRole="button" onPress={retry} style={[styles.retry, { backgroundColor: ice }]}>
                            <Text style={[styles.secondary, { color: accent }]}>Try again</Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messages}
                        keyboardShouldPersistTaps="handled"
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                {loading ? <ActivityIndicator color={accent} /> : (
                                    <Text style={[styles.secondary, { color: p.sub }]}>Send the first message.</Text>
                                )}
                            </View>
                        }
                        renderItem={({ item }) => {
                            const mine = item.sender === 'me';
                            return (
                                <View style={[styles.message, mine && styles.outgoing]}>
                                    <View style={[styles.bubble, { backgroundColor: mine ? ice : p.soft }]}>
                                        {item.media_url && <Feather name="video" size={16} color={accent} />}
                                        <Text selectable style={[styles.messageText, { color: p.text }]}>
                                            {item.media_url ? item.content || 'Video message' : item.content}
                                        </Text>
                                    </View>
                                    <Text style={[styles.time, { color: p.sub }]}>{item.time}</Text>
                                </View>
                            );
                        }}
                    />
                )}

                <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                    {sendError && <Text accessibilityRole="alert" style={[styles.secondary, { color: p.text }]}>{sendError}</Text>}
                    <View style={[styles.composer, { backgroundColor: p.bg, borderColor: p.border }]}>
                        <Pressable accessibilityRole="button" accessibilityLabel="Attach a video" onPress={attachMedia}
                            disabled={!chatId || uploading || sending} style={styles.iconButton}>
                            {uploading ? <ActivityIndicator size="small" color={accent} /> : <Feather name="paperclip" size={18} color={p.sub} />}
                        </Pressable>
                        <TextInput
                            accessibilityLabel="Message"
                            style={[styles.input, { color: p.text }]}
                            placeholder="Write a message"
                            placeholderTextColor={p.sub}
                            editable={Boolean(chatId)}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <Pressable accessibilityRole="button" accessibilityLabel="Send message"
                            accessibilityState={{ busy: sending }} onPress={handleSend} disabled={!canSend}
                            style={[styles.send, { backgroundColor: ice, opacity: canSend || sending ? 1 : 0.5 }]}>
                            {sending ? <ActivityIndicator size="small" color={accent} /> : <Feather name="arrow-up" size={19} color={accent} />}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, minHeight: 0 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 15, paddingHorizontal: 17 },
    title: { flex: 1, minWidth: 0, fontFamily: 'Outfit_600SemiBold', fontSize: 23, letterSpacing: -0.4 },
    iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, minHeight: 100, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 9 },
    secondary: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
    retry: { minHeight: 40, borderRadius: 9, paddingHorizontal: 13, justifyContent: 'center' },
    messages: { flexGrow: 1, paddingHorizontal: 18, paddingVertical: 14 },
    message: { alignSelf: 'flex-start', maxWidth: '83%', gap: 4, marginBottom: 13 },
    outgoing: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    bubble: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
    messageText: { flexShrink: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
    time: { fontFamily: 'Inter_400Regular', fontSize: 11, marginHorizontal: 3 },
    composerWrap: { paddingHorizontal: 16, paddingTop: 8, gap: 7 },
    composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 4, borderRadius: 12, borderWidth: 1 },
    input: { flex: 1, minWidth: 0, minHeight: 40, maxHeight: 104, paddingVertical: 10, paddingHorizontal: 4, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
    send: { width: 40, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
