import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { chatWithAI } from '../../lib/ai/client';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
let counter = 0;
const makeId = () => String(Date.now()) + '-' + ++counter;
const ICE = '#7DA5D9';

export default function AIScreen() {
  const { theme, mode } = useTheme();
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
  const list = useRef<FlatList<Message>>(null);
  const busy = useRef(false);

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

  const suggestions = ['Analyze a video', 'Check a claim', 'Explain an idea'];
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: dark ? '#253448' : '#EAF1FA' }]}>
              <MaterialCommunityIcons name="brain" size={23} color={ICE} />
            </View>
            <View>
              <Text style={[styles.brandName, { color: ink }]}>orvelis</Text>
              <Text style={[styles.brandSub, { color: muted }]}>by Datariot</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity accessibilityLabel="Chat history" onPress={() => setShowHistory(v => !v)} style={[styles.roundButton, { backgroundColor: surface, borderColor: border }]}>
              <Feather name="clock" size={19} color={ink} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="New chat" onPress={newChat} style={[styles.roundButton, { backgroundColor: surface, borderColor: border }]}>
              <Feather name="edit" size={19} color={ink} />
            </TouchableOpacity>
          </View>
        </View>

        {showHistory ? (
          <FlatList
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
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyCenter}>
              <MaterialCommunityIcons name="brain" size={49} color={dark ? '#6F8FB9' : '#A1A9AE'} />
              <Text style={[styles.emptyTitle, { color: ink }]}>Where should we begin?</Text>
              <Text style={[styles.emptySubtitle, { color: muted }]}>Ask a question. Challenge an idea. Go deeper.</Text>
            </View>
            <View style={styles.suggestions}>
              <Text style={[styles.sectionTitle, { color: muted }]}>EXPLORE WITH ORVELIS</Text>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={s} onPress={() => setDraft(s === 'Analyze a video' ? 'Analyze this video: ' : s === 'Check a claim' ? 'Fact-check this claim: ' : 'Explain this idea: ')} style={[styles.suggestionRow, { borderBottomColor: border }]}>
                  <Feather name={(['play-circle', 'shield', 'zap'] as const)[i]} size={18} color={ICE} />
                  <Text style={{ flex: 1, color: ink, fontSize: 14 }}>{s}</Text>
                  <Feather name="arrow-up-right" size={16} color={muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList ref={list} data={messages} keyExtractor={m => m.id} contentContainerStyle={styles.chatList}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[styles.message, item.role === 'user' ? { alignSelf: 'flex-end', backgroundColor: dark ? '#263447' : '#EDF3FA', borderRadius: 18, padding: 13, maxWidth: '87%' } : { alignSelf: 'stretch' }]}>
                {item.role === 'assistant' && <Text style={{ color: ICE, fontSize: 11, fontWeight: '700', marginBottom: 7 }}>ORVELIS</Text>}
                <Text selectable style={{ color: ink, fontSize: 14, lineHeight: 22 }}>{item.content}</Text>
              </View>
            )}
            ListFooterComponent={loading ? <ActivityIndicator color={ICE} style={{ alignSelf: 'flex-start', margin: 20 }} /> : null}
          />
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.composer, { backgroundColor: surface, borderColor: border }]}>
            <TextInput multiline value={draft} onChangeText={setDraft} placeholder="Ask Orvelis anything..." placeholderTextColor={muted}
              style={[styles.input, { color: ink }]} textAlignVertical="top" />
            <View style={styles.composerActions}>
              <TouchableOpacity onPress={() => setDeepThink(v => !v)} style={[styles.deepThink, { backgroundColor: deepThink ? (dark ? '#263B55' : '#E7F0FC') : (dark ? '#262B33' : '#F4F6F9') }]}>
                <Feather name="sliders" size={15} color={deepThink ? ICE : ink} />
                <Text style={{ fontSize: 12, color: deepThink ? ICE : ink, fontWeight: '600' }}>Deep Think</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!draft.trim() || loading} onPress={() => send()} style={[styles.send, { backgroundColor: draft.trim() ? ICE : (dark ? '#303946' : '#EFF2F6') }]}>
                <Feather name="arrow-up" size={19} color={draft.trim() ? '#FFFFFF' : muted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { height: 76, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandIcon: { width: 43, height: 43, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  brandName: { fontSize: 23, fontWeight: '700', letterSpacing: -1 },
  brandSub: { fontSize: 11, marginTop: -2 },
  actions: { flexDirection: 'row', gap: 9 },
  roundButton: { width: 41, height: 41, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 25 },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
  emptyTitle: { fontSize: 21, fontWeight: '650', marginTop: 22, letterSpacing: -0.6, textAlign: 'center' },
  emptySubtitle: { fontSize: 12, textAlign: 'center', marginTop: 9, lineHeight: 18 },
  suggestions: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 11 },
  suggestionRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1 },
  historyRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1 },
  chatList: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 14 },
  message: { marginBottom: 6 },
  composer: { borderWidth: 1, borderRadius: 23, marginHorizontal: 14, marginBottom: 10, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 11, minHeight: 113 },
  input: { minHeight: 42, maxHeight: 130, fontSize: 15, padding: 0 },
  composerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  deepThink: { height: 32, borderRadius: 18, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  send: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }
});
