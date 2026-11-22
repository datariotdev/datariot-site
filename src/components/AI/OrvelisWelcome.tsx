import React, { useState, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { SharedValue } from 'react-native-reanimated';
import { OrvelisMark } from '../UI/OrvelisMark';

const ICE = '#7DA5D9';
const TOOLS = [
  { title: 'Make it make sense', icon: 'layers', hint: 'A clear explanation. A real-world example.',
    example: 'How does an AI actually learn?',
    prompt: 'Explain how an AI learns in simple terms. Use one everyday example, then ask me a question to check my understanding.' },
  { title: 'Question a claim', icon: 'shield', hint: 'Look for evidence and missing context.',
    example: 'Does more data always mean better AI?',
    prompt: 'Examine this claim: “More data always makes an AI better.” Separate facts from assumptions, explain what evidence is needed, and point out the missing context.' },
  { title: 'See another side', icon: 'git-branch', hint: 'Compare arguments without the noise.',
    example: 'Should AI be used in classrooms?',
    prompt: 'Compare the strongest arguments for and against using AI in classrooms. Include the trade-offs and what evidence would change each view.' },
  { title: 'Turn an idea into a clip', icon: 'film', hint: 'Find a hook and shape your video reply.',
    example: 'A 30-second clip about how Bluetooth works',
    prompt: 'Help me outline a 30-second Datariot video explaining how Bluetooth works. Give me a clear hook, three talking points, and a question for viewers. Keep it accurate and easy to follow.' },
] as const;

function palette(dark: boolean) {
  return {
    ink: dark ? '#F2F5FA' : '#17202B', muted: dark ? '#A5B1C2' : '#6B798B',
    surface: dark ? '#1B212B' : '#FFFFFF', border: dark ? '#303D4E' : '#E5EBF3',
    wash: dark ? '#202E40' : '#EDF3FB', accent: dark ? '#AAC8EF' : '#4B709F',
  };
}

/** The same guide is available from inside a conversation. */
export function OrvelisGuide({ dark }: { dark: boolean }) {
  const c = palette(dark);
  const steps = [
    ['Bring a question', 'Type what made you curious, or choose an example to edit.'],
    ['Give it some context', 'Add the claim, your goal, or what you already know. For video analysis, open Orvelis on the clip itself.'],
    ['Keep the thought going', 'Ask for an example, a simpler explanation, or a different perspective. You can also ask it to quiz you.'],
  ];
  return (
    <View style={styles.guideBody}>
      {steps.map(([title, description], index) => (
        <View key={title} style={styles.guideStep}>
          <View style={[styles.stepNumber, { backgroundColor: c.wash }]}><Text style={[styles.stepNumberText, { color: c.accent }]}>{index + 1}</Text></View>
          <View style={styles.stepCopy}>
            <Text style={[styles.stepTitle, { color: c.ink }]}>{title}</Text>
            <Text style={[styles.stepDescription, { color: c.muted }]}>{description}</Text>
          </View>
        </View>
      ))}
      <View style={[styles.thinkTip, { backgroundColor: c.wash }]}>
        <Feather name="sliders" size={16} color={c.accent} />
        <Text style={[styles.tipText, { color: c.muted }]}><Text style={{ color: c.ink, fontWeight: '600' }}>Deep Think</Text> asks Orvelis to examine the reasoning and trade-offs more carefully.</Text>
      </View>
    </View>
  );
}

type Props = {
  dark: boolean; compact: boolean; composer: ReactNode; arrival: SharedValue<number>;
  onChoosePrompt: (prompt: string) => void; onExploreFeed: () => void;
};

/** Examples fill an editable draft. Only Send starts a request. */
export function OrvelisWelcome({ dark, compact, composer, arrival, onChoosePrompt, onExploreFeed }: Props) {
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const c = palette(dark);
  const narrow = width > 0 && width < 560;
  const tiny = width > 0 && width < 350;
  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.container}>
      <View style={[styles.hero, narrow && styles.heroNarrow, compact && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <View style={styles.eyebrowRow}><View style={styles.eyebrowDot} /><Text style={[styles.eyebrow, { color: c.accent }]}>A LITTLE CURIOSITY GOES A LONG WAY</Text></View>
          <Text accessibilityRole="header" style={[styles.title, { color: c.ink }, narrow && styles.titleNarrow, compact && styles.titleCompact]}>Make sense of{compact ? ' ' : '\n'}what you watch.</Text>
          {!compact && <Text style={[styles.subtitle, { color: c.muted }]}>Your AI companion for the ideas you find on Datariot. Unpack a topic, question a claim, or shape your next clip.</Text>}
        </View>
        {!compact && !tiny && (
          <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[styles.heroArt, narrow && styles.heroArtNarrow]}>
            <View style={[styles.artWash, { backgroundColor: c.wash }]} />
            <View style={[styles.orbit, { borderColor: dark ? '#43556D' : '#D6E2F2' }]} />
            <View style={[styles.orbitOuter, { borderColor: dark ? '#2D3C50' : '#E5ECF6' }]} />
            <View style={styles.orbitNode} />
            <OrvelisMark size={narrow ? 54 : 83} color={c.ink} coreColor={ICE} pressProgress={arrival} />
          </View>
        )}
      </View>
      {composer}
      {!compact && <>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: c.ink }]}>Follow a thought</Text>
          <Text style={[styles.sectionCaption, { color: c.muted }]}>Pick one. Make it yours.</Text>
        </View>
        <View style={styles.tools}>
          {TOOLS.map(tool => (
            <Pressable key={tool.title} accessibilityRole="button" accessibilityLabel={tool.title + '. Try: ' + tool.example}
              accessibilityHint="Adds an editable example to your message"
              onHoverIn={() => setHovered(tool.title)} onHoverOut={() => setHovered(null)}
              onPress={() => onChoosePrompt(tool.prompt)}
              style={({ pressed }) => [styles.tool, narrow ? styles.toolNarrow : styles.toolWide, {
                backgroundColor: hovered === tool.title || pressed ? c.wash : c.surface,
                borderColor: hovered === tool.title || pressed ? ICE : c.border,
                transform: [{ translateY: hovered === tool.title ? -2 : 0 }],
              }]}>
              <View style={styles.toolTop}><Feather name={tool.icon} size={19} color={c.accent} /><Feather name="arrow-up-right" size={15} color={c.muted} /></View>
              <Text style={[styles.toolTitle, { color: c.ink }]}>{tool.title}</Text>
              <Text style={[styles.toolHint, { color: c.muted }]}>{tool.hint}</Text>
              <Text style={[styles.toolExample, { color: c.accent }]}>{tool.example}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.clipCard, { backgroundColor: c.wash }, narrow && styles.clipCardNarrow]}>
          <View style={styles.clipCopy}>
            <View style={styles.clipHeading}><OrvelisMark size={22} color={c.accent} coreColor={ICE} /><Text style={[styles.clipTitle, { color: c.ink }]}>Start with the clip itself</Text></View>
            <Text style={[styles.clipDescription, { color: c.muted }]}>Tap the Orvelis icon beside the three dots on a video for key ideas, missing context, and follow-up questions.</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onExploreFeed} style={({ pressed }) => [styles.feedButton, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? .65 : 1 }]}>
            <Text style={[styles.feedButtonText, { color: c.ink }]}>Find a clip</Text><Feather name="arrow-right" size={16} color={c.accent} />
          </Pressable>
        </View>
        <View style={[styles.guide, { borderColor: c.border }]}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: guideOpen }} onPress={() => setGuideOpen(value => !value)} style={({ pressed }) => [styles.guideToggle, { opacity: pressed ? .65 : 1 }]}>
            <View style={styles.guideHeading}><Feather name="book-open" size={18} color={c.accent} /><Text style={[styles.guideTitle, { color: c.ink }]}>Your 30-second guide</Text></View>
            <Feather name={guideOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
          </Pressable>
          {guideOpen && <OrvelisGuide dark={dark} />}
        </View>
        <Text style={[styles.footer, { color: c.muted }]}>One good question can take you somewhere new.</Text>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  hero: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 28, gap: 18 },
  heroNarrow: { paddingTop: 14, paddingBottom: 23, gap: 6 }, heroCompact: { paddingTop: 4, paddingBottom: 16 },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 13 },
  eyebrowDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ICE },
  eyebrow: { fontSize: 9, lineHeight: 14, fontFamily: 'Inter_500Medium', letterSpacing: 1.3, flexShrink: 1 },
  title: { fontSize: 45, lineHeight: 48, fontFamily: 'Outfit_500Medium', letterSpacing: -1.7 },
  titleNarrow: { fontSize: 34, lineHeight: 37, letterSpacing: -1.2 }, titleCompact: { fontSize: 25, lineHeight: 29, letterSpacing: -.7 },
  subtitle: { fontSize: 13, lineHeight: 21, maxWidth: 440, marginTop: 14 },
  heroArt: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  heroArtNarrow: { width: 74, height: 110, marginRight: 0 },
  artWash: { position: 'absolute', width: '88%', height: '88%', borderRadius: 80, opacity: .65 },
  orbit: { position: 'absolute', width: '89%', height: '71%', borderRadius: 54, borderWidth: 1, transform: [{ rotate: '28deg' }] },
  orbitOuter: { position: 'absolute', width: '100%', height: '90%', borderRadius: 62, borderWidth: 1, transform: [{ rotate: '-22deg' }] },
  orbitNode: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: ICE, right: 6, top: 30 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 27, marginBottom: 13 },
  sectionTitle: { fontFamily: 'Outfit_500Medium', fontSize: 20, letterSpacing: -.4 }, sectionCaption: { fontSize: 11 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tool: { borderRadius: 19, borderWidth: 1, padding: 18, minHeight: 159 },
  toolWide: { flexGrow: 1, flexBasis: '46%' }, toolNarrow: { width: '100%', minHeight: 140 },
  toolTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  toolTitle: { fontFamily: 'Outfit_500Medium', fontSize: 17, letterSpacing: -.3, marginBottom: 4 },
  toolHint: { fontSize: 12, lineHeight: 18 }, toolExample: { fontSize: 12, lineHeight: 18, marginTop: 13 },
  clipCard: { marginTop: 18, padding: 19, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 20 },
  clipCardNarrow: { flexDirection: 'column', alignItems: 'stretch', gap: 14 }, clipCopy: { flex: 1 },
  clipHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  clipTitle: { fontFamily: 'Outfit_500Medium', fontSize: 17, flexShrink: 1 }, clipDescription: { fontSize: 12, lineHeight: 19 },
  feedButton: { minHeight: 42, borderRadius: 22, paddingHorizontal: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  feedButtonText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  guide: { marginTop: 20, borderTopWidth: 1, paddingTop: 5 },
  guideToggle: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  guideHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }, guideTitle: { fontFamily: 'Outfit_500Medium', fontSize: 17, flexShrink: 1 },
  guideBody: { gap: 18, paddingTop: 5, paddingBottom: 12 }, guideStep: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' }, stepCopy: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 20 }, stepDescription: { fontSize: 12, lineHeight: 19 },
  thinkTip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginTop: 1 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 19 },
  footer: { fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: 18 },
});
