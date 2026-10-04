import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../core/Txt';

export interface CreatorStats {
    memberSince?: string;
    impact: number;
    rank?: string | number;
    topInterest?: string;
    activity?: string;
    approval?: string;
}

function Row({ label, value }: { label: string; value: string }) {
    const { c } = useUI();
    return (
        <View style={[styles.row, { borderTopColor: c.hairline }]}>
            <Txt variant="body" tone="secondary">{label}</Txt>
            <Txt variant="bodyStrong">{value}</Txt>
        </View>
    );
}

/** What the app knows about how you show up: all of it counted from what you have actually posted. */
export function CreatorSheet({ visible, onClose, stats }: { visible: boolean; onClose: () => void; stats: CreatorStats }) {
    const { c } = useUI();
    const since = stats.memberSince ? new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modal}>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
                <View style={[styles.sheet, { backgroundColor: c.surface }]}>
                    <View style={[styles.handle, { backgroundColor: c.hairline }]} />
                    <View style={styles.head}>
                        <View>
                            <Txt variant="title">Creator DNA</Txt>
                            <Txt variant="callout" tone="secondary" style={{ marginTop: 2 }}>How you show up, counted from what you post.</Txt>
                        </View>
                        <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close">
                            <Ionicons name="close" size={22} color={c.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
                        <Row label="Member since" value={since} />
                        <Row label="Impact score" value={String(stats.impact)} />
                        <Row label="Global rank" value={String(stats.rank ?? '—')} />
                        <Row label="Top interest" value={stats.topInterest || '—'} />
                        <Row label="Activity" value={stats.activity || '—'} />
                        <Row label="Approval rate" value={stats.approval || '—'} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingBottom: 12 },
    handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: StyleSheet.hairlineWidth },
});
