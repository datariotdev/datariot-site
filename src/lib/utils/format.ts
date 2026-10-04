/** 1,234 -> 1.2K, 1,500,000 -> 1.5M; below a thousand, as is. */
export function formatCount(n: number | undefined | null): string {
    const v = n || 0;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
    return String(v);
}

/** "now", "5m", "3h", "2d", "6w", "1y": the short form social apps use. */
export function timeAgo(iso?: string | null, now: number = Date.now()): string {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const s = Math.max(0, Math.floor((now - t) / 1000));
    if (s < 60) return 'now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    if (d < 365) return `${Math.floor(d / 7)}w`;
    return `${Math.floor(d / 365)}y`;
}
