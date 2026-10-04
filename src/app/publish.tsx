import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/supabase/hooks/useAuth';
import { VIDEO_CATEGORIES, CATEGORY_DISPLAY_NAMES, VideoCategory } from '../lib/constants/categories';
import { supabase } from '../lib/supabase/client';
import { generateDebateSeed, DebateSeed } from '../lib/ai/client';
import { markContentChanged } from '../lib/utils/freshness';
import { FONT, NO_OUTLINE, ON_VIDEO, RADIUS, useUI } from '../design-system/ui';
import { Txt } from '../components/core/Txt';
import { Avatar } from '../components/core/Avatar';
import { Button } from '../components/core/Button';
import { Chip } from '../components/core/Chip';
import { notify, confirmAction } from '../lib/utils/dialogs';

/** One screen for three jobs: a debate thesis, a video post, or a video answer to a debate. */
export default function PublishScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();
    const { user } = useAuth();
    const { videoUri, duration, debateId, side } = useLocalSearchParams<{ videoUri?: string; duration?: string; debateId?: string; side?: string }>();

    const hasVideo = !!videoUri;
    const answering = !!debateId;

    const [caption, setCaption] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
    const [uploading, setUploading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [aiSeed, setAiSeed] = useState<DebateSeed | null>(null);
    const [suggesting, setSuggesting] = useState(false);
    const [me, setMe] = useState<{ name: string; avatar: string | null }>({ name: user?.email?.split('@')[0] || 'you', avatar: null });
    const [previewPlaying, setPreviewPlaying] = useState(false);

    const player = useVideoPlayer(videoUri || null, p => {
        p.loop = true;
        p.muted = true;
    });
    useEventListener(player, 'playingChange', ({ isPlaying }) => setPreviewPlaying(isPlaying));

    // Who is posting: the name and photo people will see
    useEffect(() => {
        if (!supabase || !user) return;
        let cancelled = false;
        supabase.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).maybeSingle().then(({ data }: { data: any }) => {
            if (cancelled || !data) return;
            setMe({ name: data.display_name || data.username || user.email?.split('@')[0] || 'you', avatar: data.avatar_url ?? null });
        });
        return () => { cancelled = true; };
    }, [user]);

    const togglePreview = () => {
        if (previewPlaying) {
            player.pause();
        } else {
            player.muted = false;
            player.play();
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            notify('Photos access needed', 'Allow access to your library in Settings to add a photo.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const suggest = async () => {
        if (!caption.trim() || suggesting) return;
        setSuggesting(true);
        try {
            const seed = await generateDebateSeed(caption.trim());
            if (seed.fallback) {
                notify('Orvelis is not available', 'Try again in a moment. Your text is unchanged.');
            } else if (seed.thesis) {
                setCaption(seed.thesis);
                setAiSeed(seed);
            }
        } catch (error) {
            console.error('AI suggestion error:', error);
            notify('Orvelis is not available', 'Try again in a moment. Your text is unchanged.');
        } finally {
            setSuggesting(false);
        }
    };

    const canPost = !uploading && (hasVideo || answering || caption.trim().length > 0);

    const handlePost = async () => {
        if (!user) {
            notify('Sign in first', 'You need an account to post.');
            return;
        }
        if (!hasVideo && !caption.trim()) {
            notify('Add your thesis', 'Write the claim you want people to take a side on.');
            return;
        }

        setUploading(true);

        const uploadFile = async (uri: string, bucket: string, path: string) => {
            let body: any;
            const filename = uri.split('/').pop() || 'file';
            const type = bucket === 'videos' ? 'video/mp4' : 'image/jpeg';

            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(uri);
                    body = await response.blob();
                } catch (fetchErr) {
                    console.error('Failed to fetch blob URL:', fetchErr);
                    throw new Error('Could not read the file. Please try again.');
                }
            } else {
                const formData = new FormData();
                formData.append('file', { uri, name: filename, type } as any);
                body = formData;
            }

            const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: type, upsert: true });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            return publicUrl;
        };

        // Real length of the clip, when the review step could read it
        const seconds = Number(duration) > 0 ? Number(duration) : null;

        try {
            let uploadedVideoUrl: string | null = null;
            let uploadedImageUrl: string | null = null;

            if (debateId) {
                // A video argument inside someone's debate
                let videoId = null;
                if (videoUri) {
                    uploadedVideoUrl = await uploadFile(videoUri, 'videos', `${user.id}/${Date.now()}.mp4`);

                    const { data: vData, error: vError } = await supabase
                        .from('videos')
                        .insert({
                            user_id: user.id,
                            title: caption.trim().substring(0, 50) || 'Video answer',
                            url: uploadedVideoUrl,
                            duration: seconds,
                        })
                        .select('id')
                        .single();
                    if (vError) throw vError;
                    videoId = vData.id;
                }

                const prefix = side === 'AGAINST' ? 'AGAINST:|' : 'FOR:|';
                const { error: commentError } = await supabase.from('comments').insert({
                    post_id: debateId,
                    user_id: user.id,
                    text: prefix + caption,
                    video_id: videoId,
                });
                if (commentError) throw commentError;
            } else {
                // A new thesis, optionally with a clip or a photo
                if (videoUri) {
                    uploadedVideoUrl = await uploadFile(videoUri, 'videos', `${user.id}/${Date.now()}.mp4`);

                    const { error: videoError } = await supabase.from('videos').insert({
                        user_id: user.id,
                        title: caption.substring(0, 50) || 'New video',
                        description: caption,
                        url: uploadedVideoUrl,
                        category: selectedCategory,
                        duration: seconds,
                    });
                    if (videoError) throw videoError;
                } else if (imageUri) {
                    uploadedImageUrl = await uploadFile(imageUri, 'posts', `${user.id}/${Date.now()}.jpg`);
                }

                const { data: postData, error: postError } = await supabase
                    .from('posts')
                    .insert({
                        user_id: user.id,
                        content: caption,
                        image_url: uploadedImageUrl,
                        is_published: true,
                        video_url: videoUri ? uploadedVideoUrl : null,
                    })
                    .select('id')
                    .single();

                if (postError) {
                    console.error('Post insert error:', postError);
                    throw postError;
                }

                // Opening arguments the model drafted for this thesis
                if (aiSeed && postData) {
                    const aiArgs = aiSeed.arguments.map(arg => ({
                        post_id: postData.id,
                        user_id: user.id,
                        text: `AI_ORACLE:|${arg.side}:|${arg.text}`,
                        likes_count: arg.strength,
                        is_published: true,
                    }));
                    await supabase.from('comments').insert(aiArgs);
                }
            }

            markContentChanged();
            // Leave the editing screens behind, then land where the result is
            router.dismissAll();
            if (debateId) router.push(`/debate/${debateId}` as any);
            else router.navigate('/(tabs)/profile' as any);
        } catch (error: any) {
            console.error(error);
            notify('Could not post', error?.message || 'Check your connection and try again.');
        } finally {
            setUploading(false);
        }
    };

    const close = async () => {
        const hasWork = !!caption.trim() || !!imageUri;
        if (!hasWork || await confirmAction('Discard this post?', { confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true })) router.back();
    };

    const title = answering ? 'Your answer' : hasVideo ? 'New video' : 'New thesis';
    const placeholder = answering
        ? 'Add a line to your answer (optional)'
        : hasVideo
            ? 'Say what this is about'
            : 'State your thesis: a claim people can take a side on';

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: c.hairline }]}>
                <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel" style={styles.side}>
                    <Txt variant="body" tone="secondary">Cancel</Txt>
                </Pressable>
                <Txt variant="headline">{title}</Txt>
                <View style={[styles.side, { alignItems: 'flex-end' }]}>
                    <Button label="Post" size="sm" onPress={handlePost} loading={uploading} disabled={!canPost} />
                </View>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <View style={styles.author}>
                    <Avatar uri={me.avatar} name={me.name} size={40} />
                    <View style={{ flex: 1 }}>
                        <Txt variant="bodyStrong" numberOfLines={1}>{me.name}</Txt>
                        {answering ? <Txt variant="caption" tone="secondary">Answering · {side === 'AGAINST' ? 'Against' : 'For'}</Txt> : null}
                    </View>
                </View>

                <TextInput
                    value={caption}
                    onChangeText={setCaption}
                    placeholder={placeholder}
                    placeholderTextColor={c.textTertiary}
                    multiline
                    maxLength={1000}
                    autoFocus={!hasVideo}
                    style={[styles.input, { color: c.text }, NO_OUTLINE]}
                />

                {!answering ? (
                    <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
                        <Button
                            label={suggesting ? 'Thinking' : 'Sharpen with Orvelis'}
                            icon="sparkles-outline"
                            variant="secondary"
                            size="sm"
                            onPress={suggest}
                            loading={suggesting}
                            disabled={!caption.trim()}
                            style={{ alignSelf: 'flex-start' }}
                        />
                    </View>
                ) : null}

                {hasVideo ? (
                    <Pressable
                        onPress={togglePreview}
                        accessibilityRole="button"
                        accessibilityLabel={previewPlaying ? 'Pause preview' : 'Play preview'}
                        style={[styles.preview, { borderColor: c.hairline }]}
                    >
                        <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls={false} />
                        {!previewPlaying ? (
                            <View style={styles.previewCenter} pointerEvents="none">
                                <View style={styles.playDisc}>
                                    <Ionicons name="play" size={22} color={ON_VIDEO.text} style={{ marginLeft: 2 }} />
                                </View>
                            </View>
                        ) : null}
                    </Pressable>
                ) : null}

                {imageUri ? (
                    <View style={[styles.imageWrap, { borderColor: c.hairline }]}>
                        <Image source={{ uri: imageUri }} style={styles.image} />
                        <Pressable onPress={() => setImageUri(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.remove}>
                            <Ionicons name="close" size={18} color="#FFFFFF" />
                        </Pressable>
                    </View>
                ) : null}

                {hasVideo && !answering ? (
                    <View style={{ marginTop: 28 }}>
                        <Txt variant="callout" tone="secondary" style={{ paddingHorizontal: 20, marginBottom: 12 }}>Category</Txt>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }} keyboardShouldPersistTaps="handled">
                            {VIDEO_CATEGORIES.map(cat => (
                                <Chip
                                    key={cat}
                                    label={CATEGORY_DISPLAY_NAMES[cat]}
                                    active={selectedCategory === cat}
                                    onPress={() => setSelectedCategory(current => (current === cat ? null : cat))}
                                />
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                {!hasVideo && !imageUri ? (
                    <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
                        <Pressable
                            onPress={pickImage}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.addPhoto, { backgroundColor: c.surface, borderColor: c.hairline }, pressed && { opacity: 0.7 }]}
                        >
                            <Ionicons name="image-outline" size={20} color={c.textSecondary} />
                            <Txt variant="callout" tone="secondary">Add a photo</Txt>
                        </Pressable>
                    </View>
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    side: { minWidth: 76, minHeight: 36, justifyContent: 'center' },
    author: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20 },
    input: {
        minHeight: 110,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        fontFamily: FONT.regular,
        fontSize: 19,
        lineHeight: 26,
        textAlignVertical: 'top',
    },
    preview: {
        alignSelf: 'center',
        width: 190,
        height: 338,
        marginTop: 24,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    previewCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    playDisc: { width: 56, height: 56, borderRadius: 28, backgroundColor: ON_VIDEO.glassStrong, alignItems: 'center', justifyContent: 'center' },
    imageWrap: { marginHorizontal: 20, marginTop: 20, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
    image: { width: '100%', height: 260 },
    remove: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    addPhoto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: RADIUS.md, borderWidth: 1 },
});
