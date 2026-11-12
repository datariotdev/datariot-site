import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { lightColors } from '@components/Theme/ThemeProvider';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { supabase } from '@lib/supabase/client';

type ImageKind = 'avatar' | 'cover';
type ProfileImage = { uri: string; asset?: ImagePicker.ImagePickerAsset };

const profileFields = 'username, display_name, bio, avatar_url, banner_url';
const { background, primary, surface, text } = lightColors;

function errorMessage(error: unknown, fallback: string) {
    return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message : fallback;
}

async function uploadImage(image: ProfileImage | null, kind: ImageKind, userId: string) {
    if (!image?.asset) return image?.uri ?? null;

    const { asset } = image;
    const mimeType = asset.mimeType?.startsWith('image/') ? asset.mimeType : undefined;
    const extension = mimeType?.split('/')[1] || asset.uri.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || 'jpeg';
    const contentType = mimeType || `image/${extension.toLowerCase() === 'jpg' ? 'jpeg' : extension.toLowerCase()}`;
    const path = `${userId}/${kind}_${Date.now()}.${extension}`;
    const bytes = Platform.OS === 'web'
        ? await (asset.file || await (await fetch(asset.uri)).blob()).arrayBuffer()
        : decode(await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' }));
    const bucket = supabase.storage.from('avatars');
    const { error } = await bucket.upload(path, bytes, { contentType });
    if (error) throw error;
    return bucket.getPublicUrl(path).data.publicUrl as string;
}

export default function EditProfile() {
    const router = useRouter();
    const navigation = useNavigation();
    const { user } = useAuth();
    const userId = user?.id;
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(false);
    const [picking, setPicking] = useState(false);
    const [retry, setRetry] = useState(0);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState<ProfileImage | null>(null);
    const [cover, setCover] = useState<ProfileImage | null>(null);
    const busy = useRef(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError('');
        setSaveError('');

        async function loadProfile() {
            try {
                if (!userId || !supabase) throw new Error('Sign in to edit your profile.');
                const { data, error } = await supabase.from('profiles')
                    .select(profileFields).eq('id', userId).maybeSingle();
                if (error) throw error;
                if (!active) return;
                setUsername(data?.username || '');
                setDisplayName(data?.display_name || '');
                setBio(data?.bio || '');
                setAvatar(data?.avatar_url ? { uri: data.avatar_url } : null);
                setCover(data?.banner_url ? { uri: data.banner_url } : null);
            } catch (error) {
                if (active) setLoadError(errorMessage(error, 'Couldn’t load your profile.'));
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadProfile();
        return () => { active = false; };
    }, [userId, retry]);

    const pickImage = async (kind: ImageKind) => {
        if (busy.current) return;
        busy.current = true;
        setPicking(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: kind === 'avatar' || Platform.OS === 'android',
                aspect: kind === 'avatar' ? [1, 1] : [7, 2],
                quality: 0.8,
            });
            const asset = result.assets?.[0];
            if (asset) {
                const setImage = kind === 'avatar' ? setAvatar : setCover;
                setImage({ uri: asset.uri, asset });
                setSaveError('');
            }
        } catch (error) {
            setSaveError(errorMessage(error, 'Couldn’t open your photos.'));
        } finally {
            busy.current = false;
            setPicking(false);
        }
    };

    const goBack = useCallback(() => {
        if (!busy.current) {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/profile');
        }
    }, [router]);

    const saveProfile = async () => {
        if (busy.current || loading || loadError || !userId || !supabase) return;
        busy.current = true;
        setSaving(true);
        setSaveError('');
        let saved = false;
        try {
            const avatarUrl = await uploadImage(avatar, 'avatar', userId);
            if (avatar?.asset && avatarUrl) setAvatar({ uri: avatarUrl });
            const bannerUrl = await uploadImage(cover, 'cover', userId);
            if (cover?.asset && bannerUrl) setCover({ uri: bannerUrl });

            const { error } = await supabase.from('profiles').upsert({
                id: userId,
                username: username.trim(),
                display_name: displayName.trim(),
                bio: bio.trim(),
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                updated_at: new Date().toISOString(),
            }).select('id').single();
            if (error) throw error;
            saved = true;
        } catch (error) {
            setSaveError(errorMessage(error, 'Couldn’t save your changes. Please try again.'));
        } finally {
            busy.current = false;
            setSaving(false);
        }
        if (saved && navigation.isFocused()) goBack();
    };

    const disabled = loading || saving || picking || !!loadError;
    const inputStyle = [styles.input, { color: text.primary, backgroundColor: surface.elevated, borderColor: surface.borderHover }];
    const labelStyle = [styles.label, { color: text.primary }];
    const initial = (displayName.trim()[0] || username.trim()[0] || user?.email?.[0] || 'U').toUpperCase();

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar style="dark" />
            <View style={[styles.toolbar, { borderColor: surface.border }]}>
                <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} disabled={saving || picking}
                    style={[styles.back, { backgroundColor: surface.elevated }]}>
                    <Ionicons name="arrow-back" size={22} color={text.primary} />
                </Pressable>
                <Text numberOfLines={1} style={[styles.title, { color: text.primary }]}>Edit profile</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Save profile"
                    accessibilityState={{ disabled, busy: saving }} disabled={disabled} onPress={saveProfile}
                    style={[styles.save, disabled && !saving && styles.disabled]}>
                    {saving ? <ActivityIndicator color={text.primary} />
                        : <Text style={[styles.buttonText, { color: text.primary }]}>Save</Text>}
                </Pressable>
            </View>

            {loading ? <ActivityIndicator style={styles.loading} color={primary.DEFAULT} />
                : loadError ? (
                    <View style={styles.loadError}>
                        <Text style={[styles.subtitle, { color: text.primary }]}>{loadError}</Text>
                        <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={styles.retry}>
                            <Text style={[styles.buttonText, { color: primary.DEFAULT }]}>Try again</Text>
                        </Pressable>
                    </View>
                ) : (
                    <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
                            {saveError ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite"
                                style={[styles.subtitle, styles.saveError, { color: text.primary, backgroundColor: background.secondary }]}>{saveError}</Text> : null}
                            <View style={[styles.preview, { backgroundColor: background.secondary, borderColor: surface.border }]}>
                                <Text style={[styles.eyebrow, { color: text.secondary }]}>PROFILE PREVIEW</Text>
                                <Pressable accessibilityRole="button" accessibilityLabel="Change cover photo" disabled={disabled}
                                    onPress={() => pickImage('cover')} style={styles.cover}>
                                    <LinearGradient colors={[surface.elevated, primary.glowStrong]}
                                        start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                                    {cover ? <Image source={{ uri: cover.uri }} style={StyleSheet.absoluteFill} /> : null}
                                    <View style={[styles.coverButton, { backgroundColor: background.primary }]}>
                                        <Ionicons name="image-outline" size={16} color={text.primary} />
                                        <Text style={[styles.buttonText, { color: text.primary }]}>{cover ? 'Change cover' : 'Add cover'}</Text>
                                    </View>
                                </Pressable>
                                <View style={styles.identity}>
                                    <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={disabled}
                                        onPress={() => pickImage('avatar')} style={styles.avatarButton}>
                                        <View style={[styles.avatar, { backgroundColor: surface.elevated, borderColor: background.secondary }]}>
                                            {avatar ? <Image source={{ uri: avatar.uri }} style={StyleSheet.absoluteFill} />
                                                : <Text style={[styles.initial, { color: primary.DEFAULT }]}>{initial}</Text>}
                                        </View>
                                        <View style={[styles.camera, { backgroundColor: primary.DEFAULT, borderColor: background.secondary }]}>
                                            <Ionicons name="camera-outline" size={15} color={primary.onPrimary} />
                                        </View>
                                    </Pressable>
                                    <View style={styles.identityText}>
                                        <Text numberOfLines={2} style={[styles.name, { color: text.primary }]}>{displayName.trim() || 'Your name'}</Text>
                                        <Text numberOfLines={1} style={[styles.subtitle, { color: text.secondary }]}>@{username.trim() || 'username'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.form}>
                                <View>
                                    <Text style={labelStyle}>Display name</Text>
                                    <TextInput accessibilityLabel="Display name" style={inputStyle} value={displayName}
                                        editable={!saving} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={text.secondary} />
                                </View>
                                <View>
                                    <Text style={labelStyle}>Username</Text>
                                    <View style={[inputStyle, styles.usernameField]}>
                                        <Text style={[styles.prefix, { color: text.secondary }]}>@</Text>
                                        <TextInput accessibilityLabel="Username" style={[styles.usernameInput, { color: text.primary }]}
                                            value={username} editable={!saving} onChangeText={setUsername} placeholder="username"
                                            placeholderTextColor={text.secondary} autoCapitalize="none" autoCorrect={false} />
                                    </View>
                                </View>
                                <View>
                                    <Text style={labelStyle}>Bio</Text>
                                    <TextInput accessibilityLabel="Bio" style={[inputStyle, styles.bio]} value={bio} editable={!saving}
                                        onChangeText={setBio} placeholder="A few words about you" placeholderTextColor={text.secondary}
                                        multiline textAlignVertical="top" />
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { backgroundColor: background.primary },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
    back: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, minWidth: 0, fontFamily: 'Outfit_700Bold', fontSize: 22, letterSpacing: -0.5 },
    save: { minWidth: 70, minHeight: 44, paddingHorizontal: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: primary.ultra },
    disabled: { opacity: 0.45 },
    buttonText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, flexShrink: 1 },
    body: { flex: 1 },
    content: { width: '100%', maxWidth: 580, alignSelf: 'center', padding: 16, paddingBottom: 32 },
    preview: { borderWidth: 1, borderRadius: 24, padding: 12 },
    eyebrow: { fontFamily: 'Outfit_600SemiBold', fontSize: 10, letterSpacing: 2, marginBottom: 10, marginLeft: 4 },
    cover: { aspectRatio: 3.5, minHeight: 82, borderRadius: 17, overflow: 'hidden', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8 },
    coverButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 10, borderRadius: 12 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, marginTop: -10 },
    avatarButton: { width: 76, height: 76 },
    avatar: { flex: 1, borderRadius: 23, borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    camera: { position: 'absolute', right: -3, bottom: -2, width: 29, height: 29, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    identityText: { flex: 1, minWidth: 0, paddingTop: 12 },
    name: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, letterSpacing: -0.4 },
    initial: { fontFamily: 'Outfit_600SemiBold', fontSize: 29 },
    subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14 },
    form: { gap: 18, paddingTop: 22 },
    label: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginBottom: 7 },
    input: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 16 },
    usernameField: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 0 },
    prefix: { fontFamily: 'Outfit_500Medium', fontSize: 16 },
    usernameInput: { flex: 1, minHeight: 48, paddingVertical: 10, fontFamily: 'Outfit_400Regular', fontSize: 16 },
    bio: { minHeight: 105 },
    loading: { marginTop: 40 },
    saveError: { marginBottom: 12, borderRadius: 12, padding: 12 },
    loadError: { alignItems: 'center', padding: 24 },
    retry: { minHeight: 44, justifyContent: 'center' },
});
