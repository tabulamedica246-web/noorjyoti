"""
EkDharma — AI Voice Generator
================================
Converts all scripture texts to high-quality AI audio
using OpenAI TTS API with soothing Male & Female voices.

VOICES (OpenAI TTS):
  Female — Nova    : Warm, intimate, soothing  ← best for devotional
  Female — Shimmer : Clear, expressive, bright
  Female — Alloy   : Balanced, professional
  Male   — Onyx    : Deep, resonant, calm      ← best for scripture recitation
  Male   — Echo    : Steady, clear, articulate
  Male   — Fable   : Warm, storytelling tone

SETUP:
    pip install openai tqdm pathlib

    Set your OpenAI API key:
        export OPENAI_API_KEY="sk-..."
    OR paste it in CONFIG below.

USAGE:
    python ekdharma_voice_gen.py

OUTPUT:
    ekdharma_audio/
      BhagavadGita/
        Hindi/
          ch01_hi_nova_female.mp3
          ch01_hi_onyx_male.mp3
          ...
      Bible/
        ...
      Quran/
        ...
"""

import os
import sys
import time
import math
from pathlib import Path

try:
    from openai import OpenAI
    from tqdm import tqdm
except ImportError:
    print("❌  Missing packages. Please run:")
    print("    pip install openai tqdm")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────
#  CONFIG — Edit before running
# ─────────────────────────────────────────────────────────────

CONFIG = {
    # Your OpenAI API key (or set OPENAI_API_KEY env var)
    "api_key": os.getenv("OPENAI_API_KEY", "YOUR_OPENAI_API_KEY_HERE"),

    # TTS model: "tts-1" = fast/cheap | "tts-1-hd" = studio quality (recommended)
    "model": "tts-1-hd",

    # Voices to generate for each file (can reduce to save cost)
    "voices": {
        "female": [
            {"id": "nova",    "label": "Priya",  "desc": "Warm & Soothing"},
            {"id": "shimmer", "label": "Devi",   "desc": "Crystal Clear"},
        ],
        "male": [
            {"id": "onyx",    "label": "Arjun",  "desc": "Deep & Calm"},
            {"id": "echo",    "label": "Dev",    "desc": "Clear & Steady"},
        ],
    },

    # Languages to generate
    "languages": {
        "hi": "Hindi",
        "pa": "Punjabi",
        "gu": "Gujarati",
        "te": "Telugu",
        "ml": "Malayalam",
        "ta": "Tamil",
        "mr": "Marathi",
        "bn": "Bengali",
        "en": "English",
    },

    # Input texts folder
    "input_dir": "ekdharma_texts",

    # Output audio folder
    "output_dir": "ekdharma_audio",

    # Max characters per TTS call (OpenAI limit is 4096)
    "chunk_size": 3800,

    # Delay between API calls (seconds) — avoids rate limits
    "api_delay": 0.5,

    # Speed: 0.5 (slowest) to 4.0 (fastest). 0.85 = gentle recitation pace
    "speed": 0.85,
}

# ─────────────────────────────────────────────────────────────
#  Scriptures supported
# ─────────────────────────────────────────────────────────────

SCRIPTURES = {
    "BhagavadGita":    {"chapters": 18, "tradition": "Hindu"},
    "Ramayana":        {"chapters": 7,  "tradition": "Hindu"},
    "Bible":           {"chapters": 66, "tradition": "Christian"},
    "Quran":           {"chapters": 114,"tradition": "Islam"},
    "GuruGranthSahib": {"chapters": 0,  "tradition": "Sikh"},
    "Torah":           {"chapters": 5,  "tradition": "Jewish"},
    "Tripitaka":       {"chapters": 3,  "tradition": "Buddhist"},
}

# ─────────────────────────────────────────────────────────────
#  Text helpers
# ─────────────────────────────────────────────────────────────

def split_text(text: str, chunk_size: int) -> list:
    """Split at verse/sentence boundaries."""
    chunks = []
    while len(text) > chunk_size:
        split_pos = chunk_size
        for sep in ["\n\n", "\n", "।।", "।", "॥", "۔", ".", " "]:
            pos = text.rfind(sep, 0, chunk_size)
            if pos > chunk_size // 2:
                split_pos = pos + len(sep)
                break
        chunks.append(text[:split_pos].strip())
        text = text[split_pos:]
    if text.strip():
        chunks.append(text.strip())
    return chunks


