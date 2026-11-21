import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from '../components/UI/SafeAreaView';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { useTheme } from '../components/Theme/ThemeProvider';
import { useNotifications } from '../components/Notifications/NotificationsProvider';
import { useAuth } from '../lib/supabase/hooks/useAuth';
import { ActivityNotification, notificationTarget, notificationTime } from '../lib/supabase/notifications';
import { PlatformUpdates } from '../components/Notifications/PlatformUpdates';
import { CommunityUploads } from '../components/Notifications/CommunityUploads';
import { fetchCommunityUploads, type CommunityUpload } from '../lib/supabase/communityActivity';
import { supabase } from '../lib/supabase/client';

const ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    follow: 'person-add-outline', video_like: 'heart-outline', post_like: 'heart-outline',
    comment_like: 'heart-outline', comment: 'chatbubble-outline', reply: 'return-up-back-outline', message: 'mail-outline',
};

function NotificationRow({ item, disabled, onPress }: { item: ActivityNotification; disabled: boolean; onPress: () => void }) {
    const { theme } = useTheme();
    const [imageFailed, setImageFailed] = useState(false);
    const name = item.actor?.display_name || item.actor?.username || 'Someone';
    const action = item.title || 'New activity';
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={`${name} ${action}${item.is_read ? '' : ', unread'}`}
            disabled={disabled} onPress={onPress}
            style={({ pressed }) => [styles.row, { backgroundColor: item.is_read ? theme.colors.surface.card : theme.colors.primary.glowSubtle,
                borderColor: item.is_read ? theme.colors.surface.border : theme.colors.surface.borderActive, opacity: pressed ? 0.7 : 1 }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.background.tertiary }]}>
                {item.actor?.avatar_url && !imageFailed ? (
                    <Image source={{ uri: item.actor.avatar_url }} style={styles.avatarImage} onError={() => setImageFailed(true)} />
                ) : <Text style={[styles.initial, { color: theme.colors.text.primary }]}>{name.charAt(0).toUpperCase()}</Text>}
                <View style={[styles.eventIcon, { backgroundColor: theme.colors.background.secondary }]}>
                    <Ionicons name={ICONS[item.type] || 'notifications-outline'} size={13} color={theme.colors.primary.DEFAULT} />
                </View>
            </View>
            <View style={styles.rowContent}>
                <Text style={[styles.rowText, { color: theme.colors.text.primary }]}>
                    <Text style={styles.name}>{name}</Text> {action}
                </Text>
                {!!item.body && <Text numberOfLines={2} style={[styles.preview, { color: theme.colors.text.secondary }]}>{item.body}</Text>}
                <Text style={[styles.time, { color: theme.colors.text.muted }]}>{notificationTime(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary.DEFAULT }]} />}
        </Pressable>
    );
}

