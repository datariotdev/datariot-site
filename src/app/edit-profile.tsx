import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { theme } from '@design-system/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { supabase } from '@lib/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { TECH_FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';
import { pageBg } from '@design-system/surface';
import { useTheme } from '../components/Theme/ThemeProvider';

export default function Page() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme: appTheme, mode } = useTheme();
    const isDark = mode === 'dark';
    const accent = appTheme.colors.primary.DEFAULT;
    const onAccent = appTheme.colors.primary.onPrimary;
    const hairline = isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.16)';
    const fieldBg = isDark ? 'rgba(218, 230, 247, 0.05)' : 'rgba(255, 255, 255, 0.7)';
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingHeader, setUploadingHeader] = useState(false);

    // Log states for debugging
    console.log('EditProfile states:', { loading, uploadingAvatar, uploadingHeader });

    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    // Preview states (can be local URIs or remote URLs)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);

    // Final URLs (must be remote URLs for saving to DB)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [headerUrl, setHeaderUrl] = useState<string | null>(null);

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            if (!user) throw new Error('No user on the session!');

            const { data, error, status } = await supabase
                .from('profiles')
                .select('username, display_name, avatar_url, bio, banner_url')
                .eq('id', user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username || '');
                setDisplayName(data.display_name || '');
                setAvatarUrl(data.avatar_url);
                setAvatarPreview(data.avatar_url);
                setBio(data.bio || '');
                setHeaderUrl(data.banner_url);
                setHeaderPreview(data.banner_url);
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user, getProfile]);

    const updateProfile = async () => {
        console.log('Update profile triggered');
        if (uploadingAvatar || uploadingHeader) {
            Alert.alert('Please wait', 'Images are still uploading...');
            return;
        }

        try {
            setLoading(true);
            if (!user) throw new Error('No user found');

            // Ensure we are using the remote URL if available, otherwise fallback to existing
            // If headerUrl is null, it might mean no change or upload finished but state lagged? 
            // Actually, uploadImage sets headerUrl directly.
            // But if user didn't change it, headerUrl starts as null unless we initialized it.
            // Wait, we initialize headerUrl in getProfile.

            // Logic:
            // 1. If we have a new remote URL from upload (headerUrl), use it.
            // 2. If we haven't uploaded a new one, we should use the one from getProfile.
            // Problem: In getProfile we set headerUrl to data.banner_url.
            // So headerUrl should hold the current remote URL.
            // Unless... uploadImage failed?

            // Let's use a robust selection:
            const finalAvatarUrl = avatarUrl && avatarUrl.startsWith('http') ? avatarUrl : (avatarPreview && avatarPreview.startsWith('http') ? avatarPreview : null);
            const finalHeaderUrl = headerUrl && headerUrl.startsWith('http') ? headerUrl : (headerPreview && headerPreview.startsWith('http') ? headerPreview : null);

            console.log('Final URLs for save:', { finalAvatarUrl, finalHeaderUrl });

            const updates = {
                id: user.id,
                username: username.trim(),
                display_name: displayName.trim(),
                bio: bio.trim(),
                avatar_url: finalAvatarUrl,
                banner_url: finalHeaderUrl,
                updated_at: new Date().toISOString(),
            };

            console.log('Upserting profile with:', updates);

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) {
                // Check for missing column error (PostgREST code PGRST204 is common for schema cache issues, 
                // but sometimes it's 42703 'undefined_column' in the message details)
                if (error.code === 'PGRST204' || error.message.includes('Could not find the') || error.message.includes('column')) {
                    console.warn('Schema mismatch detected. Attempting partial save...');

                    // Fallback: Save only standard columns
                    const standardUpdates = {
                        id: user.id,
                        username: username.trim(),
                        display_name: displayName.trim(),
                        avatar_url: finalAvatarUrl,
                        updated_at: new Date().toISOString(),
                    };

                    const { error: fallbackError } = await supabase
                        .from('profiles')
                        .upsert(standardUpdates);

                    if (fallbackError) throw fallbackError;

                    Alert.alert(
                        'Saved (Partial)',
                        'Profile name and avatar saved. Bio and Header could not be saved because the database schema is missing those columns. Please run the SQL script to fix this.'
                    );
                    router.back();
                    return;
                }

                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Profile updated successfully');
            Alert.alert('Success', 'Profile updated!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
            console.log('Update profile attempt finished');
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

                // Set preview immediately
                if (type === 'avatar') {
                    setAvatarPreview(localUri);
                } else {
                    setHeaderPreview(localUri);
                }

                uploadImage(localUri, type);
            }
        } catch {
            Alert.alert('Error', 'Error picking image');
        }
    };



    const uploadImage = async (uri: string, type: 'avatar' | 'header') => {
        const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingHeader;
        try {
            setUploading(true);
            if (!user) return;

            const ext = uri.split('.').pop() || 'png';
            const fileName = `${user.id}/${type}_${Date.now()}.${ext}`;
            const filePath = fileName;

            const bucketName = 'avatars';

            console.log('Reading file (base64):', uri);
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });
            const arrayBuffer = decode(base64);
            console.log('File size (bytes):', arrayBuffer.byteLength);

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${ext === 'jpeg' ? 'jpeg' : ext}`,
                    upsert: true
                });

            if (uploadError) {
                if ('message' in uploadError && uploadError.message.includes('Bucket not found')) {
                    throw new Error(`Storage bucket '${bucketName}' not found. Please create it and set to public.`);
                }
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            if (data?.publicUrl) {
                if (type === 'avatar') {
                    console.log('Setting avatar URL:', data.publicUrl);
                    setAvatarUrl(data.publicUrl);
                } else {
                    console.log('Setting header URL:', data.publicUrl);
                    setHeaderUrl(data.publicUrl);
                }
            } else {
                console.warn('GetPublicUrl returned no data');
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (error instanceof Error) {
                Alert.alert('Upload Error', error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    const monoFont = { fontFamily: TECH_FONT };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: pageBg(appTheme.colors.background.primary) }]}>
            <View style={[styles.header, { borderBottomColor: hairline }]}>
                <Pressable onPress={() => router.back()} style={styles.cancelButton}>
                    <Text style={[styles.cancelText, monoFont, { color: appTheme.colors.text.secondary }]}>[ CANCEL ]</Text>
                </Pressable>
                <Text numberOfLines={1} style={[styles.headerTitle, monoFont, { color: appTheme.colors.text.primary }]}>[ EDIT PROFILE ]</Text>
                <Pressable
                    onPress={updateProfile}
                    style={[styles.saveButton, { backgroundColor: accent }, loading && styles.disabledButton]}
                    disabled={loading}
                >
                    {(loading || uploadingAvatar || uploadingHeader) ? (
                        <ActivityIndicator color={onAccent} size="small" />
                    ) : (
                        <Text style={[styles.saveText, monoFont, { color: onAccent }]}>[ SAVE ]</Text>
                    )}
                </Pressable>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                  <View style={styles.column}>
                    {/* Header Image Section */}
                    <View style={styles.headerImageSection}>
                        <Pressable onPress={() => pickImage('header')} style={styles.headerImageContainer} disabled={uploadingHeader}>
                            {headerPreview ? (
                                <View style={{ flex: 1 }}>
                                    <Image source={{ uri: headerPreview }} style={styles.headerImage} />
                                    {uploadingHeader && (
                                        <View style={[StyleSheet.absoluteFill, styles.imageLoadingOverlay]}>
                                            <ActivityIndicator color="white" />
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={[styles.headerImage, styles.placeholderHeader]}>
                                    <Ionicons name="image-outline" size={40} color={appTheme.colors.text.muted} />
                                </View>
                            )}
                            <View style={styles.editIconOverlay}>
                                <Ionicons name="camera" size={20} color="white" />
                            </View>
                        </Pressable>
                    </View>

                    {/* Avatar Section - Overlapping Header */}
                    <View style={styles.avatarSection}>
                        <Pressable onPress={() => pickImage('avatar')} style={styles.avatarContainer} disabled={uploadingAvatar}>
                            <View>
                                {avatarPreview ? (
                                    <Image source={{ uri: avatarPreview }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: accent }]}>
                                        <Text style={[styles.avatarPlaceholderText, monoFont, { color: onAccent }]}>
                                            {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                        </Text>
                                    </View>
                                )}
                                {uploadingAvatar && (
                                    <View style={[styles.avatar, styles.imageLoadingOverlay, { position: 'absolute' }]}>
                                        <ActivityIndicator color="white" />
                                    </View>
                                )}
                            </View>
                            <View style={[styles.editAvatarOverlay, { backgroundColor: accent }]}>
                                <Ionicons name="camera" size={16} color={onAccent} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, monoFont, { color: appTheme.colors.text.secondary }]}>&gt; DISPLAY NAME</Text>
                            <TextInput
                                style={[styles.input, monoFont, { color: appTheme.colors.text.primary, backgroundColor: fieldBg, borderColor: hairline }]}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Enter display name"
                                placeholderTextColor={appTheme.colors.text.muted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, monoFont, { color: appTheme.colors.text.secondary }]}>&gt; USERNAME</Text>
                            <TextInput
                                style={[styles.input, monoFont, { color: appTheme.colors.text.primary, backgroundColor: fieldBg, borderColor: hairline }]}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                placeholderTextColor={appTheme.colors.text.muted}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, monoFont, { color: appTheme.colors.text.secondary }]}>&gt; BIO</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, monoFont, { color: appTheme.colors.text.primary, backgroundColor: fieldBg, borderColor: hairline }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Write something about yourself..."
                                placeholderTextColor={appTheme.colors.text.muted}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                  </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    column: {
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        flexShrink: 1,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.4,
        textAlign: 'center',
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        fontSize: 14,
    },
    saveButton: {
        padding: 8,
        ...pixelClip(3),
        paddingHorizontal: 16,
        minWidth: 70,
        alignItems: 'center',
    },
    saveText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    content: {
        paddingBottom: 40,
    },
    headerImageSection: {
        height: 150,
        width: '100%',
        marginBottom: 50, // Space for avatar overlap
    },
    headerImageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderHeader: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        ...pixelClip(5),
    },
    avatarSection: {
        position: 'absolute',
        top: 100, // Overlap header
        left: 20,
        zIndex: 10,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        ...pixelClip(6),
        borderWidth: 4,
        borderColor: theme.colors.background.primary,
    },
    placeholderAvatar: {
        backgroundColor: theme.colors.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    editAvatarOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary.DEFAULT,
        padding: 6,
        ...pixelClip(4),
        borderWidth: 2,
        borderColor: theme.colors.background.primary,
    },
    form: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
        letterSpacing: 1.2,
    },
    input: {
        ...pixelClip(4),
        padding: 16,
        fontSize: 15,
        borderWidth: 1,
    },
    textArea: {
        minHeight: 100,
    },
    disabledButton: {
        opacity: 0.5,
    },
    imageLoadingOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
