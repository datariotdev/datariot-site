import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image as RNImage, Platform } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { supabase } from '../../lib/supabase/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../Theme/ThemeProvider';

const MenuItem = ({ icon, label, isActive, onPress, isSpecial = false }: { icon: React.ReactNode, label: string, isActive: boolean, onPress?: () => void, isSpecial?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <Pressable
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.menuItem,
                isActive && {
                    backgroundColor: isDark ? 'rgba(217, 228, 255, 0.05)' : 'rgba(107, 127, 204, 0.06)',
                    borderColor: isDark ? 'rgba(217, 228, 255, 0.1)' : 'rgba(107, 127, 204, 0.12)',
                    borderWidth: 1,
                },
                isHovered && !isActive && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    borderWidth: 1,
                    transform: [{ translateX: 2 }],
                },
                isSpecial && {
                    backgroundColor: isDark ? 'rgba(217, 228, 255, 0.06)' : 'rgba(107, 127, 204, 0.06)',
                    borderColor: isDark ? 'rgba(217, 228, 255, 0.15)' : 'rgba(107, 127, 204, 0.2)',
                    borderWidth: 1,
                    marginTop: 12,
                },
                isSpecial && isHovered && {
                    backgroundColor: isDark ? 'rgba(217, 228, 255, 0.12)' : 'rgba(107, 127, 204, 0.12)',
                    borderColor: theme.colors.primary.DEFAULT,
                    shadowColor: isDark ? '#D9E4FF' : '#6B7FCC',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isDark ? 0.35 : 0.15,
                    shadowRadius: 14,
                    transform: [{ scale: 1.02 }, { translateX: 2 }],
                },
            ]}
            onPress={onPress}
        >
            {/* Active gradient indicator line */}
            {isActive && !isSpecial && (
                <LinearGradient
                    colors={isDark ? ['#D9E4FF', '#A5C6FF'] : ['#6B7FCC', '#A5C6FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.activeGradientLine}
                />
            )}
            <View style={[
                styles.iconContainer,
                isHovered && styles.iconHovered,
            ]}>
                {icon}
            </View>
            <Text style={[
                styles.label,
                { color: theme.colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
                isActive && { color: theme.colors.text.primary, fontWeight: '700' },
                isHovered && { color: theme.colors.text.primary },
                isSpecial && { color: isDark ? theme.colors.primary.DEFAULT : '#52526A' }
            ]}>
                {`> ${label.toUpperCase()}`}
            </Text>
        </Pressable>
    );
};

export const WebSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { theme, mode, toggleTheme } = useTheme();
    const isDark = mode === 'dark';
    const [likedVideos, setLikedVideos] = useState<any[]>([]);
    const [isProfileHovered, setIsProfileHovered] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    const fetchLikedVideos = useCallback(async () => {
        if (!user) return;
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
                        url
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) throw error;

            const videos = (likes || []).map((item: any) => ({
                id: item.videos?.id,
                title: item.videos?.title || 'Untitled',
                url: item.videos?.url || item.videos?.s3_url,
            })).filter((v: { id: string }) => v.id);

            setLikedVideos(videos);

        } catch (err) {
            console.error('Error fetching liked videos for menu:', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchLikedVideos();
        }
    }, [user, fetchLikedVideos]);

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/' || pathname === '/index';
        return pathname.startsWith(path);
    };

    return (
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* Logo Section with ambient glow */}
            <View style={styles.logoContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 10, position: 'relative', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                        {/* Ambient glow behind logo */}
                        <View style={{
                            position: 'absolute',
                            width: 52,
                            height: 52,
                            backgroundColor: isDark ? 'rgba(217, 228, 255, 0.12)' : 'rgba(107, 127, 204, 0.08)',
                            borderRadius: 26,
                        }} />
                        <View style={{
                            position: 'absolute',
                            width: 42,
                            height: 42,
                            backgroundColor: isDark ? 'rgba(217, 228, 255, 0.08)' : 'rgba(107, 127, 204, 0.05)',
                            borderRadius: 21,
                        }} />
                        <RNImage
                            source={require('../../../assets/logo.jpg')}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                    </View>
                    <Text style={[styles.logo, { color: theme.colors.primary.DEFAULT, fontFamily: theme.typography.fontFamilies.brand, letterSpacing: 3, fontSize: 17 }]}>DATARIOT</Text>
                </View>
            </View>

            <View style={styles.menuList}>
                <MenuItem
                    icon={<Feather name="trending-up" size={20} color={isActive('/') ? theme.colors.primary.DEFAULT : theme.colors.text.muted} />}
                    label="Feed"
                    isActive={isActive('/')}
                    onPress={() => router.push('/')}
                />
                <MenuItem
                    icon={<Ionicons name="compass-outline" size={22} color={isActive('/discover') ? theme.colors.primary.DEFAULT : theme.colors.text.muted} />}
                    label="Discover"
                    isActive={isActive('/discover')}
                    onPress={() => router.push('/discover')}
                />
                <MenuItem
                    icon={<Ionicons name="add-circle-outline" size={22} color={isActive('/create') ? theme.colors.primary.DEFAULT : theme.colors.text.muted} />}
                    label="Create"
                    isActive={isActive('/create')}
                    onPress={() => router.push('/create')}
                />
                <MenuItem
                    icon={<Feather name="settings" size={20} color={isActive('/settings') ? theme.colors.primary.DEFAULT : theme.colors.text.muted} />}
                    label="Settings"
                    isActive={isActive('/settings')}
                    onPress={() => router.push('/settings')}
                />

                <View style={styles.spacer} />

                <MenuItem
                    icon={<MaterialCommunityIcons name="sword-cross" size={22} color={theme.colors.primary.DEFAULT} />}
                    label="Arena (Beta)"
                    isActive={isActive('/ai')}
                    onPress={() => router.push('/ai')}
                    isSpecial={true}
                />
            </View>

            {/* Liked Videos Section */}
            {likedVideos.length > 0 && (
                <View style={styles.mediaSection}>
                    <Text style={[styles.sectionLabel, { color: '#38BDF8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>[ RECENT.VIDEOS ]</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
                        {likedVideos.map((video) => (
                            <Pressable 
                                key={video.id} 
                                style={styles.mediaCard} 
                                onPress={() => router.push({ pathname: '/video-player', params: { type: 'video', initialVideoId: video.id } })}
                            >
                                <View style={[styles.mediaGradientOuter]}>
                                    <LinearGradient
                                        colors={isDark ? ['rgba(217, 228, 255, 0.06)', 'rgba(217, 228, 255, 0.01)'] : ['rgba(100, 130, 200, 0.05)', 'rgba(100, 130, 200, 0.01)']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                    <View style={[styles.mediaIconPlaceholder, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.1)' : 'rgba(100, 130, 200, 0.08)' }]}>
                                        <Feather name="play" size={11} color={theme.colors.primary.DEFAULT} />
                                    </View>
                                    <Text numberOfLines={1} style={[styles.mediaTitle, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{video.title.toUpperCase()}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* User Profile Section at Bottom */}
            <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.socialRow}>
                    <Pressable onPress={() => window.open('https://twitter.com/datariot_xyz', '_blank')} style={styles.socialIcon}>
                        <FontAwesome5 name="twitter" size={16} color={theme.colors.text.muted} />
                    </Pressable>
                    <Pressable onPress={() => window.open('https://discord.gg/KvBpEVrk2', '_blank')} style={styles.socialIcon}>
                        <FontAwesome5 name="discord" size={16} color={theme.colors.text.muted} />
                    </Pressable>
                    <Pressable onPress={() => window.open('https://instagram.com/datariot.xyz', '_blank')} style={styles.socialIcon}>
                        <FontAwesome5 name="instagram" size={16} color={theme.colors.text.muted} />
                    </Pressable>
                    <View style={{ width: 1, height: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', alignSelf: 'center', marginHorizontal: 4 }} />
                    <Pressable onPress={toggleTheme} style={styles.socialIcon}>
                        <Feather name={isDark ? 'sun' : 'moon'} size={16} color={isDark ? theme.colors.primary.DEFAULT : '#55576A'} />
                    </Pressable>
                </View>

                {user ? (
                    <View>
                        <Pressable 
                            onHoverIn={() => setIsProfileHovered(true)}
                            onHoverOut={() => setIsProfileHovered(false)}
                            style={[
                                styles.profileCard, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.7)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(107, 127, 204, 0.12)',
                                    borderWidth: 1,
                                }
                            ]} 
                            onPress={() => router.push('/profile')}
                        >
                            <LinearGradient
                                colors={['#D9E4FF', '#A5C6FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.avatarGradient}
                            >
                                <Text style={[styles.avatarText, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '800' }]}>{user.email?.[0].toUpperCase()}</Text>
                            </LinearGradient>

                            <View style={styles.profileInfo}>
                                <Text style={[styles.profileName, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]} numberOfLines={1}>
                                    {(user.user_metadata?.username || 'User').toUpperCase()}
                                </Text>
                                <Text style={[styles.profileHandle, { color: theme.colors.text.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]} numberOfLines={1}>
                                    {`> @${(user.user_metadata?.username || 'user').toUpperCase()}`}
                                </Text>
                            </View>
                            <Feather name="chevron-right" size={18} color={theme.colors.text.muted} />
                        </Pressable>
                        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
                            <Text style={[styles.signOutText, { color: theme.colors.text.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>[ DISCONNECT_SESSION ]</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.loginButtonWrapper}>
                        <LinearGradient
                            colors={['#D9E4FF', '#A5C6FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginGradient}
                        >
                            <Pressable
                                style={styles.loginButton}
                                onPress={() => router.push('/auth/login')}
                            >
                                <Text style={[styles.loginText, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '800' }]}>[ AUTH.CONNECT ]</Text>
                            </Pressable>
                        </LinearGradient>
                    </View>
                )}
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        paddingLeft: 24,
        paddingTop: 36,
        paddingBottom: 28,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
    },
    logoContainer: {
        marginBottom: 44,
        paddingLeft: 16,
    },
    logo: {
        fontSize: 17,
        letterSpacing: 3,
    },
    menuList: {
        gap: 6,
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        gap: 14,
        position: 'relative',
        marginBottom: 2,
        borderWidth: 1,
        borderColor: 'transparent',
        // @ts-ignore
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    activeGradientLine: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        borderRadius: 2,
    },
    iconContainer: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
        // @ts-ignore
        transition: 'transform 0.2s ease',
    },
    iconHovered: {
        transform: [{ scale: 1.15 }],
    },
    label: {
        fontSize: 14,
        letterSpacing: 0.3,
    },
    spacer: {
        height: 28,
    },
    footer: {
        marginTop: 'auto',
        borderTopWidth: 1,
        paddingTop: 20,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        // @ts-ignore
        cursor: 'pointer',
        // @ts-ignore
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    avatarGradient: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#000000',
        fontSize: 15,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 13,
    },
    profileHandle: {
        fontSize: 11,
        marginTop: 1,
    },
    loginButtonWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    loginGradient: {
        borderRadius: 14,
    },
    loginButton: {
        width: '100%',
        paddingVertical: 13,
        alignItems: 'center',
    },
    loginText: {
        color: '#000000',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 20,
    },
    socialIcon: {
        padding: 6,
        opacity: 0.6,
        // @ts-ignore
        transition: 'opacity 0.2s ease',
    },
    sectionLabel: {
        marginLeft: 16,
        fontSize: 10,
        letterSpacing: 2.5,
        marginBottom: 12,
        marginTop: 20,
    },
    mediaSection: {
        marginBottom: 20,
        // label (10px + 20 top + 12 bottom) plus one card row; 140 left a
        // dead strip under the thumbnails
        height: 116,
    },
    mediaScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    mediaCard: {
        // the column is 260 wide with 24 of padding and 16 either side of
        // this row, so two cards have to fit inside 204 — at 120 the second
        // one was sliced in half by the sidebar edge
        width: 96,
        height: 62,
        borderRadius: 12,
        overflow: 'hidden',
        // @ts-ignore
        transition: 'transform 0.2s ease',
    },
    mediaGradientOuter: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
        overflow: 'hidden',
    },
    mediaIconPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaTitle: {
        fontSize: 9,
        letterSpacing: 0.5,
    },
    signOutBtn: {
        marginTop: 12,
        alignItems: 'center',
    },
    signOutText: {
        fontSize: 11,
        letterSpacing: 0.5,
    },
});
