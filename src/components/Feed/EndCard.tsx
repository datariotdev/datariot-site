import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '../core/Txt';
import { Button } from '../core/Button';
import { ON_VIDEO } from '../../design-system/ui';

/** The last page of a feed: you have seen everything, here is where to go next. */
export function EndCard({ onExplore, onRefresh }: { onExplore: () => void; onRefresh: () => void }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, backgroundColor: '#000' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ON_VIDEO.glass, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
            </View>
            <Txt variant="title" tone="onVideo" style={{ textAlign: 'center' }}>You&apos;re all caught up</Txt>
            <Txt variant="body" tone="onVideoDim" style={{ textAlign: 'center', marginTop: 6 }}>
                That was everything for now. Find more in Explore, or check back soon.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
                <Button label="Explore" icon="search-outline" onPress={onExplore} />
                <Button label="Refresh" variant="secondary" onPress={onRefresh} />
            </View>
        </View>
    );
}
