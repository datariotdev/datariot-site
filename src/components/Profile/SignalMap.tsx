import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { usePalette } from '../../design-system/palette';

const WEEKS = 14;
const ROWS = 7;
const GUTTER = 16;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS: Record<number, string> = { 0: 'M', 2: 'W', 4: 'F' };

// Dot size (share of the cell) and strength for 0, 1, 2, 3-4 and 5+ acts in a day
const SIZE = [0.16, 0.34, 0.5, 0.66, 0.82];
const STRENGTH = [0.2, 0.55, 0.7, 0.85, 1];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const level = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4);
const pad = (n: number) => n.toString().padStart(2, '0');

interface SignalMapProps {
    /** When each clip, thesis and argument was made */
    dates: (string | number | Date | null | undefined)[];
}

/**
 * The last fourteen weeks of a creator's activity as a wall of dots: one dot a day, bigger and
 * brighter the more they made. Reads like the LED panels in the rest of the app.
 */
export function SignalMap({ dates }: SignalMapProps) {
    const p = usePalette();
    const [gridW, setGridW] = useState(0);
    const blink = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(blink, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(blink, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [blink]);

    const model = useMemo(() => {
        const counts = new Map<string, number>();
        dates.forEach(v => {
            if (!v) return;
            const d = new Date(v);
            if (isNaN(d.getTime())) return;
            const k = dayKey(d);
            counts.set(k, (counts.get(k) || 0) + 1);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dow = (today.getDay() + 6) % 7; // Monday first
        const first = new Date(today);
        first.setDate(first.getDate() - dow - (WEEKS - 1) * 7);

        let total = 0;
        let best = 0;
        let activeDays = 0;
        const cols = Array.from({ length: WEEKS }, (_, c) =>
            Array.from({ length: ROWS }, (_, r) => {
                const date = new Date(first);
                date.setDate(first.getDate() + c * 7 + r);
                const future = date.getTime() > today.getTime();
                const n = future ? 0 : counts.get(dayKey(date)) || 0;
                if (!future) {
                    total += n;
                    if (n > best) best = n;
                    if (n > 0) activeDays += 1;
                }
                return { n, future, isToday: date.getTime() === today.getTime(), month: date.getMonth() };
            })
        );

        // A month name above the first week it appears in; skip one that would crowd the next
        const labels = cols.map((col, c) => (c === 0 || col[0].month !== cols[c - 1][0].month ? MONTHS[col[0].month] : ''));
        if (labels[1]) labels[0] = '';

        // A streak is still alive if today is empty but yesterday was not
        let streak = 0;
        const cursor = new Date(today);
        if (!counts.get(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
        while ((counts.get(dayKey(cursor)) || 0) > 0 && streak < 400) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return { cols, labels, total, best, activeDays, streak };
    }, [dates]);

    const onGridLayout = (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        if (Math.abs(w - gridW) > 1) setGridW(w);
    };

    const cell = gridW > 0 ? gridW / WEEKS : 0;
    const rowH = cell * 0.9;
    const dim = p.isDark ? 'rgba(218, 230, 247, 0.55)' : 'rgba(7, 8, 12, 0.5)';

    return (
        <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
            <View style={styles.head}>
                <View>
                    <Text style={[styles.title, { color: p.accent }]}>SIGNAL</Text>
                    <Text style={[styles.sub, { color: p.sub, fontFamily: p.fonts.regular }]}>Your last 14 weeks</Text>
                </View>
                <View style={styles.bigBox}>
                    <Text style={[styles.big, { color: p.text }]}>{pad(model.total)}</Text>
                    <Text style={[styles.cap, { color: p.sub }]}>ACTS</Text>
                </View>
            </View>

            <View style={styles.mapRow}>
                <View style={[styles.gutter, { paddingTop: 16 }]}>
                    {cell > 0 &&
                        Array.from({ length: ROWS }, (_, r) => (
                            <View key={r} style={{ height: rowH, justifyContent: 'center' }}>
                                <Text style={[styles.dayLabel, { color: p.faint }]}>{WEEKDAYS[r] || ''}</Text>
                            </View>
                        ))}
                </View>

                <View style={styles.gridCol} onLayout={onGridLayout}>
                    <View style={styles.monthRow}>
                        {model.labels.map((l, c) => (
                            <View key={c} style={{ width: cell || `${100 / WEEKS}%` as any }}>
                                {!!l && (
                                    <Text numberOfLines={1} style={[styles.monthLabel, { color: p.faint }]}>
                                        {l}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>

                    {cell > 0 && (
                        <View style={styles.grid}>
                            {model.cols.map((col, c) => (
                                <View key={c} style={{ width: cell }}>
                                    {col.map((d, r) => {
                                        const lv = level(d.n);
                                        const dia = cell * SIZE[lv];
                                        return (
                                            <View key={r} style={{ width: cell, height: rowH, alignItems: 'center', justifyContent: 'center' }}>
                                                {!d.future && (
                                                    <View
                                                        style={{
                                                            width: dia,
                                                            height: dia,
                                                            borderRadius: dia / 2,
                                                            backgroundColor: p.accent,
                                                            opacity: STRENGTH[lv],
                                                        }}
                                                    />
                                                )}
                                                {d.isToday && (
                                                    <Animated.View
                                                        pointerEvents="none"
                                                        style={{
                                                            position: 'absolute',
                                                            width: cell * 0.92,
                                                            height: cell * 0.92,
                                                            borderRadius: cell * 0.46,
                                                            borderWidth: 1.5,
                                                            borderColor: p.accent,
                                                            opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
                                                        }}
                                                    />
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {model.total === 0 && (
                <Text style={[styles.hint, { color: dim, fontFamily: p.fonts.regular }]}>
                    Publish, argue or post. Your first signal lights the first dot.
                </Text>
            )}

            <View style={[styles.stats, { borderColor: p.border }]}>
                <Stat label="STREAK" value={`${model.streak}`} unit="D" p={p} />
                <View style={[styles.statRule, { backgroundColor: p.border }]} />
                <Stat label="BEST DAY" value={`${model.best}`} p={p} />
                <View style={[styles.statRule, { backgroundColor: p.border }]} />
                <Stat label="ACTIVE" value={`${model.activeDays}`} unit="D" p={p} />
            </View>
        </View>
    );
}

const Stat = ({ label, value, unit, p }: { label: string; value: string; unit?: string; p: ReturnType<typeof usePalette> }) => (
    <View style={styles.stat}>
        <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: p.text }]}>{pad(Number(value))}</Text>
            {!!unit && <Text style={[styles.statUnit, { color: p.sub }]}>{unit}</Text>}
        </View>
        <Text style={[styles.statLabel, { color: p.sub }]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    card: {
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 6,
    },
    head: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontFamily: 'Doto_900Black',
        fontSize: 18,
        letterSpacing: 1.5,
        includeFontPadding: false,
    },
    sub: {
        fontSize: 12,
        marginTop: 3,
    },
    bigBox: {
        alignItems: 'flex-end',
    },
    big: {
        fontFamily: 'Doto_900Black',
        fontSize: 34,
        lineHeight: 36,
        letterSpacing: 1,
        includeFontPadding: false,
    },
    cap: {
        fontFamily: 'Doto_700Bold',
        fontSize: 10.5,
        letterSpacing: 1.6,
        includeFontPadding: false,
    },
    mapRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    gutter: {
        width: GUTTER,
    },
    dayLabel: {
        fontFamily: 'Doto_700Bold',
        fontSize: 10,
        includeFontPadding: false,
    },
    gridCol: {
        flex: 1,
    },
    monthRow: {
        flexDirection: 'row',
        height: 16,
    },
    monthLabel: {
        fontFamily: 'Doto_700Bold',
        fontSize: 10,
        letterSpacing: 0.4,
        includeFontPadding: false,
    },
    grid: {
        flexDirection: 'row',
    },
    hint: {
        fontSize: 12.5,
        lineHeight: 18,
        marginTop: 10,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingVertical: 12,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statRule: {
        width: StyleSheet.hairlineWidth,
        height: 30,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    statValue: {
        fontFamily: 'Doto_900Black',
        fontSize: 24,
        lineHeight: 26,
        letterSpacing: 1,
        includeFontPadding: false,
    },
    statUnit: {
        fontFamily: 'Doto_700Bold',
        fontSize: 11,
        marginLeft: 3,
        marginBottom: 2,
        includeFontPadding: false,
    },
    statLabel: {
        fontFamily: 'Doto_700Bold',
        fontSize: 10,
        letterSpacing: 1.5,
        marginTop: 3,
        includeFontPadding: false,
    },
});
