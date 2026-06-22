/**
 * EkDharma — React Native App
 * ============================
 * Setup:
 *   npx react-native init EkDharma --template react-native-template-typescript
 *   cd EkDharma
 *   npm install @react-navigation/native @react-navigation/bottom-tabs
 *   npm install react-native-screens react-native-safe-area-context
 *   npm install react-native-track-player
 *   npm install react-native-linear-gradient
 *   npm install @react-native-async-storage/async-storage
 *   npm install react-native-vector-icons
 *   npx pod-install   (iOS only)
 *
 * Replace App.tsx with this file.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  FlatList, Dimensions, Animated, StatusBar, Platform,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import TrackPlayer, {
  usePlaybackState, useProgress, State,
  Capability, Event,
} from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────
// Constants & Data
// ─────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get('window');
const API_BASE = 'https://api.ekdharma.app'; // your deployed backend

export const SCRIPTURES = [
  { id: 'gita',      label: 'Bhagavad Gita',     emoji: '🪷', origin: 'Hindu',     color: '#FF9800', chapters: 18  },
  { id: 'ramayana',  label: 'Ramayana',           emoji: '🏹', origin: 'Hindu',     color: '#E91E63', chapters: 7   },
  { id: 'bible',     label: 'Bible',              emoji: '✝️', origin: 'Christian', color: '#2196F3', chapters: 66  },
  { id: 'quran',     label: 'Quran',              emoji: '☪️', origin: 'Islam',     color: '#4CAF50', chapters: 114 },
  { id: 'granth',    label: 'Guru Granth Sahib',  emoji: '☬',  origin: 'Sikh',      color: '#9C27B0', chapters: 1430},
  { id: 'torah',     label: 'Torah',              emoji: '✡️', origin: 'Jewish',    color: '#00BCD4', chapters: 5   },
  { id: 'tripitaka', label: 'Tripitaka',          emoji: '☸️', origin: 'Buddhist',  color: '#8BC34A', chapters: 3   },
];

export const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी',    name: 'Hindi'     },
  { code: 'pa', label: 'ਪੰਜਾਬੀ',   name: 'Punjabi'   },
  { code: 'gu', label: 'ગુજરાતી',  name: 'Gujarati'  },
  { code: 'te', label: 'తెలుగు',    name: 'Telugu'    },
  { code: 'ml', label: 'മലയാളം',   name: 'Malayalam' },
  { code: 'ta', label: 'தமிழ்',     name: 'Tamil'     },
  { code: 'mr', label: 'मराठी',     name: 'Marathi'   },
  { code: 'bn', label: 'বাংলা',     name: 'Bengali'   },
  { code: 'en', label: 'English',   name: 'English'   },
];

export const VOICES = {
  female: [
    { id: 'nova',    label: 'Priya',  desc: 'Warm & Soothing'  },
    { id: 'shimmer', label: 'Devi',   desc: 'Crystal Clear'    },
    { id: 'alloy',   label: 'Anaya',  desc: 'Expressive'       },
  ],
  male: [
    { id: 'onyx',  label: 'Arjun', desc: 'Deep & Calm'       },
    { id: 'echo',  label: 'Dev',   desc: 'Clear & Steady'    },
    { id: 'fable', label: 'Rohan', desc: 'Warm & Gentle'     },
  ],
};

const UNITY_QUOTES = [
  { text: 'Truth is one, the sages call it by many names.', source: 'Rig Veda 1.164.46' },
  { text: 'Love thy neighbour as thyself.',                 source: 'Bible — Mark 12:31' },
  { text: 'There is only one God and He is the eternal truth.', source: 'Guru Granth Sahib' },
  { text: 'We made you peoples and tribes that you may know one another.', source: 'Quran 49:13' },
  { text: 'Hurt not others in ways you would find hurtful.', source: 'Tripitaka — Udana 5:18' },
  { text: 'The whole world is one family.',                 source: 'Mahopanishad 6.72' },
];

const COLORS = {
  bg:       '#0a0b14',
  card:     '#13141f',
  border:   'rgba(201,147,58,0.2)',
  gold:     '#f5d06a',
  goldDim:  '#c9933a',
  text:     '#e8dcc8',
  textMid:  'rgba(232,220,200,0.6)',
  textDim:  'rgba(232,220,200,0.35)',
};

// ─────────────────────────────────────────────────────────────
// TrackPlayer Service (register in index.js)
// ─────────────────────────────────────────────────────────────

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePause,    () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemotePlay,     () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemoteNext,     () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
}

async function setupPlayer() {
  try {
    await TrackPlayer.setupPlayer({ maxCacheSize: 1024 * 50 });
    await TrackPlayer.updateOptions({
      capabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext,
                     Capability.SkipToPrevious, Capability.SeekTo],
      compactCapabilities: [Capability.Play, Capability.Pause],
      notificationCapabilities: [Capability.Play, Capability.Pause,
                                  Capability.SkipToNext, Capability.SkipToPrevious],
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────

async function fetchAudioUrl(
  scripture: string, chapter: number,
  lang: string, voice: string
): Promise<string> {
  const url = `${API_BASE}/audio/${scripture}/${chapter}?lang=${lang}&voice=${voice}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Audio not found');
  const data = await res.json();
  return data.url;
}

async function fetchTeachings(scripture: string, lang: string): Promise<string[]> {
  const url = `${API_BASE}/teachings/${scripture}?lang=${lang}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────────────────────

function GoldText({ style, children, ...props }: any) {
  return <Text style={[{ color: COLORS.gold, fontFamily: 'Cinzel-Regular' }, style]} {...props}>{children}</Text>;
}

function WaveformBars({ playing }: { playing: boolean }) {
  const anims = useRef(Array.from({ length: 28 }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (!playing) {
      anims.forEach(a => Animated.spring(a, { toValue: 0.3, useNativeDriver: true }).start());
      return;
    }
    const loops = anims.map((a, i) => {
      const rand = 0.3 + Math.random() * 0.7;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(a, { toValue: rand, duration: 300 + i * 20, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.2, duration: 300 + i * 20, useNativeDriver: true }),
        ])
      );
    });
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [playing]);

  return (
    <View style={styles.waveform}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[styles.waveBar, {
            transform: [{ scaleY: anim }],
            backgroundColor: playing ? COLORS.goldDim : 'rgba(201,147,58,0.2)',
            height: 8 + Math.sin(i * 0.6) * 12 + (i % 3) * 5,
          }]}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────────────────

function HomeScreen() {
  const [activeScripture, setActiveScripture] = useState(SCRIPTURES[0]);
  const [activeLang, setActiveLang]           = useState(LANGUAGES[0]);
  const [gender, setGender]                   = useState<'female'|'male'>('female');
  const [activeVoice, setActiveVoice]         = useState(VOICES.female[0]);
  const [chapter, setChapter]                 = useState(1);
  const [quoteIdx, setQuoteIdx]               = useState(0);
  const [teachings, setTeachings]             = useState<string[]>([]);
  const [loadingAudio, setLoadingAudio]       = useState(false);
  const [favorites, setFavorites]             = useState<string[]>([]);
  const playback = usePlaybackState();
  const progress = useProgress();
  const insets   = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isPlaying = playback.state === State.Playing;

  // Rotate quotes
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      setQuoteIdx(i => (i + 1) % UNITY_QUOTES.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // Load teachings
  useEffect(() => {
    fetchTeachings(activeScripture.id, activeLang.code)
      .then(setTeachings)
      .catch(() => setTeachings([]));
  }, [activeScripture.id, activeLang.code]);

  // Load favorites
  useEffect(() => {
    AsyncStorage.getItem('favorites').then(v => v && setFavorites(JSON.parse(v)));
  }, []);

  const toggleFavorite = async (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    await AsyncStorage.setItem('favorites', JSON.stringify(next));
  };

  const playChapter = useCallback(async () => {
    if (loadingAudio) return;
    try {
      setLoadingAudio(true);
      const url = await fetchAudioUrl(activeScripture.id, chapter, activeLang.code, activeVoice.id);
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: `${activeScripture.id}-${chapter}-${activeLang.code}-${activeVoice.id}`,
        url,
        title: `${activeScripture.label} — Chapter ${chapter}`,
        artist: `${activeVoice.label} · ${activeLang.name}`,
        artwork: require('./assets/icon.png'),
      });
      await TrackPlayer.play();
    } catch (e) {
      Alert.alert('Audio unavailable', 'This chapter is not yet available in the selected language/voice.');
    } finally {
      setLoadingAudio(false);
    }
  }, [activeScripture, chapter, activeLang, activeVoice, loadingAudio]);

  const togglePlay = async () => {
    if (isPlaying) await TrackPlayer.pause();
    else if (progress.duration > 0) await TrackPlayer.play();
    else await playChapter();
  };

  const seek = (pct: number) => TrackPlayer.seekTo(pct * progress.duration);
  const fmt  = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  const quote = UNITY_QUOTES[quoteIdx];

  return (
    <LinearGradient colors={['#0a0b14', '#0d0e1a', '#0a0b14']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.appIcon}><Text style={{ fontSize: 30 }}>🕉</Text></View>
          <GoldText style={styles.appTitle}>EKDHARMA</GoldText>
          <Text style={styles.appTagline}>World is one · Humans are one · Truth is one</Text>
        </View>

        {/* ── Rotating quote ── */}
        <Animated.View style={[styles.quoteBanner, { opacity: fadeAnim }]}>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteSource}>— {quote.source}</Text>
        </Animated.View>

        {/* ── Language selector ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {LANGUAGES.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langChip, activeLang.code === l.code && styles.langChipActive]}
              onPress={() => setActiveLang(l)}
            >
              <Text style={[styles.langChipText, activeLang.code === l.code && { color: COLORS.gold }]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Voice gender toggle ── */}
        <View style={styles.voiceToggle}>
          {(['female', 'male'] as const).map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => {
                setGender(g);
                setActiveVoice(VOICES[g][0]);
              }}
            >
              <Text style={[styles.genderText, gender === g && { color: COLORS.gold }]}>
                {g === 'female' ? '♀ Female' : '♂ Male'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Voice chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voiceScroll}>
          {VOICES[gender].map(v => (
            <TouchableOpacity
              key={v.id}
              style={[styles.voiceChip, activeVoice.id === v.id && styles.voiceChipActive]}
              onPress={() => setActiveVoice(v)}
            >
              <Text style={[styles.voiceChipText, activeVoice.id === v.id && { color: COLORS.gold }]}>
                {v.label}
              </Text>
              <Text style={styles.voiceDesc}>{v.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Scripture tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scriptureScroll}>
          {SCRIPTURES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.scriptureTab, activeScripture.id === s.id && {
                borderColor: s.color,
                backgroundColor: 'rgba(255,255,255,0.07)',
              }]}
              onPress={() => { setActiveScripture(s); setChapter(1); }}
            >
              <Text style={styles.scriptureEmoji}>{s.emoji}</Text>
              <Text style={[styles.scriptureLabel, activeScripture.id === s.id && { color: COLORS.text }]}>
                {s.label}
              </Text>
              {activeScripture.id === s.id && (
                <View style={[styles.activeDot, { backgroundColor: s.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Player Card ── */}
        <View style={styles.playerCard}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { borderColor: activeScripture.color + '60' }]}>
              <Text style={{ fontSize: 26 }}>{activeScripture.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <GoldText style={styles.cardTitle}>{activeScripture.label}</GoldText>
              <Text style={styles.cardSub}>
                {activeScripture.origin} · {activeLang.name} · Ch. {chapter}/{activeScripture.chapters}
              </Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(activeScripture.id)}>
              <Text style={{ fontSize: 22 }}>
                {favorites.includes(activeScripture.id) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chapter slider */}
          <View style={styles.chapterRow}>
            <Text style={styles.chLabel}>Chapter</Text>
            <TouchableOpacity
              style={styles.chBtn}
              onPress={() => setChapter(c => Math.max(1, c - 1))}
            >
              <Text style={styles.chBtnText}>−</Text>
            </TouchableOpacity>
            <GoldText style={styles.chNum}>{chapter}</GoldText>
            <TouchableOpacity
              style={styles.chBtn}
              onPress={() => setChapter(c => Math.min(activeScripture.chapters, c + 1))}
            >
              <Text style={styles.chBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.chOf}>/ {activeScripture.chapters}</Text>
          </View>

          {/* Waveform */}
          <WaveformBars playing={isPlaying} />

          {/* Progress */}
          <TouchableOpacity
            style={styles.progressBar}
            onPress={(e) => seek(e.nativeEvent.locationX / (W - 72))}
            activeOpacity={1}
          >
            <View style={[styles.progressFill, {
              width: progress.duration > 0
                ? `${(progress.position / progress.duration) * 100}%`
                : '0%'
            }]} />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{fmt(progress.position)}</Text>
            <Text style={styles.timeText}>{fmt(progress.duration)}</Text>
          </View>

          {/* Controls */}
          <View style={styles.playerControls}>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => TrackPlayer.skipToPrevious()}>
              <Text style={styles.ctrlIcon}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => TrackPlayer.seekTo(Math.max(0, progress.position - 10))}>
              <Text style={styles.ctrlIcon}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={togglePlay} disabled={loadingAudio}>
              {loadingAudio
                ? <ActivityIndicator color="#0d0e1a" />
                : <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => TrackPlayer.seekTo(Math.min(progress.duration, progress.position + 10))}>
              <Text style={styles.ctrlIcon}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => TrackPlayer.skipToNext()}>
              <Text style={styles.ctrlIcon}>⏭</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Teachings ── */}
        {teachings.length > 0 && (
          <View style={styles.teachings}>
            <Text style={styles.teachHead}>KEY TEACHINGS</Text>
            {teachings.map((t, i) => (
              <View key={i} style={[styles.teachRow, i < teachings.length - 1 && styles.teachBorder]}>
                <Text style={styles.teachNum}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.teachText}>{t}</Text>
                <Text style={{ color: COLORS.goldDim, fontSize: 12 }}>▶</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Unity Banner ── */}
        <LinearGradient
          colors={['rgba(201,147,58,0.12)', 'rgba(201,147,58,0.04)']}
          style={styles.unityBanner}
        >
          <Text style={styles.unityIcon}>🕊</Text>
          <GoldText style={styles.unityTitle}>One World, One Soul</GoldText>
          <Text style={styles.unityText}>
            All scriptures teach love, compassion, and unity.{'\n'}
            Explore them all — they lead to the same light.
          </Text>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────
// Explore Screen
// ─────────────────────────────────────────────────────────────

function ExploreScreen() {
  return (
    <LinearGradient colors={['#0a0b14','#0d0e1a']} style={{ flex: 1 }}>
      <SafeAreaView>
        <GoldText style={[styles.appTitle, { margin: 24 }]}>EXPLORE</GoldText>
        <FlatList
          data={SCRIPTURES}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.exploreCard, { borderColor: item.color + '40', flex: 1 }]}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>{item.emoji}</Text>
              <GoldText style={{ fontSize: 13, marginBottom: 4, textAlign: 'center' }}>{item.label}</GoldText>
              <Text style={[styles.cardSub, { textAlign: 'center' }]}>
                {item.origin} · {item.chapters} ch.
              </Text>
              <View style={[styles.originBadge, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                <Text style={[styles.originText, { color: item.color }]}>{item.origin}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────
// Library Screen
// ─────────────────────────────────────────────────────────────

function LibraryScreen() {
  const [downloads, setDownloads] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('downloads').then(v => v && setDownloads(JSON.parse(v)));
  }, []);

  return (
    <LinearGradient colors={['#0a0b14','#0d0e1a']} style={{ flex: 1, padding: 24 }}>
      <SafeAreaView>
        <GoldText style={[styles.appTitle, { marginBottom: 24 }]}>LIBRARY</GoldText>
        {downloads.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
            <Text style={{ color: COLORS.textMid, textAlign: 'center', lineHeight: 22 }}>
              Your downloaded chapters will appear here.{'\n'}Tap ↓ on any chapter to save for offline listening.
            </Text>
          </View>
        ) : (
          <FlatList
            data={downloads}
            keyExtractor={i => i}
            renderItem={({ item }) => (
              <View style={styles.downloadRow}>
                <Text style={{ color: COLORS.text, flex: 1 }}>{item}</Text>
                <Text style={{ color: COLORS.goldDim }}>✓ Downloaded</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────
// Unity Screen
// ─────────────────────────────────────────────────────────────

function UnityScreen() {
  return (
    <LinearGradient colors={['#0a0b14','#0d0e1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={[styles.appIcon, { textAlign: 'center', fontSize: 48, marginVertical: 20 }]}>🕊</Text>
          <GoldText style={[styles.appTitle, { textAlign: 'center', marginBottom: 8 }]}>UNITY</GoldText>
          <Text style={[styles.appTagline, { textAlign: 'center', marginBottom: 32 }]}>
            One message across all faiths
          </Text>
          {UNITY_QUOTES.map((q, i) => (
            <View key={i} style={styles.unityCard}>
              <Text style={styles.quoteText}>"{q.text}"</Text>
              <Text style={styles.quoteSource}>— {q.source}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile Screen
// ─────────────────────────────────────────────────────────────

function ProfileScreen() {
  const [pref, setPref] = useState({ lang: 'hi', gender: 'female', voice: 'nova' });

  useEffect(() => {
    AsyncStorage.getItem('preferences').then(v => v && setPref(JSON.parse(v)));
  }, []);

  const save = async (update: Partial<typeof pref>) => {
    const next = { ...pref, ...update };
    setPref(next);
    await AsyncStorage.setItem('preferences', JSON.stringify(next));
  };

  return (
    <LinearGradient colors={['#0a0b14','#0d0e1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <GoldText style={[styles.appTitle, { marginBottom: 32 }]}>PROFILE</GoldText>

          <Text style={styles.settingLabel}>DEFAULT LANGUAGE</Text>
          <View style={styles.settingGroup}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.settingChip, pref.lang === l.code && styles.settingChipActive]}
                onPress={() => save({ lang: l.code })}
              >
                <Text style={[styles.settingChipText, pref.lang === l.code && { color: COLORS.gold }]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.settingLabel, { marginTop: 24 }]}>DEFAULT VOICE</Text>
          <View style={styles.voiceToggle}>
            {(['female','male'] as const).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, pref.gender === g && styles.genderBtnActive]}
                onPress={() => save({ gender: g })}
              >
                <Text style={[styles.genderText, pref.gender === g && { color: COLORS.gold }]}>
                  {g === 'female' ? '♀ Female' : '♂ Male'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.unityBanner, { marginTop: 32 }]}>
            <GoldText style={{ textAlign: 'center', marginBottom: 8, fontSize: 13, letterSpacing: 2 }}>
              ABOUT EKDHARMA
            </GoldText>
            <Text style={[styles.appTagline, { textAlign: 'center', lineHeight: 22 }]}>
              EkDharma unites the world's sacred scriptures in one app, read in soothing AI voices across all major Indian and world languages. Because every scripture points to the same truth — humanity is one.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const TabIcon = (icon: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );

// ─────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => { setupPlayer(); }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0d0e1a',
            borderTopColor: 'rgba(201,147,58,0.15)',
            borderTopWidth: 0.5,
            paddingBottom: 6,
            height: 60,
          },
          tabBarActiveTintColor: COLORS.gold,
          tabBarInactiveTintColor: COLORS.textDim,
          tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5, fontFamily: 'System' },
        }}
      >
        <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarIcon: TabIcon('🏠') }} />
        <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarIcon: TabIcon('🌐') }} />
        <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarIcon: TabIcon('📚') }} />
        <Tab.Screen name="Unity"   component={UnityScreen}   options={{ tabBarIcon: TabIcon('🕊') }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: TabIcon('👤') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  appIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#c9933a', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  appTitle: { fontSize: 24, letterSpacing: 4, color: COLORS.gold, fontWeight: '700', marginBottom: 4 },
  appTagline: { fontSize: 12, color: COLORS.textDim, fontStyle: 'italic', letterSpacing: 0.5 },
  quoteBanner: { marginHorizontal: 20, marginBottom: 16, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, backgroundColor: 'rgba(201,147,58,0.05)' },
  quoteText: { fontStyle: 'italic', fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 4 },
  quoteSource: { fontSize: 10, color: 'rgba(201,147,58,0.6)', textAlign: 'right', letterSpacing: 0.5 },
  langScroll: { paddingLeft: 16, marginBottom: 10 },
  langChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 8 },
  langChipActive: { borderColor: 'rgba(201,147,58,0.5)', backgroundColor: 'rgba(201,147,58,0.1)' },
  langChipText: { fontSize: 13, color: COLORS.textMid },
  voiceToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden' },
  genderBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  genderBtnActive: { backgroundColor: 'rgba(201,147,58,0.2)' },
  genderText: { fontSize: 13, color: COLORS.textMid, letterSpacing: 0.3 },
  voiceScroll: { paddingLeft: 16, marginBottom: 16 },
  voiceChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 8, alignItems: 'center' },
  voiceChipActive: { borderColor: 'rgba(201,147,58,0.5)', backgroundColor: 'rgba(201,147,58,0.1)' },
  voiceChipText: { fontSize: 12, color: COLORS.textMid, marginBottom: 2 },
  voiceDesc: { fontSize: 9, color: COLORS.textDim },
  scriptureScroll: { paddingLeft: 16, marginBottom: 16 },
  scriptureTab: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 10, minWidth: 90 },
  scriptureEmoji: { fontSize: 22, marginBottom: 6 },
  scriptureLabel: { fontSize: 9.5, color: 'rgba(232,220,200,0.45)', textAlign: 'center', letterSpacing: 0.3, lineHeight: 14 },
  activeDot: { width: 5, height: 5, borderRadius: 3, marginTop: 5 },
  playerCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  cardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  cardSub: { fontSize: 10, color: COLORS.textDim, letterSpacing: 0.5 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, gap: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  chLabel: { fontSize: 12, color: COLORS.textDim },
  chBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  chBtnText: { color: COLORS.text, fontSize: 16, lineHeight: 20 },
  chNum: { fontSize: 16, fontWeight: '600', minWidth: 30, textAlign: 'center' },
  chOf: { fontSize: 12, color: COLORS.textDim },
  waveform: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2.5, height: 50, paddingHorizontal: 16 },
  waveBar: { width: 3, borderRadius: 2 },
  progressBar: { height: 4, marginHorizontal: 16, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: COLORS.goldDim },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  timeText: { fontSize: 10, color: COLORS.textDim },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 20 },
  ctrlBtn: { padding: 8 },
  ctrlIcon: { fontSize: 20, color: COLORS.textMid },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.goldDim, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 22, color: '#0d0e1a' },
  teachings: { marginHorizontal: 20, marginBottom: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  teachHead: { padding: 12, paddingHorizontal: 16, fontSize: 10, letterSpacing: 2, color: COLORS.textDim, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  teachRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, paddingHorizontal: 16, gap: 10 },
  teachBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' },
  teachNum: { fontSize: 9, color: 'rgba(201,147,58,0.55)', minWidth: 22, marginTop: 3 },
  teachText: { flex: 1, fontStyle: 'italic', fontSize: 14, color: 'rgba(232,220,200,0.8)', lineHeight: 20 },
  unityBanner: { marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center' },
  unityIcon: { fontSize: 32, marginBottom: 10 },
  unityTitle: { fontSize: 16, letterSpacing: 2, marginBottom: 10 },
  unityText: { fontSize: 13, color: COLORS.textMid, textAlign: 'center', lineHeight: 21 },
  exploreCard: { padding: 18, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 0.5, alignItems: 'center' },
  originBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 0.5 },
  originText: { fontSize: 9, letterSpacing: 0.5 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  downloadRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  unityCard: { padding: 16, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 12 },
  settingLabel: { fontSize: 10, letterSpacing: 2, color: COLORS.textDim, marginBottom: 10 },
  settingGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  settingChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
  settingChipActive: { borderColor: 'rgba(201,147,58,0.5)', backgroundColor: 'rgba(201,147,58,0.1)' },
  settingChipText: { fontSize: 12, color: COLORS.textMid },
});
