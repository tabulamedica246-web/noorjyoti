/**
 * EkDharma — World Scriptures, One Soul
 * ======================================
 * React App UI with:
 *  - 7 scriptures as tabs
 *  - 8 languages
 *  - Male / Female AI voice toggle
 *  - Audio player with chapter navigation
 *
 * To run:
 *   npx create-react-app ekdharma
 *   Replace src/App.js with this file
 *   npm start
 */

import { useState, useRef, useEffect } from "react";

const SCRIPTURES = [
  { id: "gita",    label: "Bhagavad Gita",    emoji: "🪷", origin: "Hindu",  color: "#FF9800", chapters: 18 },
  { id: "ramayana",label: "Ramayana",          emoji: "🏹", origin: "Hindu",  color: "#E91E63", chapters: 7  },
  { id: "bible",   label: "Bible",             emoji: "✝️", origin: "Christian", color: "#2196F3", chapters: 66 },
  { id: "quran",   label: "Quran",             emoji: "☪️", origin: "Islam",  color: "#4CAF50", chapters: 114},
  { id: "granth",  label: "Guru Granth Sahib", emoji: "☬",  origin: "Sikh",   color: "#9C27B0", chapters: 1430},
  { id: "torah",   label: "Torah",             emoji: "✡️", origin: "Jewish", color: "#00BCD4", chapters: 5  },
  { id: "tripitaka",label:"Tripitaka",         emoji: "☸️", origin: "Buddhist",color:"#8BC34A", chapters: 3  },
];

const LANGUAGES = [
  { code: "hi", label: "हिन्दी",      name: "Hindi"     },
  { code: "pa", label: "ਪੰਜਾਬੀ",     name: "Punjabi"   },
  { code: "gu", label: "ગુજરાતી",    name: "Gujarati"  },
  { code: "te", label: "తెలుగు",      name: "Telugu"    },
  { code: "ml", label: "മലയാളം",     name: "Malayalam" },
  { code: "ta", label: "தமிழ்",       name: "Tamil"     },
  { code: "mr", label: "मराठी",       name: "Marathi"   },
  { code: "bn", label: "বাংলা",       name: "Bengali"   },
  { code: "en", label: "English",     name: "English"   },
];

const VOICES = {
  male:   [{ id: "onyx",  label: "Arjun — Deep & Calm"  },
           { id: "echo",  label: "Dev — Clear & Steady" },
           { id: "fable", label: "Rohan — Warm & Gentle"}],
  female: [{ id: "nova",    label: "Priya — Warm & Soothing" },
           { id: "shimmer", label: "Devi — Crystal Clear"    },
           { id: "alloy",   label: "Anaya — Expressive"      }],
};

const UNITY_QUOTES = [
  { text: "Truth is one, the sages call it by many names.", source: "Rig Veda 1.164.46" },
  { text: "All human beings are born free and equal in dignity and rights.", source: "Universal Declaration" },
  { text: "Love thy neighbour as thyself.", source: "Bible — Mark 12:31" },
  { text: "There is only one God and He is the eternal truth.", source: "Guru Granth Sahib" },
  { text: "We have made you peoples and tribes that you may know one another.", source: "Quran 49:13" },
  { text: "Hurt not others in ways that you yourself would find hurtful.", source: "Tripitaka — Udana 5:18" },
];

