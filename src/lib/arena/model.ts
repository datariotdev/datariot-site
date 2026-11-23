import type { Post } from '../supabase/hooks/usePosts';

export type ArenaSide = 'FOR' | 'AGAINST' | 'NEUTRAL';
export type ArenaTopic = 'all' | 'technology' | 'society' | 'science' | 'mind';
export type ArenaFilter = 'latest' | 'unanswered' | 'mine';
export type ArenaPost = Post & { topic: ArenaTopic };
export const ARENA_TOPICS: { key: ArenaTopic; label: string; icon: 'compass' | 'cpu' | 'users' | 'globe' | 'git-merge'; terms: string[] }[] = [
    { key: 'all', label: 'All questions', icon: 'compass', terms: [] },
    { key: 'technology', label: 'AI & technology', icon: 'cpu', terms: ['artificial', ' AI ', 'robot', 'algorithm', 'technology', 'training data'] },
    { key: 'society', label: 'Society & ethics', icon: 'users', terms: ['privacy', 'society', 'surveillance', 'legal', 'moral', 'personhood', 'freedom'] },
    { key: 'science', label: 'Science & the world', icon: 'globe', terms: ['science', 'space', 'climate', 'energy', 'planet', 'research', 'biology'] },
    { key: 'mind', label: 'Mind & logic', icon: 'git-merge', terms: ['logic', 'emotion', 'reasoning', 'conscious', 'belief', 'truth', 'think'] },
];
export function arenaTopic(content: string): ArenaTopic {
    if (/\b(ai|robot\w*|algorithm\w*|artificial|technology)\b/i.test(content)) return 'technology';
    if (/privacy|society|surveillance|legal|moral|personhood|freedom/i.test(content)) return 'society';
    if (/science|space|climate|energy|planet|research|biology/i.test(content)) return 'science';
    if (/logic|emotion|reasoning|conscious|belief|truth|think/i.test(content)) return 'mind';
    return 'all';
}
export function parseArenaArgument(raw: string): { content: string; side: ArenaSide; aiAssisted: boolean } {
    const aiAssisted = raw.startsWith('AI_ORACLE:|');
    const text = aiAssisted ? raw.slice('AI_ORACLE:|'.length) : raw;
    if (text.startsWith('FOR:|')) return { content: text.slice(5), side: 'FOR', aiAssisted };
    if (text.startsWith('AGAINST:|')) return { content: text.slice(9), side: 'AGAINST', aiAssisted };
    return { content: text, side: 'NEUTRAL', aiAssisted };
}
export function filterArenaPosts(posts: ArenaPost[], filter: ArenaFilter, userId?: string) {
    return posts.filter(post => filter === 'unanswered' ? post.comments === 0 : filter === 'mine' ? !!userId && post.userId === userId : true);
}
export function spotlightPost(posts: ArenaPost[]) {
    return posts.find(post => /\?/.test(post.content) && !/New Video/i.test(post.content)) || posts[0];
}
export function uniqueArenaItems<T extends { id: string }>(previous: T[], incoming: T[]): T[] {
    return [...new Map([...previous, ...incoming].map(item => [item.id, item])).values()];
}
export const arenaThinkingPrompt = (question: string) => `Help me think through this debate: “${question.slice(0, 1500)}”\n\nGive the strongest argument for and against, identify hidden assumptions, and explain what evidence could change the conclusion. Separate established facts from uncertainty. Don’t treat popularity as proof.`;
