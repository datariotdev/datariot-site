import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ChatItem } from '../../components/UI/ChatItem';
import { Avatar } from '../../components/UI/Avatar';
import { OrbitGlyph } from '../../components/UI/OrbitGlyph';
import { SectionRule } from '../../components/UI/SectionRule';
import { EmptyState } from '../../components/UI/EmptyState';
import { useRouter } from 'expo-router';
import { useChats } from '../../lib/supabase/hooks/useChats';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { usePalette } from '../../design-system/palette';
import { LinearGradient } from 'expo-linear-gradient';
import { withAlpha } from '../../lib/utils/color';

interface Profile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}


/** Orvelis is pinned above the conversations: a tool, not a person, so it has no unread count or time. */
function OrvelisCard({ onPress }: { onPress: () => void }) {
    const p = usePalette();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Orvelis. Ask anything, or test an argument."
            style={({ pressed }) => [styles.orv, { backgroundColor: p.accent }, pressed && { opacity: 0.9 }]}
        >
            <OrbitGlyph color={p.onAccent} size={42} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.orvTitle, { color: p.onAccent, fontFamily: p.fonts.bold }]}>Orvelis</Text>
                <Text style={[styles.orvSub, { color: p.onAccent, fontFamily: p.fonts.regular }]}>Ask anything, or test an argument.</Text>
            </View>
            <View style={[styles.orvGo, { backgroundColor: p.onAccent }]}>
                <Ionicons name="arrow-forward" size={18} color={p.accent} />
            </View>
        </Pressable>
    );
}

