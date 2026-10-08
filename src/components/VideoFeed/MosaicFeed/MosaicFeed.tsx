import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ViewToken, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MosaicItem } from './MosaicItem';
import { useTheme } from '../../Theme/ThemeProvider';
import { Video } from '../../../lib/supabase/hooks/useVideos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 12;

// 'rgba' of a #rrggbb colour, so a fade to the page colour has no grey midtones
const withAlpha = (hex: string, a: number) => {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return `rgba(0,0,0,${a})`;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

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
    const accent = isDark ? '#DAE6F7' : '#07080C';
    const dim = isDark ? 'rgba(218, 230, 247, 0.5)' : 'rgba(7, 8, 12, 0.45)';
    const bg = theme.colors.background.primary as string;
    const today = useMemo(() => {
        const d = new Date();
        return {
            day: d.getDate().toString().padStart(2, '0'),
            month: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()],
        };
    }, []);
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
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={[styles.headerTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                                Daily Synergy
                            </Text>
                            <View style={styles.dateBox}>
                                <Text style={[styles.dateText, { color: accent }]}>{today.day}</Text>
                                <Text style={[styles.dateCaption, { color: dim }]}>{today.month}</Text>
                            </View>
                        </View>
                        <Text style={[styles.headerSub, { color: isDark ? 'rgba(218, 230, 247, 0.62)' : '#44507A', fontFamily: theme.typography.fontFamilies.regular }]}>
                            Curated for your Creator DNA
                        </Text>
                        {/* A dotted rule that fades out */}
                        <View style={styles.dotRule}>
                            {Array.from({ length: 28 }, (_, i) => (
                                <View
                                    key={i}
                                    style={[styles.ruleDot, { backgroundColor: accent, opacity: Math.max(0.06, 0.9 - i * 0.034) }]}
                                />
                            ))}
                        </View>
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
    header: {
        paddingHorizontal: 6,
        paddingTop: 20,
        paddingBottom: 18,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 28,
        letterSpacing: -0.5,
    },
    dateBox: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontFamily: 'Doto_900Black',
        fontSize: 30,
        letterSpacing: 1,
        lineHeight: 32,
        includeFontPadding: false,
    },
    dateCaption: {
        fontFamily: 'Doto_700Bold',
        fontSize: 11,
        letterSpacing: 1.5,
        includeFontPadding: false,
    },
    headerSub: {
        fontSize: 13,
        marginTop: 4,
    },
    dotRule: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
    },
    ruleDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
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
