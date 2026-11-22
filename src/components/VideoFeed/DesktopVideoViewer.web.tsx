/** @jsxImportSource react */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';
import { OrvelisMark } from '../UI/OrvelisMark';
import { CommentsModal } from './CommentsModal';
import { DeepDiveModal } from './DeepDiveModal';
import { MoreOptionsModal } from './MoreOptionsModal';
import { encodeVideoUrl } from '../../lib/utils/url';
import { adjacentDesktopVideoId, createDesktopWheelGesture } from '../../lib/utils/desktopVideoNavigation';
import type { Video } from '../../lib/supabase/hooks/useVideos';
import type { FullScreenVideoModalProps } from './FullScreenVideoModal';

type PlayerHandle = { toggle: () => void; restart: () => void; seek: (seconds: number) => void };
type PlayerProps = {
    video: Video; active: boolean; muted: boolean; rate: number; clear: boolean;
    onToggleMute: () => void; onTime: (seconds: number) => void;
};
function time(seconds: number) {
    const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
}
const number = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
function Icon({ name, size = 20 }: { name: React.ComponentProps<typeof Feather>['name']; size?: number }) {
    return <span aria-hidden="true" className="dv-icon"><Feather name={name} size={size} color="currentColor" /></span>;
}

const DesktopPlayer = forwardRef<PlayerHandle, PlayerProps>(function DesktopPlayer({
    video, active, muted, rate, clear, onToggleMute, onTime,
}, ref) {
    const media = useRef<HTMLVideoElement>(null);
    const [paused, setPaused] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const [failed, setFailed] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const play = () => { void media.current?.play().catch(() => setPaused(true)); };
    const toggle = () => {
        const element = media.current;
        if (!element) return;
        if (element.paused) play(); else element.pause();
    };
    const seek = (seconds: number) => {
        const element = media.current;
        if (!element || !Number.isFinite(element.duration)) return;
        element.currentTime = Math.min(Math.max(0, seconds), element.duration);
        setPosition(element.currentTime);
        onTime(element.currentTime);
    };
    useImperativeHandle(ref, () => ({
        toggle, seek,
        restart: () => { seek(0); play(); },
    }));
    useEffect(() => {
        const element = media.current;
        if (!element) return;
        let cancelled = false;
        if (active) { void element.play().catch(() => { if (!cancelled) setPaused(true); }); }
        else element.pause();
        return () => { cancelled = true; };
    }, [active]);
    useEffect(() => { if (media.current) media.current.playbackRate = rate; }, [rate]);
    useEffect(() => {
        const element = media.current;
        return () => {
            if (!element) return;
            element.pause();
        };
    }, []);
    const readDuration = () => {
        const value = media.current?.duration ?? 0;
        setDuration(Number.isFinite(value) && value > 0 ? value : 0);
    };
    return <div className="dv-player">
        <div className="dv-canvas" aria-busy={!failed && (!loaded || buffering)}>
            <video ref={media} src={encodeVideoUrl(video.videoUrl) || undefined}
                poster={video.thumbnailUrl || undefined} autoPlay={active} muted={muted} loop playsInline preload="auto"
                aria-label={video.title} onClick={toggle}
                onLoadedMetadata={readDuration} onDurationChange={readDuration}
                onCanPlay={() => { setLoaded(true); setBuffering(false); }}
                onPlaying={() => { setLoaded(true); setBuffering(false); setPaused(false); }}
                onWaiting={() => setBuffering(true)} onPlay={() => setPaused(false)} onPause={() => setPaused(true)}
                onTimeUpdate={() => { const seconds = media.current?.currentTime ?? 0; setPosition(seconds); onTime(seconds); }}
                onError={() => { setFailed(true); setBuffering(false); }} />
            {failed ? <div className="dv-message" role="status">
                <Icon name="alert-circle" size={25} /><strong>This clip couldn’t load.</strong>
                <span>Try again, or switch to the next video.</span>
                <button className="dv-retry" onClick={() => { setFailed(false); setLoaded(false); media.current?.load(); play(); }}>Try again</button>
            </div> : !loaded || buffering ? <div className="dv-loading" role="status"><span className="dv-spinner" />Loading clip…</div>
                : paused && <button className="dv-play-overlay" aria-label="Play video" onClick={play}><Icon name="play" size={32} /></button>}
        </div>
        {!clear && <div className="dv-player-controls">
            <button className="dv-control" aria-label={paused ? 'Play video' : 'Pause video'} onClick={toggle}>
                <Icon name={paused ? 'play' : 'pause'} size={19} />
            </button>
            <button className="dv-control" aria-label={muted ? 'Unmute video' : 'Mute video'} onClick={onToggleMute}>
                <Icon name={muted ? 'volume-x' : 'volume-2'} size={19} />
            </button>
            <input className="dv-seek" type="range" aria-label="Video position" min={0} max={duration || 1}
                step={0.1} value={Math.min(position, duration || 0)} disabled={!duration} onChange={event => seek(Number(event.target.value))} />
            <output className="dv-time">{time(position)} <span>/ {time(duration)}</span></output>
        </div>}
    </div>;
});

