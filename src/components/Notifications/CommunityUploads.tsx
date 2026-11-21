import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';
import type { CommunityUpload } from '../../lib/supabase/communityActivity';
import { notificationTime } from '../../lib/supabase/notifications';

function UploadRow({ item }: { item: CommunityUpload }) {
    const { theme } = useTheme();
    const router = useRouter();
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const open = () => router.push({ pathname: '/video-player', params: { videoId: item.id, initialVideoId: item.id } });
    const metric = item.views > 0 ? `${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(item.views)} views` : item.likes > 0 ? `${item.likes} likes` : '';
    return <View style={[s.upload, { borderBottomColor: theme.colors.surface.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.author}'s profile`} onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.authorId } })} style={[s.avatar, { backgroundColor: theme.colors.background.tertiary }]}>
            {!!item.avatarUrl && !avatarFailed ? <Image source={{ uri: item.avatarUrl }} style={s.avatarImage} onError={() => setAvatarFailed(true)} /> : <Text style={[s.initial, { color: theme.colors.text.secondary }]}>{item.author.charAt(0).toUpperCase()}</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Watch ${item.title} by ${item.author}`} onPress={open} style={({ pressed }) => [s.uploadCopy, { opacity: pressed ? 0.65 : 1 }]}>
            <Text style={[s.activityText, { color: theme.colors.text.secondary }]}><Text style={[s.author, { color: theme.colors.text.primary }]}>{item.author}</Text> shared a clip</Text>
            <Text numberOfLines={2} style={[s.clipTitle, { color: theme.colors.text.primary }]}>{item.title}</Text>
            <View style={s.metadata}><Text style={[s.time, { color: theme.colors.text.muted }]}>{notificationTime(item.createdAt)}</Text>{!!metric && <><View style={[s.dividerDot, { backgroundColor: theme.colors.text.muted }]} /><Text style={[s.time, { color: theme.colors.text.muted }]}>{metric}</Text></>}</View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Play ${item.title}`} onPress={open} style={[s.thumbnail, { backgroundColor: theme.colors.background.tertiary }]}>
            {!!item.thumbnailUrl && !thumbnailFailed && <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setThumbnailFailed(true)} />}
            <View style={[s.play, { backgroundColor: item.thumbnailUrl && !thumbnailFailed ? 'rgba(10,22,34,0.42)' : 'rgba(69,99,130,0.18)' }]}><Ionicons name="play" size={13} color={item.thumbnailUrl && !thumbnailFailed ? '#FFF' : '#52728F'} /></View>
        </Pressable>
    </View>;
}

export function CommunityUploads({ items, loading, error, onRetry }: { items: CommunityUpload[]; loading: boolean; error: boolean; onRetry: () => void }) {
    const { theme } = useTheme();
    const router = useRouter();
    return <View style={s.section}>
        <View style={s.sectionHeader}><View style={{ flex: 1 }}><Text style={[s.sectionTitle, { color: theme.colors.text.primary }]}>From the community</Text><Text style={[s.sectionHint, { color: theme.colors.text.secondary }]}>Creators and clips worth catching up with.</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Discover more videos" onPress={() => router.push('/discover')} style={s.explore}><Ionicons name="arrow-forward" size={20} color={theme.colors.text.secondary} /></Pressable>
        </View>
        <View style={[s.uploads, { backgroundColor: theme.colors.surface.card, borderColor: theme.colors.surface.border }]}>
            {items.map(item => <UploadRow key={`${item.id}:${item.thumbnailUrl}:${item.avatarUrl}`} item={item} />)}
            {loading && !items.length ? <View style={s.state}><ActivityIndicator color={theme.colors.text.secondary} /><Text style={[s.stateText, { color: theme.colors.text.secondary }]}>Finding fresh clips…</Text></View> : !items.length ? <View style={s.state}>
                <Ionicons name={error ? 'cloud-offline-outline' : 'play-circle-outline'} size={26} color={theme.colors.text.secondary} />
                <Text style={[s.stateText, { color: theme.colors.text.secondary }]}>{error ? 'Community clips couldn’t load.' : 'The next good idea is one clip away.'}</Text>
                <Pressable accessibilityRole="button" onPress={error ? onRetry : () => router.push('/discover')} style={s.stateAction}><Text style={[s.author, { color: theme.colors.text.primary }]}>{error ? 'Try again' : 'Explore Discover'}</Text></Pressable>
            </View> : error ? <Pressable accessibilityRole="button" onPress={onRetry} style={s.stateAction}><Text style={[s.stateText, { color: theme.colors.text.secondary }]}>Couldn’t refresh clips. Try again.</Text></Pressable> : null}
        </View>
        <Text style={[s.explanation, { color: theme.colors.text.muted }]}>Community picks · ranked by engagement and freshness</Text>
    </View>;
}

const s = StyleSheet.create({
    section: { marginBottom: 30 }, sectionHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 }, sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.45 }, sectionHint: { fontSize: 12, lineHeight: 18, marginTop: 5 },
    explore: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    uploads: { borderWidth: 1, borderRadius: 22, overflow: 'hidden', paddingHorizontal: 16 }, upload: { flexDirection: 'row', gap: 12, paddingVertical: 17, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
    avatar: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', alignSelf: 'flex-start', marginTop: 6 }, avatarImage: { height: 40, width: 40 }, initial: { fontSize: 16, fontWeight: '600' },
    uploadCopy: { flex: 1, minWidth: 0, minHeight: 72, justifyContent: 'center' }, activityText: { fontSize: 12, lineHeight: 18 }, author: { fontWeight: '700', fontSize: 12 }, clipTitle: { fontSize: 13, lineHeight: 19, fontWeight: '500', marginTop: 4 },
    metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 7 }, time: { fontSize: 10 }, dividerDot: { width: 2, height: 2, borderRadius: 1 },
    thumbnail: { width: 59, height: 76, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, play: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
    explanation: { fontSize: 10, lineHeight: 16, marginTop: 10, paddingHorizontal: 2 },
    state: { paddingVertical: 26, alignItems: 'center', gap: 10 }, stateText: { fontSize: 12 }, stateAction: { padding: 12, alignItems: 'center' },
});
