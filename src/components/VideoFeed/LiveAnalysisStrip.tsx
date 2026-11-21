/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrvelisMark } from '../UI/OrvelisMark';
import { ClipAnalysis, currentMoment, getClipAnalysis, orvelisErrorMessage } from '../../lib/ai/client';
import { useOrvelisLive } from '../../lib/ai/liveSettings';

export function LiveAnalysisStrip({ videoId, active, seconds = 0, onOpen, compact = false }: {
    videoId: string; active: boolean; seconds?: number; onOpen: () => void; compact?: boolean;
}) {
    const { enabled, toggle } = useOrvelisLive();
    const [analysis, setAnalysis] = useState<ClipAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { setAnalysis(null); setError(''); }, [videoId]);
    useEffect(() => {
        if (!active || !enabled) { setLoading(false); return; }
        let cancelled = false;
        const timer = setTimeout(() => {
            setLoading(true); setError('');
            getClipAnalysis(videoId)
                .then(value => { if (!cancelled) setAnalysis(value); })
                .catch(e => { if (!cancelled) setError(orvelisErrorMessage(e)); })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 1800);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [videoId, active, enabled]);
    const moment = analysis && currentMoment(analysis, seconds);
    const message = !enabled ? 'Live notes are paused.' : error || (loading ? 'Watching the clip and finding the key ideas…'
        : analysis ? moment?.text || analysis.summary : 'Understand the idea. Question the claim.');
    return (
        <View style={[styles.card, compact && styles.compact]}>
            <View style={styles.header}>
                <OrvelisMark size={18} color="#5278AD" />
                <Text style={styles.brand}>Orvelis</Text>
                <Text style={styles.status}>{analysis && enabled ? moment ? `${Math.floor(moment.seconds / 60)}:${String(moment.seconds % 60).padStart(2, '0')} · ${moment.kind}` : 'VIDEO NOTES' : 'LIVE NOTES'}</Text>
                <Pressable onPress={toggle} accessibilityRole="switch" accessibilityState={{ checked: enabled }}
                    accessibilityLabel="Automatic Orvelis video analysis" hitSlop={8} style={styles.toggle}>
                    <Ionicons name={enabled ? 'radio-button-on' : 'radio-button-off'} color="#5278AD" size={18} />
                </Pressable>
            </View>
            <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel="Open Orvelis video analysis" style={styles.content}>
                {loading && <ActivityIndicator size="small" color="#5278AD" />}
                <Text style={styles.message} numberOfLines={compact ? 2 : 3}>{message}</Text>
                <Ionicons name="arrow-forward" size={17} color="#5278AD" />
            </Pressable>
            {!compact && <View style={styles.actions}>
                <Text style={styles.hint}>{analysis ? 'AI interpretation · check sources for factual claims' : 'Explanations, sources and questions about this clip'}</Text>
                <Pressable accessibilityRole="button" onPress={onOpen}><Text style={styles.open}>Explore</Text></Pressable>
            </View>}
        </View>
    );
}
const styles = StyleSheet.create({
    card: { borderRadius: 16, backgroundColor: '#F1F5FC', borderWidth: 1, borderColor: '#DAE4F3', padding: 14, gap: 9 },
    compact: { padding: 11, borderRadius: 12 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brand: { color: '#29486F', fontSize: 12, fontWeight: '700' },
    status: { color: '#607796', fontSize: 9, letterSpacing: 0.8, flex: 1 }, toggle: { padding: 4 },
    content: { flexDirection: 'row', alignItems: 'center', gap: 8 }, message: { flex: 1, color: '#34475F', fontSize: 12, lineHeight: 18 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, hint: { color: '#667B97', fontSize: 9, flex: 1 },
    open: { color: '#426B9F', fontSize: 11, fontWeight: '700', padding: 4 },
});
