import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Image,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { supabase } from '@lib/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { ON_VIDEO, useUI } from '../design-system/ui';
import { Txt } from '../components/core/Txt';
import { Avatar } from '../components/core/Avatar';
import { Button } from '../components/core/Button';
import { Field } from '../components/core/Field';
import { notify, confirmAction } from '../lib/utils/dialogs';

const BIO_MAX = 200;

interface Snapshot {
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    headerUrl: string | null;
}

export default function EditProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingHeader, setUploadingHeader] = useState(false);

    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    // What the screen shows (a local file right after picking) vs what gets saved (always a remote URL)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [headerUrl, setHeaderUrl] = useState<string | null>(null);

    // The values as loaded, to know whether there is anything to save
    const initial = useRef<Snapshot | null>(null);

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            if (!user) throw new Error('No user on the session!');

            const { data, error, status } = await supabase
                .from('profiles')
                .select('username, display_name, avatar_url, bio, banner_url')
                .eq('id', user.id)
                .single();

            if (error && status !== 406) throw error;

            if (data) {
                setUsername(data.username || '');
                setDisplayName(data.display_name || '');
                setAvatarUrl(data.avatar_url);
                setAvatarPreview(data.avatar_url);
                setBio(data.bio || '');
                setHeaderUrl(data.banner_url);
                setHeaderPreview(data.banner_url);
                initial.current = {
                    username: data.username || '',
                    displayName: data.display_name || '',
                    bio: data.bio || '',
                    avatarUrl: data.avatar_url ?? null,
                    headerUrl: data.banner_url ?? null,
                };
            }
        } catch (error) {
            if (error instanceof Error) notify('Could not load your profile', error.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) getProfile();
    }, [user, getProfile]);

    const uploading = uploadingAvatar || uploadingHeader;
    const was = initial.current;
    const dirty = !!was && (
        username.trim() !== was.username ||
        displayName.trim() !== was.displayName ||
        bio.trim() !== was.bio ||
        (avatarUrl ?? null) !== was.avatarUrl ||
        (headerUrl ?? null) !== was.headerUrl
    );
    const valid = username.trim().length >= 2;
    const canSave = dirty && valid && !uploading && !saving && !loading;

    const updateProfile = async () => {
        if (uploading) {
            notify('One moment', 'Your photo is still uploading.');
            return;
        }

        try {
            setSaving(true);
            if (!user) throw new Error('No user found');

            // Only remote URLs go to the database; a local file path means the upload has not finished
            const finalAvatarUrl = avatarUrl && avatarUrl.startsWith('http') ? avatarUrl : (avatarPreview && avatarPreview.startsWith('http') ? avatarPreview : null);
            const finalHeaderUrl = headerUrl && headerUrl.startsWith('http') ? headerUrl : (headerPreview && headerPreview.startsWith('http') ? headerPreview : null);

            const updates = {
                id: user.id,
                username: username.trim(),
                display_name: displayName.trim(),
                bio: bio.trim(),
                avatar_url: finalAvatarUrl,
                banner_url: finalHeaderUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) {
                // A project without the bio / banner columns still gets the name and photo saved
                if (error.code === 'PGRST204' || error.message.includes('Could not find the') || error.message.includes('column')) {
                    console.warn('Schema mismatch detected. Attempting partial save...');

                    const { error: fallbackError } = await supabase.from('profiles').upsert({
                        id: user.id,
                        username: username.trim(),
                        display_name: displayName.trim(),
                        avatar_url: finalAvatarUrl,
                        updated_at: new Date().toISOString(),
                    });
                    if (fallbackError) throw fallbackError;

                    notify('Mostly saved', 'Your name and photo are saved. The bio and banner could not be, because the database does not have those fields yet.');
                    router.back();
                    return;
                }

                console.error('Supabase error:', error);
                throw error;
            }

            // The profile page reloads itself when it comes back into view
            router.back();
        } catch {
            notify('Could not save', 'Check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const pickImage = async (type: 'avatar' | 'header') => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'avatar' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                const localUri = result.assets[0].uri;
                if (type === 'avatar') setAvatarPreview(localUri);
                else setHeaderPreview(localUri);
                uploadImage(localUri, type);
            }
        } catch {
            notify('Could not open your photos', 'Allow access to your library in Settings and try again.');
        }
    };

    const uploadImage = async (uri: string, type: 'avatar' | 'header') => {
        const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingHeader;
        // Put the old picture back if this one never makes it up
        const restore = () => {
            if (type === 'avatar') setAvatarPreview(avatarUrl);
            else setHeaderPreview(headerUrl);
        };
        try {
            setUploading(true);
            if (!user) return;

            const ext = uri.split('.').pop() || 'png';
            const filePath = `${user.id}/${type}_${Date.now()}.${ext}`;
            const bucketName = 'avatars';

            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const arrayBuffer = decode(base64);

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${ext === 'jpeg' ? 'jpeg' : ext}`,
                    upsert: true,
                });

            if (uploadError) {
                if ('message' in uploadError && uploadError.message.includes('Bucket not found')) {
                    throw new Error(`Storage bucket '${bucketName}' not found. Please create it and set to public.`);
                }
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            if (data?.publicUrl) {
                if (type === 'avatar') setAvatarUrl(data.publicUrl);
                else setHeaderUrl(data.publicUrl);
            } else {
                restore();
            }
        } catch (error) {
            console.error('Upload error:', error);
            restore();
            notify('Photo not uploaded', error instanceof Error ? error.message : 'Try a different photo.');
        } finally {
            setUploading(false);
        }
    };

    const close = async () => {
        if (!dirty || await confirmAction('Discard your changes?', { confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true })) router.back();
    };

    const name = displayName || username || user?.email?.split('@')[0] || '';

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel" style={styles.side}>
                    <Txt variant="body" tone="secondary">Cancel</Txt>
                </Pressable>
                <Txt variant="headline">Edit profile</Txt>
                <View style={[styles.side, { alignItems: 'flex-end' }]}>
                    <Button label="Save" size="sm" onPress={updateProfile} loading={saving} disabled={!canSave} />
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Banner */}
                <Pressable
                    onPress={() => pickImage('header')}
                    disabled={uploadingHeader}
                    accessibilityRole="button"
                    accessibilityLabel="Change banner"
                    style={[styles.banner, { backgroundColor: c.surface }]}
                >
                    {headerPreview ? <Image source={{ uri: headerPreview }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                    {uploadingHeader ? (
                        <View style={[StyleSheet.absoluteFill, styles.dim]}><ActivityIndicator color="#FFFFFF" /></View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: ON_VIDEO.glassStrong, right: 12, bottom: 12 }]}>
                            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                        </View>
                    )}
                </Pressable>

                {/* Photo, overlapping the banner */}
                <View style={styles.avatarRow}>
                    <Pressable onPress={() => pickImage('avatar')} disabled={uploadingAvatar} accessibilityRole="button" accessibilityLabel="Change photo" style={{ alignSelf: 'flex-start' }}>
                        <Avatar uri={avatarPreview} name={name} size={92} style={{ borderWidth: 4, borderColor: c.bg }} />
                        {uploadingAvatar ? (
                            <View style={[styles.avatarDim]}><ActivityIndicator color="#FFFFFF" /></View>
                        ) : (
                            <View style={[styles.badge, { backgroundColor: c.accent, right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: c.bg }]}>
                                <Ionicons name="camera" size={14} color={c.onAccent} />
                            </View>
                        )}
                    </Pressable>
                </View>

                <View style={styles.form}>
                    <Field label="Name" value={displayName} onChangeText={setDisplayName} placeholder="How you want to be shown" maxLength={50} />
                    <Field
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="username"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={30}
                        hint={!valid && username.length > 0 ? 'Use at least 2 characters.' : undefined}
                    />
                    <Field
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="What do you make, and what do you want to argue about?"
                        multiline
                        maxLength={BIO_MAX}
                        hint={`${bio.length}/${BIO_MAX}`}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
    side: { minWidth: 76, minHeight: 36, justifyContent: 'center' },
    banner: { height: 132, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    dim: { backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    avatarRow: { paddingHorizontal: 20, marginTop: -46, marginBottom: 8 },
    avatarDim: { position: 'absolute', top: 0, left: 0, width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
    form: { paddingHorizontal: 20, paddingTop: 12, gap: 20 },
});
