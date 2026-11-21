/** Only remote HTTPS media from database records may be opened by a player. */
export function remoteMediaUrl(value: unknown): string | undefined {
    if (typeof value !== 'string' || value.length > 8192) return undefined;
    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:' || url.username || url.password) return undefined;
        return url.href;
    } catch {
        return undefined;
    }
}

/** PostgREST's OR expression is a filter language, so never interpolate raw input. */
export function feedSearchTerm(value: string): string {
    return value.normalize('NFKC').replace(/[^\p{L}\p{N}\s#-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

export function playableFeedRecord(record: { url?: unknown; s3_url?: unknown; user_id?: unknown }): boolean {
    const url = remoteMediaUrl(record.url || record.s3_url);
    if (!url || typeof record.user_id !== 'string' || !record.user_id || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(record.user_id)) return false;
    const hostname = new URL(url).hostname;
    // These hosts contain retired/demo uploads, not the current platform storage.
    return !['clipto-videos.s3.eu-north-1.amazonaws.com', 'commondatastorage.googleapis.com', 'cloudfront-id.cloudfront.net'].includes(hostname)
        && !/BigBuckBunny|ElephantsDream|\/sample\/|big-buck-bunny|placeholder|имя-бакета/i.test(`${record.url || record.s3_url} ${url}`);
}

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
    const unique = new Map<string, T>();
    for (const item of items) if (!unique.has(item.id)) unique.set(item.id, item);
    return Array.from(unique.values());
}

export async function collectPlayablePages<T extends { url?: unknown; s3_url?: unknown; user_id?: unknown }>(
    startPage: number,
    fetchPage: (page: number) => Promise<T[]>,
    signal: AbortSignal,
) {
    let cursor = startPage;
    const rows: T[] = [];
    let hasMore = true;
    do {
        if (signal.aborted) throw new Error('Request cancelled');
        const page = await fetchPage(cursor);
        if (signal.aborted) throw new Error('Request cancelled');
        rows.push(...page.filter(playableFeedRecord));
        hasMore = page.length === 12;
        cursor++;
    } while (!rows.length && hasMore);
    return { rows, nextPage: cursor, hasMore };
}
