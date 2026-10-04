import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePosts, Post } from '../../lib/supabase/hooks/usePosts';
import { DebateCard } from '../Debate/DebateCard';
import { EmptyState } from '../core/EmptyState';
import { Skeleton } from '../core/Skeleton';
import { Txt } from '../core/Txt';
import { useUI } from '../../design-system/ui';

interface ArenaListProps {
    topInset: number;
    bottomInset: number;
}

/** Debates: a thesis, which side is winning, and a way in. */
export function ArenaList({ topInset, bottomInset }: ArenaListProps) {
    const router = useRouter();
    const { c } = useUI();
    const { posts, loading, refresh } = usePosts();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refresh?.();
        } finally {
            setRefreshing(false);
        }
    }, [refresh]);

    const renderItem = ({ item }: { item: Post }) => (
        <DebateCard item={item} onPress={() => router.push(`/debate/${item.id}` as any)} />
    );

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <FlatList
                data={posts}
                keyExtractor={p => p.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset + 24 }}
                ListHeaderComponent={
                    <View style={styles.intro}>
                        <Txt variant="display">Arena</Txt>
                        <Txt variant="body" tone="secondary" style={{ marginTop: 4 }}>
                            Pick a side, make your point. The clearest argument wins, not the loudest.
                        </Txt>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.skeletons}>
                            <Skeleton style={{ height: 150 }} />
                            <Skeleton style={{ height: 150 }} />
                        </View>
                    ) : (
                        <EmptyState
                            icon="chatbubbles-outline"
                            title="No debates yet"
                            body="Propose a thesis and let people argue it out."
                            actionLabel="Propose a thesis"
                            onAction={() => router.push('/publish')}
                        />
                    )
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textSecondary} progressViewOffset={topInset} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { ...StyleSheet.absoluteFillObject },
    intro: { paddingHorizontal: 20, paddingBottom: 16 },
    skeletons: { paddingHorizontal: 16, gap: 12 },
});
