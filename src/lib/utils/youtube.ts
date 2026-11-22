/** Parse supported YouTube URLs without accepting lookalike hosts or executable URLs. */
export function youtubeVideoId(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > 8192) return null;
    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
        const host = url.hostname.toLowerCase();
        let id: string | null = null;
        if (host === 'youtu.be') {
            const parts = url.pathname.split('/').filter(Boolean);
            if (parts.length === 1) id = parts[0];
        } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
            if (url.pathname === '/watch') id = url.searchParams.get('v');
            else id = /^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1] ?? null;
        }
        return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
        return null;
    }
}

export interface YouTubePlayback {
    playVideo(): void;
    pauseVideo(): void;
    mute(): void;
    unMute(): void;
    setPlaybackRate(rate: number): void;
    getAvailablePlaybackRates?(): number[];
}

/** Called only after the iframe is ready; paused/offscreen cards must never keep playing. */
export function syncYouTubePlayback(
    player: YouTubePlayback,
    state: { playing: boolean; muted: boolean; rate?: number },
) {
    if (state.muted) player.mute(); else player.unMute();
    const desired = Number.isFinite(state.rate) && (state.rate ?? 0) > 0 ? state.rate! : 1;
    const available = player.getAvailablePlaybackRates?.() ?? [1];
    player.setPlaybackRate(available.includes(desired) ? desired : 1);
    if (state.playing) player.playVideo(); else player.pauseVideo();
}

export function youtubeSeekSeconds(positionMs: number, durationSeconds: number): number | null {
    if (!Number.isFinite(positionMs) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return null;
    return Math.max(0, Math.min(positionMs / 1000, durationSeconds));
}
