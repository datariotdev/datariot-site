import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cancelAnimation, Easing, FadeInDown, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { usePalette } from '../../design-system/palette';
import { useCircleFeed, type CircleMode } from '../../lib/circle/useCircleFeed';
import type { Video } from '../../lib/supabase/hooks/useVideos';
import { CommentsModal } from '../VideoFeed/CommentsModal';
import { FullScreenVideoModal } from '../VideoFeed/FullScreenVideoModal';
import { DeepDiveModal } from '../VideoFeed/DeepDiveModal';
import { OrvelisMark } from '../UI/OrvelisMark';
import { formatClock, realThumb } from '../VideoFeed/feedMedia';

const TOPICS = [
    { label: 'All circles', value: null, icon: 'aperture' },
    { label: 'Space & beyond', value: 'Space', icon: 'moon' },
    { label: 'Engineering', value: 'Engineering', icon: 'tool' },
    { label: 'Learn something', value: 'Education', icon: 'book-open' },
    { label: 'Our planet', value: 'Earth Science', icon: 'globe' },
    { label: 'The natural world', value: 'Nature', icon: 'sun' },
    { label: 'In motion', value: 'Sport', icon: 'activity' },
] as const;
const MODES: { key: CircleMode; label: string }[] = [
    { key: 'explore', label: 'Explore' }, { key: 'following', label: 'Following' }, { key: 'saved', label: 'Saved' },
];

function OrbitArtwork({ dark }: { dark: boolean }) {
    const rotation = useSharedValue(0);
    useEffect(() => {
        rotation.value = withRepeat(withTiming(20, { duration: 14000, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }), -1, true, undefined, ReduceMotion.System);
        return () => cancelAnimation(rotation);
    }, [rotation]);
    const orbit = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
    const ink = dark ? '#ABC8EF' : '#527EB4';
    return <View pointerEvents="none" accessible={false} style={s.artwork}>
        <Animated.View style={[s.orbit, orbit]}>
            <View style={{ position: 'absolute', width: 214, height: 214, left: 68, top: 27, borderRadius: 107, backgroundColor: dark ? '#233C59' : '#DAE7F7', opacity: .5 }} />
            <View style={{ position: 'absolute', width: 156, height: 156, left: 97, top: 56, borderRadius: 78, borderWidth: 1, borderColor: ink, opacity: .2 }} />
            {[-30, 38, 104].map(angle => <View key={angle} style={{ position: 'absolute', width: 298, height: 132, left: 26, top: 68, borderRadius: 150, borderWidth: 1, borderColor: ink, opacity: .45, transform: [{ rotate: `${angle}deg` }] }} />)}
            <View style={{ position: 'absolute', width: 76, height: 76, left: 137, top: 96, borderRadius: 38, backgroundColor: dark ? '#AFCFF5' : '#F9FCFF', alignItems: 'center', justifyContent: 'center' }}><Feather name="globe" size={29} color={ink} /></View>
            <View style={{ position: 'absolute', left: 58, top: 84, width: 18, height: 18, borderRadius: 9, backgroundColor: ink }} />
            <View style={{ position: 'absolute', left: 294, top: 109, width: 12, height: 12, borderRadius: 6, backgroundColor: dark ? '#DFEAFA' : '#9FBEE5' }} />
            <View style={{ position: 'absolute', left: 155, top: 237, width: 14, height: 14, borderRadius: 7, backgroundColor: dark ? '#86ACDD' : '#FFFFFF', borderColor: ink, borderWidth: 1 }} />

        </Animated.View>
        <View style={[s.orbitCaption, { backgroundColor: dark ? '#263E59' : 'rgba(255,255,255,.8)' }]}>
            <Feather name="git-pull-request" size={13} color={ink} /><Text style={[s.orbitCaptionText, { color: ink }]}>Different minds. Shared curiosity.</Text>
        </View>
    </View>;
}

function Avatar({ name, uri, size = 34 }: { name: string; uri?: string; size?: number }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [uri]);
    return uri && !failed
        ? <Image accessibilityLabel={name} source={{ uri }} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: size / 2 }} />
        : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E2ECF9', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#4B6B94', fontSize: size * .38, fontFamily: 'Inter_600SemiBold' }}>{name.slice(0, 1).toUpperCase()}</Text></View>;
}