def merge_audio(part_files: list, output_path: str):
    """Binary concatenate MP3 parts."""
    with open(output_path, "wb") as out:
        for p in part_files:
            with open(p, "rb") as f:
                out.write(f.read())

# ─────────────────────────────────────────────────────────────
#  Core TTS function
# ─────────────────────────────────────────────────────────────

def generate_audio(
    client: OpenAI,
    text: str,
    voice: str,
    output_path: str,
    model: str = "tts-1-hd",
    speed: float = 0.85,
):
    """
    Call OpenAI TTS API and save audio.
    Handles chunking for long texts automatically.
    """
    chunks = split_text(text, CONFIG["chunk_size"])

    if len(chunks) == 1:
        resp = client.audio.speech.create(
            model=model, voice=voice, input=chunks[0], speed=speed
        )
        resp.stream_to_file(output_path)
    else:
        temp_files = []
        for i, chunk in enumerate(chunks, 1):
            tmp = f"{output_path}.part{i}.mp3"
            resp = client.audio.speech.create(
                model=model, voice=voice, input=chunk, speed=speed
            )
            resp.stream_to_file(tmp)
            temp_files.append(tmp)
            time.sleep(CONFIG["api_delay"])

        merge_audio(temp_files, output_path)
        for f in temp_files:
            try: os.remove(f)
            except: pass


# ─────────────────────────────────────────────────────────────
#  File processing
# ─────────────────────────────────────────────────────────────

def process_file(client, txt_path: Path, scripture: str, lang_code: str, lang_name: str):
    """Generate audio in all configured voices for one text file."""
    results = {"ok": 0, "skip": 0, "fail": 0}

    text = txt_path.read_text(encoding="utf-8").strip()
    if not text:
        print(f"    ⚠  Empty file: {txt_path.name}")
        return results

    all_voices = (
        CONFIG["voices"]["female"] +
        CONFIG["voices"]["male"]
    )

    for v in all_voices:
        gender = "female" if v in CONFIG["voices"]["female"] else "male"
        out_dir = Path(CONFIG["output_dir"]) / scripture / lang_name
        out_dir.mkdir(parents=True, exist_ok=True)

        stem = txt_path.stem
        fname = f"{stem}_{lang_code}_{v['id']}_{gender}.mp3"
        out_path = str(out_dir / fname)

        if os.path.exists(out_path):
            size = os.path.getsize(out_path) // 1024
            print(f"    ⏭  Skip ({size} KB): {fname}")
            results["skip"] += 1
            continue

        gender_sym = "♀" if gender == "female" else "♂"
        print(f"    {gender_sym} {v['label']} ({v['id']}) → {fname}")

        try:
            generate_audio(
                client=client,
                text=text,
                voice=v["id"],
                output_path=out_path,
                model=CONFIG["model"],
                speed=CONFIG["speed"],
            )
            size = os.path.getsize(out_path) // 1024
            print(f"      ✅ Saved {size} KB")
            results["ok"] += 1
        except Exception as e:
            print(f"      ❌ Error: {e}")
            results["fail"] += 1
            if os.path.exists(out_path):
                os.remove(out_path)

        time.sleep(CONFIG["api_delay"])

    return results


# ─────────────────────────────────────────────────────────────
#  README generator
# ─────────────────────────────────────────────────────────────

def create_input_structure():
    """Create input folder tree with README files."""
    base = Path(CONFIG["input_dir"])
    base.mkdir(exist_ok=True)

    readme = base / "README.txt"
    if not readme.exists():
        content = """EkDharma — Text Input Folder Structure
=======================================

Organize your text files as:

  ekdharma_texts/
    BhagavadGita/
      ch01_hi.txt    ← Chapter 1 in Hindi
      ch01_en.txt    ← Chapter 1 in English
      ch02_hi.txt
      ...
    Ramayana/
      balkand_hi.txt
      ayodhyakand_hi.txt
      ...
    Bible/
      genesis_en.txt
      exodus_en.txt
      ...
    Quran/
      ch001_ar.txt   (transliteration/translation)
      ch001_hi.txt
      ...
    GuruGranthSahib/
      ang001_pa.txt  ← Ang (page) 1 in Punjabi
      ...
    Torah/
      genesis_he.txt
      genesis_en.txt
      ...
    Tripitaka/
      dhammapada_pa.txt
      ...

LANGUAGE CODES:
  hi=Hindi  pa=Punjabi  gu=Gujarati  te=Telugu
  ml=Malayalam  ta=Tamil  mr=Marathi  bn=Bengali  en=English

TEXT SOURCES (free, public domain):
  IITK Gita Supersite : https://www.gitasupersite.iitk.ac.in/
  Sacred Texts Archive : https://www.sacred-texts.com/
  Quran.com           : https://quran.com  (copy translations)
  Bible Gateway       : https://www.biblegateway.com/
  SikhiToTheMax       : https://www.sikhitothemax.org/
"""
        readme.write_text(content, encoding="utf-8")
        print(f"📄 Created: {readme}")

    for scripture in SCRIPTURES:
        d = base / scripture
        d.mkdir(exist_ok=True)

    print(f"📂 Input folder tree created at: {base}/")


