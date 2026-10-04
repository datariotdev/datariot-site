import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUI } from '../../design-system/ui';
import { formatCount } from '../../lib/utils/format';
import { Avatar } from '../core/Avatar';
import { Button } from '../core/Button';
import { IconButton } from '../core/IconButton';
import { Txt } from '../core/Txt';

export interface ProfileInfo {
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
    banner_url?: string | null;
    bio?: string | null;
    followers_count?: number;
    following_count?: number;
    videos_count?: number;
}

interface ProfileHeaderProps {
    profile: ProfileInfo | null;
    /** Fallback name while the profile loads (the signed-in email's local part, say). */
    fallbackName?: string;
    isOwn: boolean;
    isFollowing?: boolean;
    onBack?: () => void;
    onSettings?: () => void;
    onShare?: () => void;
    onEdit?: () => void;
    onStats?: () => void;
    onFollow?: () => void;
    onMessage?: () => void;
}

function Stat({ value, label }: { value: number; label: string }) {
    return (
        <View style={styles.stat}>
            <Txt variant="headline">{formatCount(value)}</Txt>
            <Txt variant="caption" tone="secondary">{label}</Txt>
        </View>
    );
}

/**
 * Who this is. A banner only when they have set one; otherwise just the page.
 * The same header serves your own profile and anyone else's; the buttons differ.
 */
export function ProfileHeader({ profile, fallbackName = 'User', isOwn, isFollowing, onBack, onSettings, onShare, onEdit, onStats, onFollow, onMessage }: ProfileHeaderProps) {
    const insets = useSafeAreaInsets();
    const { c } = useUI();

    const name = profile?.display_name || profile?.username || fallbackName;
    const handle = profile?.username || fallbackName;
    const bio = profile?.bio?.trim();
    const hasBanner = !!profile?.banner_url;

    return (
        <View>
            {hasBanner ? (
                <View style={[styles.banner, { height: insets.top + 130 }]}>
                    <Image source={{ uri: profile!.banner_url as string }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.25)', c.bg]} style={StyleSheet.absoluteFill} />
                </View>
            ) : null}

            <View style={[styles.bar, { paddingTop: insets.top + 4 }, hasBanner && styles.barOverBanner]}>
                {onBack ? <IconButton name="chevron-back" label="Back" onPress={onBack} variant={hasBanner ? 'glass' : 'plain'} /> : <View style={{ width: 44 }} />}
                <View style={{ flexDirection: 'row' }}>
                    {onShare ? <IconButton name="share-outline" label="Share profile" onPress={onShare} variant={hasBanner ? 'glass' : 'plain'} /> : null}
                    {onSettings ? <IconButton name="settings-outline" label="Settings" onPress={onSettings} variant={hasBanner ? 'glass' : 'plain'} /> : null}
                </View>
            </View>

            <View style={[styles.identity, hasBanner && { marginTop: hasBanner ? 24 : 0 }]}>
                <Avatar uri={profile?.avatar_url} name={name} size={92} ring={c.bg} />
                <Txt variant="title" style={{ marginTop: 14 }} numberOfLines={1}>{name}</Txt>
                <Txt variant="callout" tone="secondary" style={{ marginTop: 2 }}>@{handle}</Txt>

                {bio ? (
                    <Txt variant="body" tone="secondary" style={styles.bio}>{bio}</Txt>
                ) : isOwn ? (
                    <Pressable onPress={onEdit} hitSlop={8}>
                        <Txt variant="body" tone="tertiary" style={styles.bio}>Add a line about yourself</Txt>
                    </Pressable>
                ) : null}

                <View style={[styles.stats, { borderColor: c.hairline }]}>
                    <Stat value={profile?.videos_count || 0} label="Videos" />
                    <View style={[styles.statDivider, { backgroundColor: c.hairline }]} />
                    <Stat value={profile?.followers_count || 0} label="Followers" />
                    <View style={[styles.statDivider, { backgroundColor: c.hairline }]} />
                    <Stat value={profile?.following_count || 0} label="Following" />
                </View>

                <View style={styles.actions}>
                    {isOwn ? (
                        <>
                            <Button label="Edit profile" variant="secondary" onPress={onEdit} style={{ flex: 1 }} />
                            <Button label="Creator DNA" variant="secondary" icon="finger-print" onPress={onStats} style={{ flex: 1 }} />
                        </>
                    ) : (
                        <>
                            <Button
                                label={isFollowing ? 'Following' : 'Follow'}
                                variant={isFollowing ? 'secondary' : 'primary'}
                                onPress={onFollow}
                                style={{ flex: 1 }}
                            />
                            <Button label="Message" variant="secondary" icon="chatbubble-outline" onPress={onMessage} style={{ flex: 1 }} />
                        </>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: { position: 'absolute', top: 0, left: 0, right: 0 },
    bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
    barOverBanner: {},
    identity: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },
    bio: { textAlign: 'center', marginTop: 12, maxWidth: 320 },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        marginTop: 20,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    stat: { flex: 1, alignItems: 'center', gap: 2 },
    statDivider: { width: StyleSheet.hairlineWidth, height: 28 },
    actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 18 },
});