function ClipCard({ video, onWatch, onDiscuss, onContext, onSave, saving, disabledSave, onProfile }: {
    video: Video; onWatch: () => void; onDiscuss: () => void; onContext: () => void; onSave: () => void;
    saving: boolean; disabledSave: boolean; onProfile: () => void;
}) {
    const p = usePalette();
    const [hovered, setHovered] = useState(false);
    const [failed, setFailed] = useState(false);
    const thumb = realThumb(video.thumbnailUrl);
    useEffect(() => setFailed(false), [thumb]);
    return <View style={[s.clipCard, { backgroundColor: p.card }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Watch ${video.title}`} onPress={onWatch}
            onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={[s.poster, { backgroundColor: p.isDark ? '#1D2633' : '#EAF0F8' }]}>
            {thumb && !failed
                ? <Image source={{ uri: thumb }} onError={() => setFailed(true)} style={StyleSheet.absoluteFill} resizeMode="contain" />
                : <View style={s.posterFallback}><Feather name="film" size={34} color={p.isDark ? '#8BA5C8' : '#86A0C3'} /><Text style={[s.posterFallbackText, { color: p.sub }]}>An idea worth your time</Text></View>}
            <View style={[s.play, { backgroundColor: hovered ? '#D9E8FC' : 'rgba(255,255,255,.94)', transform: [{ scale: hovered ? 1.08 : 1 }] }]}><Feather name="play" size={20} color="#1F3755" /></View>
            {!!video.duration && video.duration > 0 && <View style={s.duration}><Text style={s.durationText}>{formatClock(video.duration * 1000)}</Text></View>}
        </Pressable>
        <View style={s.clipBody}>
            <View style={s.between}>
                <Text style={[s.clipCategory, { color: p.isDark ? '#9EBCE4' : '#6481A4' }]}>{video.category || 'Discover'}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={video.isSaved ? `Unsave ${video.title}` : `Save ${video.title}`}
                    accessibilityState={{ selected: video.isSaved, disabled: saving || disabledSave }} disabled={saving || disabledSave} onPress={onSave} hitSlop={6} style={[s.save, { backgroundColor: video.isSaved ? p.cardHigh : 'transparent', opacity: disabledSave ? .4 : 1 }]}>
                    {saving ? <ActivityIndicator size="small" color={p.sub} /> : <Feather name={video.isSaved ? 'check' : 'bookmark'} size={17} color={video.isSaved ? '#6E97CD' : p.sub} />}
                </Pressable>
            </View>
            <Pressable accessibilityRole="button" onPress={onWatch}><Text numberOfLines={2} style={[s.clipTitle, { color: p.text }]}>{video.title}</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`View ${video.author}'s profile`} onPress={onProfile} style={s.author}>
                <Avatar name={video.author} uri={video.avatarUrl} size={23} /><Text numberOfLines={1} style={[s.authorName, { color: p.sub }]}>{video.author}</Text>
                {video.isFollowing && <Feather name="check" size={12} color="#7397C5" />}
            </Pressable>
            <View style={[s.cardActions, { borderColor: p.border }]}>
                <Pressable accessibilityRole="button" onPress={onDiscuss} accessibilityLabel={`Discuss ${video.title}`} style={s.action}>
                    <Feather name="message-circle" size={16} color={p.sub} /><Text style={[s.actionText, { color: p.text }]}>Join conversation</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={onContext} accessibilityLabel={`Explore ${video.title} with Orvelis`} style={s.action}>
                    <OrvelisMark size={19} color={p.isDark ? '#AFC9EF' : '#6E92BF'} /><Text style={[s.actionText, { color: p.sub }]}>Go deeper</Text>
                </Pressable>
            </View>
        </View>
    </View>;
}

export function CircleFeed({ desktop = false, paddingTop = 0 }: { desktop?: boolean; paddingTop?: number }) {
    const p = usePalette();
    const router = useRouter();
    const [mode, setMode] = useState<CircleMode>('explore');
    const [category, setCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [availableWidth, setAvailableWidth] = useState(0);
    const [selected, setSelected] = useState<Video | null>(null);
    const [discussion, setDiscussion] = useState<string | null>(null);
    const [context, setContext] = useState<Video | null>(null);
    const feed = useCircleFeed(mode, category, search);
    const wide = desktop && availableWidth >= 1020;
    const twoColumns = availableWidth >= 620;
    const creators = useMemo(() => [...new Map(feed.videos.map(video => [video.authorId, video])).values()].slice(0, 4), [feed.videos]);
    const clipVideos = selected && !feed.videos.some(video => video.id === selected.id) ? [selected, ...feed.videos] : feed.videos;
    const signIn = () => router.push('/auth/login');
    const save = (id: string) => feed.userId ? feed.toggleSave(id) : signIn();
    const follow = (id: string) => feed.userId ? feed.toggleFollow(id) : signIn();
    const profile = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });
    const reset = () => { setSearch(''); setCategory(null); setMode('explore'); };
    const blue = p.isDark ? '#ABC9EF' : '#496D9D';
    const contextualTitle = mode === 'saved' ? 'Keep the good ideas close.' : mode === 'following' ? 'A little closer to your people.' : 'Find your next rabbit hole.';

    return <View style={s.root} onLayout={event => setAvailableWidth(event.nativeEvent.layout.width)}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingTop: paddingTop + (desktop ? 25 : 14), paddingHorizontal: desktop ? 0 : 16 }]} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInDown.duration(420).reduceMotion(ReduceMotion.System)}>
                <View style={[s.headingRow, !desktop && { marginBottom: 18 }]}>
                    <View style={s.headingGroup}><Text accessibilityRole="header" aria-level={1} style={[s.title, { color: p.text }]}>Circle<Text style={{ color: '#86A8D5' }}>.</Text></Text>
                        {availableWidth > 680 && <Text style={[s.headingNote, { color: p.faint }]}>A place for curious minds.</Text>}</View>
                    <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/create')} style={[s.shareButton, { backgroundColor: p.card }]}><Feather name="plus" size={16} color={p.text} /><Text style={[s.smallBold, { color: p.text }]}>Share a clip</Text></Pressable>
                </View>
                <LinearGradient colors={p.isDark ? ['#19293D', '#203B59', '#1C3048'] : ['#EEF4FD', '#E0EBFA', '#D3E3F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, !desktop && s.heroMobile]}>
                    <View style={[s.heroCopy, availableWidth > 850 && { maxWidth: '64%' }]}>
                        <View style={s.heroEyebrow}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: blue }} /><Text style={[s.eyebrow, { color: blue }]}>CURIOSITY IS BETTER SHARED</Text></View>
                        <Text style={[s.heroTitle, { color: p.isDark ? '#EAF3FF' : '#20354F', fontSize: desktop ? 48 : 36, lineHeight: desktop ? 50 : 39 }]}>Good ideas find{desktop ? '\n' : ' '}their people.</Text>
                        <Text style={[s.heroDescription, { color: p.isDark ? '#B2C4DD' : '#627994' }]}>Follow the minds that make you think. Trade perspectives.{desktop ? '\n' : ' '}Turn a short clip into a longer conversation.</Text>
                        <View style={s.heroFooter}><Feather name="arrow-down-right" size={16} color={blue} /><Text style={[s.heroFootnote, { color: blue }]}>Find an idea below. Add your perspective.</Text></View>
                    </View>
                    {availableWidth > 850 && <OrbitArtwork dark={p.isDark} />}
                </LinearGradient>
            </Animated.View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.topics}>
                {TOPICS.map(topic => <Pressable key={topic.label} accessibilityRole="button" accessibilityState={{ selected: category === topic.value }}
                    onPress={() => setCategory(topic.value)} style={[s.topic, { backgroundColor: category === topic.value ? (p.isDark ? '#D9E6F8' : '#22364F') : p.card }]}>
                    <Feather name={topic.icon} size={15} color={category === topic.value ? (p.isDark ? '#182D48' : '#F0F5FD') : p.sub} />
                    <Text style={[s.topicText, { color: category === topic.value ? (p.isDark ? '#182D48' : '#F0F5FD') : p.sub }]}>{topic.label}</Text>
                </Pressable>)}
            </ScrollView>

            {!wide && creators.length > 0 && <View style={{ marginBottom: 22 }}>
                <Text style={[s.sidebarTitle, { color: p.text, marginBottom: 12 }]}>Behind the ideas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {creators.map(creator => <View key={creator.authorId} style={[s.compactCreator, { backgroundColor: p.card }]}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`View ${creator.author}'s profile`} onPress={() => profile(creator.authorId)} style={s.personProfile}>
                            <Avatar name={creator.author} uri={creator.avatarUrl} /><View style={{ maxWidth: 130 }}><Text numberOfLines={1} style={[s.personName, { color: p.text }]}>{creator.author}</Text><Text style={[s.personTopic, { color: p.faint }]}>{creator.category || 'Curious mind'}</Text></View>
                        </Pressable>
                        {creator.authorId !== feed.userId && <Pressable accessibilityRole="button" accessibilityLabel={`${creator.isFollowing ? 'Unfollow' : 'Follow'} ${creator.author}`}
                            disabled={feed.pending.has(`follow:${creator.authorId}`) || feed.relationsLoading || !!feed.relationsError} onPress={() => follow(creator.authorId)} style={s.follow}>
                            <Feather name={creator.isFollowing ? 'check' : 'plus'} size={17} color={blue} />
                        </Pressable>}
                    </View>)}
                </ScrollView>
            </View>}

            <View style={[s.columns, !wide && { flexDirection: 'column' }]}>
                <View style={s.main}>
                    <View style={[s.toolbar, !twoColumns && { flexDirection: 'column', alignItems: 'stretch', gap: 14 }, { borderColor: p.border }]}>
                        <View accessibilityRole="tablist" style={s.tabs}>
                            {MODES.map(tab => <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: mode === tab.key }} onPress={() => setMode(tab.key)} style={[s.tab, { borderBottomColor: mode === tab.key ? blue : 'transparent' }]}>
                                <Text style={[s.tabText, { color: mode === tab.key ? p.text : p.faint }]}>{tab.label}</Text>
                            </Pressable>)}
                        </View>
                        <View style={[s.search, { backgroundColor: p.cardHigh }, !twoColumns && { width: '100%', marginBottom: 13 }]}>
                            <Feather name="search" size={15} color={p.faint} />
                            <TextInput accessibilityLabel="Search Circle clips" placeholder="Find an idea…" placeholderTextColor={p.faint} value={search} onChangeText={setSearch} style={[s.searchInput, { color: p.text }]} returnKeyType="search" />
                            {!!search && <Pressable accessibilityRole="button" accessibilityLabel="Clear Circle search" onPress={() => setSearch('')} hitSlop={8}><Feather name="x" size={14} color={p.sub} /></Pressable>}
                        </View>
                    </View>
                    <View style={s.feedHeading}><Text accessibilityRole="header" aria-level={2} style={[s.sectionTitle, { color: p.text }]}>{contextualTitle}</Text>
                        <Text style={[s.sectionDescription, { color: p.faint }]}>{mode === 'explore' ? 'Fresh perspectives from across Datariot.' : mode === 'following' ? 'New clips from the creators you choose to follow.' : 'The clips you want to come back to.'}</Text></View>
                    {(feed.actionError || feed.relationsError) && <View accessibilityRole="alert" style={[s.notice, { backgroundColor: p.cardHigh }]}><Text style={[s.noticeText, { color: p.sub }]}>{feed.actionError || feed.relationsError}</Text>
                        <Pressable accessibilityRole="button" onPress={feed.refresh}><Text style={[s.smallBold, { color: blue }]}>Retry</Text></Pressable></View>}
                    {feed.loading && feed.videos.length === 0 ? <View accessibilityLabel="Loading Circle" style={s.loading}><ActivityIndicator color={blue} /><Text style={[s.sectionDescription, { color: p.sub }]}>Finding something worth sharing…</Text></View>
                        : !feed.videos.length ? <View style={[s.empty, { backgroundColor: p.card }]}>
                            <View style={[s.emptyIcon, { backgroundColor: p.cardHigh }]}><Feather name={feed.error ? 'wifi-off' : mode === 'saved' ? 'bookmark' : mode === 'following' ? 'users' : 'search'} size={25} color={blue} /></View>
                            <Text style={[s.emptyTitle, { color: p.text }]}>{feed.error ? 'We couldn’t load your circle.' : mode !== 'explore' && !feed.userId ? 'Your circle starts with you.' : search || category ? 'A little too specific?' : mode === 'saved' ? 'Some ideas are worth keeping.' : mode === 'following' ? 'Find a mind you want to follow.' : 'Be the first to bring an idea.'}</Text>
                            <Text style={[s.emptyText, { color: p.sub }]}>{feed.error ? 'Please check your connection and try again.' : mode !== 'explore' && !feed.userId ? 'Sign in to follow creators and keep your favourite clips together.' : search || category ? 'Try a different search or explore all circles.' : mode === 'saved' ? 'Tap the bookmark on any clip here. You’ll find it waiting for you.' : mode === 'following' ? 'Explore a few clips and follow their creators. Their next ideas will land here.' : 'Share a clip that made you curious and give people something to talk about.'}</Text>
                            <Pressable accessibilityRole="button" onPress={feed.error ? feed.refresh : mode !== 'explore' && !feed.userId ? signIn : !search && !category && mode === 'explore' ? () => router.push('/(tabs)/create') : reset} style={[s.emptyButton, { backgroundColor: p.cardHigh }]}><Text style={[s.smallBold, { color: blue }]}>{feed.error ? 'Try again' : mode !== 'explore' && !feed.userId ? 'Sign in' : mode === 'explore' && !search && !category ? 'Share a clip' : 'Explore all circles'}</Text><Feather name="arrow-right" size={15} color={blue} /></Pressable>
                        </View> : <>
                            <View style={s.grid}>{feed.videos.map(video => <View key={video.id} style={{ width: twoColumns ? '48.8%' : '100%' }}>
                                <ClipCard video={video} onWatch={() => setSelected(video)} onDiscuss={() => setDiscussion(video.id)} onContext={() => setContext(video)}
                                    onSave={() => save(video.id)} saving={feed.pending.has(`save:${video.id}`)} disabledSave={feed.relationsLoading || !!feed.relationsError}
                                    onProfile={() => profile(video.authorId)} />
                            </View>)}</View>
                            {!!feed.error && <Text accessibilityRole="alert" style={[s.emptyText, { color: p.sub, marginTop: 18 }]}>More clips couldn’t load. Your current clips are still here.</Text>}
                            {(feed.hasMore || feed.error) && <Pressable accessibilityRole="button" disabled={feed.loading} onPress={feed.loadMore} style={[s.loadMore, { backgroundColor: p.card, opacity: feed.loading ? .6 : 1 }]}>{feed.loading ? <ActivityIndicator color={blue} /> : <><Text style={[s.smallBold, { color: p.sub }]}>{feed.error ? 'Try loading more' : 'More to explore'}</Text><Feather name="arrow-down" size={15} color={p.sub} /></>}</Pressable>}
                        </>}
                </View>
                <View style={[s.sidebar, { width: wide ? 278 : '100%' }]}>
                    {wide && <View style={[s.people, { borderColor: p.border }]}>
                        <View style={s.sidebarHeading}><Feather name="users" size={17} color={blue} /><Text accessibilityRole="header" aria-level={2} style={[s.sidebarTitle, { color: p.text }]}>Behind the ideas</Text></View>
                        <Text style={[s.sidebarDescription, { color: p.faint }]}>Like how someone thinks?{wide ? '\n' : ' '}Keep them in your circle.</Text>
                        {creators.map(creator => <View key={creator.authorId} style={s.person}>
                            <Pressable accessibilityRole="button" accessibilityLabel={`View ${creator.author}'s profile`} onPress={() => profile(creator.authorId)} style={s.personProfile}>
                                <Avatar name={creator.author} uri={creator.avatarUrl} size={37} /><View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={[s.personName, { color: p.text }]}>{creator.author}</Text><Text numberOfLines={1} style={[s.personTopic, { color: p.faint }]}>{creator.category || 'Curious mind'}</Text></View>
                            </Pressable>
                            {creator.authorId !== feed.userId && <Pressable accessibilityRole="button" accessibilityLabel={`${creator.isFollowing ? 'Unfollow' : 'Follow'} ${creator.author}`}
                                accessibilityState={{ selected: creator.isFollowing, disabled: feed.pending.has(`follow:${creator.authorId}`) || feed.relationsLoading || !!feed.relationsError }}
                                disabled={feed.pending.has(`follow:${creator.authorId}`) || feed.relationsLoading || !!feed.relationsError} onPress={() => follow(creator.authorId)} style={[s.follow, { backgroundColor: creator.isFollowing ? p.cardHigh : p.card }]}>
                                {feed.pending.has(`follow:${creator.authorId}`) ? <ActivityIndicator size="small" color={blue} /> : <Feather name={creator.isFollowing ? 'check' : 'plus'} size={16} color={blue} />}
                            </Pressable>}
                        </View>)}
                        {!creators.length && <Text style={[s.sidebarDescription, { color: p.sub, marginTop: 12 }]}>Creators from the clips you discover will appear here.</Text>}
                    </View>}
                    <View style={[s.contextCard, { backgroundColor: p.isDark ? '#1B2B40' : '#EAF1FB' }]}>
                        <View style={s.between}><OrvelisMark size={29} color={blue} /><Text style={[s.contextEyebrow, { color: blue }]}>ORVELIS AI</Text></View>
                        <Text style={[s.contextTitle, { color: p.text }]}>The clip ends.{'\n'}Your curiosity doesn’t.</Text>
                        <Text style={[s.contextDescription, { color: p.sub }]}>Unpack an idea, question the logic, or find the missing context.</Text>
                        <Pressable accessibilityRole="button" onPress={() => feed.videos[0] ? setContext(feed.videos[0]) : router.push('/(tabs)/ai')} style={s.contextAction}><Text style={[s.smallBold, { color: blue }]}>{feed.videos[0] ? 'Explore a clip with Orvelis' : 'Ask Orvelis'}</Text><Feather name="arrow-up-right" size={16} color={blue} /></Pressable>
                    </View>
                    <View style={s.makeItYours}><Text accessibilityRole="header" aria-level={2} style={[s.sidebarTitle, { color: p.text }]}>Make it your circle.</Text>
                        {[['01', 'Find a spark', 'Pick a topic that pulls you in.'], ['02', 'Follow a mind', 'More of the people, less of the noise.'], ['03', 'Add something', 'A question. An example. A different view.']].map(([index, title, detail]) => <View key={index} style={s.step}><Text style={[s.stepNumber, { color: '#8CA7C9' }]}>{index}</Text><View style={{ flex: 1 }}><Text style={[s.stepTitle, { color: p.sub }]}>{title}</Text><Text style={[s.stepDescription, { color: p.faint }]}>{detail}</Text></View></View>)}
                    </View>
                </View>
            </View>
            <Text style={[s.endnote, { color: p.faint }]}>Stay curious. Bring something to the conversation.</Text>
        </ScrollView>
        <CommentsModal visible={!!discussion} videoId={discussion} focusComposer onClose={() => setDiscussion(null)} />
        <DeepDiveModal visible={!!context} video={context} onClose={() => setContext(null)} />
        <FullScreenVideoModal visible={!!selected} videos={clipVideos} initialVideoId={selected?.id || null} onClose={() => setSelected(null)} onSave={save} activeTab="following" onEndReached={feed.loadMore} onLike={id => feed.userId ? feed.toggleLike(id) : signIn()} />
    </View>;
}