// ── CSS-in-JS styles ──────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0b14;
    color: #e8dcc8;
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .app {
    max-width: 430px;
    margin: 0 auto;
    min-height: 100vh;
    background: #0d0e1a;
    position: relative;
    overflow: hidden;
  }

  /* ── Stars background ── */
  .stars {
    position: fixed;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 430px;
    height: 100vh;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }
  .star {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,220,130,0.6);
    animation: twinkle var(--d, 3s) infinite ease-in-out;
  }
  @keyframes twinkle {
    0%,100% { opacity: 0.1; transform: scale(0.8); }
    50%      { opacity: 0.9; transform: scale(1.2); }
  }

  /* ── Header ── */
  .header {
    position: relative;
    z-index: 10;
    padding: 48px 24px 24px;
    text-align: center;
  }
  .app-icon {
    width: 64px; height: 64px;
    margin: 0 auto 12px;
    background: linear-gradient(135deg, #c9933a, #f5d06a, #c9933a);
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
    box-shadow: 0 0 40px rgba(201,147,58,0.4);
  }
  .app-title {
    font-family: 'Cinzel', serif;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #f5d06a, #e8a840, #f5d06a);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 3px;
    margin-bottom: 4px;
  }
  .app-tagline {
    font-family: 'Crimson Pro', serif;
    font-style: italic;
    font-size: 14px;
    color: rgba(232,220,200,0.55);
    letter-spacing: 1px;
  }

  /* ── Unity Quote Banner ── */
  .quote-banner {
    margin: 0 20px 20px;
    padding: 14px 18px;
    border: 0.5px solid rgba(201,147,58,0.3);
    border-radius: 12px;
    background: rgba(201,147,58,0.06);
    position: relative;
    z-index: 10;
  }
  .quote-text {
    font-family: 'Crimson Pro', serif;
    font-style: italic;
    font-size: 15px;
    color: #e8dcc8;
    line-height: 1.5;
    margin-bottom: 4px;
  }
  .quote-source {
    font-size: 11px;
    color: rgba(201,147,58,0.7);
    letter-spacing: 0.5px;
    text-align: right;
  }

  /* ── Controls bar ── */
  .controls {
    display: flex;
    gap: 10px;
    padding: 0 20px 16px;
    position: relative;
    z-index: 10;
  }
  .select {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 0.5px solid rgba(201,147,58,0.3);
    border-radius: 8px;
    color: #e8dcc8;
    font-size: 13px;
    padding: 8px 12px;
    cursor: pointer;
    appearance: none;
    font-family: 'Inter', sans-serif;
  }
  .select:focus { outline: none; border-color: rgba(201,147,58,0.7); }

  .voice-toggle {
    display: flex;
    background: rgba(255,255,255,0.05);
    border: 0.5px solid rgba(201,147,58,0.3);
    border-radius: 8px;
    overflow: hidden;
  }
  .voice-btn {
    padding: 8px 12px;
    font-size: 12px;
    font-family: 'Inter', sans-serif;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    color: rgba(232,220,200,0.55);
    background: transparent;
  }
  .voice-btn.active {
    background: rgba(201,147,58,0.25);
    color: #f5d06a;
  }

  /* ── Scripture scroll tabs ── */
  .scripture-scroll {
    display: flex;
    gap: 10px;
    padding: 0 20px 20px;
    overflow-x: auto;
    scrollbar-width: none;
    position: relative;
    z-index: 10;
  }
  .scripture-scroll::-webkit-scrollbar { display: none; }

  .scripture-tab {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 0.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    cursor: pointer;
    transition: all 0.25s;
    min-width: 90px;
  }
  .scripture-tab:hover {
    border-color: rgba(201,147,58,0.3);
    background: rgba(201,147,58,0.06);
  }
  .scripture-tab.active {
    border-color: var(--sc-color);
    background: rgba(255,255,255,0.07);
    box-shadow: 0 0 20px rgba(255,255,255,0.04);
  }
  .tab-emoji  { font-size: 22px; }
  .tab-label  {
    font-family: 'Cinzel', serif;
    font-size: 9px;
    letter-spacing: 0.5px;
    color: rgba(232,220,200,0.6);
    text-align: center;
    line-height: 1.3;
  }
  .scripture-tab.active .tab-label { color: #e8dcc8; }
  .tab-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--sc-color);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .scripture-tab.active .tab-dot { opacity: 1; }

  /* ── Main card ── */
  .main-card {
    margin: 0 20px 20px;
    border-radius: 20px;
    background: rgba(255,255,255,0.04);
    border: 0.5px solid rgba(255,255,255,0.1);
    overflow: hidden;
    position: relative;
    z-index: 10;
  }
  .card-header {
    padding: 20px 20px 14px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }
  .card-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    background: rgba(255,255,255,0.06);
    border: 0.5px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
  }
  .card-title {
    font-family: 'Cinzel', serif;
    font-size: 17px;
    font-weight: 600;
    color: #f5d06a;
    margin-bottom: 2px;
  }
  .card-origin {
    font-size: 11px;
    color: rgba(232,220,200,0.45);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Chapter nav */
  .chapter-nav {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }
  .ch-label { font-size: 12px; color: rgba(232,220,200,0.5); }
  .ch-slider {
    flex: 1;
    appearance: none;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  .ch-slider::-webkit-slider-thumb {
    appearance: none;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: #f5d06a;
    cursor: pointer;
  }
  .ch-num {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    color: #f5d06a;
    min-width: 30px;
    text-align: right;
  }

  /* Voice picker */
  .voice-picker {
    padding: 12px 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }
  .voice-chip {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    border: 0.5px solid rgba(255,255,255,0.12);
    background: transparent;
    color: rgba(232,220,200,0.5);
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .voice-chip.active {
    background: rgba(201,147,58,0.2);
    border-color: rgba(201,147,58,0.5);
    color: #f5d06a;
  }

  /* ── Audio Player ── */
  .player {
    padding: 20px;
  }
  .waveform {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 48px;
    margin-bottom: 16px;
  }
  .wave-bar {
    width: 3px;
    border-radius: 2px;
    background: rgba(201,147,58,0.25);
    transition: height 0.1s, background 0.2s;
    animation: pulse-bar var(--dur, 0.8s) infinite ease-in-out;
    animation-play-state: paused;
  }
  .wave-bar.playing {
    background: rgba(201,147,58,0.7);
    animation-play-state: running;
  }
  @keyframes pulse-bar {
    0%,100% { transform: scaleY(0.3); }
    50%      { transform: scaleY(1);   }
  }

  .progress-wrap {
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    height: 3px;
    margin-bottom: 6px;
    cursor: pointer;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #c9933a, #f5d06a);
    transition: width 0.3s;
  }
  .time-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: rgba(232,220,200,0.4);
    margin-bottom: 16px;
  }

  .player-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
  .ctrl-btn {
    background: none;
    border: none;
    color: rgba(232,220,200,0.6);
    font-size: 18px;
    cursor: pointer;
    transition: color 0.2s, transform 0.1s;
    padding: 6px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .ctrl-btn:hover { color: #f5d06a; transform: scale(1.1); }
  .ctrl-btn.play-btn {
    width: 56px; height: 56px;
    background: linear-gradient(135deg, #c9933a, #f5d06a);
    color: #0d0e1a;
    font-size: 22px;
    border-radius: 50%;
    box-shadow: 0 0 30px rgba(201,147,58,0.4);
  }
  .ctrl-btn.play-btn:hover { transform: scale(1.08); }

  /* ── Teachings section ── */
  .teachings {
    margin: 0 20px 20px;
    border-radius: 16px;
    background: rgba(255,255,255,0.03);
    border: 0.5px solid rgba(255,255,255,0.07);
    overflow: hidden;
    position: relative;
    z-index: 10;
  }
  .teachings-head {
    padding: 14px 16px;
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 2px;
    color: rgba(232,220,200,0.4);
    text-transform: uppercase;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }
  .teaching-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 16px;
    border-bottom: 0.5px solid rgba(255,255,255,0.04);
    cursor: pointer;
    transition: background 0.15s;
  }
  .teaching-row:hover { background: rgba(255,255,255,0.03); }
  .teaching-row:last-child { border-bottom: none; }
  .teaching-num {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    color: rgba(201,147,58,0.6);
    min-width: 24px;
    margin-top: 2px;
  }
  .teaching-text {
    font-family: 'Crimson Pro', serif;
    font-size: 15px;
    color: rgba(232,220,200,0.8);
    line-height: 1.4;
    flex: 1;
  }
  .teaching-lang {
    font-size: 10px;
    color: rgba(201,147,58,0.5);
    margin-top: 2px;
  }

  /* ── Bottom nav ── */
  .bottom-nav {
    position: sticky;
    bottom: 0;
    background: rgba(13,14,26,0.95);
    backdrop-filter: blur(20px);
    border-top: 0.5px solid rgba(255,255,255,0.08);
    display: flex;
    padding: 10px 0 20px;
    z-index: 100;
  }
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: none;
  }
  .nav-icon {
    font-size: 20px;
    transition: transform 0.2s;
  }
  .nav-label {
    font-size: 10px;
    color: rgba(232,220,200,0.35);
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.5px;
  }
  .nav-item.active .nav-label { color: #f5d06a; }
  .nav-item.active .nav-icon  { transform: scale(1.15); }
`;

// ── Utility hooks ────────────────────────────────────────────────────────────

function useQuoteRotate() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % UNITY_QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);
  return UNITY_QUOTES[idx];
}

function usePlayer() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const duration = 2847; // mock 47:27
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const tick = (now) => {
    if (!startRef.current) startRef.current = now;
    const secs = ((now - startRef.current) / 1000 + elapsed) % duration;
    setElapsed(secs);
    setProgress((secs / duration) * 100);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (playing) { rafRef.current = requestAnimationFrame(tick); }
    else { cancelAnimationFrame(rafRef.current); startRef.current = null; }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return { playing, setPlaying, progress, elapsed, duration, fmt };
}

// ── Stars ────────────────────────────────────────────────────────────────────
function Stars() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 4,
    dur: 2 + Math.random() * 3,
  }));
  return (
    <div className="stars">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          width: s.size, height: s.size,
          left: `${s.x}%`, top: `${s.y}%`,
          "--d": `${s.dur}s`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
}

// ── Waveform ─────────────────────────────────────────────────────────────────
function Waveform({ playing }) {
  const bars = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    height: 8 + Math.sin(i * 0.7) * 12 + Math.random() * 16,
    delay: (i * 0.05) % 1,
  }));
  return (
    <div className="waveform">
      {bars.map(b => (
        <div key={b.id} className={`wave-bar${playing ? " playing" : ""}`}
          style={{
            height: b.height,
            "--dur": `${0.5 + b.delay}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function EkDharmaApp() {
  const [activeScripture, setActiveScripture] = useState("gita");
  const [activeLang, setActiveLang] = useState("hi");
  const [gender, setGender] = useState("female");
  const [activeVoice, setActiveVoice] = useState("nova");
  const [chapter, setChapter] = useState(1);
  const [navTab, setNavTab] = useState("home");
  const { playing, setPlaying, progress, elapsed, duration, fmt } = usePlayer();
  const quote = useQuoteRotate();

  const scripture = SCRIPTURES.find(s => s.id === activeScripture);
  const langLabel = LANGUAGES.find(l => l.code === activeLang)?.label;
  const voices = VOICES[gender];

  const SAMPLE_TEACHINGS = [
    "सर्वे भवन्तु सुखिनः — May all be happy",
    "एकं सत् विप्राः बहुधा वदन्ति — Truth is one",
    "वसुधैव कुटुम्बकम् — The world is one family",
    "अहिंसा परमो धर्मः — Non-violence is the highest duty",
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <Stars />

        {/* Header */}
        <div className="header">
          <div className="app-icon">🕉</div>
          <div className="app-title">EkDharma</div>
          <div className="app-tagline">World is one · Humans are one · Truth is one</div>
        </div>

        {/* Rotating unity quote */}
        <div className="quote-banner" key={quote.text}>
          <div className="quote-text">"{quote.text}"</div>
          <div className="quote-source">— {quote.source}</div>
        </div>

        {/* Language + Voice controls */}
        <div className="controls">
          <select className="select" value={activeLang} onChange={e => setActiveLang(e.target.value)}>
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label} · {l.name}</option>
            ))}
          </select>
          <div className="voice-toggle">
            <button className={`voice-btn${gender === "female" ? " active" : ""}`}
              onClick={() => { setGender("female"); setActiveVoice("nova"); }}>
              ♀ Female
            </button>
            <button className={`voice-btn${gender === "male" ? " active" : ""}`}
              onClick={() => { setGender("male"); setActiveVoice("onyx"); }}>
              ♂ Male
            </button>
          </div>
        </div>

        {/* Scripture scroll tabs */}
        <div className="scripture-scroll">
          {SCRIPTURES.map(s => (
            <div key={s.id}
              className={`scripture-tab${activeScripture === s.id ? " active" : ""}`}
              style={{ "--sc-color": s.color }}
              onClick={() => { setActiveScripture(s.id); setChapter(1); setPlaying(false); }}>
              <span className="tab-emoji">{s.emoji}</span>
              <span className="tab-label">{s.label}</span>
              <span className="tab-dot" />
            </div>
          ))}
        </div>

        {/* Main player card */}
        <div className="main-card">
          <div className="card-header">
            <div className="card-icon" style={{ borderColor: `${scripture.color}40` }}>
              {scripture.emoji}
            </div>
            <div>
              <div className="card-title">{scripture.label}</div>
              <div className="card-origin">{scripture.origin} · {langLabel} · Ch. {chapter}</div>
            </div>
          </div>

          {/* Chapter slider */}
          <div className="chapter-nav">
            <span className="ch-label">Chapter</span>
            <input type="range" className="ch-slider"
              min={1} max={scripture.chapters} value={chapter}
              onChange={e => { setChapter(+e.target.value); setPlaying(false); }} />
            <span className="ch-num">{chapter}/{scripture.chapters}</span>
          </div>

          {/* Voice chips */}
          <div className="voice-picker">
            {voices.map(v => (
              <button key={v.id}
                className={`voice-chip${activeVoice === v.id ? " active" : ""}`}
                onClick={() => setActiveVoice(v.id)}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Player */}
          <div className="player">
            <Waveform playing={playing} />
            <div className="progress-wrap">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="time-row">
              <span>{fmt(elapsed)}</span>
              <span>{fmt(duration)}</span>
            </div>
            <div className="player-controls">
              <button className="ctrl-btn" onClick={() => setChapter(c => Math.max(1, c - 1))}>⏮</button>
              <button className="ctrl-btn" title="Rewind">↺</button>
              <button className="ctrl-btn play-btn" onClick={() => setPlaying(p => !p)}>
                {playing ? "⏸" : "▶"}
              </button>
              <button className="ctrl-btn" title="Forward">↻</button>
              <button className="ctrl-btn" onClick={() => setChapter(c => Math.min(scripture.chapters, c + 1))}>⏭</button>
            </div>
          </div>
        </div>

        {/* Key Teachings */}
        <div className="teachings">
          <div className="teachings-head">Key Teachings</div>
          {SAMPLE_TEACHINGS.map((t, i) => (
            <div key={i} className="teaching-row">
              <span className="teaching-num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="teaching-text">{t}</div>
                <div className="teaching-lang">{LANGUAGES.find(l => l.code === activeLang)?.name}</div>
              </div>
              <span style={{ fontSize: 14, color: "rgba(201,147,58,0.4)" }}>▶</span>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="bottom-nav">
          {[
            { id: "home",    icon: "🏠", label: "Home"     },
            { id: "explore", icon: "🌐", label: "Explore"  },
            { id: "library", icon: "📚", label: "Library"  },
            { id: "unity",   icon: "🕊", label: "Unity"    },
            { id: "profile", icon: "👤", label: "Profile"  },
          ].map(n => (
            <button key={n.id}
              className={`nav-item${navTab === n.id ? " active" : ""}`}
              onClick={() => setNavTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
