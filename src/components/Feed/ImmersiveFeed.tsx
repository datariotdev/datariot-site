import React, { useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, RefreshControl, StyleSheet, View, ViewToken, useWindowDimensions } from 'react-native';
import { Video } from '../../lib/supabase/hooks/useVideos';
import { ImmersiveItem, ItemHandlers } from './ImmersiveItem';

interface ImmersiveFeedProps {
    videos: Video[];
    handlers: ItemHandlers;
    muted: boolean;
    autoplay: boolean;
    /** This screen is the one being looked at, and nothing is covering it. */
    focused: boolean;
    /** Height of whatever floats along the bottom (the tab bar): caption, rail and progress sit above it. */
    bottomInset: number;
    /** Space the header takes at the top, so the pull-to-refresh spinner clears it. */
    topInset: number;
    refreshing: boolean;
    onRefresh: () => void;
    onEndReached: () => void;
    /** The signed-in viewer, so a creator's own clips do not offer to follow themselves. */
    viewerId?: string;
    /** Shown as a last page when there is nothing further to load. */
    footer?: React.ReactNode;
    initialIndex?: number;
}

const HANDLER_KEYS: (keyof ItemHandlers)[] = ['like', 'likeOnly', 'comment', 'save', 'share', 'follow', 'openProfile', 'openCategory', 'deepDive'];

/**
 * Full-screen vertical feed: one clip per page, one page per swipe. Only the page
 * in view plays; the pages either side hold a paused player so a swipe lands on a
 * picture, not a spinner.
 */
export function ImmersiveFeed({
    videos, handlers, muted, autoplay, focused, bottomInset, topInset, refreshing,
    onRefresh, onEndReached, viewerId, footer, initialIndex = 0,
}: ImmersiveFeedProps) {
    const win = useWindowDimensions();
    const [box, setBox] = useState({ width: win.width, height: win.height });
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    // The items are memoised, so the handlers they receive must never change identity;
    // they forward to whatever the parent passed most recently.
    const latest = useRef(handlers);
    latest.current = handlers;
    const stable = useMemo(() => {
        const out: Record<string, unknown> = {};
        HANDLER_KEYS.forEach(k => {
            out[k] = (...args: unknown[]) => (latest.current[k] as (...a: unknown[]) => void)(...args);
        });
        return out as unknown as ItemHandlers;
    }, []);

    const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const first = viewableItems.find(v => v.isViewable && v.index != null);
        if (first && first.index != null) setActiveIndex(first.index);
    }).current;
    const viewConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

    const onLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0 && (width !== box.width || height !== box.height)) setBox({ width, height });
    };

    const extraData = useMemo(
        () => ({ activeIndex, focused, muted, autoplay, bottomInset, viewerId, w: box.width, h: box.height }),
        [activeIndex, focused, muted, autoplay, bottomInset, viewerId, box.width, box.height],
    );

    return (
        <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
            <FlatList
                data={videos}
                extraData={extraData}
                keyExtractor={v => v.id}
                renderItem={({ item, index }) => (
                    <ImmersiveItem
                        video={item}
                        width={box.width}
                        height={box.height}
                        bottomInset={bottomInset}
                        active={index === activeIndex}
                        near={Math.abs(index - activeIndex) <= 1}
                        focused={focused}
                        autoplay={autoplay}
                        muted={muted}
                        isOwn={!!viewerId && item.authorId === viewerId}
                        handlers={stable}
                    />
                )}
                pagingEnabled
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({ length: box.height, offset: box.height * index, index })}
                initialScrollIndex={initialIndex > 0 && initialIndex < videos.length ? initialIndex : undefined}
                viewabilityConfig={viewConfig}
                onViewableItemsChanged={onViewable}
                windowSize={5}
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                onEndReached={onEndReached}
                onEndReachedThreshold={1.5}
                ListFooterComponent={footer ? <View style={{ width: box.width, height: box.height }}>{footer}</View> : null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FFFFFF"
                        progressViewOffset={topInset}
                    />
                }
            />
        </View>
    );
}
