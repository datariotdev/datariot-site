/** @jsxImportSource react */
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { usePalette } from '../design-system/palette';

const CATEGORIES = [
    { id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' },
    { id: 'cafe', label: 'Cafe', icon: 'cafe-outline' },
    { id: 'beauty', label: 'Beauty', icon: 'sparkles-outline' },
    { id: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
    { id: 'shop', label: 'Shop', icon: 'bag-handle-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

const AUDIENCES = [
    { id: 'local', label: 'Local', description: 'Nearby viewers', price: 'Free' },
    { id: 'city', label: 'City', description: 'Viewers across your city', price: '$15 / week' },
    { id: 'national', label: 'National', description: 'Viewers across the country', price: '$75 / week' },
] as const;

type Field = 'name' | 'offer' | 'link';
const FIELDS = [
    { key: 'name', label: 'Business name', placeholder: 'Bloom Cafe' },
    { key: 'offer', label: 'Offer or tagline', placeholder: 'Fresh pastries every morning' },
    { key: 'link', label: 'Website, menu or social link', placeholder: 'https://example.com' },
] as const;

const EMPTY_DRAFT = { name: '', offer: '', link: '' };

export default function BusinessScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const wide = Platform.OS === 'web' && width >= 1000;
    const p = usePalette();
    const ice = p.isDark ? '#21334B' : '#EAF2FE';
    const iceLine = p.isDark ? '#516E95' : '#B1C8E7';
    const accent = p.isDark ? '#D9E4FF' : '#355983';
    const action = p.isDark ? '#D9E4FF' : '#172842';
    const actionText = p.isDark ? '#172842' : '#FFFFFF';
    const errorColor = p.isDark ? '#FFA2A9' : '#A52D3B';

    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(CATEGORIES[0]);
    const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>(AUDIENCES[0]);
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [reviewed, setReviewed] = useState(false);
    const [error, setError] = useState<{ field: 'name' | 'link'; message: string } | null>(null);
    const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
    const name = useRef<React.ComponentRef<typeof TextInput>>(null);
    const link = useRef<React.ComponentRef<typeof TextInput>>(null);
    const columnsTop = useRef(0);
    const previewTop = useRef(0);

    const updateDraft = (field: Field, value: string) => {
        setDraft(current => ({ ...current, [field]: value }));
        setReviewed(false);
        if (error?.field === field) setError(null);
    };

    const review = () => {
        if (!draft.name.trim()) {
            setError({ field: 'name', message: 'Enter your business name.' });
            name.current?.focus();
            return;
        }
        const url = draft.link.trim();
        if (url) {
            try {
                const { protocol } = new URL(url);
                if (protocol !== 'https:' && protocol !== 'http:') throw new Error('Unsupported protocol');
            } catch {
                setError({ field: 'link', message: 'Enter a link starting with https:// or http://.' });
                link.current?.focus();
                return;
            }
        }
        setError(null);
        setReviewed(true);
        if (!wide) scroll.current?.scrollTo({ y: Math.max(0, columnsTop.current + previewTop.current - 18), animated: true });
    };

    const panel = { backgroundColor: p.card, borderColor: p.border };
    const reviewButton = (
        <Pressable accessibilityRole="button" onPress={review}
            style={({ pressed }) => [styles.review, { backgroundColor: action, opacity: pressed ? 0.78 : 1 }]}>
            <Text style={[styles.label, { color: actionText }]}>Review draft</Text>
            <Feather name="arrow-right" size={17} color={actionText} />
        </Pressable>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={[styles.screen, { backgroundColor: p.bg }]} edges={['top', 'bottom']}>
                <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView ref={scroll} style={styles.screen} contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <View style={[styles.page, wide && styles.widePage]}>
                            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                                style={({ pressed }) => [styles.back, { opacity: pressed ? 0.65 : 1 }]}>
                                <Feather name="arrow-left" size={17} color={accent} />
                                <Text style={[styles.label, { color: accent }]}>Back</Text>
                            </Pressable>

                            <View style={styles.intro}>
                                <Text accessibilityRole="header" aria-level={1} style={[styles.title, wide && styles.wideTitle, { color: p.text }]}>
                                    Create a campaign
                                </Text>
                                <Text style={[styles.description, { color: p.sub }]}>Set up your offer and see how it will appear on Datariot.</Text>
                            </View>

                            <View style={[styles.columns, wide && styles.wideColumns]}
                                onLayout={({ nativeEvent }) => { columnsTop.current = nativeEvent.layout.y; }}>
                                <View style={styles.form}>
                                    <View style={[styles.panel, panel]}>
                                        <Text accessibilityRole="header" aria-level={2} style={[styles.sectionTitle, { color: p.text }]}>Campaign details</Text>
                                        {FIELDS.map(field => (
                                            <View key={field.key} style={styles.field}>
                                                <Text style={[styles.label, { color: p.text }]}>
                                                    {field.label}{field.key === 'name' ? ' *' : ''}
                                                </Text>
                                                <TextInput
                                                    ref={field.key === 'name' ? name : field.key === 'link' ? link : undefined}
                                                    accessibilityLabel={field.key === 'name' ? 'Business name, required' : field.label}
                                                    accessibilityHint={error?.field === field.key ? error.message : undefined}
                                                    placeholder={field.placeholder}
                                                    placeholderTextColor={p.sub}
                                                    value={draft[field.key]}
                                                    onChangeText={value => updateDraft(field.key, value)}
                                                    autoCapitalize={field.key === 'link' ? 'none' : 'sentences'}
                                                    autoCorrect={field.key !== 'link'}
                                                    keyboardType={field.key === 'link' ? 'url' : 'default'}
                                                    style={[styles.input, { color: p.text, backgroundColor: p.bg, borderColor: error?.field === field.key ? errorColor : p.border }]}
                                                />
                                                {error?.field === field.key && (
                                                    <Text accessibilityRole="alert" style={[styles.small, { color: errorColor }]}>{error.message}</Text>
                                                )}
                                            </View>
                                        ))}

                                        <View style={styles.field}>
                                            <Text style={[styles.label, { color: p.text }]}>Business category</Text>
                                            <View style={styles.categoryGrid}>
                                                {CATEGORIES.map(item => {
                                                    const selected = item.id === category.id;
                                                    return (
                                                        <Pressable key={item.id} accessibilityRole="button" aria-pressed={selected}
                                                            onPress={() => { setCategory(item); setReviewed(false); }}
                                                            style={({ pressed }) => [styles.category, {
                                                                backgroundColor: selected ? ice : p.card,
                                                                borderColor: selected ? iceLine : p.border,
                                                                opacity: pressed ? 0.7 : 1,
                                                            }]}>
                                                            <Ionicons name={item.icon} size={19} color={selected ? accent : p.sub} />
                                                            <Text style={[styles.categoryLabel, { color: selected ? accent : p.text }]}>{item.label}</Text>
                                                        </Pressable>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    </View>

                                    <View style={[styles.panel, panel]}>
                                        <Text accessibilityRole="header" aria-level={2} style={[styles.sectionTitle, { color: p.text }]}>Audience</Text>
                                        <View accessibilityRole="radiogroup" accessibilityLabel="Audience" style={styles.audiences}>
                                            {AUDIENCES.map(item => {
                                                const selected = item.id === audience.id;
                                                return (
                                                    <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected }}
                                                        onPress={() => { setAudience(item); setReviewed(false); }}
                                                        style={({ pressed }) => [styles.audience, {
                                                            backgroundColor: selected ? ice : p.card,
                                                            borderColor: selected ? iceLine : p.border,
                                                            opacity: pressed ? 0.7 : 1,
                                                        }]}>
                                                        <View style={[styles.radio, { borderColor: selected ? accent : p.sub }]}>
                                                            {selected && <View style={[styles.radioFill, { backgroundColor: accent }]} />}
                                                        </View>
                                                        <View style={styles.audienceBody}>
                                                            <Text style={[styles.label, { color: p.text }]}>{item.label}</Text>
                                                            <Text style={[styles.small, { color: p.sub }]}>{item.description}</Text>
                                                        </View>
                                                        <Text style={[styles.label, { color: accent }]}>{item.price}</Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    {!wide && reviewButton}
                                </View>

                                <View style={[styles.preview, wide && styles.widePreview]}
                                    onLayout={({ nativeEvent }) => { previewTop.current = nativeEvent.layout.y; }}>
                                    <View style={[styles.panel, panel, reviewed && { borderColor: iceLine }]}>
                                        <Text accessibilityRole="header" aria-level={2} style={[styles.sectionTitle, { color: p.text }]}>Ad preview</Text>

                                        <View style={[styles.ad, { borderColor: p.border }]}>
                                            <View style={[styles.adBody, { backgroundColor: ice }]}>
                                                <View style={[styles.adIcon, { backgroundColor: p.card }]}>
                                                    <Ionicons name={category.icon} size={23} color={accent} />
                                                </View>
                                                <Text style={[styles.small, { color: accent }]}>{category.label}</Text>
                                                <Text style={[styles.adName, { color: p.text }]} numberOfLines={3}>{draft.name.trim() || 'Your business name'}</Text>
                                                {draft.offer.trim() ? (
                                                    <Text style={[styles.description, { color: p.sub }]} numberOfLines={4}>{draft.offer.trim()}</Text>
                                                ) : null}
                                            </View>
                                            {draft.link.trim() ? (
                                                <View style={styles.adLink}>
                                                    <Text style={[styles.small, styles.linkText, { color: p.sub }]} numberOfLines={1}>{draft.link.trim()}</Text>
                                                    <View style={styles.linkAction}>
                                                        <Text style={[styles.label, { color: accent }]}>Learn more</Text>
                                                        <Feather name="arrow-up-right" size={14} color={accent} />
                                                    </View>
                                                </View>
                                            ) : null}
                                        </View>

                                        <View style={styles.summary}>
                                            <Text style={[styles.small, { color: p.sub }]}>Audience</Text>
                                            <Text style={[styles.label, { color: p.text }]}>{audience.label}</Text>
                                        </View>
                                        <View style={styles.summary}>
                                            <Text style={[styles.small, { color: p.sub }]}>Plan price</Text>
                                            <Text style={[styles.label, { color: p.text }]}>{audience.price}</Text>
                                        </View>
                                        {reviewed && <Text accessibilityLiveRegion="polite" style={[styles.label, { color: accent }]}>Draft ready for review.</Text>}
                                    </View>
                                    {wide && reviewButton}
                                    <Text style={[styles.small, styles.previewNote, { color: p.sub }]}>Campaign publishing is unavailable.</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, minHeight: 0 },
    scroll: { paddingBottom: 32 },
    page: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 18 },
    widePage: { maxWidth: 1160, paddingHorizontal: 38, paddingTop: 25 },
    back: { flexDirection: 'row', minHeight: 40, gap: 8, alignItems: 'center', alignSelf: 'flex-start' },
    intro: { gap: 7, marginTop: 10, marginBottom: 25 },
    title: { fontFamily: 'Outfit_600SemiBold', fontSize: 38, letterSpacing: -1.5, lineHeight: 43 },
    wideTitle: { fontSize: 52, letterSpacing: -2.3, lineHeight: 57 },
    description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
    columns: { gap: 22 },
    wideColumns: { flexDirection: 'row', alignItems: 'flex-start', gap: 28 },
    form: { flex: 1, minWidth: 0, gap: 14 },
    preview: { width: '100%', minWidth: 0, gap: 10 },
    widePreview: { width: '37%' },
    panel: { borderWidth: 1, borderRadius: 17, padding: 18, gap: 14 },
    sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 24, letterSpacing: -0.5 },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
    field: { gap: 6 },
    input: { minHeight: 44, borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, fontFamily: 'Inter_400Regular', fontSize: 14 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    category: { minHeight: 56, minWidth: '30%', flexGrow: 1, flexBasis: '30%', gap: 5, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    categoryLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    audiences: { gap: 7 },
    audience: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, paddingVertical: 9, minHeight: 54, borderWidth: 1, borderRadius: 9 },
    audienceBody: { flex: 1, minWidth: 0, gap: 1 },
    radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    radioFill: { width: 8, height: 8, borderRadius: 4 },
    review: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, minHeight: 48, borderRadius: 10 },
    ad: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    adBody: { padding: 16, gap: 6 },
    adIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    adName: { fontFamily: 'Outfit_600SemiBold', fontSize: 28, lineHeight: 32, letterSpacing: -0.7 },
    adLink: { minHeight: 45, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
    linkText: { flex: 1, minWidth: 0 },
    linkAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    small: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
    previewNote: { paddingHorizontal: 3 },
});
