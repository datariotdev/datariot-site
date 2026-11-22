import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Keyboard, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { cancelAnimation, Easing, interpolate, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { OrvelisGuide, OrvelisWelcome } from '../../components/AI/OrvelisWelcome';
import { OrvelisMark } from '../../components/UI/OrvelisMark';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { chatWithAI, orvelisErrorMessage } from '../../lib/ai/client';
import { FEATURED_PROMPT } from '../../lib/ai/featuredPrompt';

type Message = { id: string; role: 'user' | 'assistant'; content: string; error?: boolean };
let counter = 0;
const makeId = () => String(Date.now()) + '-' + ++counter;
const ICE = '#7DA5D9';
const FOLLOW_UPS = [
  { label: 'Make it simpler', prompt: 'Explain your last answer more simply, without losing the important details.' },
  { label: 'Give me an example', prompt: 'Give me a concrete, everyday example of the idea in your last answer.' },
  { label: 'Quiz me', prompt: 'Check my understanding of what we just discussed. Ask one question at a time and wait for my answer before explaining.' },
] as const;

export default function AIScreen() {
  const router = useRouter();
  const { starter } = useLocalSearchParams<{ starter?: string }>();
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const input = useRef<React.ElementRef<typeof TextInput>>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const dark = mode === 'dark';
  const bg = dark ? '#101318' : '#FAFBFD';
  const ink = dark ? '#F2F5FA' : '#17202B';
  const muted = dark ? '#9AA6B6' : '#89939F';
  const surface = dark ? '#1B212B' : '#FFFFFF';
  const border = dark ? '#303A49' : '#EDF0F4';
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [history, setHistory] = useState<Message[][]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const welcomeScroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const isWelcome = !showHistory && messages.length === 0;
  const list = useRef<FlatList<Message>>(null);
  const busy = useRef(false);
  const arrival = useSharedValue(1);

  useFocusEffect(useCallback(() => {
    arrival.set(0);
    arrival.set(withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(arrival);
  }, [arrival]));

  useFocusEffect(useCallback(() => {
    if (starter !== FEATURED_PROMPT.id) return;
    setDraft(FEATURED_PROMPT.question);
    setShowHistory(false);
    router.setParams({ starter: undefined });
    input.current?.focus();
  }, [router, starter]));

  const welcomeMotion = useAnimatedStyle(() => ({
    opacity: interpolate(arrival.value, [0, .45, 1], [0, 1, 1]),
    transform: [{ translateY: interpolate(arrival.value, [0, 1], [18, 0]) }],
  }));
  const composerMotion = useAnimatedStyle(() => ({
    opacity: interpolate(arrival.value, [0, .2, 1], [.4, .65, 1]),
    transform: [{ translateY: interpolate(arrival.value, [0, 1], [24, 0]) }],
  }));

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomTabHeight = 52 + Math.max(insets.bottom, 8);
  const bottomComposerMargin = Platform.OS === 'web' && width > 768 ? 24 : keyboardOpen ? 8 : bottomTabHeight + 8;

  const newChat = useCallback(() => {
    if (messages.length) setHistory(prev => [messages, ...prev]);
    setMessages([]);
    setDraft('');
    setShowHistory(false);
  }, [messages]);

  const send = useCallback(async (suggestion?: string) => {
    const question = (suggestion ?? draft).trim();
    if (!question || busy.current) return;
    busy.current = true;
    setDraft('');
    const previous = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { id: makeId(), role: 'user', content: question }]);
    setLoading(true);
    try {
      const answer = await chatWithAI(deepThink ? 'Think carefully and examine the reasoning. ' + question : question, previous);
      setMessages(prev => [...prev, { id: makeId(), role: 'assistant', content: answer }]);
    } catch (error) {
      setDraft(question);
      setMessages(prev => [...prev, { id: makeId(), role: 'assistant', content: orvelisErrorMessage(error), error: true }]);
    } finally {
      busy.current = false;
      setLoading(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [draft, messages, deepThink]);

  const choosePrompt = (prompt: string) => {
    setDraft(prompt);
    input.current?.focus();
    welcomeScroll.current?.scrollTo({ y: 0, animated: true });
  };
  const composer = (
    <Animated.View style={[styles.composer, { backgroundColor: surface, borderColor: inputFocused ? ICE : border, shadowOpacity: inputFocused ? 0.14 : 0.06, marginHorizontal: isWelcome ? 0 : 18 }, composerMotion]}>
      <TextInput ref={input} accessibilityLabel="Message Orvelis" onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} multiline value={draft} onChangeText={setDraft} placeholder="What made you curious?" placeholderTextColor={muted}
        style={[styles.input, { color: ink }]} textAlignVertical="top" />
      <View style={styles.composerActions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Deep Think" accessibilityHint="Ask Orvelis to examine reasoning and trade-offs more carefully" accessibilityState={{ selected: deepThink }} onPress={() => setDeepThink(v => !v)} style={[styles.deepThink, { backgroundColor: deepThink ? (dark ? '#263B55' : '#E7F0FC') : (dark ? '#262B33' : '#F4F6F9') }]}>
          <Feather name="sliders" size={15} color={deepThink ? ICE : ink} />
          <Text style={{ fontSize: 12, color: deepThink ? ICE : ink, fontWeight: '600' }}>Deep Think</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: !draft.trim() || loading }} disabled={!draft.trim() || loading} onPress={() => send()} style={[styles.send, { backgroundColor: draft.trim() ? ICE : (dark ? '#303946' : '#EFF2F6') }]}>
          <Feather name="arrow-up" size={19} color={draft.trim() ? '#FFFFFF' : muted} />
        </TouchableOpacity>
      </View>
      {deepThink && <Text style={[styles.composerHint, { color: muted }]}>A closer look at the reasoning and trade-offs.</Text>}
    </Animated.View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <OrvelisMark size={29} color={ink} coreColor={ICE} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.brandName, { color: ink }]}>orvelis</Text>
              <Text numberOfLines={1} style={[styles.brandCaption, { color: muted }]}>Ideas, with a little more context.</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="How to use Orvelis" onPress={() => setShowGuide(true)} style={[styles.roundButton, { backgroundColor: surface, borderColor: border }]}>
              <Feather name="book-open" size={18} color={ink} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chat history" accessibilityState={{ disabled: loading, selected: showHistory }} disabled={loading} onPress={() => setShowHistory(v => !v)} style={[styles.roundButton, { backgroundColor: showHistory ? (dark ? '#263447' : '#EDF3FA') : surface, borderColor: border, opacity: loading ? .45 : 1 }]}>
              <Feather name="clock" size={19} color={ink} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="New chat" accessibilityState={{ disabled: loading }} disabled={loading} onPress={newChat} style={[styles.roundButton, { backgroundColor: surface, borderColor: border, opacity: loading ? .45 : 1 }]}>
              <Feather name="edit" size={19} color={ink} />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.body, { paddingBottom: isWelcome ? 0 : bottomComposerMargin }]}>
          {showHistory ? (
            <FlatList
              style={styles.body}
              data={history}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20 }}
              ListHeaderComponent={<Text style={[styles.sectionTitle, { color: muted }]}>RECENT CONVERSATIONS</Text>}
              ListEmptyComponent={<Text style={{ color: muted, marginTop: 24 }}>Your conversations will appear here.</Text>}
              renderItem={({ item, index }) => (
                <TouchableOpacity style={[styles.historyRow, { borderBottomColor: border }]} onPress={() => { if (messages.length) setHistory(prev => [messages, ...prev.filter((_, i) => i !== index)]); else setHistory(prev => prev.filter((_, i) => i !== index)); setMessages(item); setShowHistory(false); }}>
                  <Feather name="message-circle" size={17} color={ICE} />
                  <Text numberOfLines={1} style={{ color: ink, flex: 1, fontSize: 14 }}>{item.find(m => m.role === 'user')?.content ?? 'Conversation'}</Text>
                  <Feather name="chevron-right" size={16} color={muted} />
                </TouchableOpacity>
              )}
            />
          ) : isWelcome ? (
            <ScrollView ref={welcomeScroll} style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
              contentContainerStyle={[styles.welcomeContent, { paddingBottom: bottomComposerMargin + 18 }]}>
              <Animated.View style={welcomeMotion}>
                <OrvelisWelcome dark={dark} compact={keyboardOpen} composer={composer} arrival={arrival}
                  onChoosePrompt={choosePrompt} onExploreFeed={() => router.push('/')} onShowGuide={() => setShowGuide(true)} />
              </Animated.View>
            </ScrollView>
          ) : (
            <FlatList ref={list} style={styles.body} data={messages} keyExtractor={m => m.id} contentContainerStyle={styles.chatList}
              onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <View style={[styles.message, item.role === 'user' ? { alignSelf: 'flex-end', backgroundColor: dark ? '#263447' : '#EDF3FA', borderRadius: 18, padding: 13, maxWidth: '87%' } : { alignSelf: 'stretch' }]}>
                  {item.role === 'assistant' && <View style={styles.assistantLabel}><OrvelisMark size={18} color={ICE} /><Text style={{ color: muted, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>ORVELIS</Text></View>}
                  <Text selectable style={{ color: ink, fontSize: 14, lineHeight: 22 }}>{item.content}</Text>
                </View>
              )}
              ListFooterComponent={loading ? <View accessibilityRole="progressbar" accessibilityLabel="Orvelis is thinking" style={styles.thinking}><ActivityIndicator size="small" color={ICE} /><Text style={{ color: muted, fontSize: 12 }}>{deepThink ? 'Looking a little deeper…' : 'Thinking it through…'}</Text></View> : undefined}
            />
          )}

          {!isWelcome && !showHistory && <>
            {!loading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.error && <View style={styles.followUps}>
              {FOLLOW_UPS.map(item => <TouchableOpacity key={item.label} accessibilityRole="button" onPress={() => choosePrompt(item.prompt)} style={[styles.followUp, { borderColor: border, backgroundColor: surface }]}>
                <Text style={{ color: ink, fontSize: 11 }}>{item.label}</Text><Feather name="arrow-up-right" size={13} color={ICE} />
              </TouchableOpacity>)}
            </View>}
            {composer}
          </>}
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal visible={showGuide} transparent animationType="fade" onRequestClose={() => setShowGuide(false)}>
        <View style={[styles.guideBackdrop, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close guide" onPress={() => setShowGuide(false)} />
          <View accessibilityViewIsModal style={[styles.guideSheet, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.guideHeader}>
              <Text accessibilityRole="header" style={[styles.guideTitle, { color: ink }]}>A good place to start.</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close guide" onPress={() => setShowGuide(false)} style={styles.roundButton}>
                <Feather name="x" size={22} color={ink} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.guideScroll}><OrvelisGuide dark={dark} /></ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { height: 76, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, marginRight: 12 },
  brandName: { fontSize: 23, fontFamily: 'Outfit_500Medium', letterSpacing: -.8 },
  brandCaption: { fontSize: 10, letterSpacing: .2, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 9, flexShrink: 0 },
  roundButton: { width: 41, height: 41, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minHeight: 0 },
  welcomeContent: { paddingHorizontal: 22, paddingTop: 10 },
  composerHint: { fontSize: 11, lineHeight: 17, marginTop: 10 },
  followUps: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 18, paddingBottom: 10 },
  followUp: { minHeight: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  guideBackdrop: { flex: 1, backgroundColor: 'rgba(15, 25, 40, .28)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  guideSheet: { width: '100%', maxWidth: 520, maxHeight: '90%', borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 14, paddingTop: 14, paddingBottom: 8 },
  guideTitle: { fontFamily: 'Outfit_500Medium', fontSize: 23, letterSpacing: -.6, flexShrink: 1 },
  guideScroll: { paddingHorizontal: 22, paddingBottom: 22 },
  assistantLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  sectionTitle: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 11 },

  historyRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1 },
  chatList: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 14 },
  message: { marginBottom: 6 },
  composer: { shadowColor: ICE, shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, borderWidth: 1, borderRadius: 23, marginHorizontal: 14, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 11, minHeight: 113 },
  input: { minHeight: 42, maxHeight: 130, fontSize: 15, padding: 0 },
  composerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  deepThink: { height: 32, borderRadius: 18, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  send: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }
});
