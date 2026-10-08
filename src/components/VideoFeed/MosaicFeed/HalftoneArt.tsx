import React, { memo, useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';

/**
 * A tile with no picture of its own gets a one-off dot-matrix picture, drawn from its id,
 * so a grid of unpublished clips still looks like a wall of signals instead of blank cards.
 */

const COLS = 12;

const hash = (str: string) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

const makeRng = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** Brightness 0..1 for the dot at (u, v) in the unit square, for one of four looks */
const makeField = (id: string) => {
    const h = hash(id);
    const rnd = makeRng(h);
    const kind = h % 4;
    const cx = 0.2 + rnd() * 0.6;
    const cy = 0.12 + rnd() * 0.4;
    const phase = rnd() * Math.PI * 2;
    const freq = 5 + rnd() * 5;
    const corner = Math.floor(rnd() * 4);
    const bars = Array.from({ length: COLS }, () => 0.2 + rnd() * 0.75);

    return (u: number, v: number, col: number) => {
        let s = 0;
        if (kind === 0) {
            // A glowing blob
            s = 1 - smooth(0.05, 0.62, Math.hypot(u - cx, v - cy));
        } else if (kind === 1) {
            // Diagonal waves
            s = (Math.sin((u + v) * freq + phase) + 1) / 2;
            s = Math.pow(s, 1.6);
        } else if (kind === 2) {
            // Rings spreading from a corner
            const ox = corner % 2 === 0 ? 0 : 1;
            const oy = corner < 2 ? 0 : 1;
            s = (Math.sin(Math.hypot(u - ox, v - oy) * freq * 2.2 + phase) + 1) / 2;
            s = Math.pow(s, 1.8);
        } else {
            // A level meter: columns lit from the middle up
            const lit = bars[col];
            s = v < 0.82 && v > 0.82 - lit * 0.8 ? 0.35 + 0.65 * (1 - (0.82 - v) / (lit * 0.8)) : 0;
        }
        // Fade out toward the bottom where the title sits, and a touch at the top under the labels
        return s * (1 - 0.95 * smooth(0.4, 0.78, v)) * (0.1 + 0.9 * smooth(0.1, 0.32, v));
    };
};

interface HalftoneArtProps {
    seed: string;
    isDark: boolean;
}

export const HalftoneArt = memo(({ seed, isDark }: HalftoneArtProps) => {
    const [size, setSize] = useState({ w: 0, h: 0 });
    const field = useMemo(() => makeField(seed || 'x'), [seed]);

    const onLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.abs(width - size.w) > 1 || Math.abs(height - size.h) > 1) setSize({ w: width, h: height });
    };

    const dots = useMemo(() => {
        if (!size.w) return [];
        const step = size.w / COLS;
        const rows = Math.max(1, Math.round(size.h / step));
        const maxD = step * 0.76;
        const out: Array<{ key: string; left: number; top: number; d: number; o: number }> = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < COLS; c++) {
                const s = field((c + 0.5) / COLS, (r + 0.5) / rows, c);
                // Every cell has an unlit dot, like the pixels of an LED panel; lit ones swell
                const lit = s >= 0.08;
                const d = lit ? maxD * (0.22 + 0.78 * s) : 2;
                out.push({
                    key: `${r}-${c}`,
                    left: (c + 0.5) * step - d / 2,
                    top: (r + 0.5) * (size.h / rows) - d / 2,
                    d,
                    o: lit ? 0.3 + 0.7 * s : 0.14,
                });
            }
        }
        return out;
    }, [size.w, size.h, field]);

    const color = isDark ? '#DAE6F7' : '#1E2A55';

    return (
        <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
            {dots.map(p => (
                <View
                    key={p.key}
                    style={{
                        position: 'absolute',
                        left: p.left,
                        top: p.top,
                        width: p.d,
                        height: p.d,
                        borderRadius: p.d / 2,
                        backgroundColor: color,
                        opacity: p.o,
                    }}
                />
            ))}
        </View>
    );
});
HalftoneArt.displayName = 'HalftoneArt';
