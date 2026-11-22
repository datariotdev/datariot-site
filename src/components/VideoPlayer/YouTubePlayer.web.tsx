/** @jsxImportSource react */
import React, { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { syncYouTubePlayback, youtubeSeekSeconds, type YouTubePlayback } from '../../lib/utils/youtube';

interface Player extends YouTubePlayback {
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getIframe(): HTMLIFrameElement;
    destroy(): void;
}
type Event = { target: Player; data?: number };
type API = { Player: new (element: HTMLElement, options: {
    videoId: string; width: string; height: string; host: string;
    playerVars: Record<string, string | number>;
    events: { onReady: (event: Event) => void; onStateChange: (event: Event) => void; onError: (event: Event) => void; onAutoplayBlocked: (event: Event) => void };
}) => Player };
type YouTubeWindow = Window & { YT?: API; onYouTubeIframeAPIReady?: () => void };
let apiPromise: Promise<API> | null = null;

function loadAPI(): Promise<API> {
    const ytWindow = window as YouTubeWindow;
    if (ytWindow.YT?.Player) return Promise.resolve(ytWindow.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise<API>((resolve, reject) => {
        const previous = ytWindow.onYouTubeIframeAPIReady;
        const timeout = window.setTimeout(() => reject(new Error('YouTube player timed out')), 20000);
        ytWindow.onYouTubeIframeAPIReady = () => {
            window.clearTimeout(timeout);
            try { previous?.(); } finally {
                if (ytWindow.YT?.Player) resolve(ytWindow.YT);
                else reject(new Error('YouTube player unavailable'));
            }
        };
        if (!document.getElementById('datariot-youtube-api')) {
            const script = document.createElement('script');
            script.id = 'datariot-youtube-api';
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            script.onerror = () => {
                window.clearTimeout(timeout);
                script.remove();
                reject(new Error('YouTube player could not load'));
            };
            document.head.appendChild(script);
        }
    }).catch(error => { apiPromise = null; throw error; });
    return apiPromise;
}

interface Props {
    videoId: string;
    playing: boolean;
    active?: boolean;
    muted?: boolean;
    playbackRate?: number;
    style?: StyleProp<ViewStyle>;
    playbackRef?: Ref<{ seekTo: (positionMs: number) => void }>;
    onTimeUpdate?: (currentMs: number, durationMs: number) => void;
    onFirstFrame?: () => void;
    onError?: () => void;
    onPlayingChange?: (playing: boolean) => void;
}

/** Official, interactive player. No rehosting, cropping, hidden branding, or click-blocking overlay. */
export function YouTubePlayer(props: Props) {
    const host = useRef<HTMLDivElement>(null);
    const player = useRef<Player | null>(null);
    const ready = useRef(false);
    const latest = useRef(props);
    latest.current = props;
    const [activated, setActivated] = useState(props.playing);
    const [attempt, setAttempt] = useState(0);
    const [failed, setFailed] = useState(false);
    useEffect(() => { if (props.playing) setActivated(true); }, [props.playing]);

    useImperativeHandle(props.playbackRef, () => ({
        seekTo(positionMs) {
            const instance = player.current;
            if (!instance || !ready.current) return;
            const seconds = youtubeSeekSeconds(positionMs, instance.getDuration());
            if (seconds !== null) instance.seekTo(seconds, true);
        },
    }), []);

    useEffect(() => {
        if (!activated || !host.current) return;
        let disposed = false;
        let instance: Player | null = null;
        let interval: ReturnType<typeof setInterval> | undefined;
        ready.current = false;
        setFailed(false);
        const fail = () => {
            if (disposed) return;
            ready.current = false;
            setFailed(true);
            latest.current.onError?.();
        };
        void loadAPI().then(api => {
            if (disposed || !host.current) return;
            const mount = document.createElement('div');
            host.current.replaceChildren(mount);
            instance = new api.Player(mount, {
                host: 'https://www.youtube-nocookie.com',
                videoId: props.videoId,
                width: '100%', height: '100%',
                playerVars: {
                    enablejsapi: 1, playsinline: 1, controls: 1,
                    autoplay: 0, cc_load_policy: 1, cc_lang_pref: 'en', rel: 0,
                    origin: window.location.origin,
                },
                events: {
                    onReady: event => {
                        if (disposed) return;
                        ready.current = true;
                        const iframe = event.target.getIframe();
                        iframe.title = 'YouTube video player';
                        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
                        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
                        latest.current.onFirstFrame?.();
                        syncYouTubePlayback(event.target, {
                            playing: latest.current.playing,
                            muted: latest.current.muted ?? true,
                            rate: latest.current.playbackRate,
                        });
                        interval = setInterval(() => {
                            if (!disposed && ready.current) {
                                latest.current.onTimeUpdate?.(event.target.getCurrentTime() * 1000, event.target.getDuration() * 1000);
                            }
                        }, 250);
                    },
                    onStateChange: event => {
                        if (disposed) return;
                        if (event.data === 1 && latest.current.active === false) { event.target.pauseVideo(); return; }
                        if (event.data === 1) latest.current.onFirstFrame?.();
                        if (event.data === 1 || event.data === 2) latest.current.onPlayingChange?.(event.data === 1);
                        if (event.data === 0 && latest.current.playing) {
                            event.target.seekTo(0, true);
                            event.target.playVideo();
                        }
                    },
                    onAutoplayBlocked: () => {
                        // Reveal the official play button instead of leaving a poster/loading deadlock.
                        latest.current.onFirstFrame?.();
                        latest.current.onPlayingChange?.(false);
                    },
                    onError: fail,
                },
            });
            player.current = instance;
        }).catch(fail);
        return () => {
            disposed = true;
            ready.current = false;
            if (interval) clearInterval(interval);
            try { instance?.pauseVideo(); instance?.destroy(); } catch { /* Already removed by navigation. */ }
            if (player.current === instance) player.current = null;
        };
    }, [props.videoId, activated, attempt]);

    useEffect(() => {
        if (player.current && ready.current) {
            syncYouTubePlayback(player.current, {
                playing: props.playing, muted: props.muted ?? true, rate: props.playbackRate,
            });
        }
    }, [props.playing, props.muted, props.playbackRate]);

    const layout: React.CSSProperties = {
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        ...(StyleSheet.flatten(props.style) as React.CSSProperties),
    };
    return <div style={layout}>
        <div ref={host} style={{ width: '100%', height: '100%' }} />
        {failed && <div role="status" style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
            background: '#10151E', color: '#FFFFFF', textAlign: 'center',
        }}>
            <strong>This video is currently unavailable.</strong>
            <span>Try again or choose the next clip.</span>
            <button type="button" onClick={() => setAttempt(value => value + 1)}
                style={{ padding: '10px 18px', borderRadius: 10, border: 0, cursor: 'pointer' }}>Try again</button>
        </div>}
    </div>;
}