export default function NotificationsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const activity = useNotifications();
    const { refresh } = activity;
    const [community, setCommunity] = useState<{ scope: string | null; items: CommunityUpload[]; loading: boolean; error: boolean }>({ scope: user?.id ?? null, items: [], loading: true, error: false });
    const communityRequest = useRef(0);
    const scope = user?.id ?? null;
    const loadCommunity = useCallback(async () => {
        const request = ++communityRequest.current;
        setCommunity(previous => ({ scope, items: previous.scope === scope ? previous.items : [], loading: true, error: false }));
        try {
            if (!supabase) throw new Error('Video service unavailable');
            const items = await fetchCommunityUploads(supabase);
            if (request === communityRequest.current) setCommunity({ scope, items, loading: false, error: false });
        } catch {
            if (request === communityRequest.current) setCommunity(previous => ({ ...previous, loading: false, error: true }));
        }
    }, [scope]);
    useFocusEffect(useCallback(() => {
        void refresh();
        if (!authLoading) void loadCommunity();
        return () => { communityRequest.current++; };
    }, [refresh, loadCommunity, authLoading]));
    const visibleCommunity = community.scope === scope ? community : { items: [], loading: true, error: false };
    const refreshAll = () => { void refresh(); void loadCommunity(); };

    const openNotification = async (item: ActivityNotification) => {
        const target = notificationTarget(item);
        if (!target) {
            Alert.alert('Content unavailable', 'This content or account is no longer available.');
            await activity.markRead(item.id);
            return;
        }
        const marked = await activity.markRead(item.id);
        if (marked) router.push(target);
    };

    const empty = (
        <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary.glowSubtle }]}>
                <Ionicons name={activity.filter === 'unread' ? 'checkmark-done-outline' : 'notifications-outline'} size={22} color={theme.colors.primary.DEFAULT} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {!user ? 'Your activity, in one place' : activity.filter === 'unread' ? 'You’re all caught up' : 'Make the first connection'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {!user ? 'Sign in to see your notifications.' : activity.filter === 'unread' ? 'You’ve seen every update. Find a new idea while you’re here.' : 'Follow a creator, leave a thought, start a conversation. This is where it comes back to you.'}
            </Text>
            {!!user && <Pressable accessibilityRole="button" onPress={() => router.push('/discover')} style={[styles.signIn, { backgroundColor: theme.colors.background.tertiary }]}>
                <Text style={{ color: theme.colors.text.primary, fontWeight: '700', fontSize: 12 }}>Find your people</Text>
            </Pressable>}
            {!user && <Pressable accessibilityRole="button" onPress={() => router.push('/auth/login')} style={[styles.signIn, { backgroundColor: theme.colors.primary.DEFAULT }]}>
                <Text style={{ color: theme.colors.background.primary, fontWeight: '700' }}>Sign in</Text>
            </Pressable>}
        </View>
    );

    return (
        <ResponsiveLayout>
            <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: theme.colors.background.primary }]}>
                <View style={styles.header}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                    </Pressable>
                    <View style={styles.heading}>
                        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Notifications</Text>
                        <Text accessibilityLiveRegion="polite" style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                            {activity.unreadCount ? `${activity.unreadCount} unread` : 'Your people. Your platform.'}
                        </Text>
                    </View>
                    {!!user && <Pressable accessibilityRole="button" accessibilityLabel="Mark all notifications as read"
                        disabled={!activity.unreadCount || !activity.items.length || activity.markingRead || activity.loading}
                        onPress={() => { void activity.markRead(); }} style={[styles.back, { opacity: activity.unreadCount ? 1 : 0.4 }]}>
                        {activity.markingRead ? <ActivityIndicator color={theme.colors.primary.DEFAULT} /> : <Ionicons name="checkmark-done-outline" size={24} color={theme.colors.text.primary} />}
                    </Pressable>}
                </View>
                {!!(activity.error || activity.actionError) && <View style={styles.error}>
                    <Text accessibilityRole="alert" style={{ color: theme.colors.text.secondary }}>{activity.actionError || activity.error}</Text>
                    {!!activity.error && <Pressable accessibilityRole="button" onPress={() => { void refresh(); }} style={styles.retry}>
                        <Text style={{ color: theme.colors.text.primary }}>Try again</Text>
                    </Pressable>}
                </View>}
                <FlatList
                    data={activity.items} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                    renderItem={({ item }) => <NotificationRow key={`${item.id}:${item.actor?.avatar_url}`} item={item} disabled={activity.markingRead} onPress={() => { void openNotification(item); }} />}
                    ListHeaderComponent={<View>
                        <PlatformUpdates />
                        {activity.filter === 'all' && <CommunityUploads items={visibleCommunity.items} loading={visibleCommunity.loading || authLoading} error={visibleCommunity.error} onRetry={() => { void loadCommunity(); }} />}
                        <View style={styles.personalHeading}>
                            <Text style={[styles.personalTitle, { color: theme.colors.text.primary }]}>For you</Text>
                            <Text style={[styles.personalHint, { color: theme.colors.text.muted }]}>Your personal activity</Text>
                        </View>
                        {!!user && <View accessibilityRole="tablist" style={[styles.filters, { backgroundColor: theme.colors.background.secondary }]}>
                    {(['all', 'unread'] as const).map(filter => (
                        <Pressable key={filter} accessibilityRole="tab" accessibilityState={{ selected: activity.filter === filter }}
                            disabled={activity.markingRead} onPress={() => activity.setFilter(filter)}
                            style={[styles.filter, activity.filter === filter && { backgroundColor: theme.colors.surface.card }]}>
                            <Text style={{ color: activity.filter === filter ? theme.colors.text.primary : theme.colors.text.secondary, fontWeight: '600' }}>
                                {filter === 'all' ? 'All activity' : 'Unread'}
                            </Text>
                        </Pressable>
                    ))}
                </View>}
                    </View>}
                    ListEmptyComponent={activity.loading || authLoading ? <ActivityIndicator style={styles.loading} color={theme.colors.primary.DEFAULT} /> : !activity.error ? empty : undefined}
                    refreshControl={<RefreshControl refreshing={activity.refreshing && !activity.loading} onRefresh={refreshAll} tintColor={theme.colors.primary.DEFAULT} />}
                    ListFooterComponent={activity.hasMore ? <Pressable accessibilityRole="button" disabled={activity.loadingMore || activity.refreshing} onPress={() => { void activity.loadMore(); }} style={styles.loadMore}>
                        {activity.loadingMore ? <ActivityIndicator color={theme.colors.primary.DEFAULT} /> : <Text style={{ color: theme.colors.text.primary }}>Load older notifications</Text>}
                    </Pressable> : undefined}
                />
            </SafeAreaView>
        </ResponsiveLayout>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, width: '100%', maxWidth: 860, alignSelf: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 8 },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    heading: { flex: 1, minWidth: 0 }, title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 }, subtitle: { fontSize: 13, marginTop: 4 },
    personalHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }, personalTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.45 }, personalHint: { fontSize: 11 },
    filters: { flexDirection: 'row', marginBottom: 10, padding: 4, borderRadius: 14, gap: 4 },
    filter: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    list: { paddingHorizontal: 24, paddingBottom: 40, gap: 10, flexGrow: 1 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderRadius: 20, borderWidth: 1, minHeight: 100 },
    avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    avatarImage: { width: 46, height: 46, borderRadius: 23 }, initial: { fontSize: 19, fontWeight: '700' },
    eventIcon: { position: 'absolute', bottom: -3, right: -3, borderRadius: 12, padding: 4 },
    rowContent: { flex: 1, minWidth: 0 }, rowText: { fontSize: 14, lineHeight: 21 }, name: { fontWeight: '700' },
    preview: { marginTop: 4, fontSize: 13, lineHeight: 18 }, time: { fontSize: 11, marginTop: 8 },
    unreadDot: { width: 7, height: 7, borderRadius: 4 },
    empty: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, paddingHorizontal: 16 }, emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' }, emptyText: { textAlign: 'center', marginTop: 8, fontSize: 12, lineHeight: 20, maxWidth: 340 },
    signIn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 13, marginTop: 16 },
    error: { paddingHorizontal: 24, paddingBottom: 16 }, retry: { paddingVertical: 12 },
    loading: { marginTop: 80 }, loadMore: { padding: 20, alignItems: 'center' },
});
