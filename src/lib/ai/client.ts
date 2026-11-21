import { supabase } from '../supabase/client';

type Mode = 'chat' | 'insight' | 'analyze' | 'debate' | 'deep_dive' | 'video_chat' | 'live_analysis';
export type VideoAction = 'ask' | 'explain' | 'check' | 'reply';
export interface Source { title: string; url: string }
interface Result { content: string; sources?: Source[]; searchEntryPoint?: string; context?: string; cached?: boolean }
export interface DeepDiveMessage {
    role: 'user' | 'assistant' | 'system'; content: string; sources?: Source[]; searchEntryPoint?: string;
}
export class OrvelisError extends Error {
    constructor(public code: string) { super(code); }
}
export function orvelisErrorMessage(error: unknown): string {
    const code = error instanceof OrvelisError ? error.code : '';
    if (code === 'SIGN_IN_REQUIRED') return 'Sign in to explore this video with Orvelis.';
    if (code === 'RATE_LIMITED') return 'Orvelis has reached its request limit. Try again later.';
    if (code === 'ANALYSIS_PENDING' || code === 'MEDIA_PROCESSING') return 'This clip is still being analyzed. Try again shortly.';
    if (code === 'MEDIA_UNSUPPORTED') return 'Live analysis does not support this video file yet.';
    if (code === 'CLIP_NOT_PUBLIC') return 'Orvelis video analysis is available for public clips only.';
    if (code === 'MEDIA_UNAVAILABLE' || code === 'CLIP_UNAVAILABLE') return 'Orvelis could not access this video. Try another clip.';
    return 'Orvelis could not finish this request. Please try again.';
}
async function invokeOrvelis(mode: Mode, prompt: string, history: DeepDiveMessage[] = [], extra: Record<string, unknown> = {}): Promise<Result> {
    if (!supabase) throw new OrvelisError('SERVICE_UNAVAILABLE');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session || sessionData.session.user.is_anonymous) throw new OrvelisError('SIGN_IN_REQUIRED');
    const { data, error } = await supabase.functions.invoke('orvelis-ai', {
        body: { mode, prompt, history: history.filter(h => h.role === 'user' || h.role === 'assistant').map(h => ({ role: h.role, content: h.content })), ...extra },
    });
    if (error) {
        const detail = await error.context?.json?.().catch(() => null);
        throw new OrvelisError(detail?.error || 'SERVICE_UNAVAILABLE');
    }
    if (!data?.content || data.error) throw new OrvelisError(data?.error || 'SERVICE_UNAVAILABLE');
    return data;
}
function parseJSON<T>(s: string): T {
    return JSON.parse(s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()) as T;
}
export interface DailyInsight { score: number; status: string; message: string; trend: string }
export interface Recommendation {
    id: string; title: string; type: 'Video' | 'Article' | 'Podcast'; duration?: string; readTime?: string; reason: string; image?: string;
}
export interface VideoAnalysis { essence: string; manipulation: string; realValue: string }
export interface DebateSeed { thesis: string; arguments: { side: 'FOR' | 'AGAINST'; text: string; strength: number }[] }
export interface DeepDiveData { summary: string; keyTerms: { term: string; definition: string }[]; recommendations: Recommendation[] }
export interface ClipAnalysis extends DeepDiveData {
    context: 'video'; learningValue: string; claim: string; evidence: string; missingContext: string;
    reasoning: 'supported_in_clip' | 'needs_context' | 'opinion' | 'no_checkable_claim';
    moments: { seconds: number; kind: 'concept' | 'claim' | 'context'; text: string }[];
    questions: string[]; replyOutline: string[];
    quiz: { question: string; options: string[]; correctIndex: number; explanation: string };
}
export async function generateDailyInsight(): Promise<DailyInsight> {
    return parseJSON((await invokeOrvelis('insight', 'Give a useful reflection about learning. Do not claim access to personal health or focus data.')).content);
}
export async function getRecommendations(): Promise<Recommendation[]> { return []; }
export async function generateVideoAnalysis(): Promise<VideoAnalysis> {
    return parseJSON((await invokeOrvelis('analyze', 'No video was selected. Explain that the viewer should open a clip and use Orvelis there for an actual analysis.')).content);
}
export async function chatWithAI(message: string, history: DeepDiveMessage[]): Promise<string> {
    return (await invokeOrvelis('chat', message, history)).content;
}
export async function generateDebateSeed(contentHint: string): Promise<DebateSeed> {
    return parseJSON((await invokeOrvelis('debate', contentHint)).content);
}

// Per-session deduplication. Only successful, recent analyses are cached; chats stay private.
const cache = new Map<string, { expires: number; value: ClipAnalysis }>();
const inFlight = new Map<string, Promise<ClipAnalysis>>();
export async function getClipAnalysis(videoId: string): Promise<ClipAnalysis> {
    if (!supabase) throw new OrvelisError('SERVICE_UNAVAILABLE');
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new OrvelisError('SIGN_IN_REQUIRED');
    const key = `${data.session.user.id}:${videoId}`;
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    const pending = inFlight.get(key);
    if (pending) return pending;
    const request = (async () => {
        let result: Result | undefined;
        for (let attempt = 0; attempt < 4; attempt++) {
            try { result = await invokeOrvelis('live_analysis', 'Analyze this clip.', [], { videoId }); break; }
            catch (error) {
                if (!(error instanceof OrvelisError) || error.code !== 'ANALYSIS_PENDING' || attempt === 3) throw error;
                await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 3000));
            }
        }
        const analysis = parseJSON<ClipAnalysis>(result!.content);
        if (analysis.context !== 'video' || typeof analysis.summary !== 'string' || !Array.isArray(analysis.moments) || !analysis.quiz) throw new OrvelisError('INCOMPLETE_ANALYSIS');
        if (cache.size >= 50) cache.delete(cache.keys().next().value!);
        cache.set(key, { value: analysis, expires: Date.now() + 300000 });
        return analysis;
    })();
    inFlight.set(key, request);
    try { return await request; } finally { inFlight.delete(key); }
}
export function currentMoment(analysis: ClipAnalysis, seconds: number) {
    return [...analysis.moments].reverse().find(m => m.seconds <= seconds);
}
export async function askAboutClip(videoId: string, message: string, history: DeepDiveMessage[] = [], seconds = 0, action: VideoAction = 'ask'): Promise<Result> {
    return invokeOrvelis('video_chat', message, history, { videoId, seconds: Math.max(0, Math.floor(seconds)), action });
}
export async function generateDeepDive(videoTitle: string, videoDescription = '', videoId?: string): Promise<DeepDiveData> {
    if (videoId) return getClipAnalysis(videoId);
    return parseJSON((await invokeOrvelis('chat', `Explain this title using background knowledge only. No video was supplied. Return JSON with summary, keyTerms (term, definition), recommendations (empty array). Source material: ${JSON.stringify({ videoTitle, videoDescription })}`)).content);
}
export async function chatWithVideo(videoTitle: string, videoDescription: string, message: string, history: DeepDiveMessage[], videoId?: string): Promise<string> {
    if (videoId) return (await askAboutClip(videoId, message, history)).content;
    return (await invokeOrvelis('chat', `Only a title and description are available; do not claim to have seen the clip. Source material: ${JSON.stringify({ videoTitle, videoDescription })}\nQuestion: ${message}`, history)).content;
}