export function DesktopVideoViewer({
    videos, initialVideoId, onClose, onLike, onSave, openOptionsOnMount = false,
    activeTab = 'trending', onSelectTab, onEndReached,
}: FullScreenVideoModalProps) {
    const { theme, mode } = useTheme();
    const dark = mode === 'dark';
    const focused = useIsFocused();
    const router = useRouter();
    const [selectedId, setSelectedId] = useState(initialVideoId ?? videos[0]?.id ?? '');
    const [muted, setMuted] = useState(true);
    const [rate, setRate] = useState(1);
    const [clear, setClear] = useState(false);
    const [options, setOptions] = useState(openOptionsOnMount);
    const [comments, setComments] = useState<{ id: string; compose: boolean } | null>(null);
    const [analysis, setAnalysis] = useState<{ video: Video; seconds: number } | null>(null);
    const player = useRef<PlayerHandle>(null);
    const canvas = useRef<HTMLDivElement>(null);
    const root = useRef<HTMLDivElement>(null);
    const playback = useRef(0);
    const requestedLength = useRef(-1);
    const index = Math.max(0, videos.findIndex(item => item.id === selectedId));
    const video = videos[index];
    const videosRef = useRef(videos);
    const selectedRef = useRef(selectedId);
    const loadMoreRef = useRef(onEndReached);
    videosRef.current = videos;
    selectedRef.current = video?.id ?? '';
    loadMoreRef.current = onEndReached;
    const locked = !!comments || !!analysis || options || !focused;
    const navigate = useCallback((direction: -1 | 1) => {
        const nextId = adjacentDesktopVideoId(videosRef.current.map(item => item.id), selectedRef.current, direction);
        if (!nextId) return;
        selectedRef.current = nextId;
        playback.current = 0;
        setSelectedId(nextId);
    }, []);
    useEffect(() => {
        if (index < videos.length - 3 || !onEndReached || requestedLength.current === videos.length) return;
        requestedLength.current = videos.length;
        loadMoreRef.current?.();
    }, [index, videos.length, onEndReached]);
    useEffect(() => { root.current?.focus({ preventScroll: true }); }, []);
    useEffect(() => {
        if (locked) return;
        const element = canvas.current;
        if (!element) return;
        const wheelStep = createDesktopWheelGesture();
        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey || event.metaKey) return;
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
            if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
            event.preventDefault();
            const direction = wheelStep(event.deltaY, event.deltaMode, performance.now());
            if (direction) navigate(direction);
        };
        element.addEventListener('wheel', onWheel, { passive: false });
        return () => element.removeEventListener('wheel', onWheel);
    }, [locked, navigate]);
    useEffect(() => {
        if (locked) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (event.repeat) return;
            if (event.key === 'ArrowDown' || event.key === 'PageDown') { event.preventDefault(); navigate(1); }
            else if (event.key === 'ArrowUp' || event.key === 'PageUp') { event.preventDefault(); navigate(-1); }
            else if (event.code === 'Space' && !target?.closest('button, a')) { event.preventDefault(); player.current?.toggle(); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [locked, navigate]);
    const closeTop = () => {
        if (options) setOptions(false);
        else if (clear) setClear(false);
        else onClose();
    };
    const openAnalysis = () => { if (video) setAnalysis({ video, seconds: Math.floor(playback.current) }); };
    const openAuthor = () => {
        if (!video?.authorId) return;
        onClose();
        router.push({ pathname: '/user/[id]', params: { id: video.authorId } });
    };
    const variables = {
        '--dv-bg': theme.colors.background.primary,
        '--dv-ink': theme.colors.text.primary,
        '--dv-sub': theme.colors.text.secondary,
        '--dv-stage': dark ? '#111A28' : '#F0F4F9',
        '--dv-soft': dark ? '#1D2B3E' : '#EAF1FA',
        '--dv-accent': dark ? '#B7D3FA' : '#4C709F',
    } as React.CSSProperties;
    const author = video?.author.split(' | ')[0] || 'Datariot';
    return <Modal visible={focused} transparent={false} animationType="fade" onRequestClose={closeTop}>
        <div ref={root} className={'dv-root' + (clear ? ' dv-clear' : '')} style={variables} tabIndex={-1}
            data-video-id={video?.id} aria-label="Desktop video viewer">
            <style>{css}</style>
            {!clear ? <header className="dv-header">
                <div className="dv-header-leading">
                    <button className="dv-control" aria-label="Close full-screen feed" onClick={onClose}><Icon name="x" size={23} /></button>
                    <nav aria-label="Feed sections" className="dv-tabs">
                        {(onSelectTab ? ['ai', 'trending', 'following'] : [activeTab]).map(tab => <button key={tab}
                            aria-current={activeTab === tab ? 'page' : undefined}
                            onClick={onSelectTab ? () => { if (tab !== activeTab) onSelectTab(tab as 'ai' | 'trending' | 'following'); } : undefined}>
                            {tab === 'ai' ? 'Arena' : tab === 'following' ? 'Circle' : 'Feed'}
                        </button>)}
                    </nav>
                </div>
                <div className="dv-navigation" aria-label="Video navigation">
                    <span className="dv-position" aria-live="polite">{video ? index + 1 : 0} <span>/ {videos.length}</span></span>
                    <button className="dv-step" aria-label="Previous video" disabled={!video || index === 0} onClick={() => navigate(-1)}>
                        <Icon name="arrow-up" size={19} /><span>Previous</span>
                    </button>
                    <button className="dv-step" aria-label="Next video" disabled={!video || index === videos.length - 1} onClick={() => navigate(1)}>
                        <span>Next</span><Icon name="arrow-down" size={19} />
                    </button>
                </div>
            </header> : <button className="dv-restore" aria-label="Restore video controls" onClick={() => setClear(false)}><Icon name="minimize" /></button>}
            {video ? <div className="dv-layout">
                <div className="dv-media" ref={canvas}>
                    <DesktopPlayer key={video.id} ref={player} video={video} active={!locked} muted={muted} rate={rate} clear={clear}
                        onToggleMute={() => setMuted(value => !value)} onTime={seconds => { playback.current = seconds; }} />
                </div>
                {!clear && <aside className="dv-details">
                    <div className="dv-author-row">
                        <button className="dv-author" onClick={openAuthor} disabled={!video.authorId} aria-label={'Open ' + author + "'s profile"}>
                            <span className="dv-avatar">{author[0]?.toUpperCase()}{video.avatarUrl &&
                                <img src={video.avatarUrl} alt="" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}</span>
                            <span>{author}</span>
                        </button>
                        <button className="dv-control" aria-label="More video options" onClick={() => setOptions(true)}><Icon name="more-horizontal" /></button>
                    </div>
                    {video.category && <span className="dv-category">{video.category}</span>}
                    <h1 className="dv-title" key={video.id}>{video.title}</h1>
                    {video.hashtag && <p className="dv-hashtag">#{video.hashtag}</p>}
                    <div className="dv-actions">
                        <button aria-label={video.isLiked ? 'Unlike' : 'Like'} aria-pressed={video.isLiked} onClick={() => onLike(video.id)}>
                            <span className="dv-star" aria-hidden="true">✦</span><span>{number.format(video.likes || 0)}</span>
                        </button>
                        <button aria-label="Comments" onClick={() => setComments({ id: video.id, compose: false })}>
                            <Icon name="message-circle" /><span>{number.format(video.comments || 0)}</span>
                        </button>
                        <button aria-label={video.isSaved ? 'Unsave' : 'Save'} aria-pressed={video.isSaved} onClick={() => onSave(video.id)}>
                            <Icon name="bookmark" /><span>{number.format(video.saved || 0)}</span>
                        </button>
                    </div>
                    <button className="dv-orvelis" onClick={openAnalysis}>
                        <OrvelisMark size={25} color={dark ? '#B7D3FA' : '#4C709F'} />
                        <span><strong>Unpack this clip</strong><small>Explore it with Orvelis</small></span>
                        <Icon name="arrow-up-right" size={18} />
                    </button>
                    <div className="dv-details-bottom">
                        <button className="dv-comment" onClick={() => setComments({ id: video.id, compose: true })}>
                            <span>Add a comment…</span><Icon name="arrow-up" size={18} />
                        </button>
                        <p className="dv-hint">Scroll over the video or use <kbd>↑</kbd> <kbd>↓</kbd> to switch.</p>
                    </div>
                </aside>}
            </div> : <div className="dv-empty"><p>No videos to play.</p><button onClick={onClose}>Back to feed</button></div>}
            {options && video && <MoreOptionsModal video={video} muted={muted} rate={rate} onClose={() => setOptions(false)}
                onClearDisplay={() => { setOptions(false); setClear(true); }}
                onRestart={() => { setOptions(false); player.current?.restart(); }}
                onToggleMute={() => { setOptions(false); setMuted(value => !value); }}
                onRateChange={value => { setRate(value); setOptions(false); }}
                onComments={() => { setOptions(false); setComments({ id: video.id, compose: false }); }}
                onAuthor={video.authorId ? () => { setOptions(false); openAuthor(); } : undefined}
                onDeepDive={() => { setOptions(false); openAnalysis(); }} />}
        </div>
        <CommentsModal visible={!!comments} videoId={comments?.id ?? null} focusComposer={comments?.compose} onClose={() => setComments(null)} />
        <DeepDiveModal visible={!!analysis} video={analysis?.video ?? null} seconds={analysis?.seconds ?? 0}
            onSeek={seconds => { player.current?.seek(seconds); setAnalysis(null); }} onClose={() => setAnalysis(null)} />
    </Modal>;
}

const css = "\n.dv-root{height:100%;height:100dvh;width:100%;display:flex;flex-direction:column;overflow:hidden;background:var(--dv-bg);color:var(--dv-ink);font-family:Inter_400Regular,Inter,system-ui,sans-serif;outline:none;position:relative}\n.dv-root,.dv-root *{box-sizing:border-box}\n.dv-root button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}\n.dv-root button:disabled{opacity:.3;cursor:default}\n.dv-root button:focus-visible,.dv-root input:focus-visible{outline:2px solid var(--dv-accent);outline-offset:3px}\n.dv-icon{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}\n.dv-header{width:100%;max-width:1520px;min-height:76px;padding:12px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px;align-self:center;flex-shrink:0}\n.dv-header-leading,.dv-tabs,.dv-navigation{display:flex;align-items:center;gap:12px}\n.dv-tabs{gap:20px}.dv-tabs button{font-size:14px;color:var(--dv-sub);padding:12px 0}\n.dv-tabs button[aria-current=page]{font-weight:600;color:var(--dv-ink)}\n.dv-control{width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;flex-shrink:0}\n.dv-root .dv-control:hover,.dv-root .dv-step:hover:not(:disabled){background:var(--dv-soft)}\n.dv-position{font-size:12px;font-variant-numeric:tabular-nums;min-width:60px;margin-right:8px}.dv-position span{color:var(--dv-sub)}\n.dv-step{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 12px;border-radius:12px;font-size:12px!important}\n.dv-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:30px;width:100%;max-width:1520px;align-self:center;flex:1;min-height:0;padding:0 32px 24px}\n.dv-media{min-width:0;min-height:0;display:flex;overscroll-behavior:contain}\n.dv-player{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}\n.dv-canvas{display:flex;flex:1;min-height:0;position:relative;overflow:hidden;border-radius:16px;background:var(--dv-stage)}\n.dv-canvas video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--dv-stage);cursor:pointer}\n.dv-player-controls{display:flex;align-items:center;gap:8px;min-height:58px;flex-shrink:0}\n.dv-seek{flex:1;min-width:0;height:4px;margin:0 12px;accent-color:var(--dv-accent);cursor:pointer}\n.dv-time{font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap;padding-right:4px}.dv-time span{color:var(--dv-sub)}\n.dv-play-overlay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(20,30,45,.65)!important;color:#fff!important}\n.dv-loading{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:10px;align-items:center;font-size:12px;background:var(--dv-bg);padding:12px 16px;border-radius:12px;pointer-events:none}\n.dv-spinner{width:15px;height:15px;border:2px solid var(--dv-soft);border-top-color:var(--dv-accent);border-radius:50%;animation:dv-spin .8s linear infinite}\n@keyframes dv-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.dv-spinner{animation:none}}\n.dv-message{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--dv-stage);font-size:13px;text-align:center;padding:24px}.dv-message>span{color:var(--dv-sub)}\n.dv-retry{padding:10px 18px!important;background:var(--dv-soft)!important;border-radius:10px}\n.dv-details{display:flex;flex-direction:column;min-width:0;min-height:0;padding:16px 0 4px;overflow:auto;overscroll-behavior:contain}\n.dv-author-row{display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:28px}\n.dv-author{display:flex;align-items:center;gap:10px;min-width:0;text-align:left;font-size:12px!important;font-weight:600!important;opacity:1!important}\n.dv-author>span:last-child{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}\n.dv-avatar{width:34px;height:34px;border-radius:50%;background:var(--dv-soft);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;flex-shrink:0;color:var(--dv-accent)}\n.dv-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}\n.dv-category{font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:var(--dv-accent);margin-bottom:12px}\n.dv-title{font-family:Outfit_600SemiBold,Inter,system-ui,sans-serif;font-size:25px;line-height:1.2;letter-spacing:-.6px;font-weight:600;margin:0;overflow-wrap:anywhere}\n.dv-hashtag{font-size:12px;line-height:1.5;color:var(--dv-sub);margin:12px 0 0}\n.dv-actions{display:flex;align-items:center;gap:8px;margin-top:24px;margin-bottom:24px}\n.dv-actions button{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;min-height:44px;border-radius:10px;font-size:12px!important}\n.dv-actions button:hover{background:var(--dv-soft)}.dv-actions button[aria-pressed=true]{color:var(--dv-accent)}\n.dv-star{font-size:26px;line-height:1}\n.dv-orvelis{display:flex;align-items:center;gap:12px;padding:14px 0!important;text-align:left;width:100%}\n.dv-orvelis>span{display:flex;flex:1;flex-direction:column;gap:4px}.dv-orvelis strong{font-size:12px;font-weight:600}.dv-orvelis small{font-size:11px;color:var(--dv-sub)}\n.dv-details-bottom{margin-top:auto;padding-top:32px}\n.dv-comment{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:46px;border-radius:14px;padding:12px 14px!important;background:var(--dv-soft)!important;font-size:12px!important;color:var(--dv-sub)!important}\n.dv-hint{font-size:10px;line-height:1.7;color:var(--dv-sub);margin:14px 0 0}.dv-hint kbd{font-family:inherit;font-size:12px;margin:0 2px}\n.dv-clear .dv-layout{grid-template-columns:minmax(0,1fr);max-width:none;padding:12px}.dv-clear .dv-canvas{border-radius:0}\n.dv-restore{position:absolute;right:24px;top:24px;z-index:10;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:var(--dv-bg)!important}\n.dv-empty{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:12px}\n@media(max-width:1050px){.dv-header{padding-left:20px;padding-right:20px}.dv-layout{grid-template-columns:minmax(0,1fr) 250px;gap:22px;padding-left:20px;padding-right:20px}.dv-title{font-size:22px}.dv-header .dv-step span{display:none}.dv-header .dv-step{width:42px;padding:0}.dv-navigation{gap:4px}}\n";
