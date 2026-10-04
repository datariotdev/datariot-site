import { Platform, Share } from 'react-native';

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Where a shared clip lands: the web app, with that clip first in the feed. */
export const videoLink = (id: string) => `https://datariot.xyz/video-player?type=trending&initialVideoId=${id}`;

/**
 * The system share sheet on a phone; the browser's own on the web, or, failing
 * that, the link copied to the clipboard.
 */
export async function shareVideo(video: { id: string; title: string; author: string }): Promise<ShareResult> {
    const url = videoLink(video.id);
    const message = `${video.title} · @${video.author} on Datariot`;

    try {
        if (Platform.OS === 'web') {
            const nav: any = typeof navigator !== 'undefined' ? navigator : null;
            if (nav?.share) {
                await nav.share({ title: video.title, text: message, url });
                return 'shared';
            }
            if (nav?.clipboard?.writeText) {
                await nav.clipboard.writeText(url);
                return 'copied';
            }
            return 'failed';
        }

        const result = await Share.share(Platform.OS === 'ios' ? { message, url } : { message: `${message}\n${url}` });
        return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
    } catch (e: any) {
        // The web share sheet rejects with AbortError when the person closes it
        if (e?.name === 'AbortError') return 'cancelled';
        return 'failed';
    }
}