const s = StyleSheet.create({
    root: { flex: 1, minHeight: 0, minWidth: 0 }, content: { paddingBottom: 100 },
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23, gap: 12 },
    headingGroup: { flexDirection: 'row', alignItems: 'center', gap: 22 }, title: { fontFamily: 'Outfit_600SemiBold', fontSize: 39, lineHeight: 45, letterSpacing: -1.8 },
    headingNote: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6 },
    shareButton: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 9, paddingVertical: 11, paddingHorizontal: 14 },
    smallBold: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    hero: { borderRadius: 23, overflow: 'hidden', minHeight: 272, paddingHorizontal: 34, paddingVertical: 29, justifyContent: 'center' },
    heroMobile: { padding: 24, minHeight: 266 }, heroCopy: { zIndex: 1 }, heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
    eyebrow: { fontSize: 9, letterSpacing: 1.6, fontFamily: 'Inter_600SemiBold' },
    heroTitle: { fontFamily: 'Outfit_500Medium', letterSpacing: -1.8 }, heroDescription: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 20, marginTop: 13 },
    heroFooter: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 20 }, heroFootnote: { fontFamily: 'Inter_500Medium', fontSize: 11 },
    artwork: { position: 'absolute', right: 22, top: -5, bottom: 0, width: 350, alignItems: 'center', justifyContent: 'center' }, orbit: { width: 350, height: 268 },
    orbitCaption: { position: 'absolute', bottom: 17, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 }, orbitCaptionText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
    topics: { flexDirection: 'row', gap: 8, paddingVertical: 24 }, topic: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 22, paddingHorizontal: 15, minHeight: 39 }, topicText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
    columns: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' }, main: { flex: 1, minWidth: 0, width: '100%' },
    toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1 }, tabs: { flexDirection: 'row', gap: 23 },
    tab: { borderBottomWidth: 2, paddingVertical: 14 }, tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    search: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 32, borderRadius: 7, width: 205, paddingHorizontal: 11 },
    searchInput: { flex: 1, minWidth: 0, fontFamily: 'Inter_400Regular', fontSize: 11, padding: 0, height: 32, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) },
    feedHeading: { marginTop: 24, marginBottom: 21, gap: 5 }, sectionTitle: { fontFamily: 'Outfit_500Medium', fontSize: 23, lineHeight: 28, letterSpacing: -.6 }, sectionDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 19 }, clipCard: { overflow: 'hidden', borderRadius: 15 },
    poster: { width: '100%', aspectRatio: 1.75, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    posterFallback: { alignItems: 'center', gap: 12 }, posterFallbackText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
    play: { width: 43, height: 43, borderRadius: 24, justifyContent: 'center', alignItems: 'center', paddingLeft: 2, position: 'absolute', shadowColor: '#1A2F4E', shadowOpacity: .12, shadowRadius: 20 },
    duration: { position: 'absolute', right: 10, bottom: 9, backgroundColor: 'rgba(15,24,38,.75)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 }, durationText: { fontSize: 9, color: '#fff', fontFamily: 'Inter_500Medium' },
    clipBody: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    clipCategory: { fontFamily: 'Inter_500Medium', fontSize: 10 }, save: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderRadius: 7 },
    clipTitle: { fontFamily: 'Outfit_500Medium', fontSize: 21, lineHeight: 25, letterSpacing: -.5, marginTop: 2, minHeight: 50 },
    author: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, marginBottom: 15 }, authorName: { fontFamily: 'Inter_400Regular', fontSize: 10, flexShrink: 1 },
    cardActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 9, gap: 5 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 }, actionText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
    sidebar: { flexShrink: 0, paddingTop: 8, gap: 23 }, people: { paddingBottom: 23, borderBottomWidth: 1 }, sidebarHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 7 },
    sidebarTitle: { fontFamily: 'Outfit_500Medium', fontSize: 19, letterSpacing: -.35 }, sidebarDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 18, marginTop: 9 },
    person: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 19 }, personProfile: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }, personName: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 18 }, personTopic: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 16 },
    compactCreator: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12, borderRadius: 12 },
    follow: { width: 33, height: 33, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    contextCard: { borderRadius: 15, padding: 21 }, contextEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 1.3 }, contextTitle: { fontFamily: 'Outfit_500Medium', fontSize: 25, lineHeight: 28, letterSpacing: -.7, marginTop: 18 },
    contextDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 19, marginTop: 12 }, contextAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 20, minHeight: 32 },
    makeItYours: { paddingTop: 0 }, step: { flexDirection: 'row', gap: 13, marginTop: 19 }, stepNumber: { fontFamily: 'Inter_500Medium', fontSize: 10, paddingTop: 3 }, stepTitle: { fontFamily: 'Inter_500Medium', fontSize: 11 }, stepDescription: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 17, marginTop: 3 },
    loading: { paddingVertical: 75, gap: 15, alignItems: 'center' }, empty: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 47, borderRadius: 16 },
    emptyIcon: { width: 57, height: 57, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, emptyTitle: { fontFamily: 'Outfit_500Medium', fontSize: 25, lineHeight: 30, textAlign: 'center', letterSpacing: -.5 },
    emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 21, maxWidth: 360, textAlign: 'center', marginTop: 10 },
    emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, minHeight: 42, borderRadius: 9, marginTop: 22 },
    loadMore: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 43, paddingHorizontal: 22, borderRadius: 10, marginTop: 26 },
    notice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 9, marginBottom: 17 }, noticeText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
    endnote: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 40 },
});
