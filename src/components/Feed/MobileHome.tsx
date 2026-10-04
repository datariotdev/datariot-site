import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideos } from '../../lib/supabase/hooks/useVideos';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTabBarHeight } from '../../lib/hooks/useTabBarHeight';
import { useUI } from '../../design-system/ui';
import { EmptyState } from '../core/EmptyState';
import { ArenaList } from './ArenaList';
import { EndCard } from './EndCard';
import { FeedHeader, HEADER_ROW, HomeTab } from './FeedHeader';
import { FeedStage } from './FeedStage';

/** One of the three home screens, kept alive underneath so switching back is instant and keeps your place. */
function Layer({ visible, children }: { visible: boolean; children: React.ReactNode }) {
    return (
        <View style={[StyleSheet.absoluteFill, !visible && styles.hidden]} pointerEvents={visible ? 'auto' : 'none'}>
            {children}
        </View>
    );
}

/**
 * The phone's home: a full-screen feed with three words on top of it.
 * Following and Arena load the first time you open them, not before.
 */
export function MobileHome() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { c, isDark } = useUI();
    const tabBarHeight = useTabBarHeight();

    const [tab, setTab] = useState<HomeTab>('foryou');
    const [visited, setVisited] = useState<Record<HomeTab, boolean>>({ foryou: true, following: false, arena: false });
    const select = (t: HomeTab) => {
        setTab(t);
        setVisited(v => (v[t] ? v : { ...v, [t]: true }));
    };

    const forYou = useVideos({ type: 'trending' });
    const following = useVideos({ type: 'following', enabled: visited.following });

    const topInset = insets.top + HEADER_ROW;
    const overVideo = tab !== 'arena';

    const goExplore = () => router.push('/discover');

    return (
        <View style={[styles.root, { backgroundColor: overVideo ? '#000' : c.bg }]}>
            <StatusBar barStyle={overVideo || isDark ? 'light-content' : 'dark-content'} />

            <Layer visible={tab === 'foryou'}>
                <FeedStage
                    videos={forYou.videos}
                    loading={forYou.loading}
                    hasMore={forYou.hasMore}
                    refreshing={forYou.refreshing}
                    onRefresh={forYou.refresh}
                    onEndReached={forYou.loadMore}
                    toggleLike={forYou.toggleLike}
                    likeOnly={forYou.likeOnly}
                    toggleSave={forYou.toggleSave}
                    toggleFollow={forYou.toggleFollow}
                    focused={isFocused && tab === 'foryou'}
                    topInset={topInset}
                    bottomInset={tabBarHeight}
                    empty={
                        <EmptyState
                            icon="film-outline"
                            title="Nothing to watch yet"
                            body="New videos will show up here as people post them."
                            actionLabel="Refresh"
                            onAction={forYou.refresh}
                        />
                    }
                    footer={<EndCard onExplore={goExplore} onRefresh={forYou.refresh} />}
                />
            </Layer>

            {visited.following ? (
                <Layer visible={tab === 'following'}>
                    <FeedStage
                        videos={following.videos}
                        loading={following.loading}
                        hasMore={following.hasMore}
                        refreshing={following.refreshing}
                        onRefresh={following.refresh}
                        onEndReached={following.loadMore}
                        toggleLike={following.toggleLike}
                        likeOnly={following.likeOnly}
                        toggleSave={following.toggleSave}
                        toggleFollow={following.toggleFollow}
                        focused={isFocused && tab === 'following'}
                        topInset={topInset}
                        bottomInset={tabBarHeight}
                        empty={
                            user ? (
                                <EmptyState
                                    icon="people-outline"
                                    title="Your circle is empty"
                                    body="Follow creators from For you and their new videos will land here."
                                    actionLabel="Find people"
                                    onAction={goExplore}
                                />
                            ) : (
                                <EmptyState
                                    icon="people-outline"
                                    title="Follow people you like"
                                    body="Sign in to see their new videos here."
                                    actionLabel="Sign in"
                                    onAction={() => router.push('/auth/login')}
                                />
                            )
                        }
                        footer={<EndCard onExplore={goExplore} onRefresh={following.refresh} />}
                    />
                </Layer>
            ) : null}

            {visited.arena ? (
                <Layer visible={tab === 'arena'}>
                    <ArenaList topInset={topInset} bottomInset={tabBarHeight} />
                </Layer>
            ) : null}

            <FeedHeader
                tab={tab}
                onTab={select}
                overVideo={overVideo}
                onProfile={() => router.push(user ? '/profile' : '/auth/login')}
                onSearch={() => router.push({ pathname: '/discover', params: { focus: '1' } })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    hidden: { opacity: 0 },
});
