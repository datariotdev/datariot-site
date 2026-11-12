import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Share, Platform, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';
import { supabase } from '../../lib/supabase/client';

type Profile = {
    username?: string; display_name?: string; avatar_url?: string | null; banner_url?: string | null; bio?: string | null;
    followers_count?: number; following_count?: number; videos_count?: number;
};
type Props = {
    profile: Profile | null; userId: string; fallbackName?: string; own?: boolean; showSaved?: boolean;
    activeTab: string; onTab: (tab: any) => void; onEdit?: () => void; onSettings?: () => void;
    onActivity?: () => void; onBack?: () => void; onFollow?: () => void; onMessage?: () => void;
    isFollowing?: boolean; followPending?: boolean;
};
const number = (value = 0) => value >= 1000000 ? `${(value / 1000000).toFixed(1).replace('.0', '')}M`
    : value >= 1000 ? `${(value / 1000).toFixed(1).replace('.0', '')}K` : value.toLocaleString();

async function shareProfile(id: string) {
    const url = `https://datariot.xyz/user/${encodeURIComponent(id)}`;
    try {
        if (Platform.OS === 'web') {
            if (navigator.share) await navigator.share({ title: 'Datariot profile', url });
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                return 'Link copied';
            } else Alert.alert('Profile link', url);
        } else await Share.share({ message: url });
    } catch (error: any) {
        if (error?.name !== 'AbortError') Alert.alert('Couldn’t share', 'Please try again.');
    }
}

