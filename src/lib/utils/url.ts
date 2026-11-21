import { remoteMediaUrl } from './feed';

/**
 * Database/player URLs are remote HTTPS resources by default.
 * A local editor preview must explicitly opt in for a trusted device URI.
 */
export function encodeVideoUrl(url: string | null | undefined, allowLocalPreview = false): string | null {
    if (!url) return null;
    if (allowLocalPreview && /^(file|content|assets-library|blob):/.test(url)) return url;
    return remoteMediaUrl(url) || null;
}
