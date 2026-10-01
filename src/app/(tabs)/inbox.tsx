import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Switch, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatItem } from '../../components/UI/ChatItem';
import { useRouter } from 'expo-router';
import { useChats } from '../../lib/supabase/hooks/useChats';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { pageBg } from '@design-system/surface';
import { FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';

interface Profile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

// Mock Data
const AI_BOT = {
    id: 'ai-bot',
    name: 'Orvelis AI',
    message: 'I can help you analyze that improved engagement strategy.',
    time: 'Now',
    isAi: true,
    unreadCount: 3,
};

// Removed mock THOUGHTS
export default function InboxScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [isFocusMode, setIsFocusMode] = useState(false);
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
    }, [searchQuery]);

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
                // Determine a consistent chat ID structure or attempt creation
                const { data: newChat, error: createError } = await supabase
                    .from('chats')
                    .insert({ type: 'direct' })
                    .select('id')
                    .single();

                if (createError) throw createError;
                chatId = newChat.id;

                // Attempt to insert participants one by one to avoid total failure if one is blocked by RLS
                // First, add yourself (should usually work due to RLS)
                const { error: selfError } = await supabase
                    .from('chat_participants')
                    .insert({ chat_id: chatId, user_id: user.id });

                if (selfError) {
                    console.error('Error adding self as participant:', selfError.message);
                }

                // Then try to add the other person
                const { error: otherError } = await supabase
                    .from('chat_participants')
                    .insert({ chat_id: chatId, user_id: targetUser.id });

                if (otherError) {
                    console.log('Note: Could not add other participant via RLS (common), proceeding anyway.');
                }
            }

            // Close search and go to chat
            setIsSearching(false);
            setSearchQuery('');
            router.push({
                pathname: `/chat/[id]` as any,
                params: { id: chatId, name: targetUser.display_name || targetUser.username, userId: targetUser.id }
            });

        } catch (error) {
            console.error('Error starting chat:', error);
            // Fallback: If creation completely fails, use the targetUser ID to let useMessages try its fallback
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

    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const renderHeader = () => (
        <View>
            {/* Focus Mode & Calls Header */}
            <View style={styles.topControls}>
                <TouchableOpacity
                    style={[
                        styles.focusButton,
                        pixelClip(3),
                        isFocusMode
                            ? { backgroundColor: 'transparent', borderColor: theme.colors.primary.DEFAULT }
                            : { backgroundColor: theme.colors.primary.DEFAULT, borderColor: theme.colors.primary.DEFAULT },
                    ]}
                    onPress={() => setIsFocusMode(!isFocusMode)}
                >
                    <Ionicons
                        name={isFocusMode ? "moon" : "sunny"}
                        size={14}
                        color={isFocusMode ? theme.colors.text.primary : theme.colors.primary.onPrimary}
                    />
                    <Text style={[styles.focusText, { color: isFocusMode ? theme.colors.text.primary : theme.colors.primary.onPrimary }]}>
                        {isFocusMode ? "FOCUS ON" : "FOCUS OFF"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.callsButton, pixelClip(3), { backgroundColor: isDark ? 'rgba(218, 230, 247, 0.08)' : 'rgba(7, 8, 12, 0.06)' }]}
                    disabled
                >
                    <Ionicons name="call" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {/* Title & Search Button */}
            <View style={styles.titleRow}>
                <Text style={[styles.pageTitle, { color: theme.colors.text.primary }]}>MESSAGES</Text>
                <TouchableOpacity
                    style={[styles.searchButton, pixelClip(3), { backgroundColor: isDark ? 'rgba(218, 230, 247, 0.08)' : 'rgba(7, 8, 12, 0.06)' }]}
                    onPress={() => setIsSearching(!isSearching)}
                >
                    <Ionicons name={isSearching ? "close" : "search"} size={20} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            {isSearching && (
                <View style={[styles.searchContainer, pixelClip(4), { backgroundColor: isDark ? 'rgba(218, 230, 247, 0.05)' : 'rgba(255, 255, 255, 0.7)', borderColor: isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.16)' }]}>
                    <Ionicons name="search" size={20} color={theme.colors.text.muted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text.primary }]}
                        placeholder="Search users to chat..."
                        placeholderTextColor={theme.colors.text.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoFocus
                    />
                </View>
            )}

            {!isSearching && (
                <>
                    {/* AI Section */}
                    <Text style={[styles.sectionTitle, { color: theme.colors.text.muted }]}>[ ASSISTANT ]</Text>
                    <ChatItem
                        {...AI_BOT}
                        onPress={() => handleChatPress(AI_BOT.id)}
                    />
                </>
            )}
        </View>
    );

    if (isSearching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: pageBg(theme.colors.background.primary) }]} edges={['top']}>
                {renderHeader()}
                {searchLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
                    </View>
                ) : (
                    <FlatList
                        data={foundUsers}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            searchQuery.length >= 2 ? (
                                <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>[ NO USERS FOUND ]</Text>
                            ) : (
                                <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>[ TYPE AT LEAST 2 CHARACTERS ]</Text>
                            )
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.userItem, { borderBottomColor: isDark ? 'rgba(218, 230, 247, 0.1)' : 'rgba(7, 8, 12, 0.1)' }]} onPress={() => startChat(item)}>
                                <View style={[styles.avatar, pixelClip(4), { backgroundColor: theme.colors.primary.DEFAULT }]}>
                                    <Text style={[styles.avatarText, { color: theme.colors.primary.onPrimary }]}>
                                        {(item.display_name || item.username)[0].toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={[styles.displayName, { color: theme.colors.text.primary }]}>{item.display_name || item.username}</Text>
                                    <Text style={[styles.username, { color: theme.colors.text.secondary }]}>@{item.username}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: pageBg(theme.colors.background.primary) }]} edges={['top']}>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.chat_id || item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.text.muted, fontFamily: FONT.tech, fontSize: 11, letterSpacing: 1.6 }}>
                            {loading ? '[ LOADING CHATS... ]' : '[ NO CONVERSATIONS YET ]'}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ChatItem
                        {...item}
                        onPress={() => handleChatPress(item.chat_id, item.name)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 100,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10,
    },
    focusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    focusText: {
        marginLeft: 7,
        fontFamily: FONT.techMedium,
        fontSize: 11,
        letterSpacing: 1.2,
    },
    callsButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    pageTitle: {
        fontFamily: FONT.display,
        fontSize: 38,
        letterSpacing: 1.5,
    },
    searchButton: {
        padding: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    sectionTitle: {
        fontFamily: FONT.tech,
        fontSize: 10,
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 12,
        letterSpacing: 2,
    },
    // Removed thoughts styles
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#DAE6F7',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    // Search List Styles
    listContainer: {
        paddingHorizontal: 20,
    },
    emptyText: {
        fontFamily: FONT.tech,
        fontSize: 11,
        letterSpacing: 1.6,
        textAlign: 'center',
        marginTop: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    avatar: {
        width: 48,
        height: 48,
        backgroundColor: '#DAE6F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontFamily: FONT.display,
        fontSize: 22,
    },
    userInfo: {
        flex: 1,
    },
    displayName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    username: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginTop: 2,
    },
});