export function MobileProfileHeader({ profile, userId, fallbackName = 'Creator', own = false, showSaved = own,
    activeTab, onTab, onEdit, onSettings, onActivity, onBack, onFollow, onMessage, isFollowing, followPending = false }: Props) {
    const { theme, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const [shareStatus, setShareStatus] = useState('');
    const handleShare = async () => {
        const result = await shareProfile(userId);
        if (result) setShareStatus(result);
    };
    const [connections, setConnections] = useState<'followers' | 'following' | null>(null);
    const ink = theme.colors.text.primary;
    const muted = theme.colors.text.secondary;
    const accent = theme.colors.primary.DEFAULT;
    const line = theme.colors.surface.border;
    const actionBorder = theme.colors.surface.borderHover;
    const actionFill = mode === 'dark' ? accent : theme.colors.primary.ultra;
    const actionInk = mode === 'dark' ? theme.colors.primary.onPrimary : ink;
    const name = profile?.display_name || profile?.username || fallbackName;
    const tabs = showSaved ? ['videos', 'posts', 'saved'] : ['videos', 'posts'];
    return (
        <View style={{ backgroundColor: theme.colors.background.primary, paddingTop: insets.top }}>
            <View style={s.toolbar}>
                {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={s.iconButton}>
                    <Ionicons name="arrow-back" size={23} color={ink} />
                </Pressable> : null}
                <Text accessibilityRole="header" style={[s.toolbarTitle, { color: ink }]}>Profile</Text>
                {onSettings && <Pressable accessibilityRole="button" accessibilityLabel="Profile settings" onPress={onSettings} style={s.iconButton}>
                    <Ionicons name="options-outline" size={21} color={ink} />
                </Pressable>}
            </View>
            <View style={s.content}>
                {profile?.banner_url && <Image source={{ uri: profile.banner_url }} resizeMode="cover" style={s.cover} />}
                <View style={s.identity}>
                    <View style={[s.avatar, { backgroundColor: theme.colors.surface.elevated }]}>
                        {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFill} />
                            : <Text style={[s.initial, { color: accent }]}>{name[0]?.toUpperCase()}</Text>}
                    </View>
                    <View style={s.identityText}>
                        <Text numberOfLines={2} style={[s.name, { color: ink }]}>{name}</Text>
                        <Text numberOfLines={1} style={[s.handle, { color: muted }]}>@{profile?.username || fallbackName}</Text>
                    </View>
                </View>
                {profile?.bio ? <Text style={[s.bio, { color: ink }]}>{profile.bio}</Text>
                    : own && <Pressable accessibilityRole="button" onPress={onEdit}><Text style={[s.bio, { color: muted }]}>Add bio</Text></Pressable>}
                <View style={s.stats}>
                    {(['following', 'followers', 'videos'] as const).map(stat => <Pressable key={stat}
                        accessibilityRole="button"
                        accessibilityLabel={`${profile?.[`${stat}_count`] || 0} ${stat}`}
                        onPress={() => stat === 'videos' ? onTab('videos') : setConnections(stat)}
                        style={s.stat}>
                        <Text style={[s.statLabel, { color: muted }]}>
                            <Text style={[s.statValue, { color: ink }]}>{number(profile?.[`${stat}_count`])}</Text>
                            {' '}{stat[0].toUpperCase() + stat.slice(1)}
                        </Text>
                    </Pressable>)}
                </View>
                <View style={s.actions}>
                    <Pressable accessibilityRole="button" disabled={!own && followPending} accessibilityState={{ disabled: !own && followPending, busy: !own && followPending }} onPress={own ? onEdit : onFollow}
                        style={[s.action, { backgroundColor: actionFill, borderColor: actionFill }]}>
                        <Ionicons name={own ? 'create-outline' : isFollowing ? 'checkmark' : 'add'} size={16} color={actionInk} />
                        <Text style={[s.actionText, { color: actionInk }]}>{own ? 'Edit profile' : isFollowing ? 'Following' : 'Follow'}</Text>
                    </Pressable>
                    {!own && onMessage && <Pressable accessibilityRole="button" onPress={onMessage}
                        style={[s.action, { borderColor: actionBorder }]}>
                        <Ionicons name="chatbubble-outline" size={16} color={ink} />
                        <Text style={[s.actionText, { color: ink }]}>Message</Text>
                    </Pressable>}
                    <Pressable accessibilityRole="button" accessibilityLabel={shareStatus || 'Share profile'}
                        onPress={handleShare} hitSlop={2} style={[s.shareAction, { borderColor: actionBorder }]}>
                        <Ionicons name={shareStatus ? 'checkmark' : 'share-outline'} size={17} color={ink} />
                    </Pressable>
                </View>
                {own && onActivity && <Pressable accessibilityRole="button" onPress={onActivity}
                    style={[s.activity, { borderColor: line }]}>
                    <Ionicons name="stats-chart-outline" size={16} color={muted} />
                    <Text style={[s.activityLabel, { color: ink }]}>Activity</Text>
                    <Ionicons name="chevron-forward" size={15} color={muted} />
                </Pressable>}
            </View>
            <View style={[s.tabs, { borderBottomColor: line }]}>
                {tabs.map(tab => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }}
                    onPress={() => onTab(tab)} style={[s.tab, { borderBottomColor: activeTab === tab ? accent : 'transparent' }]}>
                    <Ionicons name={tab === 'videos' ? 'grid-outline' : tab === 'posts' ? 'chatbubbles-outline' : 'bookmark-outline'} size={17} color={activeTab === tab ? ink : muted} />
                    <Text style={[s.tabText, { color: activeTab === tab ? ink : muted }]}>{tab === 'videos' ? 'Videos' : tab === 'posts' ? 'Theses' : 'Saved'}</Text>
                </Pressable>)}
            </View>
            <Connections visible={connections} userId={userId} onClose={() => setConnections(null)} />
        </View>
    );
}

