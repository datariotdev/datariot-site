import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, ViewToken, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MosaicItem } from './MosaicItem';
import { useTheme } from '../../Theme/ThemeProvider';
import { Video } from '../../../lib/supabase/hooks/useVideos';
import { withAlpha } from '../../../lib/utils/color';

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
    const { theme } = useTheme();
    const { width } = Dimensions.get('window');
    const isWeb = Platform.OS === 'web' && width > 768;
    const numColumns = isWeb ? 3 : 2;
    const bg = theme.colors.background.primary as string;
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

    const renderItem = ({ item, index }: { item: Video; index: number }) => {
        const isActive = viewableItems.has(item.id);

        return (
            <MosaicItem
                video={item}
                index={index}
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
                    paddingTop: paddingTop + GRID_SPACING + 6,
                    paddingBottom: paddingBottom + 80,
                    paddingHorizontal: GRID_SPACING,
                }}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={5}
                initialNumToRender={4}
            />
            {/* Lets the tab bar icons sit on a clean strip instead of on top of the tile text */}
            {Platform.OS !== 'web' && (
                <LinearGradient
                    colors={[withAlpha(bg, 0), withAlpha(bg, 0.92), bg]}
                    locations={[0, 0.55, 1]}
                    style={styles.bottomFade}
                    pointerEvents="none"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bottomFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 150,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
});
