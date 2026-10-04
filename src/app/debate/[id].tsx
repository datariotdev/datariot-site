import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, Image, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { supabase } from '@lib/supabase/client';
import { Post } from '@lib/supabase/hooks/usePosts';
import { useDebateArguments, Argument } from '@lib/supabase/hooks/useDebateArguments';
import { promptSignIn } from '../../lib/utils/promptSignIn';
import { timeAgo } from '../../lib/utils/format';
import { FONT, NO_OUTLINE, ON_VIDEO, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { Avatar } from '../../components/core/Avatar';
import { Chip } from '../../components/core/Chip';
import { IconButton } from '../../components/core/IconButton';
import { EmptyState } from '../../components/core/EmptyState';
import { VideoViewer } from '../../components/core/VideoViewer';
import { notify, confirmAction } from '../../lib/utils/dialogs';

type Side = 'FOR' | 'AGAINST';

/** "This is a strong argument": a count you can add one to. */
function Vote({ voted, count, onPress }: { voted: boolean; count: number; onPress: () => void }) {
    const { c } = useUI();
    const scale = useRef(new Animated.Value(1)).current;

    const press = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 1.25, duration: 90, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start();
        onPress();
    };

    return (
        <Pressable
            onPress={press}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={voted ? 'Remove your vote' : 'Mark as a strong argument'}
            style={[styles.vote, voted && { backgroundColor: c.surfaceHigh }]}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name={voted ? 'bulb' : 'bulb-outline'} size={17} color={voted ? c.text : c.textSecondary} />
            </Animated.View>
            <Txt variant="caption" tone={voted ? 'primary' : 'secondary'}>{count}</Txt>
        </Pressable>
    );
}

