import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideos, FeedType } from '../lib/supabase/hooks/useVideos';
import { FeedStage } from '../components/Feed/FeedStage';
import { IconButton } from '../components/core/IconButton';
import { EmptyState } from '../components/core/EmptyState';

const clean = (param: string | string[] | undefined) => {
    if (!param || param === 'undefined') return undefined;
    const val = Array.isArray(param) ? param[0] : param;
    return val === '' ? undefined : val;
};

/**
 * One clip, full screen, with the feed it came from carrying on underneath it:
 * from a profile, a saved list, a search result, or a shared link. The clip you
 * opened is always first, wherever it falls in that feed.
 */
export default function VideoPlayerScreen() {
    const params = useLocalSearchParams<{
        type?: FeedType;
        userId?: string;
        savedBy?: string;
        hashtag?: string;
        searchQuery?: string;
        category?: string;
        initialVideoId?: string;
        sort?: 'recent' | 'popular';
    }>();

    const router = useRouter();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const feed = useVideos({
        type: (clean(params.type) || 'trending') as FeedType,
        userId: clean(params.userId),
        savedBy: clean(params.savedBy),
        hashtag: clean(params.hashtag),
        searchQuery: clean(params.searchQuery),
        category: clean(params.category),
        sort: clean(params.sort) as 'recent' | 'popular' | undefined,
        pinnedId: clean(params.initialVideoId),
    });

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
    };

    return (
        <View style={styles.root}>
            <FeedStage
                videos={feed.videos}
                loading={feed.loading}
                hasMore={feed.hasMore}
                refreshing={feed.refreshing}
                onRefresh={feed.refresh}
                onEndReached={feed.loadMore}
                toggleLike={feed.toggleLike}
                likeOnly={feed.likeOnly}
                toggleSave={feed.toggleSave}
                toggleFollow={feed.toggleFollow}
                focused={isFocused}
                topInset={insets.top + 48}
                bottomInset={insets.bottom}
                empty={
                    <EmptyState
                        icon="film-outline"
                        title="This video isn't available"
                        body="It may have been removed, or the link is out of date."
                        actionLabel="Go back"
                        onAction={goBack}
                    />
                }
            />

            <View style={[styles.back, { top: insets.top + 2 }]} pointerEvents="box-none">
                <IconButton variant="glass" name="chevron-back" size={22} label="Back" onPress={goBack} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    back: { position: 'absolute', left: 6, zIndex: 50 },
});
