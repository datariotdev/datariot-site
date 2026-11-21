/** 'rgba(...)' for a #rrggbb colour, so a fade to the page colour has no grey midtones */
export function withAlpha(hex: string, a: number): string {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return `rgba(0, 0, 0, ${a})`;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