function Connections({ visible, userId, onClose }: { visible: 'followers' | 'following' | null; userId: string; onClose: () => void }) {
    const { theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [people, setPeople] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!visible) return;
        let alive = true;
        setLoading(true); setPeople([]); setError(false);
        (async () => {
            try {
                if (!supabase) throw new Error('Unavailable');
                const field = visible === 'followers' ? 'follower_id' : 'following_id';
                const { data: links, error: linkError } = await supabase.from('follows').select(field)
                    .eq(visible === 'followers' ? 'following_id' : 'follower_id', userId).limit(100);
                if (linkError) throw linkError;
                const ids = [...new Set((links || []).map((link: any) => link[field]))];
                if (!ids.length) return;
                const { data, error: profileError } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
                if (profileError) throw profileError;
                if (alive) setPeople(data || []);
            } catch { if (alive) setError(true); }
            finally { if (alive) setLoading(false); }
        })();
        return () => { alive = false; };
    }, [visible, userId, retry]);
    return <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.modalBackdrop}>
            <Pressable accessibilityLabel="Close connections" style={StyleSheet.absoluteFill} onPress={onClose} />
            <View style={[s.sheet, { backgroundColor: theme.colors.background.primary, paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={s.sheetHeader}><Text style={[s.name, { color: theme.colors.text.primary }]}>{visible === 'followers' ? 'Followers' : 'Following'}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close connections" onPress={onClose} style={s.iconButton}><Ionicons name="close" size={24} color={theme.colors.text.primary} /></Pressable></View>
                {loading ? <ActivityIndicator style={{ padding: 32 }} color={theme.colors.primary.DEFAULT} />
                    : error ? <Pressable onPress={() => setRetry(value => value + 1)}><Text style={[s.bio, { color: theme.colors.text.secondary }]}>Couldn’t load people. Tap to retry.</Text></Pressable>
                    : <FlatList data={people} keyExtractor={person => person.id}
                        ListEmptyComponent={<Text style={[s.bio, { color: theme.colors.text.secondary }]}>{visible === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</Text>}
                        ListFooterComponent={people.length >= 100 ? <Text style={{ color: theme.colors.text.secondary }}>Showing the first 100 people</Text> : null}
                        renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push(`/user/${item.id}`); }} style={s.person}>
                            <View style={[s.personAvatar, { backgroundColor: theme.colors.surface.elevated }]}>{item.avatar_url && <Image source={{ uri: item.avatar_url }} style={StyleSheet.absoluteFill} />}</View>
                            <View style={{ flex: 1 }}><Text style={[s.actionText, { color: theme.colors.text.primary }]}>{item.display_name || item.username || 'Creator'}</Text><Text style={{ color: theme.colors.text.secondary }}>@{item.username || 'creator'}</Text></View>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                        </Pressable>} />}
            </View>
        </View>
    </Modal>;
}
const s = StyleSheet.create({
    toolbar: { height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
    toolbarTitle: { flex: 1, paddingHorizontal: 4, fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
    iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    cover: { width: '100%', height: 76, borderRadius: 12, marginBottom: 14 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 68, height: 68, borderRadius: 34, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    initial: { fontFamily: 'Outfit_600SemiBold', fontSize: 29 },
    identityText: { flex: 1, minWidth: 0 },
    name: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, lineHeight: 24 },
    handle: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 3 },
    bio: { fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20, marginTop: 12 },
    stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, marginTop: 8 },
    stat: { justifyContent: 'center', minHeight: 34 },
    statValue: { fontFamily: 'Outfit_600SemiBold' },
    statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 13 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
    action: { minHeight: 40, borderWidth: 1, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
    shareAction: { width: 40, height: 40, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    actionText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
    activity: { flexDirection: 'row', alignItems: 'center', minHeight: 40, gap: 8, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10, marginTop: 12 },
    activityLabel: { flex: 1, fontFamily: 'Outfit_500Medium', fontSize: 13 },
    tabs: { flexDirection: 'row', marginTop: 12, borderBottomWidth: 1, paddingHorizontal: 12 },
    tab: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderBottomWidth: 2 },
    tabText: { fontFamily: 'Outfit_500Medium', fontSize: 13 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: { maxHeight: '80%', minHeight: 250, paddingHorizontal: 20, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
    person: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 }, personAvatar: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
});
