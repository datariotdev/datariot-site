/** @jsxImportSource react */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePalette } from '../../design-system/palette';

interface CreateStudioProps {
    onVideo: () => void;
    onThesis: () => void;
    busy?: boolean;
    bottomInset?: number;
    signedIn?: boolean;
}

export function CreateStudio({ onVideo, onThesis, busy = false, bottomInset = 0, signedIn = true }: CreateStudioProps) {
    const p = usePalette();
    const { width } = useWindowDimensions();
    const background = p.isDark ? '#08090D' : '#F7F8FA';
    const ink = p.isDark ? '#F3F4F7' : '#111318';
    const muted = p.isDark ? '#9298A4' : '#737984';
    return <ScrollView style={{ flex: 1, backgroundColor: background }} showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: 100 + bottomInset }]}>
        <View style={s.content}>
            <View style={s.masthead}>
                <View style={[s.brandDot, { backgroundColor: ink }]} />
                <Text style={[s.wordmark, { color: ink, fontFamily: p.fonts.semibold }]}>datariot<Text style={{ color: muted, fontFamily: p.fonts.regular }}> / studio</Text></Text>
            </View>
            <View style={s.hero}>
                <Text style={[s.title, { color: ink, fontFamily: p.fonts.semibold, fontSize: width < 360 ? 38 : 43, lineHeight: width < 360 ? 41 : 46 }]}>What’s on{`\n`}your mind?</Text>
                <Text style={[s.subtitle, { color: muted, fontFamily: p.fonts.regular }]}>A short video. A bold idea.{`\n`}Make it a conversation.</Text>
            </View>

            <Pressable onPress={onVideo} disabled={busy} accessibilityRole="button" accessibilityLabel="Upload a video"
                accessibilityState={{ disabled: busy, busy }}
                style={({ pressed }) => [s.videoCard, { opacity: pressed || busy ? 0.88 : 1, transform: [{ scale: pressed ? 0.986 : 1 }] }]}>
                <LinearGradient colors={['#1A2233', '#10131B', '#0D1016']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={s.cardTop}>
                    <Text style={[s.eyebrow, { fontFamily: p.fonts.medium, color: '#A9B3C7' }]}>01 / VIDEO</Text>
                    <Feather name="arrow-up-right" size={20} color="#D9E4FF" />
                </View>
                <View style={[s.frameArt, width < 360 && { top: 14, right: 12, transform: [{ scale: 0.6 }] }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <View style={[s.frame, s.backFrame]} />
                    <View style={[s.frame, s.frontFrame]}>
                        <View style={s.playDisc}><Ionicons name="play" color="#111826" size={23} style={{ marginLeft: 3 }} /></View>
                    </View>
                    <View style={s.artDot} />
                </View>
                <View style={s.videoText}>
                    <Text style={[s.videoTitle, { fontFamily: p.fonts.semibold, maxWidth: width < 360 ? '100%' : '68%' }]}>Give your idea{`\n`}some motion.</Text>
                    <View style={s.videoAction}>
                        {busy ? <ActivityIndicator size="small" color="#D9E4FF" /> : <Feather name="upload" size={15} color="#D9E4FF" />}
                        <Text style={[s.videoHint, { fontFamily: p.fonts.medium }]}>{busy ? 'Opening your videos…' : 'Choose a video'}</Text>
                    </View>
                </View>
            </Pressable>

            <Pressable onPress={onThesis} accessibilityRole="button" accessibilityLabel="Propose a thesis"
                style={({ pressed }) => [s.thesisCard, { backgroundColor: p.isDark ? '#12151C' : '#FFFFFF', borderColor: p.isDark ? '#252A34' : '#E7E9EE', opacity: pressed ? 0.7 : 1 }]}>
                <View style={[s.thesisIcon, { backgroundColor: p.isDark ? '#1D2330' : '#EFF2F7' }]}><Ionicons name="chatbubbles-outline" size={24} color={ink} /></View>
                <View style={{ flex: 1 }}>
                    <Text style={[s.eyebrow, { color: muted, fontFamily: p.fonts.medium, marginBottom: 5 }]}>02 / THESIS</Text>
                    <Text style={[s.thesisTitle, { color: ink, fontFamily: p.fonts.semibold }]}>Start a debate</Text>
                    <Text style={[s.thesisHint, { color: muted, fontFamily: p.fonts.regular }]}>Put one idea to the test.</Text>
                </View>
                <Feather name="arrow-up-right" size={20} color={ink} />
            </Pressable>
            <View style={s.note}>
                <View style={[s.noteLine, { backgroundColor: p.isDark ? '#303642' : '#D8DDE5' }]} />
                <Text style={[s.noteText, { color: muted, fontFamily: p.fonts.regular }]}>{signedIn ? 'Good ideas start small.' : 'Sign in when you’re ready to share.'}</Text>
            </View>
        </View>
    </ScrollView>;
}

const s = StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 20 },
    content: { width: '100%', maxWidth: 540, alignSelf: 'center' },
    masthead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    brandDot: { width: 6, height: 6, borderRadius: 3 },
    wordmark: { fontSize: 16, letterSpacing: -0.4 },
    hero: { marginTop: 29, marginBottom: 28 },
    title: { letterSpacing: -1.8 },
    subtitle: { fontSize: 15, lineHeight: 22, marginTop: 13 },
    videoCard: { height: 238, borderRadius: 22, padding: 22, overflow: 'hidden', backgroundColor: '#10131B' },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    eyebrow: { fontSize: 9, letterSpacing: 1.5 },
    frameArt: { position: 'absolute', right: 24, top: 70, width: 116, height: 130 },
    frame: { position: 'absolute', width: 82, height: 106, borderRadius: 15, borderWidth: 1 },
    backFrame: { right: -1, top: 0, transform: [{ rotate: '12deg' }], borderColor: '#3A4B67', backgroundColor: '#1D2A40' },
    frontFrame: { left: 4, top: 12, transform: [{ rotate: '-8deg' }], borderColor: '#627591', backgroundColor: '#283A55', alignItems: 'center', justifyContent: 'center' },
    playDisc: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#D9E4FF', alignItems: 'center', justifyContent: 'center' },
    artDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#8AA9D6', right: -4, bottom: 1 },
    videoText: { marginTop: 'auto' },
    videoTitle: { color: '#F6F8FC', fontSize: 26, lineHeight: 29, letterSpacing: -0.7, maxWidth: '68%' },
    videoAction: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 21, minHeight: 20 },
    videoHint: { color: '#D9E4FF', fontSize: 13 },
    thesisCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 22, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, marginTop: 14 },
    thesisIcon: { width: 46, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    thesisTitle: { fontSize: 20, letterSpacing: -0.5 },
    thesisHint: { fontSize: 13, marginTop: 4 },
    note: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
    noteLine: { width: 18, height: 1 },
    noteText: { fontSize: 12 },
});
