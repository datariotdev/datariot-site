import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatItem } from '../../components/UI/ChatItem';
import { useChats } from '../../lib/supabase/hooks/useChats';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useDebounced } from '../../lib/hooks/useDebounced';
import { useTabBarHeight } from '../../lib/hooks/useTabBarHeight';
import { cleanSearch } from '../../lib/supabase/hooks/useSearchProfiles';
import { FONT, NO_OUTLINE, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { Avatar } from '../../components/core/Avatar';
import { IconButton } from '../../components/core/IconButton';
import { EmptyState } from '../../components/core/EmptyState';

interface Profile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

const AI_ROW = {
    id: 'ai-bot',
    name: 'Orvelis',
    message: 'Ask anything, or have it break down a clip.',
    isAi: true,
};

export default function InboxScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { c, isDark } = useUI();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();
    const { chats, loading } = useChats();

    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState<Profile[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const debounced = useDebounced(cleanSearch(searchQuery), 300);

    useEffect(() => {
        if (!user || debounced.length < 2) {
            setFoundUsers([]);
            return;
        }
        let alive = true;
        (async () => {
            setSearchLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .or(`username.ilike.%${debounced}%,display_name.ilike.%${debounced}%`)
                    .neq('id', user.id)
                    .limit(20);
                if (error) throw error;
                if (alive) setFoundUsers(data || []);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                if (alive) setSearchLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [debounced, user]);

    const closeSearch = () => {
        setIsSearching(false);
        setSearchQuery('');
    };

    const startChat = async (target: Profile) => {
        if (!user) return;
        try {
            // Reuse the conversation if there already is one with this person
            const existing = chats.find(ch => ch.id === target.id);
            let chatId = existing?.chat_id;

            if (!chatId) {
                const { data: newChat, error: createError } = await supabase
                    .from('chats')
                    .insert({ type: 'direct' })
                    .select('id')
                    .single();
                if (createError) throw createError;
                chatId = newChat.id;

                // One at a time, so a policy that blocks adding the other person does not lose the chat
                const { error: selfError } = await supabase.from('chat_participants').insert({ chat_id: chatId, user_id: user.id });
                if (selfError) console.error('Error adding self as participant:', selfError.message);
                const { error: otherError } = await supabase.from('chat_participants').insert({ chat_id: chatId, user_id: target.id });
                if (otherError) console.log('Note: could not add the other participant (common under RLS); continuing.');
            }

            closeSearch();
            router.push({ pathname: `/chat/[id]` as any, params: { id: chatId, name: target.display_name || target.username, userId: target.id } });
        } catch (error) {
            console.error('Error starting chat:', error);
            // The messages hook can fall back to the person's id
            closeSearch();
            router.push({ pathname: `/chat/[id]` as any, params: { id: target.id, name: target.display_name || target.username, userId: target.id } });
        }
    };

    const openChat = (id: string, name?: string) => {
        if (id === 'ai-bot') router.push('/ai');
        else router.push({ pathname: `/chat/[id]` as any, params: { id, name } });
    };

    const header = (
        <View style={{ paddingTop: insets.top + 12, backgroundColor: c.bg }}>
            <View style={styles.titleRow}>
                <Txt variant="display">Messages</Txt>
                {user ? (
                    <IconButton
                        variant="soft"
                        name={isSearching ? 'close' : 'create-outline'}
                        size={21}
                        label={isSearching ? 'Close search' : 'New message'}
                        onPress={isSearching ? closeSearch : () => setIsSearching(true)}
                    />
                ) : null}
            </View>

            {isSearching ? (
                <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.hairline }]}>
                    <Ionicons name="search" size={18} color={c.textTertiary} />
                    <TextInput
                        style={[styles.input, { color: c.text }, NO_OUTLINE]}
                        placeholder="Search people to message"
                        placeholderTextColor={c.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                    />
                </View>
            ) : null}
        </View>
    );

    if (isSearching) {
        return (
            <View style={[styles.root, { backgroundColor: c.bg }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                {header}
                <FlatList
                    data={foundUsers}
                    keyExtractor={u => u.id}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingTop: 8 }}
                    ListEmptyComponent={
                        searchLoading ? (
                            <View style={{ padding: 32 }}><ActivityIndicator color={c.textSecondary} /></View>
                        ) : (
                            <Txt variant="body" tone="tertiary" style={{ textAlign: 'center', marginTop: 32 }}>
                                {debounced.length >= 2 ? 'No one found' : 'Type at least two letters'}
                            </Txt>
                        )
                    }
                    renderItem={({ item }) => (
                        <Pressable onPress={() => startChat(item)} accessibilityRole="button" style={({ pressed }) => [styles.person, pressed && { backgroundColor: c.surface }]}>
                            <Avatar uri={item.avatar_url} name={item.display_name || item.username} size={48} />
                            <View style={{ flex: 1 }}>
                                <Txt variant="bodyStrong">{item.display_name || item.username}</Txt>
                                <Txt variant="caption" tone="secondary">@{item.username}</Txt>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                        </Pressable>
                    )}
                />
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {header}
            <FlatList
                data={user ? chats : []}
                keyExtractor={item => item.chat_id || item.id}
                ListHeaderComponent={<ChatItem {...AI_ROW} onPress={() => openChat(AI_ROW.id)} />}
                ListEmptyComponent={
                    !user ? (
                        <EmptyState icon="chatbubble-outline" title="Sign in to message" body="Talk to the people behind the videos." actionLabel="Sign in" onAction={() => router.push('/auth/login')} />
                    ) : loading ? (
                        <View style={{ padding: 32 }}><ActivityIndicator color={c.textSecondary} /></View>
                    ) : (
                        <EmptyState icon="chatbubble-outline" title="No conversations yet" body="Find someone and say hello." actionLabel="New message" onAction={() => setIsSearching(true)} />
                    )
                }
                renderItem={({ item }) => (
                    <ChatItem
                        id={item.id}
                        name={item.name}
                        message={item.message}
                        time={item.time}
                        unreadCount={item.unreadCount}
                        avatarUrl={item.avatar_url}
                        onPress={() => openChat(item.chat_id, item.name)}
                    />
                )}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: tabBarHeight + 24 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 10, paddingBottom: 12 },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 8,
        height: 46,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        paddingHorizontal: 14,
    },
    input: { flex: 1, height: '100%', fontFamily: FONT.regular, fontSize: 16, padding: 0 },
    person: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
});
