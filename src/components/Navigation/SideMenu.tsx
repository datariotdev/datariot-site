/** @jsxImportSource react */
import { MOBILE_CONTENT_WIDTH } from '../Layout/ScreenFrame';
// Preserve the menu buttons' native Pressable style callbacks.
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Linking,
    Platform,
    Image as RNImage,
    Modal,
    StatusBar,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    FadeInLeft,
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTheme } from '../Theme/ThemeProvider';
import { supabase } from '../../lib/supabase/client';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuItemConfig {
    title: string;
    subtitle?: string;
    route?: string;
    url?: string;
    params?: Record<string, string>;
}

// Menu configuration containing only unique destinations not duplicated on the main screen
const MENU_ITEMS: MenuItemConfig[] = [
    {
        title: 'SAVED CLIPS',
        subtitle: 'Your personal collection',
        route: '/profile',
        params: { tab: 'saved' },
    },
    {
        title: 'SETTINGS',
        subtitle: 'Account & preferences',
        route: '/settings',
    },
    {
        title: 'NOTIFICATIONS',
        subtitle: 'Activity & updates',
        route: '/notifications',
    },
    {
        title: 'COMMUNITY RULES',
        subtitle: 'Guidelines & safety',
        url: 'https://info.datariot.xyz',
    },
    {
        title: 'ABOUT DATARIOT',
        subtitle: 'Vision & platform',
        url: 'https://datariot.xyz',
    },
];

