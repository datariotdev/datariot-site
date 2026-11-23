/** @jsxImportSource react */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from '../UI/SafeAreaView';
import { OrvelisMark } from '../UI/OrvelisMark';
import { usePalette } from '../../design-system/palette';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { VIDEO_CATEGORIES } from '../../lib/constants/categories';
import { UploadDetails, UploadReview, stageVideo, uploadAction } from '../../lib/publish/client';

export function VideoPublisher() {
    const router = useRouter();
    const params = useLocalSearchParams<{ videoUri: string; thesis?: string; debateId?: string; side?: string }>();
    const { user } = useAuth();
    const p = usePalette();
    const { width } = useWindowDimensions();
    const wide = Platform.OS === 'web' && width > 940;
    const [title, setTitle] = useState(params.thesis || '');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [sources, setSources] = useState('');
    const [language, setLanguage] = useState('Auto-detect');
    const [rights, setRights] = useState(false);
    const [aiConsent, setAiConsent] = useState(false);
    const [share, setShare] = useState(true);
    const [busy, setBusy] = useState<'upload' | 'review' | 'publish' | null>(null);
    const [review, setReview] = useState<UploadReview | null>(null);
    const [reviewedDetails, setReviewedDetails] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [duration, setDuration] = useState(0);
    const [previewError, setPreviewError] = useState(false);
    const staged = useRef<string | null>(null);
    const inFlight = useRef(false);
    const mounted = useRef(true);
    const draftKey = `datariot:publish-details:${user?.id || 'guest'}`;
    const player = useVideoPlayer(params.videoUri || null, v => { v.loop = false; v.muted = false; });
    useEventListener(player, 'statusChange', ({ status }) => {
        setPreviewError(status === 'error');
        if (status === 'readyToPlay') setDuration(player.duration);
    });
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => { staged.current = null; setReview(null); setReviewedDetails(''); }, [params.videoUri]);
    const tagList = [...new Set(tags.split(/[\s,#]+/).filter(Boolean))];
    const sourceList = sources.split('\n').map(s => s.trim()).filter(Boolean);
    const details: UploadDetails = { title: title.trim(), description: description.trim(), category, tags: tagList,
        sources: sourceList, language, rightsConfirmed: rights, aiConsent, shareToCircle: share,
        ...(params.debateId ? { debateId: params.debateId, side: params.side === 'AGAINST' ? 'AGAINST' : 'FOR' } : {}) };
    const fingerprint = JSON.stringify(details);
    const currentReview = review && reviewedDetails === fingerprint ? review : null;
    const approved = currentReview?.decision === 'approved';
    const fullDuration = duration || review?.duration || 0;
    const time = fullDuration ? `${Math.floor(fullDuration / 60)}:${String(Math.round(fullDuration % 60)).padStart(2, '0')}` : 'Original video';
    const font = { fontFamily: p.fonts.regular, color: p.text };
    const heading = { fontFamily: p.fonts.bold, color: p.text };
    const inputStyle = [s.input, font, { backgroundColor: p.isDark ? p.cardHigh : '#F4F6FA' }];
    const statusTitle = busy === 'upload' ? 'Uploading privately…' : busy === 'review' ? 'Watching your video…' : approved ? 'Ready to publish' :
        currentReview?.decision === 'rejected' ? 'This clip does not fit Datariot' : currentReview?.decision === 'review' ? 'Could not approve this clip' : 'Orvelis content check';

    const validate = () => {
        if (!user) return 'Sign in to publish a video.';
        if (title.trim().length < 5) return 'Give your video a clear title of at least 5 characters.';
        if (!category) return 'Choose a topic so the right viewers can find your clip.';
        if (tagList.length > 8 || tagList.some(t => !/^[\p{L}\p{N}_-]{1,40}$/u.test(t))) return 'Use up to 8 tags, with letters, numbers, underscores or hyphens.';
        if (sourceList.length > 5 || sourceList.some(src => { try { const u = new URL(src); return u.protocol !== 'https:' || !!u.username || !!u.password || src.length > 1000; } catch { return true; } })) return 'Add up to 5 valid https source links, one per line.';
        if (!aiConsent) return 'Allow Google Gemini to process the video and audio for this content check.';
        if (!rights) return 'Confirm that you have permission to share this video.';
        if (duration > 600) return 'Choose a clip up to 10 minutes long.';
        return '';
    };
    const check = async () => {
        if (inFlight.current) return;
        const issue = validate();
        if (issue) { setError(issue); return; }
        inFlight.current = true;
        setError(''); setNotice(''); setReview(null);
        const checkedFingerprint = fingerprint;
        try {
            if (!staged.current) {
                setBusy('upload');
                staged.current = await stageVideo(params.videoUri, user!.id);
            }
            if (!mounted.current) return;
            setBusy('review');
            const result = await uploadAction({ action: 'review', path: staged.current, details });
            if (!mounted.current) return;
            setReview(result); setReviewedDetails(checkedFingerprint);
        } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Please try again.'); }
        finally { inFlight.current = false; if (mounted.current) setBusy(null); }
    };
    const publish = async () => {
        if (inFlight.current || !approved || !currentReview) return;
        const issue = validate();
        if (issue) { setError(issue); return; }
        inFlight.current = true; setBusy('publish'); setError('');
        try {
            const result = await uploadAction({ action: 'publish', reviewId: currentReview.id });
            if (!result.videoId) throw new Error('Publication was not confirmed. Please try again.');
            await AsyncStorage.removeItem(draftKey).catch(() => {});
            player.pause(); router.replace('/profile');
        } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Publication failed.'); }
        finally { inFlight.current = false; if (mounted.current) setBusy(null); }
    };
    const save = async () => {
        try { await AsyncStorage.setItem(draftKey, JSON.stringify({ title, description, category, tags, sources, language, share })); setNotice('Details saved on this device. Select your original video again to resume later.'); }
        catch { setError('Could not save these details. Please try again.'); }
    };
    const restore = async () => {
        try {
            const raw = await AsyncStorage.getItem(draftKey);
            if (!raw) { setNotice('No saved details yet.'); return; }
            const d = JSON.parse(raw);
            setTitle(typeof d.title === 'string' ? d.title.slice(0, 100) : '');
            setDescription(typeof d.description === 'string' ? d.description.slice(0, 2200) : '');
            setCategory(VIDEO_CATEGORIES.includes(d.category) ? d.category : '');
            setTags(typeof d.tags === 'string' ? d.tags : ''); setSources(typeof d.sources === 'string' ? d.sources : '');
            setLanguage(typeof d.language === 'string' ? d.language : 'Auto-detect'); setShare(d.share !== false);
            setRights(false); setAiConsent(false); setReview(null); setNotice('Saved details restored. Run a fresh check for this video.');
        } catch { setError('Could not restore your saved details.'); }
    };
    return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
            <View style={s.shell}>
                <View style={s.nav}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={!!busy} onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={18} color={p.text} /><Text style={[font, s.small]}>Create studio</Text></Pressable>
                    <Text style={[font, s.eyebrow, { color: p.faint }]}>DATARIOT / PUBLISH</Text>
                </View>
                <View style={s.intro}>
                    <Text accessibilityRole="header" style={[heading, s.title, !wide && { fontSize: 34 }]}>Give curiosity{wide ? '\n' : ' '}something to follow.</Text>
                    <Text style={[font, s.subtitle, { color: p.sub }]}>One good clip can start a better conversation. Make yours worth bringing up later.</Text>
                </View>
                <View style={[s.columns, !wide && { flexDirection: 'column' }]}>
                    <View style={[s.main, { backgroundColor: p.card }]}>
                        <View style={s.sectionTop}><Text style={[heading, s.sectionHeading]}>The story behind your clip</Text><Text style={[font, s.small, { color: p.faint }]}>@{user?.email?.split('@')[0] || 'creator'}</Text></View>
                        <Text style={[heading, s.label]}>Title</Text>
                        <TextInput accessibilityLabel="Video title" editable={!busy} style={[...inputStyle, s.titleInput]} placeholder="What will someone discover?" placeholderTextColor={p.faint} maxLength={100} value={title} onChangeText={setTitle} />
                        <Text style={[font, s.counter, { color: p.faint }]}>{title.length}/100</Text>
                        <Text style={[heading, s.label]}>Add a little context</Text>
                        <TextInput accessibilityLabel="Video description" editable={!busy} style={[...inputStyle, s.description]} multiline placeholder="The idea, the explanation, or the question your clip leaves open…" placeholderTextColor={p.faint} maxLength={2200} value={description} onChangeText={setDescription} />
                        <Text style={[font, s.counter, { color: p.faint }]}>{description.length}/2,200</Text>
                        <Text style={[heading, s.label]}>Find its people</Text>
                        <Text style={[font, s.help, { color: p.sub }]}>Choose the topic your video actually explores.</Text>
                        <View style={s.chips}>{VIDEO_CATEGORIES.filter(c => c !== 'Viral').map(c => <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: category === c }} disabled={!!busy} onPress={() => setCategory(c)} style={[s.chip, { backgroundColor: category === c ? '#D9E4FF' : p.soft }]}><Text style={[font, s.small, category === c && { color: '#152037', fontFamily: p.fonts.semibold }]}>{c}</Text></Pressable>)}</View>
                        <Text style={[heading, s.label]}>Tags <Text style={[font, { color: p.faint }]}>(optional)</Text></Text>
                        <TextInput accessibilityLabel="Video tags" editable={!busy} style={inputStyle} placeholder="#science #howitworks — up to 8 tags" placeholderTextColor={p.faint} maxLength={330} value={tags} onChangeText={setTags} />
                        <Text style={[heading, s.label]}>Sources & further reading <Text style={[font, { color: p.faint }]}>(optional)</Text></Text>
                        <TextInput accessibilityLabel="Source links" editable={!busy} style={[...inputStyle, { minHeight: 78 }]} placeholder="https://…  One source per line" placeholderTextColor={p.faint} multiline maxLength={5000} value={sources} onChangeText={setSources} />
                        <Text style={[font, s.help, { color: p.sub }]}>Give your explanation a foundation. Sources are saved with your video.</Text>
                        <Text style={[heading, s.label]}>Spoken language</Text>
                        <View style={s.chips}>{['Auto-detect', 'English', 'Russian', 'Azerbaijani', 'Other'].map(l => <Pressable key={l} accessibilityRole="button" accessibilityState={{ selected: language === l }} disabled={!!busy} onPress={() => setLanguage(l)} style={[s.chip, { backgroundColor: language === l ? '#D9E4FF' : p.soft }]}><Text style={[font, s.small, language === l && { color: '#152037' }]}>{l}</Text></Pressable>)}</View>
                        {!params.debateId && <View style={[s.setting, { borderColor: p.border }]}><View style={{ flex: 1 }}><Text style={[heading, s.small]}>Start a conversation in Circle</Text><Text style={[font, s.help, { color: p.sub }]}>Also share your clip as a Circle post.</Text></View><Switch accessibilityLabel="Share video to Circle" disabled={!!busy} value={share} onValueChange={setShare} trackColor={{ false: '#CBD2DF', true: '#B4C9F4' }} thumbColor="#FFFFFF" /></View>}
                        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: rights, disabled: !!busy }} disabled={!!busy} onPress={() => setRights(!rights)} style={s.consent}><View style={[s.checkbox, { backgroundColor: rights ? '#D9E4FF' : p.soft }]}>{rights && <Feather name="check" size={15} color="#152037" />}</View><Text style={[font, s.help, { flex: 1, color: p.sub }]}>I created this video or have permission to share it on Datariot.</Text></Pressable>
                        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: aiConsent, disabled: !!busy }} disabled={!!busy} onPress={() => setAiConsent(!aiConsent)} style={s.consent}><View style={[s.checkbox, { backgroundColor: aiConsent ? '#D9E4FF' : p.soft }]}>{aiConsent && <Feather name="check" size={15} color="#152037" />}</View><Text style={[font, s.help, { flex: 1, color: p.sub }]}>I agree to send this video and its audio to Google Gemini for the Orvelis content check.</Text></Pressable>
                        <View style={s.draftRow}><Pressable disabled={!!busy} accessibilityRole="button" onPress={save} style={s.inlineButton}><Feather name="bookmark" size={15} color={p.sub} /><Text style={[font, s.small, { color: p.sub }]}>Save details</Text></Pressable><Pressable disabled={!!busy} accessibilityRole="button" onPress={restore} style={s.inlineButton}><Text style={[font, s.small, { color: p.sub }]}>Restore saved details</Text></Pressable></View>
                    </View>
                    <View style={[s.aside, wide ? { width: 338 } : { width: '100%' }]}>
                        <View style={[s.previewCard, { backgroundColor: p.isDark ? p.card : '#EDF2FA' }]}>
                            <View style={s.previewTop}><Text style={[heading, s.small]}>Your clip</Text><Text style={[font, s.small, { color: p.sub }]}>{time}</Text></View>
                            <View style={[s.preview, { backgroundColor: p.isDark ? '#171C28' : '#E2EAF7' }]}>
                                <VideoView player={player} style={[StyleSheet.absoluteFill, { backgroundColor: p.isDark ? '#171C28' : '#E2EAF7' }]} contentFit="contain" nativeControls />
                                {previewError && <View style={s.previewFallback}><Feather name="video-off" size={24} color={p.sub} /><Text style={[font, s.help, { color: p.sub, textAlign: 'center' }]}>Preview unavailable. Select the original video again.</Text></View>}
                            </View>
                            <Text numberOfLines={2} style={[heading, s.previewTitle]}>{title || 'Your next good idea.'}</Text>
                            <Text style={[font, s.help, { color: p.sub }]}>Full video · Original proportions · Up to 10 min / 140 MB</Text>
                        </View>
                        <LinearGradient colors={p.isDark ? ['#202C43', '#151D2D'] : ['#E2ECFF', '#F2F6FE']} style={s.reviewCard}>
                            <View style={s.reviewHeading}><OrvelisMark size={31} color={p.text} /><View style={{ flex: 1 }}><Text style={[font, s.eyebrow, { color: p.sub }]}>ORVELIS</Text><Text accessibilityLiveRegion="polite" style={[heading, s.sectionHeading]}>{statusTitle}</Text></View>{busy && <ActivityIndicator color={p.text} />}</View>
                            <Text style={[font, s.reviewText, { color: p.sub }]}>{currentReview?.reason || 'Before your clip goes live, Orvelis watches the actual video for useful content and platform fit.'}</Text>
                            {currentReview?.summary && <Text style={[font, s.reviewText, { color: p.sub }]}>{currentReview.summary}</Text>}
                            {!currentReview && <View style={s.criteria}>{['An idea, explanation or useful perspective', 'No sexualized bait, empty dance trends or meme spam', 'Private until the check passes'].map(t => <View key={t} style={s.criterion}><Feather name="check" size={14} color={p.sub} /><Text style={[font, s.help, { flex: 1, color: p.sub }]}>{t}</Text></View>)}</View>}
                            {review && !currentReview && <Text style={[font, s.help, { color: p.sub }]}>Details changed. Run the check again before publishing.</Text>}
                            <Pressable accessibilityRole="button" disabled={!!busy} onPress={check} style={[s.checkButton, { backgroundColor: p.card, opacity: busy ? 0.55 : 1 }]}><Feather name={approved ? 'check-circle' : 'shield'} size={16} color={p.text} /><Text style={[heading, s.small]}>{approved ? 'Check again' : review ? 'Recheck video' : 'Check with Orvelis'}</Text></Pressable>
                            {currentReview && <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => { setTitle(currentReview.suggestedTitle.slice(0, 100)); setDescription(currentReview.suggestedCaption.slice(0, 2200)); setNotice('Orvelis suggestions applied. Check again to review the new details.'); }} style={s.inlineButton}><Feather name="edit-3" size={14} color={p.sub} /><Text style={[font, s.small, { color: p.sub }]}>Use Orvelis title & caption</Text></Pressable>}
                        </LinearGradient>
                        <View style={s.benefit}><Feather name="compass" size={21} color={p.sub} /><View style={{ flex: 1 }}><Text style={[heading, s.small]}>Find your kind of curious.</Text><Text style={[font, s.help, { color: p.sub }]}>Topics help viewers discover your ideas. Circle gives them a place to respond.</Text></View></View>
                    </View>
                </View>
                {!!error && <Text accessibilityRole="alert" style={[font, s.message, { backgroundColor: p.isDark ? '#33232A' : '#FFF0F0', color: p.isDark ? '#FFD0D0' : '#9D3030' }]}>{error}</Text>}
                {!!notice && <Text accessibilityLiveRegion="polite" style={[font, s.message, { backgroundColor: p.soft }]}>{notice}</Text>}
                <View style={[s.footer, { borderColor: p.border }]}><View style={{ flex: 1 }}><Text style={[heading, s.small]}>{approved ? 'A good idea, ready to travel.' : 'A little substance goes a long way.'}</Text><Text style={[font, s.help, { color: p.sub }]}>{approved ? 'Passed the content check. This is not a factual verification.' : 'Complete the details and pass the Orvelis check to publish.'}</Text></View><Pressable accessibilityRole="button" accessibilityState={{ disabled: !approved || !!busy }} disabled={!approved || !!busy} onPress={publish} style={[s.publish, { backgroundColor: '#D9E4FF', opacity: !approved || busy ? 0.45 : 1 }]}>{busy === 'publish' ? <ActivityIndicator color="#152037" /> : <><Text style={[heading, { color: '#152037' }]}>Publish video</Text><Feather name="arrow-up-right" size={18} color="#152037" /></>}</Pressable></View>
            </View>
        </ScrollView>
    </SafeAreaView>;
}
const s = StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }, shell: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
    nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24, gap: 12 }, back: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    eyebrow: { fontSize: 10, letterSpacing: 1.7 }, small: { fontSize: 13 }, intro: { paddingTop: 18, paddingBottom: 34 }, title: { fontSize: 46, lineHeight: 51, letterSpacing: -1.8 }, subtitle: { fontSize: 15, lineHeight: 23, maxWidth: 510, marginTop: 15 },
    columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 }, main: { flex: 1, width: '100%', padding: 28, borderRadius: 24, minWidth: 0 }, aside: { gap: 18 },
    sectionTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }, sectionHeading: { fontSize: 17, lineHeight: 23 },
    label: { fontSize: 13, marginTop: 23, marginBottom: 10 }, input: { borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 21, textAlignVertical: 'top', ...Platform.select({ web: { outlineStyle: 'none' as any } }) }, titleInput: { fontSize: 18, minHeight: 54 }, description: { minHeight: 120 }, counter: { fontSize: 10, alignSelf: 'flex-end', marginTop: 6 },
    help: { fontSize: 12, lineHeight: 19 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }, chip: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
    setting: { marginTop: 27, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 20 }, consent: { flexDirection: 'row', gap: 11, marginTop: 22, alignItems: 'center' }, checkbox: { width: 23, height: 23, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    draftRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 16 }, inlineButton: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingVertical: 10 },
    previewCard: { borderRadius: 22, padding: 18 }, previewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }, preview: { width: '100%', height: 330, overflow: 'hidden', borderRadius: 12 }, previewFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26, gap: 12 }, previewTitle: { fontSize: 17, marginTop: 16, marginBottom: 5 },
    reviewCard: { borderRadius: 22, padding: 22 }, reviewHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 17 }, reviewText: { fontSize: 13, lineHeight: 21, marginBottom: 12 }, criteria: { gap: 9, marginBottom: 12 }, criterion: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
    checkButton: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 17, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, benefit: { flexDirection: 'row', gap: 12, paddingHorizontal: 10, paddingVertical: 8 },
    message: { borderRadius: 12, padding: 15, fontSize: 13, lineHeight: 21, marginTop: 20 }, footer: { borderTopWidth: 1, marginTop: 28, paddingTop: 24, gap: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }, publish: { flexDirection: 'row', alignItems: 'center', gap: 18, borderRadius: 25, paddingHorizontal: 25, paddingVertical: 16 },
});
