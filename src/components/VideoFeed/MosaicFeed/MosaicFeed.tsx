import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ViewToken, Dimensions, Platform } from 'react-native';
import { MosaicItem } from './MosaicItem';
import { useTheme } from '../../Theme/ThemeProvider';
import { Video } from '../../../lib/supabase/hooks/useVideos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 12;

interface MosaicFeedProps {
    videos: Video[];
    onEndReached: () => void;
    onSelect: (videoId: string) => void;
    isFocused?: boolean;
    paddingTop?: number;
    paddingBottom?: number;
}

export function MosaicFeed({
    videos,
    onEndReached,
    onSelect,
    isFocused = true,
    paddingTop = 0,
    paddingBottom = 40,
}: MosaicFeedProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const { width } = Dimensions.get('window');
    const isWeb = Platform.OS === 'web' && width > 768;
    const numColumns = isWeb ? 3 : 2;
    const [viewableItems, setViewableItems] = useState<Set<string>>(new Set());

    const onViewableItemsChanged = useCallback(
        ({ viewableItems: currentlyViewable }: { viewableItems: ViewToken[] }) => {
            const newViewable = new Set<string>();
            currentlyViewable.forEach(item => {
                if (item.isViewable && item.key) {
                    newViewable.add(item.key as string);
                }
            });
            setViewableItems(newViewable);
        },
        []
    );

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 70,
    }), []);

    const renderItem = ({ item }: { item: Video }) => {
        const isActive = viewableItems.has(item.id);

        return (
            <MosaicItem
                video={item}
                isActive={isActive}
                isScreenFocused={isFocused}
                onPress={() => onSelect(item.id)}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <FlatList
                data={videos}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                            Daily Synergy
                        </Text>
                        <Text style={[styles.headerSub, { color: isDark ? 'rgba(217, 228, 255, 0.6)' : '#44507A', fontFamily: theme.typography.fontFamilies.regular }]}>
                            Curated for your Creator DNA
                        </Text>
                    </View>
                }
                keyExtractor={(item) => item.id}
                key={isWeb ? 'web-mosaic' : 'mobile-mosaic'}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={{
                    paddingTop: paddingTop + GRID_SPACING,
                    paddingBottom: paddingBottom + 80,
                    paddingHorizontal: GRID_SPACING,
                }}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={5}
                initialNumToRender={4}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 6,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        letterSpacing: -0.3,
    },
    headerSub: {
        fontSize: 13,
        marginTop: 4,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
});
