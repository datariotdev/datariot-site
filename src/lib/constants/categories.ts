export const VIDEO_CATEGORIES = [
    'Sport',
    'E-sports',
    'Engineering',
    'Logic',
    'AI',
    'Gaming',
    'Education',
    'Comedy',
    'Viral',
    'Lifestyle',
    'Debate',
    'Politics'
] as const;

export const ANIMATED_SHORTS_CATEGORY = 'animated-shorts';
// Animated Shorts is paused; keep the identifier for existing records.
export const ANIMATED_SHORTS_ENABLED = false;
export const PUBLISH_VIDEO_CATEGORIES = ANIMATED_SHORTS_ENABLED
    ? [ANIMATED_SHORTS_CATEGORY, ...VIDEO_CATEGORIES] as const
    : VIDEO_CATEGORIES;

export type VideoCategory = typeof PUBLISH_VIDEO_CATEGORIES[number];

export const CATEGORY_DISPLAY_NAMES: Record<VideoCategory, string> = {
    [ANIMATED_SHORTS_CATEGORY]: 'Animated Shorts',
    'Sport': 'Sport',
    'E-sports': 'E-sports',
    'Engineering': 'Engineering',
    'Logic': 'Logic',
    'AI': 'AI',
    'Gaming': 'Gaming',
    'Education': 'Education',
    'Comedy': 'Comedy',
    'Viral': 'Trending',
    'Lifestyle': 'Lifestyle',
    'Debate': 'Debate',
    'Politics': 'Politics'
};
