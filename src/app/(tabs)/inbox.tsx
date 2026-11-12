import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatItem } from '../../components/UI/ChatItem';
import { useRouter } from 'expo-router';
import { useChats } from '../../lib/supabase/hooks/useChats';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTheme } from '../../components/Theme/ThemeProvider';

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

    const startChat = (targetUser: Profile) => {
        if (!user) return;
        setIsSearching(false);
        setSearchQuery('');
        router.push({
            pathname: '/chat/[id]',
            params: { id: targetUser.id, userId: targetUser.id, name: targetUser.display_name || targetUser.username },
        });
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

    const openComposer = () => {
        setIsSearching(true);
        setSearchQuery('');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.eyebrowRow}>
                <View style={[styles.onlineDot, { backgroundColor: isDark ? '#CBD5E5' : '#34445C' }]} />
                <Text style={[styles.eyebrow, { color: theme.colors.text.secondary }]}>YOUR SPACE / 04</Text>
            </View>
            <View style={styles.titleRow}>
                <View>
                    <Text style={[styles.pageTitle, { color: theme.colors.text.primary }]}>Messages</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                        {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.composeButton, { backgroundColor: isDark ? '#D9E4F5' : '#101722' }]}
                    onPress={isSearching ? () => setIsSearching(false) : openComposer}
                    accessibilityRole="button"
                    accessibilityLabel={isSearching ? 'Close new message search' : 'Start a new conversation'}
                >
                    <Feather name={isSearching ? 'x' : 'edit-3'} size={21} color={isDark ? '#101722' : '#FFFFFF'} />
                </TouchableOpacity>
            </View>
            {isSearching ? (
                <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(18,30,48,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(18,30,48,0.10)' }]}>
                    <Feather name="search" size={19} color={theme.colors.text.muted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text.primary }]}
                        placeholder="Find someone to message"
                        placeholderTextColor={theme.colors.text.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoFocus
                    />
                </View>
            ) : chats.length > 0 ? (
                <Text style={[styles.listLabel, { color: theme.colors.text.secondary }]}>RECENT CONVERSATIONS</Text>
            ) : null}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyWrap}>
            <View style={[styles.emptyCard, {
                backgroundColor: isDark ? '#111822' : '#F8FAFE',
                borderColor: isDark ? 'rgba(200,214,236,0.16)' : 'rgba(31,48,75,0.10)'
            }]}>
                <View style={styles.emptyArt}>
                    <View style={[styles.orbit, { borderColor: isDark ? 'rgba(202,216,238,0.15)' : 'rgba(36,56,87,0.13)' }]} />
                    <View style={[styles.orbitSmall, { borderColor: isDark ? 'rgba(202,216,238,0.15)' : 'rgba(36,56,87,0.13)' }]} />
                    <View style={[styles.messageBubble, { backgroundColor: isDark ? '#D9E4F5' : '#172337' }]}>
                        <Feather name="message-circle" size={30} color={isDark ? '#172337' : '#FFFFFF'} />
                    </View>
                    <View style={[styles.messageMini, { backgroundColor: isDark ? '#303D50' : '#E2E9F3' }]}>
                        <Feather name="arrow-up-right" size={16} color={isDark ? '#E2EAF7' : '#172337'} />
                    </View>
                </View>
                <Text style={[styles.emptyEyebrow, { color: theme.colors.text.secondary }]}>THE NEXT CONVERSATION STARTS HERE</Text>
                <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>Good ideas deserve a conversation.</Text>
                <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
                    Found a creator worth talking to? Send the first message.
                </Text>
                <TouchableOpacity style={[styles.emptyCTA, { backgroundColor: isDark ? '#D9E4F5' : '#172337' }]} onPress={openComposer} accessibilityRole="button" accessibilityLabel="Write your first message">
                    <Text style={[styles.emptyCTAText, { color: isDark ? '#111722' : '#FFFFFF' }]}>New message</Text>
                    <Feather name="arrow-up-right" size={19} color={isDark ? '#111722' : '#FFFFFF'} />
                </TouchableOpacity>
            </View>
            <View style={styles.emptyFooter}>
                <Feather name="lock" size={13} color={theme.colors.text.muted} />
                <Text style={[styles.footerText, { color: theme.colors.text.muted }]}>Your conversations live here, not in your feed.</Text>
            </View>
        </View>
    );

    if (isSearching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['top']}>
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
                                <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>No users found</Text>
                            ) : (
                                <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>Type at least 2 characters to search</Text>
                            )
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.userItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => startChat(item)}>
                                <View style={[styles.avatar, { backgroundColor: theme.colors.primary.DEFAULT }]}>
                                    <Text style={styles.avatarText}>
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['top']}>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.chat_id || item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={loading ? <View style={styles.loadingWrap}><ActivityIndicator color={theme.colors.primary.DEFAULT} /></View> : renderEmpty()}
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
    container: { flex: 1 },
    header: { paddingHorizontal: 23, paddingTop: 25, paddingBottom: 18 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 20 },
    onlineDot: { width: 7, height: 7, borderRadius: 4 },
    eyebrow: { fontSize: 10, letterSpacing: 2.1, fontWeight: '700' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    pageTitle: { fontSize: 38, letterSpacing: -1.8, fontWeight: '800' },
    subtitle: { fontSize: 14, marginTop: 6, fontWeight: '500' },
    composeButton: { width: 51, height: 51, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 53, paddingHorizontal: 16, borderRadius: 15, borderWidth: 1, marginTop: 22 },
    searchInput: { flex: 1, fontSize: 15 },
    listLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', marginTop: 24 },
    listContent: { flexGrow: 1, paddingBottom: 115 },
    loadingWrap: { paddingTop: 120, alignItems: 'center' },
    emptyWrap: { flex: 1, paddingHorizontal: 21, paddingTop: 66 },
    emptyCard: { borderWidth: 1, borderRadius: 27, paddingHorizontal: 25, paddingTop: 27, paddingBottom: 29, alignItems: 'flex-start', overflow: 'hidden' },
    emptyArt: { width: '100%', height: 155, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
    orbit: { width: 176, height: 126, borderRadius: 75, borderWidth: 1, transform: [{ rotate: '-24deg' }], position: 'absolute' },
    orbitSmall: { width: 136, height: 136, borderRadius: 70, borderWidth: 1, position: 'absolute', transform: [{ rotate: '28deg' }] },
    messageBubble: { width: 83, height: 83, borderRadius: 25, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
    messageMini: { position: 'absolute', left: '61%', top: 92, width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    emptyEyebrow: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 13 },
    emptyTitle: { fontSize: 27, lineHeight: 33, letterSpacing: -0.9, fontWeight: '800', maxWidth: 300 },
    emptyDescription: { fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 25, maxWidth: 310 },
    emptyCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', height: 54, borderRadius: 14, paddingHorizontal: 19 },
    emptyCTAText: { fontSize: 15, fontWeight: '700' },
    emptyFooter: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    footerText: { fontSize: 11, fontWeight: '500' },
    listContainer: { paddingHorizontal: 20 },
    emptyText: { textAlign: 'center', marginTop: 30, fontSize: 14 },
    userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1 },
    avatar: { width: 48, height: 48, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
    avatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    displayName: { fontSize: 16, fontWeight: '600' },
    username: { fontSize: 14, marginTop: 2 },
});
