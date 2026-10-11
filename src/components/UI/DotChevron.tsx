import React from 'react';
import { View } from 'react-native';

// A bold dot-matrix arrow head on a 5x5 grid, drawn dot by dot like the close cross in the video player
const POINTS: Record<'left' | 'right', [number, number][]> = {
    left: [[2, 0], [1, 1], [0, 2], [1, 3], [2, 4], [3, 0], [2, 1], [1, 2], [2, 3], [3, 4]],
    right: [[1, 0], [2, 1], [3, 2], [2, 3], [1, 4], [0, 0], [1, 1], [2, 2], [1, 3], [0, 4]],
};

interface DotChevronProps {
    color: string;
    direction?: 'left' | 'right';
    dot?: number;
    gap?: number;
}

export function DotChevron({ color, direction = 'left', dot = 4, gap = 1.5 }: DotChevronProps) {
    const step = dot + gap;
    const box = 5 * dot + 4 * gap;
    return (
        <View style={{ width: box, height: box }}>
            {POINTS[direction].map(([x, y]) => (
                <View
                    key={`${x}${y}`}
                    style={{ position: 'absolute', left: x * step, top: y * step, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }}
                />
            ))}
        </View>
    );
}
