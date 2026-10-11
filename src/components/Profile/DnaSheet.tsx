import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';

interface DnaProfile {
    created_at?: string;
    total_impact_score?: number;
    top_category?: string;
    global_rank?: number | string;
    activity_level?: string;
    win_rate?: string;
    arguments_count?: number;
}

interface DnaSheetProps {
    visible: boolean;
    onClose: () => void;
    profile: DnaProfile | null;
}

const pad = (n: number) => n.toString().padStart(2, '0');

/** A row of ten dots with the first `lit` of them on */
const Meter = ({ lit, color, muted }: { lit: number; color: string; muted: string }) => (
    <View style={styles.meter}>
        {Array.from({ length: 10 }, (_, i) => (
            <View key={i} style={[styles.meterDot, { backgroundColor: i < lit ? color : muted }]} />
        ))}
    </View>
);

export function DnaSheet({ visible, onClose, profile }: DnaSheetProps) {
    const p = usePalette();
    const since = profile?.created_at ? new Date(profile.created_at) : null;
    const sinceLabel =
        since && !isNaN(since.getTime())
            ? `${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][since.getMonth()]} ${since.getFullYear()}`
            : '—';

    const approval = parseInt(profile?.win_rate || '0', 10) || 0;
    const activity = profile?.activity_level || 'Low';
    const activityLit = activity === 'High' ? 10 : activity === 'Medium' ? 6 : 2;
    const muted = p.isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.14)';

    const tiles: Array<{ label: string; value: string; meter?: number }> = [
        { label: 'TOTAL IMPACT', value: `${profile?.total_impact_score || 0}` },
        { label: 'GLOBAL RANK', value: `${profile?.global_rank || 'N/A'}` },
        { label: 'ACTIVITY', value: activity.toUpperCase(), meter: activityLit },
        { label: 'APPROVAL', value: profile?.win_rate || 'N/A', meter: Math.round(approval / 10) },
        { label: 'TOP INTEREST', value: (profile?.top_category || 'General').toUpperCase() },
        { label: 'ARGUMENTS', value: pad(profile?.arguments_count || 0) },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[
                        styles.sheet,
                        { backgroundColor: p.isDark ? '#07080C' : '#F4F8FE', borderColor: p.border },
                    ]}
                >
                    <View style={[styles.handle, { backgroundColor: p.isDark ? 'rgba(218, 230, 247, 0.2)' : 'rgba(7, 8, 12, 0.15)' }]} />

                    <View style={styles.head}>
                        <View>
                            <Text style={[styles.title, { color: p.accent }]}>CREATOR DNA</Text>
                            <Text style={[styles.sub, { color: p.faint, fontFamily: p.fonts.regular }]}>Identity · Stats · History</Text>
                        </View>
                        <Pressable onPress={onClose} style={[styles.close, { borderColor: p.border }]} accessibilityLabel="Close">
                            <Ionicons name="close" size={18} color={p.sub} />
                        </Pressable>
                    </View>

                    <View style={[styles.since, { borderColor: p.border }]}>
                        <Text style={[styles.cap, { color: p.sub }]}>MEMBER SINCE</Text>
                        <Text style={[styles.sinceValue, { color: p.text }]}>{sinceLabel}</Text>
                    </View>

                    <View style={styles.grid}>
                        {tiles.map(t => (
                            <View key={t.label} style={[styles.tile, { backgroundColor: p.card, borderColor: p.border }]}>
                                <Text style={[styles.cap, { color: p.sub }]}>{t.label}</Text>
                                <Text
                                    style={[styles.value, { color: p.text }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.6}
                                >
                                    {t.value}
                                </Text>
                                {t.meter !== undefined && <Meter lit={t.meter} color={p.accent} muted={muted} />}
                            </View>
                        ))}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderBottomWidth: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 18,
    },
    head: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontFamily: 'Doto_900Black',
        fontSize: 24,
        letterSpacing: 1.5,
        includeFontPadding: false,
    },
    sub: {
        fontSize: 12,
        marginTop: 4,
    },
    close: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    since: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        marginBottom: 14,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sinceValue: {
        fontFamily: 'Doto_900Black',
        fontSize: 26,
        letterSpacing: 1.2,
        includeFontPadding: false,
    },
    cap: {
        fontFamily: 'Doto_700Bold',
        fontSize: 11,
        letterSpacing: 1.6,
        includeFontPadding: false,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    tile: {
        width: '48.4%',
        minHeight: 92,
        borderRadius: 20,
        borderWidth: 1,
        padding: 14,
        justifyContent: 'space-between',
    },
    value: {
        fontFamily: 'Doto_900Black',
        fontSize: 26,
        letterSpacing: 1,
        marginTop: 10,
        includeFontPadding: false,
    },
    meter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    meterDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
});