export default function DebateThreadScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { c, isDark } = useUI();

    const [post, setPost] = useState<Post | null>(null);
    const [loadingPost, setLoadingPost] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [playing, setPlaying] = useState<string | null>(null);

    const { argumentsList, loading, posting, fetchArguments, postArgument, toggleVoteArgument, deleteArgument } = useDebateArguments(id);

    const [draft, setDraft] = useState('');
    const [side, setSide] = useState<Side | null>(null);
    const inputRef = useRef<TextInput>(null);

    const fetchPost = useCallback(async () => {
        if (!supabase || !id) return;
        try {
            const { data: p, error } = await supabase.from('posts').select('*').eq('id', id).single();
            if (error) throw error;
            if (!p) return;

            let profile: any = {};
            if (p.user_id) {
                const { data: profileData } = await supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', p.user_id).single();
                if (profileData) profile = profileData;
            }

            let isLiked = false;
            if (user) {
                const { data: l } = await supabase.from('post_likes').select('id').eq('user_id', user.id).eq('post_id', id);
                isLiked = !!l && l.length > 0;
            }

            setPost({
                id: p.id,
                userId: p.user_id,
                authorName:
                    profile.display_name ||
                    profile.username ||
                    (user?.id === p.user_id ? (user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0]) : 'User'),
                authorAvatar: profile.avatar_url,
                content: p.content,
                imageUrl: p.image_url || undefined,
                videoUrl: p.video_url || undefined,
                likes: p.likes_count || 0,
                comments: p.comments_count || 0,
                isLiked,
                createdAt: p.created_at,
                timestamp: '',
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPost(false);
        }
    }, [id, user]);

    // The first load (and any change of account) is handled by the effects; coming back to this
    // screen from a video answer or someone's profile reloads it so new arguments show up
    useEffect(() => { fetchPost(); }, [fetchPost]);

    const reload = useRef<() => void>(() => { });
    reload.current = () => { fetchPost(); fetchArguments(); };
    const focused = useRef(false);
    useFocusEffect(
        useCallback(() => {
            if (focused.current) reload.current();
            focused.current = true;
        }, []),
    );

    const likePost = async () => {
        if (!user) { promptSignIn('back a thesis'); return; }
        if (!post) return;
        const was = post.isLiked;
        const apply = (liked: boolean) => setPost(p => (p ? { ...p, isLiked: liked, likes: Math.max(0, p.likes + (liked ? 1 : -1)) } : p));
        apply(!was);
        try {
            const { error } = was
                ? await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', post.id)
                : await supabase.from('post_likes').insert({ user_id: user.id, post_id: post.id });
            if (error) throw error;
        } catch {
            apply(was);
        }
    };

    const send = async () => {
        if (!user) { promptSignIn('join the debate'); return; }
        if (!side || !draft.trim()) return;
        await postArgument(draft, side);
        setDraft('');
    };

    const reply = (arg: Argument) => {
        if (!user) { promptSignIn('join the debate'); return; }
        // A reply is just text that names who it answers; take the other side by default
        setSide(arg.side === 'FOR' ? 'AGAINST' : 'FOR');
        setDraft(`@${arg.authorName} `);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const answerOnCamera = () => {
        if (!user) { promptSignIn('answer on camera'); return; }
        router.push({ pathname: '/(tabs)/create', params: { debateId: id, side: side || 'FOR' } });
    };

    const confirmDeleteArgument = async (arg: Argument) => {
        if (await confirmAction('Delete your argument?', { confirmLabel: 'Delete', destructive: true })) deleteArgument(arg.id);
    };

    const confirmDeletePost = async () => {
        const yes = await confirmAction('Delete this thesis?', {
            message: 'The debate and its arguments go with it. This cannot be undone.',
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (!yes || !post) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('posts').delete().eq('id', post.id);
            if (error) throw error;
            router.back();
        } catch (err) {
            console.error(err);
            notify('Could not delete', 'Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

    const balance = useMemo(() => {
        let forCount = 0, againstCount = 0, forScore = 0, againstScore = 0;
        argumentsList.forEach(a => {
            if (a.side === 'FOR') { forCount++; forScore += a.strength; }
            else if (a.side === 'AGAINST') { againstCount++; againstScore += a.strength; }
        });
        const total = forScore + againstScore;
        return { forCount, againstCount, forPct: total > 0 ? (forScore / total) * 100 : 50, voted: total > 0 };
    }, [argumentsList]);

    // The bar slides to its new share instead of jumping
    const share = useRef(new Animated.Value(50)).current;
    useEffect(() => {
        Animated.timing(share, { toValue: balance.forPct, duration: 320, useNativeDriver: false }).start();
    }, [balance.forPct, share]);
    const forWidth = share.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

    const isOwn = !!user && post?.userId === user.id;
    const canSend = !!side && !!draft.trim() && !posting;

    const header = (
        <View>
            {loadingPost ? (
                <View style={{ paddingVertical: 48 }}><ActivityIndicator color={c.textSecondary} /></View>
            ) : post ? (
                <View style={styles.thesis}>
                    <View style={styles.author}>
                        <Pressable
                            onPress={() => post.userId && router.push(post.userId === user?.id ? '/profile' : (`/user/${post.userId}` as any))}
                            accessibilityRole="button"
                            style={styles.authorLink}
                        >
                            <Avatar uri={post.authorAvatar} name={post.authorName} size={36} />
                            <View style={{ flex: 1 }}>
                                <Txt variant="bodyStrong" numberOfLines={1}>{post.authorName}</Txt>
                                {timeAgo(post.createdAt) ? <Txt variant="caption" tone="tertiary">{timeAgo(post.createdAt)}</Txt> : null}
                            </View>
                        </Pressable>
                        {isOwn ? (
                            deleting ? <ActivityIndicator color={c.danger} /> : (
                                <Pressable onPress={confirmDeletePost} hitSlop={12} accessibilityRole="button" accessibilityLabel="Delete thesis">
                                    <Ionicons name="trash-outline" size={19} color={c.danger} />
                                </Pressable>
                            )
                        ) : null}
                    </View>

                    <Txt variant="title" selectable style={{ marginTop: 16 }}>{post.content}</Txt>

                    {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={[styles.image, { backgroundColor: c.surface }]} /> : null}

                    {post.videoUrl ? (
                        <Pressable onPress={() => setPlaying(post.videoUrl!)} accessibilityRole="button" accessibilityLabel="Play the video" style={[styles.clip, { backgroundColor: c.surface, borderColor: c.hairline }]}>
                            <View style={styles.playDisc}><Ionicons name="play" size={20} color={ON_VIDEO.text} style={{ marginLeft: 2 }} /></View>
                            <Txt variant="callout" tone="secondary">Watch the video</Txt>
                        </Pressable>
                    ) : null}

                    <View style={[styles.balance, { backgroundColor: c.surface, borderColor: c.hairline }]}>
                        <View style={styles.balanceTop}>
                            <Txt variant="callout" tone="secondary">Where it stands</Txt>
                            <Pressable onPress={likePost} hitSlop={10} accessibilityRole="button" accessibilityLabel={post.isLiked ? 'Remove your like' : 'Like this thesis'} style={styles.like}>
                                <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={19} color={post.isLiked ? c.like : c.textSecondary} />
                                <Txt variant="callout" tone={post.isLiked ? 'primary' : 'secondary'}>{post.likes}</Txt>
                            </Pressable>
                        </View>
                        <View style={[styles.track, { backgroundColor: c.surfaceHigh }]}>
                            {balance.voted ? <Animated.View style={[styles.fill, { width: forWidth, backgroundColor: c.accent }]} /> : null}
                        </View>
                        <View style={styles.balanceRow}>
                            <Txt variant="caption" tone={balance.voted ? 'primary' : 'tertiary'}>
                                {balance.voted ? `For ${Math.round(balance.forPct)}%` : 'No votes yet'}
                            </Txt>
                            <Txt variant="caption" tone="secondary">{balance.voted ? `Against ${100 - Math.round(balance.forPct)}%` : ''}</Txt>
                        </View>
                    </View>
                </View>
            ) : (
                <EmptyState icon="alert-circle-outline" title="This thesis isn't available" body="It may have been removed." actionLabel="Go back" onAction={goBack} />
            )}

            {post ? (
                <View style={styles.sectionRow}>
                    <Txt variant="headline">Arguments</Txt>
                    <Txt variant="caption" tone="tertiary">{argumentsList.length} · strongest first</Txt>
                </View>
            ) : null}
        </View>
    );

    const renderArgument = ({ item }: { item: Argument }) => {
        const isFor = item.side === 'FOR';
        const own = !!user && item.authorId === user.id;
        const ruleColor = item.side === 'NEUTRAL' ? c.hairline : isFor ? c.accent : c.textTertiary;

        return (
            <View style={[styles.arg, { backgroundColor: c.surface, borderColor: c.hairline }]}>
                <View style={[styles.rule, { backgroundColor: ruleColor }]} />
                <View style={{ flex: 1 }}>
                    <View style={styles.argHead}>
                        {item.byAI ? (
                            <View style={[styles.aiMark, { backgroundColor: c.surfaceHigh }]}>
                                <Ionicons name="sparkles" size={13} color={c.text} />
                            </View>
                        ) : (
                            <Avatar uri={item.authorAvatar} name={item.authorName} size={26} />
                        )}
                        <Txt variant="callout" numberOfLines={1} style={{ flexShrink: 1 }}>{item.byAI ? 'Orvelis' : item.authorName}</Txt>
                        {item.side !== 'NEUTRAL' ? (
                            <View style={[styles.sideTag, { backgroundColor: c.surfaceHigh }]}>
                                <Txt variant="micro" tone={isFor ? 'primary' : 'secondary'}>{isFor ? 'For' : 'Against'}</Txt>
                            </View>
                        ) : null}
                        <View style={{ flex: 1 }} />
                        <Txt variant="caption" tone="tertiary">{item.timestamp}</Txt>
                        {own ? (
                            <Pressable onPress={() => confirmDeleteArgument(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete your argument">
                                <Ionicons name="trash-outline" size={16} color={c.textTertiary} />
                            </Pressable>
                        ) : null}
                    </View>

                    <Txt variant="body" selectable style={{ marginTop: 10 }}>{item.content}</Txt>

                    {item.videoUrl ? (
                        <Pressable
                            onPress={() => setPlaying(item.videoUrl!)}
                            accessibilityRole="button"
                            accessibilityLabel="Play video answer"
                            style={[styles.argClip, { backgroundColor: c.surfaceHigh }]}
                        >
                            <View style={styles.playDisc}><Ionicons name="play" size={18} color={ON_VIDEO.text} style={{ marginLeft: 2 }} /></View>
                            <Txt variant="callout" tone="secondary">Video answer</Txt>
                        </Pressable>
                    ) : null}

                    <View style={styles.argFoot}>
                        <Vote voted={item.isVoted} count={item.strength} onPress={() => (user ? toggleVoteArgument(item.id) : promptSignIn('vote on arguments'))} />
                        <Pressable onPress={() => reply(item)} hitSlop={8} accessibilityRole="button" style={styles.reply}>
                            <Ionicons name="return-down-forward-outline" size={16} color={c.textSecondary} />
                            <Txt variant="caption" tone="secondary">Reply</Txt>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: c.hairline }]}>
                <IconButton name="chevron-back" label="Back" onPress={goBack} />
                <Txt variant="headline">Debate</Txt>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={post ? argumentsList : []}
                keyExtractor={a => a.id}
                renderItem={renderArgument}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    post && !loading ? (
                        <View style={{ paddingVertical: 36 }}>
                            <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>No arguments yet. Take a side and start it.</Txt>
                        </View>
                    ) : null
                }
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
            />

            {post ? (
                <View style={[styles.composer, { borderTopColor: c.hairline, backgroundColor: c.bg, paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <View style={styles.sideRow}>
                        <Chip label="For" active={side === 'FOR'} onPress={() => setSide(s => (s === 'FOR' ? null : 'FOR'))} />
                        <Chip label="Against" active={side === 'AGAINST'} onPress={() => setSide(s => (s === 'AGAINST' ? null : 'AGAINST'))} />
                        <View style={{ flex: 1 }} />
                        <Pressable onPress={answerOnCamera} hitSlop={8} accessibilityRole="button" accessibilityLabel="Answer on camera" style={styles.camera}>
                            <Ionicons name="videocam-outline" size={19} color={c.text} />
                            <Txt variant="callout">On camera</Txt>
                        </Pressable>
                    </View>
                    <View style={styles.inputRow}>
                        <TextInput
                            ref={inputRef}
                            value={draft}
                            onChangeText={setDraft}
                            placeholder={side ? 'Make your case' : 'Pick a side, then make your case'}
                            placeholderTextColor={c.textTertiary}
                            multiline
                            numberOfLines={1}
                            maxLength={500}
                            style={[styles.input, { backgroundColor: c.surface, borderColor: c.hairline, color: c.text }, NO_OUTLINE]}
                        />
                        <Pressable
                            onPress={send}
                            disabled={!canSend}
                            accessibilityRole="button"
                            accessibilityLabel="Post argument"
                            style={[styles.send, canSend ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderColor: c.hairline, borderWidth: 1 }]}
                        >
                            {posting ? <ActivityIndicator size="small" color={c.textSecondary} /> : <Ionicons name="arrow-up" size={20} color={canSend ? c.onAccent : c.textTertiary} />}
                        </Pressable>
                    </View>
                </View>
            ) : null}

            {playing ? <VideoViewer url={playing} onClose={() => setPlaying(null)} /> : null}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
    thesis: { paddingHorizontal: 20, paddingTop: 20 },
    author: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    authorLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    image: { width: '100%', height: 220, borderRadius: RADIUS.lg, marginTop: 18 },
    clip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, padding: 12, borderRadius: RADIUS.md, borderWidth: 1 },
    playDisc: { width: 40, height: 40, borderRadius: 20, backgroundColor: ON_VIDEO.glassStrong, alignItems: 'center', justifyContent: 'center' },
    balance: { marginTop: 22, padding: 16, borderRadius: RADIUS.lg, borderWidth: 1, gap: 12 },
    balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    like: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    track: { height: 6, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
    fill: { height: 6, borderRadius: 3 },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 28, marginBottom: 12 },
    arg: { flexDirection: 'row', gap: 14, marginHorizontal: 16, marginBottom: 10, padding: 14, paddingLeft: 12, borderRadius: RADIUS.lg, borderWidth: 1 },
    rule: { width: 3, borderRadius: 2 },
    argHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiMark: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    sideTag: { paddingHorizontal: 8, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    argClip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 10, borderRadius: RADIUS.md },
    argFoot: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
    vote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15 },
    reply: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30 },
    composer: { paddingHorizontal: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
    sideRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    camera: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 6 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 12 : 9,
        paddingBottom: Platform.OS === 'ios' ? 12 : 9,
        fontFamily: FONT.regular,
        fontSize: 16,
    },
    send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
