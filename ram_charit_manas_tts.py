"""
Ram Charit Manas - Text to Audio Converter
==========================================
Uses gTTS (Google Text-to-Speech) — FREE, no API key required.

SETUP:
    pip install gTTS pydub tqdm

USAGE:
    1. Place your text files in the 'input_texts/' folder
       - Name them like: balkand_hi.txt, ayodhyakand_hi.txt, etc.
    2. Run: python ram_charit_manas_tts.py
    3. Audio files will appear in 'output_audio/'

TEXT FILE FORMAT:
    - UTF-8 encoded plain text files
    - One file per Kand (chapter) recommended
    - You can get the text from: https://www.gitasupersite.iitk.ac.in/
      or: https://www.sacred-texts.com/hin/

SUPPORTED LANGUAGES (set your choice in CONFIG below):
    hi  = Hindi
    sa  = Sanskrit (limited TTS support)
    bn  = Bengali
    gu  = Gujarati
    mr  = Marathi
    ta  = Tamil (translation)
    te  = Telugu (translation)
    kn  = Kannada (translation)
    en  = English (translation)
    pa  = Punjabi
"""

import os
import sys
import time
import math
from pathlib import Path

try:
    from gtts import gTTS
    from tqdm import tqdm
except ImportError:
    print("Missing dependencies. Please run:")
    print("    pip install gTTS tqdm")
    sys.exit(1)

# ─────────────────────────────────────────────
# CONFIG — Edit these settings before running
# ─────────────────────────────────────────────

CONFIG = {
    # Languages to generate audio for.
    # Each entry: "language_code": "Label for filenames"
    "languages": {
        "hi": "Hindi",
        "en": "English",
        "bn": "Bengali",
        "mr": "Marathi",
        "gu": "Gujarati",
        "pa": "Punjabi",
        "te": "Telugu",
        "ta": "Tamil",
        "kn": "Kannada",
    },

    # Folder containing your .txt input files (one per Kand)
    "input_dir": "input_texts",

    # Folder where MP3 files will be saved
    "output_dir": "output_audio",

    # Max characters per TTS chunk (gTTS has a ~5000 char limit per call)
    "chunk_size": 4000,

    # Pause between API calls in seconds (avoids rate limiting)
    "api_delay": 1.0,

    # Speed: False = normal, True = slow (better for recitation)
    "slow_speech": False,
}

# The 7 Kands of Ram Charit Manas (used for auto-naming)
KANDS = [
    "Bal Kand",
    "Ayodhya Kand",
    "Aranya Kand",
    "Kishkindha Kand",
    "Sundar Kand",
    "Lanka Kand",
    "Uttar Kand",
]


def split_into_chunks(text: str, chunk_size: int) -> list[str]:
    """
    Split text into chunks at sentence/verse boundaries
    to avoid cutting words mid-way.
    """
    chunks = []
    while len(text) > chunk_size:
        # Try to split at newline or period near the chunk_size boundary
        split_pos = chunk_size
        for sep in ["\n\n", "\n", "।", ".", " "]:
            pos = text.rfind(sep, 0, chunk_size)
            if pos > chunk_size // 2:
                split_pos = pos + len(sep)
                break
        chunks.append(text[:split_pos].strip())
        text = text[split_pos:]
    if text.strip():
        chunks.append(text.strip())
    return chunks


def text_to_audio(text: str, lang_code: str, output_path: str, slow: bool = False):
    """
    Convert a full text to an MP3 file, chunking as needed.
    Saves directly (single chunk) or concatenates (multi-chunk).
    """
    chunks = split_into_chunks(text, CONFIG["chunk_size"])
    total_chunks = len(chunks)

    if total_chunks == 1:
        tts = gTTS(text=chunks[0], lang=lang_code, slow=slow)
        tts.save(output_path)
    else:
        # Save chunks as temp files, then concatenate
        temp_files = []
        for i, chunk in enumerate(chunks):
            temp_path = f"{output_path}_part{i}.mp3"
            tts = gTTS(text=chunk, lang=lang_code, slow=slow)
            tts.save(temp_path)
            temp_files.append(temp_path)
            time.sleep(CONFIG["api_delay"])

        # Concatenate all part files into one MP3
        concatenate_mp3s(temp_files, output_path)

        # Clean up temp files
        for f in temp_files:
            os.remove(f)


