import { supabase } from '../supabase/client';

// Provider credentials belong exclusively on the server.
const endpoint = process.env.EXPO_PUBLIC_ORVELIS_API_URL || 'https://datariot.xyz/api/orvelis';
export interface DailyInsight { status: string; message: string }
export interface Recommendation { id: string; title: string; reason: string }
export interface VideoAnalysis { essence: string; manipulation: string; realValue: string }
export interface DebateSeed { thesis: string; arguments: { side: 'FOR' | 'AGAINST'; text: string; strength: number }[] }
export interface VideoContext { title: string; description: string; transcript?: string }
export interface DeepDiveData {
    summary: string;
    keyTerms: { term: string; definition: string }[];
    recommendations: Recommendation[];
    contextNotes: string;
    followUpQuestions: string[];
    contextSource: 'title' | 'description' | 'transcript';
}
export interface DeepDiveMessage { role: 'user' | 'assistant'; content: string }
export class OrvelisError extends Error {
    constructor(public code: string) { super(code); this.name = 'OrvelisError'; }
}
export function getAIErrorMessage(error: unknown): string {
    const code = error instanceof OrvelisError ? error.code : '';
    const messages: Record<string, string> = {
        SIGN_IN_REQUIRED: 'Sign in to use Orvelis, then try again.',
        NOT_CONFIGURED: 'Orvelis is not connected yet. Please try again later.',
        RATE_LIMITED: 'You have reached the request limit. Please try again later.',
        TIMEOUT: 'Orvelis took too long to respond. Please try again.',
        REFUSED: 'Orvelis could not answer this request. Try asking it differently.',
        MISSING_CONTEXT: 'Add a description, transcript or question first.',
        INVALID_REQUEST: 'This request is too long or incomplete. Shorten it and try again.',
        REQUEST_TOO_LARGE: 'This request is too long. Shorten the text and try again.',
    };
    return messages[code] || 'Orvelis could not connect. Your question is still here; please try again.';
}
function locale(): string {
    try { return Intl.DateTimeFormat().resolvedOptions().locale; } catch { return 'en'; }
}
async function requestAI<T>(action: string, payload: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
    if (!supabase) throw new OrvelisError('NOT_CONFIGURED');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new OrvelisError('SIGN_IN_REQUIRED');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort);
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 55000);
    try {
        const response = await fetch(endpoint, {
            method: 'POST', signal: controller.signal,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ action, ...payload, locale: locale() }),
        });
        const result = await response.json();
        if (!response.ok) throw new OrvelisError(typeof result.error === 'string' ? result.error : 'UNAVAILABLE');
        if (!result || typeof result.data !== 'object' || !result.data) throw new OrvelisError('INVALID_RESPONSE');
        return result.data as T;
    } catch (error) {
        if (error instanceof OrvelisError) throw error;
        if (controller.signal.aborted) throw new OrvelisError('TIMEOUT');
        throw new OrvelisError('UNAVAILABLE');
    } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
    }
}
const historyTail = (history: { role: string; content: string }[]) => {
    let remaining = 12000;
    const result: { role: string; content: string }[] = [];
    for (const message of history.filter(m => m.role === 'user' || m.role === 'assistant').slice(-12).reverse()) {
        if (!remaining) break;
        const content = message.content.slice(-Math.min(6000, remaining));
        if (content.trim()) result.unshift({ role: message.role, content });
        remaining -= content.length;
    }
    return result;
};
export const generateDailyInsight = () => requestAI<DailyInsight>('insight');
export const generateVideoAnalysis = (content: string) => requestAI<VideoAnalysis>('analyze', { message: content });
export async function chatWithAI(message: string, history: { role: string; content: string }[]): Promise<string> {
    const data = await requestAI<{ answer: string }>('chat', { message, history: historyTail(history) });
    if (typeof data.answer !== 'string' || !data.answer.trim()) throw new OrvelisError('INVALID_RESPONSE');
    return data.answer;
}
export async function generateDebateSeed(contentHint: string): Promise<DebateSeed> {
    const seed = await requestAI<{ thesis: string; arguments: { side: 'FOR' | 'AGAINST'; text: string }[] }>('debate', { message: contentHint });
    // Existing debate UI expects a starting score; zero is no votes, not AI confidence.
    return { ...seed, arguments: seed.arguments.map(argument => ({ ...argument, strength: 0 })) };
}
export const generateDeepDive = (video: VideoContext, signal?: AbortSignal) => requestAI<DeepDiveData>('deepDive', { video }, signal);
export async function chatWithVideo(video: VideoContext, message: string, history: DeepDiveMessage[], signal?: AbortSignal): Promise<string> {
    const data = await requestAI<{ answer: string }>('videoChat', { video, message, history: historyTail(history) }, signal);
    if (typeof data.answer !== 'string' || !data.answer.trim()) throw new OrvelisError('INVALID_RESPONSE');
    return data.answer;
}