export default function InboxScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const p = usePalette();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const { chats, loading } = useChats();

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState<Profile[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchUsers(searchQuery);
        } else {
            setFoundUsers([]);
        }
    }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchUsers = async (query: string) => {
        if (!user) return;
        setSearchLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .ilike('username', `%${query}%`)
                .neq('id', user.id)
                .limit(20);

            if (error) throw error;
            setFoundUsers(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const startChat = async (targetUser: Profile) => {
        if (!user) return;
        try {
            // Check if we already have a chat with this user locally
            const existingChat = chats.find(c => c.id === targetUser.id);
            let chatId = existingChat?.chat_id;

            if (!chatId) {
                const { data: newChat, error: createError } = await supabase
                    .from('chats')
                    .insert({ type: 'direct' })
                    .select('id')
                    .single();

                if (createError) throw createError;
                chatId = newChat.id;

                // Add yourself first (usually allowed), then the other person (may be blocked by RLS)
                const { error: selfError } = await supabase
                    .from('chat_participants')
                    .insert({ chat_id: chatId, user_id: user.id });

                if (selfError) {
                    console.error('Error adding self as participant:', selfError.message);
                }

                const { error: otherError } = await supabase
                    .from('chat_participants')
                    .insert({ chat_id: chatId, user_id: targetUser.id });

                if (otherError) {
                    console.log('Note: Could not add other participant via RLS (common), proceeding anyway.');
                }
            }

            setIsSearching(false);
            setSearchQuery('');
            router.push({
                pathname: `/chat/[id]` as any,
                params: { id: chatId, name: targetUser.display_name || targetUser.username, userId: targetUser.id }
            });

        } catch (error) {
            console.error('Error starting chat:', error);
            // If creation completely fails, use the user's id and let useMessages try its fallback
            setIsSearching(false);
            setSearchQuery('');
            router.push({
                pathname: `/chat/[id]` as any,
                params: { id: targetUser.id, name: targetUser.display_name || targetUser.username, userId: targetUser.id }
            });
        }
    };

    const handleChatPress = (id: string, name?: string) => {
        if (id === 'ai-bot') {
            router.push('/ai');
        } else {
            router.push({
                pathname: `/chat/[id]` as any,
                params: { id, name }
            });
        }
    };

    const closeSearch = () => {
        setIsSearching(false);
        setSearchQuery('');
    };

    const header = (
        <View>
            <View style={[styles.titleRow, { paddingTop: insets.top + 12 }]}>
                <View>
                    <Text style={[styles.title, { color: p.text, fontFamily: p.fonts.bold }]}>{isSearching ? 'New message' : 'Messages'}</Text>
                    <View style={styles.sub}>
                        <Text style={[styles.subText, { color: p.sub }]}>
                            {isSearching ? 'Find a creator to write to' : `${chats.length} ${chats.length === 1 ? 'conversation' : 'conversations'}`}
                        </Text>
                    </View>
                </View>
                <Pressable
                    onPress={isSearching ? closeSearch : () => setIsSearching(true)}
                    hitSlop={8}
                    accessibilityLabel={isSearching ? 'Close search' : 'Find someone to message'}
                    style={[styles.roundBtn, { backgroundColor: p.accent }]}
                >
                    <Ionicons name={isSearching ? 'close' : 'create-outline'} size={21} color={p.onAccent} />
                </Pressable>
            </View>

            {isSearching ? (
                <View style={[styles.search, { backgroundColor: p.card, borderColor: p.border }]}>
                    <Ionicons name="search" size={18} color={p.faint} />
                    <TextInput
                        style={[styles.searchInput, { color: p.text, fontFamily: p.fonts.regular }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
                        placeholder="Search by username"
                        placeholderTextColor={p.faint}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                    />
                </View>
            ) : (
                <>
                    <OrvelisCard onPress={() => handleChatPress('ai-bot')} />
                    {chats.length > 0 && (
                        <View style={styles.rule}>
                            <SectionRule label="Conversations" right={String(chats.length)} />
                        </View>
                    )}
                </>
            )}
        </View>
    );

    if (isSearching) {
        return (
            <View style={[styles.container, { backgroundColor: p.bg }]}>
                {header}
                {searchLoading ? (
                    <View style={{ paddingTop: 40 }}><ActivityIndicator color={p.sub} /></View>
                ) : (
                    <FlatList
                        data={foundUsers}
                        keyExtractor={(item) => item.id}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
                        ListEmptyComponent={
                            <Text style={[styles.hint, { color: p.faint, fontFamily: p.fonts.regular }]}>
                                {searchQuery.length >= 2 ? 'No one with that username.' : 'Type at least 2 letters of a username.'}
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => startChat(item)}
                                style={({ pressed }) => [styles.userRow, pressed && { backgroundColor: p.soft }]}
                            >
                                <Avatar uri={item.avatar_url} name={item.display_name || item.username} size={48} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.userName, { color: p.text, fontFamily: p.fonts.semibold }]}>{item.display_name || item.username}</Text>
                                    <Text style={[styles.userHandle, { color: p.sub, fontFamily: p.fonts.regular }]}>@{item.username}</Text>
                                </View>
                                <View style={[styles.pill, { backgroundColor: p.accent }]}>
                                    <Text style={[styles.pillText, { color: p.onAccent, fontFamily: p.fonts.semibold }]}>Message</Text>
                                </View>
                            </Pressable>
                        )}
                    />
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: p.bg }]}>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.chat_id || item.id}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    loading ? (
                        <View style={{ paddingTop: 40 }}><ActivityIndicator color={p.sub} /></View>
                    ) : (
                        <EmptyState
                            icon="chatbubbles-outline"
                            title="No conversations yet"
                            sub="Find a creator whose video made you think and say so."
                            cta="Find someone"
                            onCta={() => setIsSearching(true)}
                        />
                    )
                }
                renderItem={({ item }) => (
                    <ChatItem {...item} onPress={() => handleChatPress(item.chat_id, item.name)} />
                )}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
            />
            {/* Rows fade out above the tab bar instead of running under its icons */}
            {Platform.OS !== 'web' && (
                <LinearGradient
                    colors={[withAlpha(p.bg, 0), withAlpha(p.bg, 0.92), p.bg]}
                    locations={[0, 0.55, 1]}
                    style={[styles.bottomFade, { height: tabBarHeight + 40 }]}
                    pointerEvents="none"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
    title: { fontSize: 34, letterSpacing: -0.9 },
    sub: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    subText: { fontFamily: 'Outfit_500Medium', fontSize: 14 },
    roundBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    orv: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 26 },
    orvTitle: { fontSize: 20, letterSpacing: -0.2 },
    orvSub: { fontSize: 13.5, marginTop: 2, opacity: 0.72 },
    orvGo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    rule: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 6 },
    search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1 },
    searchInput: { flex: 1, height: '100%', fontSize: 16, padding: 0 },
    hint: { textAlign: 'center', fontSize: 14, paddingTop: 36, paddingHorizontal: 30 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 11 },
    userName: { fontSize: 16 },
    userHandle: { fontSize: 13.5, marginTop: 1 },
    pill: { height: 34, paddingHorizontal: 16, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    pillText: { fontSize: 13 },
});