const SOCIAL_LINKS = [
    { id: 'twitter', icon: 'twitter', url: 'https://twitter.com/datariot_xyz' },
    { id: 'discord', icon: 'discord', url: 'https://discord.gg/KvBpEVrk2' },
    { id: 'instagram', icon: 'instagram', url: 'https://instagram.com/datariot.xyz' },
];

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();
    const { theme, mode, toggleTheme } = useTheme();

    const [likedVideos, setLikedVideos] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<{
        displayName: string;
        username: string;
        avatarUrl: string | null;
    } | null>(null);

    const fetchLikedVideos = useCallback(async () => {
        if (!user || !supabase) return;
        try {
            const { data: likes, error } = await supabase
                .from('likes')
                .select(`
                    video_id,
                    videos (
                        id,
                        title,
                        user_id,
                        s3_url,
                        url,
                        thumbnail_url
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            const videos = (likes || [])
                .map((item: any) => ({
                    id: item.videos?.id,
                    title: item.videos?.title || 'Untitled',
                    url: item.videos?.url || item.videos?.s3_url,
                    thumbnailUrl: item.videos?.thumbnail_url || null,
                }))
                .filter((v: { id: string }) => Boolean(v.id));

            setLikedVideos(videos);
        } catch (err) {
            console.error('Error fetching liked videos for menu:', err);
        }
    }, [user]);

    const fetchUserProfile = useCallback(async () => {
        if (!user || !supabase) return;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('display_name, username, avatar_url')
                .eq('id', user.id)
                .single();

            if (data) {
                setUserProfile({
                    displayName: data.display_name || user.email?.split('@')[0] || 'User',
                    username: data.username || user.email?.split('@')[0] || 'user',
                    avatarUrl: data.avatar_url || null,
                });
            }
        } catch {
            // Quiet fail
        }
    }, [user]);

    const progress = useSharedValue(0);

    useEffect(() => {
        if (isOpen) {
            progress.value = withSpring(1, {
                damping: 22,
                stiffness: 95,
            });
            if (user) {
                fetchLikedVideos();
                fetchUserProfile();
            }
        } else {
            progress.value = 0;
        }
    }, [isOpen, user, fetchLikedVideos, fetchUserProfile, progress]);

    const contentStyle = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [24, 0]);
        const opacity = interpolate(progress.value, [0, 1], [0, 1]);
        return {
            transform: [{ translateY }],
            opacity,
        };
    });

    const handleMenuItemPress = (item: MenuItemConfig) => {
        onClose();
        if (item.url) {
            Linking.openURL(item.url).catch((err) => console.error("Couldn't open URL", err));
        } else if (item.route) {
            if (item.params) {
                router.push({ pathname: item.route as any, params: item.params });
            } else {
                router.push(item.route as any);
            }
        }
    };

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    const openLink = (url: string) => {
        Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
    };

    const openLikedVideo = (videoId: string) => {
        onClose();
        router.push({
            pathname: '/video-player',
            params: { initialVideoId: videoId },
        });
    };

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <StatusBar barStyle="light-content" />

                {/* Frosted Glass Background */}
                <View style={StyleSheet.absoluteFill}>
                    {/* Dark baseline scrim to ensure text legibility over any feed content */}
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7, 8, 12, 0.88)' }]} />
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
                    ) : null}
                    <LinearGradient
                        colors={['rgba(217, 228, 255, 0.06)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </View>

                {/* Top Header (Close Button + Brand) */}
                <View style={[styles.header, Platform.OS === 'web' && { width: '100%', maxWidth: MOBILE_CONTENT_WIDTH, alignSelf: 'center' }, { paddingTop: Math.max(insets.top + 8, 24) }]}>
                    <Pressable
                        onPress={onClose}
                        style={styles.closeButton}
                        accessibilityRole="button"
                        accessibilityLabel="Close menu"
                    >
                        <Feather name="x" size={18} color="white" />
                    </Pressable>

                    <View style={styles.brandRow}>
                        <View style={styles.logoBadge}>
                            <RNImage
                                source={require('../../../assets/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={[styles.logoText, { fontFamily: theme.typography.fontFamilies.brand }]}>
                            DATARIOT
                        </Text>
                    </View>
                </View>

                {/* Scrollable Content Body */}
                <ScrollView
                    style={[styles.scroll, Platform.OS === 'web' && { width: '100%', maxWidth: MOBILE_CONTENT_WIDTH, alignSelf: 'center' }]}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Math.max(insets.bottom + 8, 16) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <Animated.View style={contentStyle}>
                        {/* Account Preview Card (Replaces redundant giant Profile button) */}
                        <View style={styles.accountCardSection}>
                            {user ? (
                                <Pressable
                                    onPress={() => {
                                        onClose();
                                        router.push('/profile');
                                    }}
                                    style={({ pressed }) => [
                                        styles.userCard,
                                        pressed && { opacity: 0.8 },
                                    ]}
                                    accessibilityRole="button"
                                    accessibilityLabel="Open profile"
                                >
                                    <View style={styles.userCardAvatarWrap}>
                                        {userProfile?.avatarUrl ? (
                                            <RNImage
                                                source={{ uri: userProfile.avatarUrl }}
                                                style={styles.userCardAvatar}
                                            />
                                        ) : (
                                            <View style={styles.userCardAvatarInitial}>
                                                <Text style={[styles.userCardInitialText, { fontFamily: theme.typography.fontFamilies.bold }]}>
                                                    {(userProfile?.displayName || user.email || 'U')[0].toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.userCardInfo}>
                                        <Text
                                            numberOfLines={1}
                                            style={[styles.userCardName, { fontFamily: theme.typography.fontFamilies.bold }]}
                                        >
                                            {userProfile?.displayName || user.email?.split('@')[0]}
                                        </Text>
                                        <Text numberOfLines={1} style={styles.userCardHandle}>
                                            @{userProfile?.username || user.email?.split('@')[0]}
                                        </Text>
                                    </View>

                                    <View style={styles.userCardBadge}>
                                        <Text style={[styles.userCardBadgeText, { fontFamily: theme.typography.fontFamilies.medium }]}>
                                            Profile
                                        </Text>
                                        <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.7)" />
                                    </View>
                                </Pressable>
                            ) : (
                                <Pressable
                                    onPress={() => {
                                        onClose();
                                        router.push('/auth/login');
                                    }}
                                    style={({ pressed }) => [
                                        styles.guestCard,
                                        pressed && { opacity: 0.85 },
                                    ]}
                                    accessibilityRole="button"
                                    accessibilityLabel="Sign in"
                                >
                                    <View style={styles.guestIconCircle}>
                                        <Feather name="user" size={16} color="#D9E4FF" />
                                    </View>
                                    <View style={styles.guestInfo}>
                                        <Text style={[styles.guestTitle, { fontFamily: theme.typography.fontFamilies.bold }]}>
                                            Sign In to Datariot
                                        </Text>
                                        <Text style={styles.guestSub}>
                                            Save clips and publish arguments
                                        </Text>
                                    </View>
                                    <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.7)" />
                                </Pressable>
                            )}
                        </View>

                        {/* Purposeful Menu Links (Not duplicated on main screen) */}
                        <View style={styles.menuLinks}>
                            {MENU_ITEMS.map((item, index) => {
                                const isActive = item.route ? pathname === item.route : false;

                                return (
                                    <Animated.View
                                        key={item.title}
                                        entering={FadeInLeft.delay(80 + index * 40).duration(400)}
                                    >
                                        <Pressable
                                            accessibilityRole="link"
                                            accessibilityLabel={item.title}
                                            onPress={() => handleMenuItemPress(item)}
                                            style={({ pressed }) => [
                                                styles.menuItem,
                                                pressed && { opacity: 0.6 },
                                            ]}
                                        >
                                            <View>
                                                <Text
                                                    style={[
                                                        styles.menuItemText,
                                                        {
                                                            fontFamily: isActive
                                                                ? theme.typography.fontFamilies.bold
                                                                : theme.typography.fontFamilies.semibold,
                                                        },
                                                        isActive && styles.menuItemTextActive,
                                                    ]}
                                                >
                                                    {item.title}
                                                </Text>
                                                {item.subtitle ? (
                                                    <Text style={styles.menuItemSubtitle}>
                                                        {item.subtitle}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            {isActive && <View style={styles.activeDot} />}
                                        </Pressable>
                                    </Animated.View>
                                );
                            })}
                        </View>

                        {/* Liked Videos Strip */}
                        {likedVideos.length > 0 && (
                            <Animated.View entering={FadeInLeft.delay(320).duration(400)} style={styles.mediaSection}>
                                <Text style={styles.sectionLabel}>RECENTLY LIKED</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.mediaScroll}
                                >
                                    {likedVideos.map((video) => (
                                        <Pressable
                                            key={video.id}
                                            onPress={() => openLikedVideo(video.id)}
                                            style={({ pressed }) => [
                                                styles.mediaCard,
                                                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                                            ]}
                                        >
                                            {video.thumbnailUrl ? (
                                                <RNImage
                                                    source={{ uri: video.thumbnailUrl }}
                                                    style={StyleSheet.absoluteFill}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <LinearGradient
                                                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']}
                                                    style={StyleSheet.absoluteFill}
                                                />
                                            )}
                                            <LinearGradient
                                                colors={['transparent', 'rgba(0,0,0,0.85)']}
                                                locations={[0.3, 1]}
                                                style={StyleSheet.absoluteFill}
                                            />
                                            <View style={styles.mediaCardContent}>
                                                <View style={styles.mediaIconPlaceholder}>
                                                    <Feather name="play" size={10} color="white" />
                                                </View>
                                                <Text numberOfLines={1} style={styles.mediaTitle}>
                                                    {video.title}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {/* Theme Segmented Toggle */}
                        <View style={styles.themeToggleSegment}>
                            <Pressable
                                onPress={() => mode !== 'light' && toggleTheme()}
                                style={[
                                    styles.themeSegmentBtn,
                                    mode === 'light' && styles.themeSegmentActive,
                                ]}
                            >
                                <Ionicons
                                    name="sunny"
                                    size={12}
                                    color={mode === 'light' ? '#07080C' : 'rgba(255,255,255,0.5)'}
                                />
                                <Text
                                    style={[
                                        styles.themeSegmentText,
                                        mode === 'light' && styles.themeSegmentActiveText,
                                        { fontFamily: theme.typography.fontFamilies.semibold },
                                    ]}
                                >
                                    LIGHT
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => mode !== 'dark' && toggleTheme()}
                                style={[
                                    styles.themeSegmentBtn,
                                    mode === 'dark' && styles.themeSegmentActive,
                                ]}
                            >
                                <Ionicons
                                    name="moon"
                                    size={12}
                                    color={mode === 'dark' ? '#07080C' : 'rgba(255,255,255,0.5)'}
                                />
                                <Text
                                    style={[
                                        styles.themeSegmentText,
                                        mode === 'dark' && styles.themeSegmentActiveText,
                                        { fontFamily: theme.typography.fontFamilies.semibold },
                                    ]}
                                >
                                    DARK
                                </Text>
                            </Pressable>
                        </View>

                        {/* Social Links Dock */}
                        <View style={styles.socialRow}>
                            {SOCIAL_LINKS.map((social) => (
                                <Pressable
                                    key={social.id}
                                    onPress={() => openLink(social.url)}
                                    style={styles.socialBtn}
                                    accessibilityRole="link"
                                    accessibilityLabel={`Open ${social.id}`}
                                >
                                    <FontAwesome5 name={social.icon} size={16} color="#FFFFFF" />
                                </Pressable>
                            ))}
                        </View>

                        {/* Sign In / Sign Out */}
                        <Pressable
                            accessibilityRole="button"
                            onPress={user ? handleSignOut : () => { onClose(); router.push('/auth/login'); }}
                            style={styles.signOutBtn}
                        >
                            <Text
                                style={[
                                    styles.signOutText,
                                    {
                                        fontFamily: theme.typography.fontFamilies.semibold,
                                        color: user ? 'rgba(255, 100, 100, 0.85)' : '#D9E4FF',
                                    },
                                ]}
                            >
                                {user ? 'SIGN OUT' : 'SIGN IN'}
                            </Text>
                        </Pressable>

                        <Text style={[styles.version, { fontFamily: theme.typography.fontFamilies.regular }]}>
                            DATARIOT v1.0.2
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoBadge: {
        width: 24,
        height: 24,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        backgroundColor: '#07090C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    accountCardSection: {
        paddingHorizontal: 22,
        marginBottom: 12,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 10,
    },
    userCardAvatarWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    userCardAvatar: {
        width: '100%',
        height: '100%',
    },
    userCardAvatarInitial: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userCardInitialText: {
        color: '#FFFFFF',
        fontSize: 15,
    },
    userCardInfo: {
        flex: 1,
    },
    userCardName: {
        color: '#FFFFFF',
        fontSize: 14,
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    userCardHandle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
    },
    userCardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    userCardBadgeText: {
        color: '#FFFFFF',
        fontSize: 10.5,
    },
    guestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 10,
    },
    guestIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(217, 228, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    guestInfo: {
        flex: 1,
    },
    guestTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        marginBottom: 2,
    },
    guestSub: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10.5,
    },
    menuLinks: {
        paddingHorizontal: 24,
        paddingTop: 4,
        marginBottom: 12,
    },
    menuItem: {
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuItemText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: -0.3,
    },
    menuItemTextActive: {
        color: '#FFFFFF',
    },
    menuItemSubtitle: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10.5,
        marginTop: 2,
        letterSpacing: 0.2,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D9E4FF',
        marginLeft: 12,
    },
    mediaSection: {
        marginBottom: 14,
    },
    sectionLabel: {
        marginHorizontal: 24,
        color: 'rgba(255, 255, 255, 0.45)',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.4,
        marginBottom: 8,
    },
    mediaScroll: {
        paddingHorizontal: 24,
        gap: 8,
    },
    mediaCard: {
        width: 108,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        position: 'relative',
    },
    mediaCardContent: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 8,
    },
    mediaIconPlaceholder: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaTitle: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    footer: {
        alignItems: 'center',
        paddingTop: 6,
    },
    themeToggleSegment: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        padding: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 10,
    },
    themeSegmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
    },
    themeSegmentActive: {
        backgroundColor: '#FFFFFF',
    },
    themeSegmentText: {
        color: 'rgba(255, 255, 255, 0.55)',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    themeSegmentActiveText: {
        color: '#07080C',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 18,
        marginBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    socialBtn: {
        opacity: 0.85,
    },
    signOutBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    signOutText: {
        fontSize: 11,
        letterSpacing: 1,
    },
    version: {
        color: 'rgba(255, 255, 255, 0.25)',
        fontSize: 9,
        letterSpacing: 0.5,
    },
});
