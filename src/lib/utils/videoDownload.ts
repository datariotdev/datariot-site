import { Platform } from 'react-native';
import { encodeVideoUrl } from './url';

const VIDEO_TYPES = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
} as const;

export function downloadableVideo(url: string) {
    const source = encodeVideoUrl(url);
    if (!source) return null;
    const extension = /\.(mp4|m4v|mov|webm)$/i.exec(new URL(source).pathname)?.[1]?.toLowerCase() as keyof typeof VIDEO_TYPES | undefined;
    return extension ? { source, extension, mime: VIDEO_TYPES[extension] } : null;
}

export async function downloadVideo(video: NonNullable<ReturnType<typeof downloadableVideo>>, title: string): Promise<boolean> {
    const name = title.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'datariot-video';
    const filename = `${name}.${video.extension}`;

    if (Platform.OS === 'web') {
        const response = await fetch(video.source, { credentials: 'omit' });
        const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
        if (!response.ok || !type || (!type.startsWith('video/') && type !== 'application/octet-stream')) {
            throw new Error('The source did not return a video file.');
        }
        const blobUrl = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        try {
            link.click();
        } finally {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
        }
        return true;
    }

    const { Directory, File, Paths } = await import('expo-file-system');
    let folder;
    try {
        folder = await Directory.pickDirectoryAsync();
    } catch (error) {
        if (error instanceof Error && /cancelled by the user/i.test(error.message)) return false;
        throw error;
    }

    const temporary = new Directory(Paths.cache, `video-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    temporary.create();
    try {
        const media = await File.downloadFileAsync(video.source, new File(temporary, filename));
        if (!media.size || (media.type && !media.type.startsWith('video/') && media.type !== 'application/octet-stream')) {
            throw new Error('The source did not return a video file.');
        }
        const destination = folder.createFile(`${name}-${Date.now()}.${video.extension}`, video.mime);
        try {
            await media.copy(destination, { overwrite: true });
        } catch (error) {
            if (destination.exists) destination.delete();
            throw error;
        }
        return true;
    } finally {
        temporary.delete();
    }
}
