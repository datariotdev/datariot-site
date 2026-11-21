import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Keyboard, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Animated, { cancelAnimation, Easing, interpolate, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { OrvelisMark } from '../../components/UI/OrvelisMark';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { chatWithAI } from '../../lib/ai/client';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
let counter = 0;
const makeId = () => String(Date.now()) + '-' + ++counter;
const ICE = '#7DA5D9';
const STARTERS = [
  { label: 'Analyze a video', icon: 'play-circle', prompt: 'Analyze this video: ' },
  { label: 'Check a claim', icon: 'shield', prompt: 'Fact-check this claim: ' },
  { label: 'Explain an idea', icon: 'layers', prompt: 'Explain this idea: ' },
] as const;

export default function AIScreen() {
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const input = useRef<React.ElementRef<typeof TextInput>>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const compactWelcome = keyboardOpen || height < 650;
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
  const isWelcome = !showHistory && messages.length === 0;
  const list = useRef<FlatList<Message>>(null);
  const busy = useRef(false);
  const arrival = useSharedValue(1);

  useFocusEffect(useCallback(() => {
    arrival.set(0);
    arrival.set(withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(arrival);
  }, [arrival]));

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
    } catch {
      setMessages(prev => [...prev, { id: makeId(), role: 'assistant', content: 'Unable to connect right now. Please try again.' }]);
    } finally {
      busy.current = false;
      setLoading(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [draft, messages, deepThink]);

  const choosePrompt = (prompt: string) => {
    setDraft(prompt);
    input.current?.focus();
  };
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <OrvelisMark size={29} color={ink} coreColor={ICE} />
            <View>
              <Text style={[styles.brandName, { color: ink }]}>orvelis</Text>
              <Text style={[styles.brandCaption, { color: muted }]}>A curious anomaly.</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chat history" accessibilityState={{ disabled: loading, selected: showHistory }} disabled={loading} onPress={() => setShowHistory(v => !v)} style={[styles.roundButton, { backgroundColor: showHistory ? (dark ? '#263447' : '#EDF3FA') : surface, borderColor: border, opacity: loading ? .45 : 1 }]}>
              <Feather name="clock" size={19} color={ink} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="New chat" accessibilityState={{ disabled: loading }} disabled={loading} onPress={newChat} style={[styles.roundButton, { backgroundColor: surface, borderColor: border, opacity: loading ? .45 : 1 }]}>
              <Feather name="edit" size={19} color={ink} />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.body, { paddingBottom: bottomComposerMargin }]}>
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
            <Animated.View style={[styles.welcomeHead, compactWelcome && styles.welcomeHeadCompact, welcomeMotion]}>
              {!compactWelcome && <View accessible={false} style={styles.heroArt}>
                <View style={[styles.heroTrace, { borderColor: dark ? '#354253' : '#E0E6EF' }]} />
                <View style={[styles.heroCoordinate, { backgroundColor: ICE }]} />
                <OrvelisMark size={94} color={ink} coreColor={ICE} pressProgress={arrival} />
              </View>}
              <Text style={[styles.eyebrow, { color: muted }]}>ORVELIS / FOLLOW THE ANOMALY</Text>
              <Text accessibilityRole="header" style={[styles.welcomeTitle, { color: ink, fontSize: width < 360 ? 32 : 38 }]}>A thought got loose.</Text>
              {!keyboardOpen && <Text style={[styles.welcomeSubtitle, { color: muted }]}>Let’s see where it goes.</Text>}
            </Animated.View>
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

          <Animated.View style={[styles.composer, { backgroundColor: surface, borderColor: inputFocused ? ICE : border, shadowOpacity: inputFocused ? 0.14 : 0.06 }, composerMotion]}>
            <TextInput ref={input} accessibilityLabel="Message Orvelis" onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} multiline value={draft} onChangeText={setDraft} placeholder="Ask Orvelis anything..." placeholderTextColor={muted}
              style={[styles.input, { color: ink }]} textAlignVertical="top" />
            <View style={styles.composerActions}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Deep Think" accessibilityState={{ selected: deepThink }} onPress={() => setDeepThink(v => !v)} style={[styles.deepThink, { backgroundColor: deepThink ? (dark ? '#263B55' : '#E7F0FC') : (dark ? '#262B33' : '#F4F6F9') }]}>
                <Feather name="sliders" size={15} color={deepThink ? ICE : ink} />
                <Text style={{ fontSize: 12, color: deepThink ? ICE : ink, fontWeight: '600' }}>Deep Think</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: !draft.trim() || loading }} disabled={!draft.trim() || loading} onPress={() => send()} style={[styles.send, { backgroundColor: draft.trim() ? ICE : (dark ? '#303946' : '#EFF2F6') }]}>
                <Feather name="arrow-up" size={19} color={draft.trim() ? '#FFFFFF' : muted} />
              </TouchableOpacity>
            </View>
          </Animated.View>
          {isWelcome && (
            <View style={styles.welcomeFoot}>
              {!keyboardOpen && (
                <View style={styles.starters}>
                  {STARTERS.map(({ label, icon, prompt }) => (
                    <TouchableOpacity key={label} accessibilityRole="button"
                      onPress={() => choosePrompt(prompt)} style={[styles.starter, { borderColor: border }]}>
                      <Feather name={icon} size={15} color={ink} />
                      <Text style={[styles.starterLabel, { color: ink }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { height: 76, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandName: { fontSize: 23, fontFamily: 'Outfit_500Medium', letterSpacing: -.8 },
  brandCaption: { fontSize: 10, letterSpacing: .2, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 9 },
  roundButton: { width: 41, height: 41, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minHeight: 0 },
  welcomeHead: { flex: 1.35, minHeight: 260, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 27, paddingHorizontal: 16 },
  welcomeHeadCompact: { minHeight: 100, paddingBottom: 16 },
  heroArt: { width: 156, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  heroTrace: { position: 'absolute', width: 134, height: 113, borderWidth: 1, borderRadius: 46, transform: [{ rotate: '23deg' }] },
  heroCoordinate: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, left: 12, bottom: 17 },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 2, marginBottom: 10 },
  welcomeTitle: { textAlign: 'center', fontFamily: 'Outfit_500Medium', letterSpacing: -1.8 },
  welcomeSubtitle: { fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },
  welcomeFoot: { flex: 1 },
  assistantLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  starters: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 13, paddingHorizontal: 14 },
  starter: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12 },
  starterLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
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
