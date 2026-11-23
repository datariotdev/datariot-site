export type ClipRange = { start: number; end: number };
export type ClipEdge = 'start' | 'end';
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function minimumRange(duration: number): number { return Math.min(1000, Math.max(0, duration)); }
export function moveEdge(range: ClipRange, edge: ClipEdge, value: number, duration: number): ClipRange {
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(value)) return range;
    const gap = minimumRange(duration);
    return edge === 'start'
        ? { start: clamp(value, 0, Math.max(0, range.end - gap)), end: range.end }
        : { start: range.start, end: clamp(value, Math.min(duration, range.start + gap), duration) };
}
// Translation is relative to the grab point, never the screen's absolute X coordinate.
export function dragEdge(range: ClipRange, edge: ClipEdge, translationX: number, trackWidth: number, duration: number): ClipRange {
    if (!Number.isFinite(trackWidth) || trackWidth <= 0 || !Number.isFinite(translationX)) return range;
    return moveEdge(range, edge, range[edge] + translationX / trackWidth * duration, duration);
}
export function formatClipTime(ms: number, precise = false): string {
    const safe = Number.isFinite(ms) ? Math.max(0, ms) : 0;
    const tenths = Math.round(safe / 100);
    const seconds = Math.floor(tenths / 10);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}${precise ? `.${tenths % 10}` : ''}`;
}