# ─────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────

def main():
    print("=" * 65)
    print("  EkDharma — AI Voice Generator")
    print("  World Scriptures · Soothing Male & Female Voices")
    print("=" * 65)

    # Check API key
    if CONFIG["api_key"] == "YOUR_OPENAI_API_KEY_HERE":
        print("\n❌  OpenAI API key not set.")
        print("    Option 1: export OPENAI_API_KEY='sk-...'")
        print("    Option 2: Paste your key in CONFIG['api_key'] in this script")
        sys.exit(1)

    client = OpenAI(api_key=CONFIG["api_key"])
    input_dir = Path(CONFIG["input_dir"])

    if not input_dir.exists():
        create_input_structure()
        print(f"\n👉 Add your text files to '{input_dir}/' and run again.")
        return

    # Check for any txt files anywhere in input_dir
    all_txts = list(input_dir.rglob("*.txt"))
    real_txts = [f for f in all_txts if f.name != "README.txt"]

    if not real_txts:
        print(f"\n⚠  No .txt files found in '{input_dir}/'")
        create_input_structure()
        print(f"\n👉 Add your scripture text files and run again.")
        return

    print(f"\n📂 Found {len(real_txts)} text file(s)")
    print(f"🎙  Model: {CONFIG['model']}")
    print(f"🔊 Voices: {sum(len(v) for v in CONFIG['voices'].values())} (per file)")
    print(f"🌐 Languages: {len(CONFIG['languages'])}")
    print(f"⚡ Speed: {CONFIG['speed']}x\n")

    total_jobs = len(real_txts) * sum(len(v) for v in CONFIG["voices"].values())
    print(f"🚀 Total audio files to generate: ~{total_jobs}")
    print("   (Already generated files will be skipped)\n")

    grand = {"ok": 0, "skip": 0, "fail": 0}

    for scripture_name in SCRIPTURES:
        scripture_dir = input_dir / scripture_name
        if not scripture_dir.exists():
            continue

        txt_files = sorted(scripture_dir.glob("*.txt"))
        txt_files = [f for f in txt_files if f.name != "README.txt"]

        if not txt_files:
            continue

        print(f"\n{'═'*65}")
        print(f"📖  {scripture_name}  ({len(txt_files)} files)")
        print(f"{'═'*65}")

        for txt_path in txt_files:
            # Detect language from filename
            lang_code = txt_path.stem.split("_")[-1].lower()
            lang_name = CONFIG["languages"].get(lang_code, lang_code.upper())

            print(f"\n  📄 {txt_path.name}  [{lang_name}]")
            r = process_file(client, txt_path, scripture_name, lang_code, lang_name)
            for k in grand:
                grand[k] += r.get(k, 0)

    print("\n" + "=" * 65)
    print("  FINAL SUMMARY")
    print("=" * 65)
    print(f"  ✅ Generated : {grand['ok']}")
    print(f"  ⏭  Skipped   : {grand['skip']}")
    print(f"  ❌ Errors    : {grand['fail']}")
    print(f"\n  📁 Output: {CONFIG['output_dir']}/")
    print("     Structure: scripture / language / file_voice_gender.mp3")
    print("=" * 65)

    if grand["ok"] > 0:
        print(f"\n✨ Done! Your EkDharma audio library is ready.")
        print("   Voices used:")
        for g, voices in CONFIG["voices"].items():
            for v in voices:
                sym = "♀" if g == "female" else "♂"
                print(f"   {sym} {v['label']} ({v['id']}) — {v['desc']}")


if __name__ == "__main__":
    main()
