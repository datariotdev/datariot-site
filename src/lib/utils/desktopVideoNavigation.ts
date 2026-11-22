/** One step per physical wheel gesture, including long trackpad momentum. */
export function createDesktopWheelGesture() {
    let accumulated = 0;
    let lastEventAt = -Infinity;
    let consumed = false;
    return (delta: number, mode: number, now: number): -1 | 0 | 1 => {
        if (!Number.isFinite(delta) || delta === 0) return 0;
        if (now - lastEventAt > 180) { accumulated = 0; consumed = false; }
        lastEventAt = now;
        if (consumed) return 0;
        const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 720 : 1);
        if (Math.sign(pixels) !== Math.sign(accumulated)) accumulated = 0;
        accumulated += pixels;
        if (Math.abs(accumulated) < 45) return 0;
        consumed = true;
        return accumulated > 0 ? 1 : -1;
    };
}

export function adjacentDesktopVideoId(ids: readonly string[], currentId: string, direction: -1 | 1): string | null {
    const current = ids.indexOf(currentId);
    const next = current < 0 ? (direction === 1 ? 0 : -1) : current + direction;
    return ids[next] ?? null;
}
