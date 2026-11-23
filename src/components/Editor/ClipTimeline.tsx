/** @jsxImportSource react */
import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ClipEdge, ClipRange, clamp, dragEdge, formatClipTime, moveEdge } from '../../lib/editor/timeline';
import { usePalette } from '../../design-system/palette';

interface Props {
    duration: number; position: number; range: ClipRange; disabled: boolean;
    onChange: (range: ClipRange, edge: ClipEdge) => void;
    onDragStart: () => void; onDragEnd: () => void;
}
function EdgeHandle({ edge, offset, getState, onChange, onStart, onEnd, disabled }: {
    edge: ClipEdge; offset: number; getState: () => { range: ClipRange; width: number; duration: number };
    onChange: Props['onChange']; onStart: () => void; onEnd: () => void; disabled: boolean;
}) {
    const [active, setActive] = useState(false);
    const handlers = useRef({ getState, onChange, onStart, onEnd, disabled });
    handlers.current = { getState, onChange, onStart, onEnd, disabled };
    const snapshot = useRef(getState());
    const finish = () => { setActive(false); handlers.current.onEnd(); };
    const responder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => !handlers.current.disabled,
        onMoveShouldSetPanResponder: () => !handlers.current.disabled,
        onPanResponderGrant: () => {
            snapshot.current = handlers.current.getState(); setActive(true); handlers.current.onStart();
        },
        onPanResponderMove: (_, gesture) => {
            const { range, width, duration } = snapshot.current;
            handlers.current.onChange(dragEdge(range, edge, gesture.dx, width, duration), edge);
        },
        onPanResponderRelease: finish, onPanResponderTerminate: finish,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
    }), [edge]);
    const nudge = (amount: number) => {
        const { range, duration } = handlers.current.getState();
        handlers.current.onChange(moveEdge(range, edge, range[edge] + amount, duration), edge);
    };
    const state = getState();
    const keyboard = Platform.OS === 'web' ? { onKeyDown: (event: any) => {
        if (handlers.current.disabled) return;
        if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(event.key)) {
            event.preventDefault(); nudge((event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1) * (event.shiftKey ? 1000 : 100));
        }
    } } : {};
    return <View {...responder.panHandlers} {...keyboard} accessible focusable={!disabled} accessibilityRole="adjustable"
        accessibilityLabel={edge === 'start' ? 'Clip start' : 'Clip end'} accessibilityHint="Drag to adjust. Use arrow keys for 0.1 second steps."
        accessibilityState={{ disabled }} accessibilityValue={{ min: 0, max: state.duration / 1000, now: state.range[edge] / 1000, text: formatClipTime(state.range[edge], true) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event => { if (!disabled) nudge(event.nativeEvent.actionName === 'increment' ? 100 : -100); }}
        hitSlop={8} style={[s.handle, { left: offset + (edge === 'start' ? -28 : 0), backgroundColor: active ? '#AEC5F0' : '#D9E4FF', opacity: disabled ? 0.45 : 1 }, Platform.OS === 'web' && ({ cursor: 'ew-resize', touchAction: 'none', userSelect: 'none' } as any)]}>
        <View style={s.grip} /><View style={s.grip} />
    </View>;
}
export function ClipTimeline({ duration, position, range, disabled, onChange, onDragStart, onDragEnd }: Props) {
    const p = usePalette();
    const [width, setWidth] = useState(0);
    const live = useRef({ range, width, duration }); live.current = { range, width, duration };
    const getState = () => live.current;
    const left = duration > 0 ? range.start / duration * width : 0;
    const right = duration > 0 ? range.end / duration * width : width;
    const playhead = duration > 0 ? clamp(position / duration * width, 0, width) : 0;
    return <View style={s.wrapper}>
        <View style={s.timeline} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
            <View pointerEvents="none" style={[s.track, { backgroundColor: p.isDark ? '#202A3A' : '#E7EDF7' }]}>
                {Array.from({ length: 31 }, (_, i) => <View key={i} style={{ height: i % 5 === 0 ? 25 : 12, width: 1, backgroundColor: p.isDark ? '#4B5870' : '#BCC8DC' }} />)}
            </View>
            <View pointerEvents="none" style={[s.selection, { left, width: Math.max(0, right - left) }]} />
            <View pointerEvents="none" style={[s.dim, { left: 0, width: left, backgroundColor: p.isDark ? '#111723AA' : '#FFFFFF99' }]} />
            <View pointerEvents="none" style={[s.dim, { left: right, width: Math.max(0, width - right), backgroundColor: p.isDark ? '#111723AA' : '#FFFFFF99' }]} />
            <View pointerEvents="none" style={[s.playhead, { left: playhead, backgroundColor: p.isDark ? '#F2F5FB' : '#243552' }]} />
            <EdgeHandle edge="start" offset={left} getState={getState} disabled={disabled || width <= 0} onChange={onChange} onStart={onDragStart} onEnd={onDragEnd} />
            <EdgeHandle edge="end" offset={right} getState={getState} disabled={disabled || width <= 0} onChange={onChange} onStart={onDragStart} onEnd={onDragEnd} />
        </View>
        <View style={s.ticks}>{[0, .25, .5, .75, 1].map(f => <Text key={f} style={{ fontFamily: p.fonts.regular, fontSize: 10, color: p.faint }}>{formatClipTime(duration * f)}</Text>)}</View>
        <View style={s.precision}>{(['start', 'end'] as const).map(edge => <View key={edge} style={[s.timeField, { backgroundColor: p.soft }]}>
            <View><Text style={{ fontFamily: p.fonts.regular, fontSize: 10, color: p.sub }}>{edge === 'start' ? 'START' : 'END'}</Text><Text style={{ fontFamily: p.fonts.medium, fontSize: 16, color: p.text, fontVariant: ['tabular-nums'] }}>{formatClipTime(range[edge], true)}</Text></View>
            <View style={s.nudges}>{([-100, 100] as const).map(amount => <Pressable key={amount} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${edge === 'start' ? 'Start' : 'End'} ${amount < 0 ? 'earlier' : 'later'} by 0.1 seconds`} onPress={() => { onDragStart(); onChange(moveEdge(range, edge, range[edge] + amount, duration), edge); onDragEnd(); }} style={s.nudge}><Feather name={amount < 0 ? 'minus' : 'plus'} size={14} color={p.text} /></Pressable>)}</View>
        </View>)}</View>
    </View>;
}
const s = StyleSheet.create({
    wrapper: { marginTop: 24 }, timeline: { height: 58, marginHorizontal: 32, position: 'relative' }, track: { ...StyleSheet.absoluteFill, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, overflow: 'hidden' },
    selection: { position: 'absolute', top: 0, height: 58, borderTopWidth: 3, borderBottomWidth: 3, borderColor: '#ADC3EB', backgroundColor: 'rgba(190,210,245,0.14)' },
    dim: { position: 'absolute', top: 0, bottom: 0 }, handle: { position: 'absolute', top: -3, width: 28, height: 64, borderRadius: 8, flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center', zIndex: 3 }, grip: { width: 2, height: 19, borderRadius: 2, backgroundColor: '#3D5377' },
    playhead: { position: 'absolute', width: 2, top: -7, height: 72, borderRadius: 2, zIndex: 2 }, ticks: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 28, marginTop: 14 },
    precision: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 }, timeField: { flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 13, padding: 12, gap: 10 }, nudges: { flexDirection: 'row', gap: 2 }, nudge: { width: 34, height: 40, alignItems: 'center', justifyContent: 'center' },
});
