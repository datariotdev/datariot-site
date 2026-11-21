/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import { ChatThread, type ChatTarget } from '../../components/Chat/ChatThread';
import { Avatar } from '../../components/UI/Avatar';
import { ChatItem } from '../../components/UI/ChatItem';
import { usePalette } from '../../design-system/palette';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useChats } from '../../lib/supabase/hooks/useChats';
import { useUserSearch } from '../../lib/supabase/hooks/useUserSearch';
import { normalizeUsernameQuery, type SearchProfile } from '../../lib/supabase/searchUsers';

export default function InboxScreen() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { chats, loading } = useChats();
    const { width } = useWindowDimensions();
    const focused = useIsFocused();
    const wide = Platform.OS === 'web' && width >= 1080;
    const p = usePalette();
    const ice = p.isDark ? '#253850' : '#E7F0FD';
    const accent = p.isDark ? '#D9E4FF' : '#34577D';
    const userId = user?.id;

    const [selection, setSelection] = useState<(ChatTarget & { ownerId: string }) | null>(null);
    const [composingFor, setComposingFor] = useState<string>();
    const composing = Boolean(userId && userId === composingFor);
    const [filter, setFilter] = useState('');
    const [recipient, setRecipient] = useState('');
    const selected = selection?.ownerId === userId ? selection : null;
    const { users: foundUsers, loading: searchLoading, error: searchError, retry } = useUserSearch(
        composing ? recipient : '', userId,
    );
    const filtered = chats.filter(chat => chat.name.toLowerCase().includes(filter.trim().toLowerCase()));

    const closeCompose = () => {
        setComposingFor(undefined);
        setRecipient('');
    };

    const openConversation = (target: ChatTarget) => {
        if (!userId) return;
        closeCompose();
        if (wide) {
            setSelection({ ...target, ownerId: userId });
            return;
        }
        router.push({
            pathname: '/chat/[id]',
            params: { id: target.id, name: target.name, userId: target.userId },
        });
    };

    const showThread = selected && focused;
    const thread = showThread ? (
        <ChatThread key={`${selected.userId ? 'recipient' : 'chat'}:${selected.id}`} {...selected}
            onBack={wide ? undefined : () => setSelection(null)} />
    ) : null;

    if (!wide && showThread) return thread;

    const signedIn = Boolean(userId);
    const hasChats = chats.length > 0;
    const showSearch = composing || hasChats;
    const emptyHeading = signedIn ? hasChats ? 'Select a conversation' : 'No conversations yet' : 'Sign in to see your messages';
    const emptyHint = signedIn ? hasChats ? 'Pick a chat from the list.' : 'Use New message to find someone by username.' : null;

    const emptyThread = (
        <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: ice }]}>
                <Feather name="message-circle" size={25} color={accent} />
            </View>
            <Text accessibilityRole="header" aria-level={2} style={[styles.emptyTitle, { color: p.text }]}>{emptyHeading}</Text>
            {emptyHint && <Text style={[styles.hint, { color: p.sub }]}>{emptyHint}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={[styles.page, wide && styles.widePage, { backgroundColor: p.bg }]} edges={['top']}>
            <View style={[styles.listPane, wide && styles.wideList, wide && { borderRightColor: p.border }]}>
                <View style={styles.controls}>
                    <View style={styles.titleRow}>
                        <Text accessibilityRole="header" aria-level={1} style={[styles.title, { color: p.text }]}>
                            {composing ? 'New message' : 'Messages'}
                        </Text>
                        {!authLoading && (
                            <Pressable accessibilityRole="button" accessibilityLabel={composing ? 'Close new message' : signedIn ? 'New message' : 'Sign in'}
                                onPress={() => composing ? closeCompose() : signedIn ? setComposingFor(userId) : router.push('/auth/login')}
                                style={({ pressed }) => [styles.action, { backgroundColor: ice, opacity: pressed ? 0.65 : 1 }]}>
                                <Feather name={composing ? 'x' : signedIn ? 'edit-3' : 'log-in'} size={17} color={accent} />
                                {!composing && <Text style={[styles.actionText, { color: accent }]}>{signedIn ? 'New message' : 'Sign in'}</Text>}
                            </Pressable>
                        )}
                    </View>
                    {showSearch && (
                        <View style={[styles.search, { backgroundColor: p.card, borderColor: p.border }]}>
                            <Feather name="search" size={16} color={p.sub} />
                            <TextInput key={composing ? 'recipient' : 'conversation'} style={[styles.searchInput, { color: p.text }]}
                                accessibilityLabel={composing ? 'Search users to chat by username' : 'Search conversations'}
                                placeholder={composing ? 'Search @username to chat...' : 'Search conversations'} placeholderTextColor={p.sub}
                                autoFocus={composing} autoCapitalize="none" autoCorrect={false}
                                value={composing ? recipient : filter}
                                onChangeText={composing ? setRecipient : setFilter} />
                        </View>
                    )}
                </View>

                {composing ? (
                    <FlatList data={foundUsers} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
                        contentContainerStyle={[styles.listContent, !wide && styles.singleListContent]}
                        ListEmptyComponent={searchLoading ? (
                            <ActivityIndicator style={styles.status} color={accent} />
                        ) : searchError ? (
                            <Pressable accessibilityRole="button" onPress={retry}>
                                <Text accessibilityLiveRegion="polite" style={[styles.status, styles.hint, { color: p.sub }]}>
                                    {searchError} Tap to retry.
                                </Text>
                            </Pressable>
                        ) : normalizeUsernameQuery(recipient) ? (
                            <Text accessibilityLiveRegion="polite" style={[styles.status, styles.hint, { color: p.sub }]}>
                                No users found.
                            </Text>
                        ) : (
                            <Text accessibilityLiveRegion="polite" style={[styles.status, styles.hint, { color: p.sub }]}>
                                Type a username to search.
                            </Text>
                        )}
                        renderItem={({ item }) => {
                            const name = item.display_name || item.nickname || item.username;
                            return (
                                <Pressable accessibilityRole="button" accessibilityLabel={`Message @${item.username}`}
                                    style={({ pressed }) => [styles.person, pressed && { backgroundColor: ice }]}
                                    onPress={() => {
                                        const existing = chats.find(chat => chat.id === item.id);
                                        openConversation({ id: existing?.chat_id ?? item.id, userId: existing ? undefined : item.id, name, avatarUrl: item.avatar_url });
                                    }}>
                                    <Avatar name={name} uri={item.avatar_url} size={40} />
                                    <View style={styles.personInfo}>
                                        <Text numberOfLines={1} style={[styles.personName, { color: p.text }]}>{name}</Text>
                                        <Text numberOfLines={1} style={[styles.hint, { color: p.sub }]}>@{item.username}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={16} color={p.sub} />
                                </Pressable>
                            );
                        }} />
                ) : (
                    <FlatList data={filtered} keyExtractor={item => item.chat_id}
                        contentContainerStyle={[styles.listContent, !wide && styles.singleListContent]}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={loading || authLoading ? <ActivityIndicator style={styles.status} color={accent} /> : hasChats ? (
                            <Text style={[styles.status, styles.hint, { color: p.sub }]}>No matching conversations.</Text>
                        ) : wide ? undefined : emptyThread}
                        renderItem={({ item }) => (
                            <ChatItem {...item} selected={selected?.id === item.chat_id || selected?.userId === item.id}
                                onPress={() => openConversation({ id: item.chat_id, name: item.name, avatarUrl: item.avatar_url })} />
                        )} />
                )}
            </View>

            {wide && (
                <View style={[styles.thread, { backgroundColor: p.card }]}>
                    {thread ?? (loading || authLoading ? <ActivityIndicator style={styles.status} color={accent} /> : emptyThread)}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, minHeight: 0 },
    widePage: { flexDirection: 'row', paddingHorizontal: 26, paddingVertical: 22 },
    listPane: { flex: 1, minWidth: 0, minHeight: 0 },
    wideList: { width: 344, flex: 0, borderRightWidth: StyleSheet.hairlineWidth },
    controls: { gap: 15, paddingHorizontal: 17, paddingTop: 17, paddingBottom: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    title: { flexShrink: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 31, letterSpacing: -0.95 },
    action: { minHeight: 40, minWidth: 40, paddingHorizontal: 11, borderRadius: 9, gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    actionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    search: { minHeight: 43, paddingHorizontal: 11, gap: 9, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    searchInput: { flex: 1, minWidth: 0, minHeight: 40, fontFamily: 'Inter_400Regular', fontSize: 13 },
    listContent: { paddingHorizontal: 9, paddingBottom: 20 },
    singleListContent: { flexGrow: 1, paddingBottom: 74 },
    status: { marginTop: 20, textAlign: 'center', paddingHorizontal: 12 },
    person: { flexDirection: 'row', padding: 10, gap: 10, minHeight: 60, borderRadius: 9, alignItems: 'center' },
    personInfo: { flex: 1, minWidth: 0, gap: 2 },
    personName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    thread: { flex: 1, minWidth: 0, minHeight: 0, borderTopRightRadius: 15, borderBottomRightRadius: 15, overflow: 'hidden' },
    empty: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 7 },
    emptyIcon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    emptyTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 23, letterSpacing: -0.45, textAlign: 'center' },
    hint: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
});