def concatenate_mp3s(input_files: list[str], output_file: str):
    """Concatenate multiple MP3 files by binary append (simple method)."""
    with open(output_file, "wb") as out_f:
        for fpath in input_files:
            with open(fpath, "rb") as in_f:
                out_f.write(in_f.read())


def process_single_file(txt_path: Path, lang_code: str, lang_label: str):
    """Convert a single text file to audio in one language."""
    out_dir = Path(CONFIG["output_dir"]) / lang_label
    out_dir.mkdir(parents=True, exist_ok=True)

    stem = txt_path.stem  # e.g. "balkand_hi"
    out_filename = f"{stem}_{lang_code}.mp3"
    out_path = str(out_dir / out_filename)

    if os.path.exists(out_path):
        print(f"  ⏭  Skipping (already exists): {out_filename}")
        return

    print(f"  🔊 Converting: {txt_path.name}  →  {out_filename}")
    text = txt_path.read_text(encoding="utf-8").strip()

    if not text:
        print(f"  ⚠  Empty file, skipping: {txt_path.name}")
        return

    num_chunks = math.ceil(len(text) / CONFIG["chunk_size"])
    print(f"     Text length: {len(text):,} chars | Chunks: {num_chunks}")

    try:
        text_to_audio(
            text=text,
            lang_code=lang_code,
            output_path=out_path,
            slow=CONFIG["slow_speech"],
        )
        print(f"  ✅ Saved: {out_path}")
    except Exception as e:
        print(f"  ❌ Error on {txt_path.name} ({lang_label}): {e}")


def create_sample_input():
    """Create sample input folder and a demo file if none exist."""
    input_dir = Path(CONFIG["input_dir"])
    input_dir.mkdir(exist_ok=True)

    sample_file = input_dir / "sample_balkand_hi.txt"
    if not sample_file.exists():
        sample_text = """श्रीरामचरितमानस - बालकाण्ड

श्लोक १
वर्णानामर्थसंघानां रसानां छन्दसामपि।
मङ्गलानां च कर्त्तारौ वन्दे वाणीविनायकौ॥

दोहा १
जो सुमिरत सिधि होइ गन नायक करिबर बदन।
करउ अनुग्रह सोइ बुद्धि रासि सुभ गुन सदन॥

चौपाई
मुनि सुनु राम कथा मनोहर।
सुंदर सुखद सकल दुख दोहर॥
यह सब महिमा राम की है।
जो जन भजे सो तर जाइ है॥
"""
        sample_file.write_text(sample_text, encoding="utf-8")
        print(f"📝 Created sample input file: {sample_file}")


def main():
    print("=" * 60)
    print("  Ram Charit Manas — Text to Audio Converter")
    print("=" * 60)

    # Setup directories
    input_dir = Path(CONFIG["input_dir"])
    output_dir = Path(CONFIG["output_dir"])
    output_dir.mkdir(exist_ok=True)

    # Create sample if input folder is empty/missing
    if not input_dir.exists() or not list(input_dir.glob("*.txt")):
        print("\n⚠  No input text files found.")
        create_sample_input()
        print(f"\nPlease add your .txt files to '{input_dir}/' and run again.")
        print("TIP: One .txt file per Kand works best.")
        return

    txt_files = sorted(input_dir.glob("*.txt"))
    print(f"\n📂 Found {len(txt_files)} text file(s) in '{input_dir}/'")
    for f in txt_files:
        print(f"   • {f.name}")

    print(f"\n🌐 Languages to generate: {len(CONFIG['languages'])}")
    for code, label in CONFIG["languages"].items():
        print(f"   • {label} ({code})")

    total_jobs = len(txt_files) * len(CONFIG["languages"])
    print(f"\n🚀 Starting conversion ({total_jobs} total audio files)...\n")

    for lang_code, lang_label in CONFIG["languages"].items():
        print(f"\n{'─'*50}")
        print(f"🌐 Language: {lang_label} ({lang_code})")
        print(f"{'─'*50}")
        for txt_path in txt_files:
            process_single_file(txt_path, lang_code, lang_label)
            time.sleep(CONFIG["api_delay"])

    print("\n" + "=" * 60)
    print(f"✅ Done! Audio files saved in: '{output_dir}/'")
    print("=" * 60)
    print("\nFolder structure:")
    for lang_label in CONFIG["languages"].values():
        lang_dir = output_dir / lang_label
        if lang_dir.exists():
            mp3s = list(lang_dir.glob("*.mp3"))
            print(f"  {output_dir}/{lang_label}/  ({len(mp3s)} file(s))")


if __name__ == "__main__":
    main()
