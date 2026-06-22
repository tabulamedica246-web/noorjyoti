"""
Bhagavad Gita — Text to Audio Converter
========================================
Uses gTTS (Google Text-to-Speech) — FREE, no API key required.

SETUP:
    pip install gTTS tqdm

USAGE:
    1. Place your .txt files in the 'gita_texts/' folder
       - One file per chapter OR one file per language (your choice)
       - File naming tip: ch01_hi.txt, ch02_hi.txt ... ch18_hi.txt
         OR full_gita_hi.txt, full_gita_pa.txt, etc.
    2. Run: python bhagavad_gita_tts.py
    3. Audio MP3s appear in 'gita_audio/' organized by language

WHERE TO GET THE TEXT (free, public domain):
    Hindi   : https://www.gitasupersite.iitk.ac.in/  (select Hindi + all 18 chapters)
    Punjabi : https://www.srigranth.org/  or IITK Gita site
    Gujarati: https://www.gitasupersite.iitk.ac.in/
    Telugu  : https://www.gitasupersite.iitk.ac.in/
    Malayalam: https://www.gitasupersite.iitk.ac.in/
    Tamil   : https://www.gitasupersite.iitk.ac.in/
    Marathi : https://www.gitasupersite.iitk.ac.in/
    Bengali : https://www.gitasupersite.iitk.ac.in/

    Tip: On the IITK site, select language → select chapter range → copy text → save as UTF-8 .txt

TEXT FILE NAMING CONVENTION:
    Single file per language (simplest):
        full_gita_hi.txt   → Hindi full Gita
        full_gita_pa.txt   → Punjabi full Gita
        full_gita_gu.txt   → Gujarati full Gita
        ...

    OR per chapter (better quality, resumable):
        ch01_hi.txt  ch02_hi.txt  ...  ch18_hi.txt
        ch01_pa.txt  ch02_pa.txt  ...  ch18_pa.txt
        ...

    The script auto-detects the language code from the filename suffix.
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
    print("❌ Missing dependencies. Please run:")
    print("    pip install gTTS tqdm")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────
# CONFIG — Edit these settings before running
# ─────────────────────────────────────────────────────────────

CONFIG = {
    # Languages to process. Key = gTTS language code, Value = folder label
    "languages": {
        "hi": "Hindi",
        "pa": "Punjabi",
        "gu": "Gujarati",
        "te": "Telugu",
        "ml": "Malayalam",
        "ta": "Tamil",
        "mr": "Marathi",
        "bn": "Bengali",
    },

    # Where your input .txt files live
    "input_dir": "gita_texts",

    # Where MP3 output will be saved
    "output_dir": "gita_audio",

    # Max characters per TTS chunk (gTTS limit ~5000, keep lower for stability)
    "chunk_size": 3500,

    # Delay between API calls in seconds (avoids rate limiting)
    "api_delay": 1.2,

    # Slow speech: True = slower/clearer, False = normal pace
    "slow_speech": False,
}

# ─────────────────────────────────────────────────────────────
# The 18 Chapters of the Bhagavad Gita
# ─────────────────────────────────────────────────────────────

CHAPTERS = {
    "ch01": "Arjuna Vishada Yoga",
    "ch02": "Sankhya Yoga",
    "ch03": "Karma Yoga",
    "ch04": "Jnana Karma Sanyasa Yoga",
    "ch05": "Karma Sanyasa Yoga",
    "ch06": "Atma Samyama Yoga",
    "ch07": "Jnana Vijnana Yoga",
    "ch08": "Aksara Brahma Yoga",
    "ch09": "Raja Vidya Raja Guhya Yoga",
    "ch10": "Vibhuti Yoga",
    "ch11": "Vishwarupa Darshana Yoga",
    "ch12": "Bhakti Yoga",
    "ch13": "Kshetra Kshetrajna Vibhaga Yoga",
    "ch14": "Gunatraya Vibhaga Yoga",
    "ch15": "Purushottama Yoga",
    "ch16": "Daivasura Sampad Vibhaga Yoga",
    "ch17": "Shraddhatraya Vibhaga Yoga",
    "ch18": "Moksha Sanyasa Yoga",
}

LANGUAGE_NAMES = {
    "hi": "हिन्दी (Hindi)",
    "pa": "ਪੰਜਾਬੀ (Punjabi)",
    "gu": "ગુજરાતી (Gujarati)",
    "te": "తెలుగు (Telugu)",
    "ml": "മലയാളം (Malayalam)",
    "ta": "தமிழ் (Tamil)",
    "mr": "मराठी (Marathi)",
    "bn": "বাংলা (Bengali)",
}


def split_into_chunks(text: str, chunk_size: int) -> list:
    """Split text at natural verse/sentence boundaries."""
    chunks = []
    while len(text) > chunk_size:
        split_pos = chunk_size
        for sep in ["\n\n", "\n", "।।", "।", "॥", ".", " "]:
            pos = text.rfind(sep, 0, chunk_size)
            if pos > chunk_size // 2:
                split_pos = pos + len(sep)
                break
        chunks.append(text[:split_pos].strip())
        text = text[split_pos:]
    if text.strip():
        chunks.append(text.strip())
    return chunks


def concatenate_mp3s(input_files: list, output_file: str):
    """Concatenate MP3 parts by binary append."""
    with open(output_file, "wb") as out_f:
        for fpath in input_files:
            with open(fpath, "rb") as in_f:
                out_f.write(in_f.read())


def text_to_audio(text: str, lang_code: str, output_path: str, slow: bool = False):
    """Convert text to MP3, handling chunking automatically."""
    chunks = split_into_chunks(text, CONFIG["chunk_size"])
    total = len(chunks)

    if total == 1:
        tts = gTTS(text=chunks[0], lang=lang_code, slow=slow)
        tts.save(output_path)
    else:
        print(f"     Splitting into {total} chunks...")
        temp_files = []
        for i, chunk in enumerate(chunks, 1):
            print(f"     Chunk {i}/{total} ({len(chunk)} chars)...", end=" ", flush=True)
            temp_path = f"{output_path}_tmp{i}.mp3"
            tts = gTTS(text=chunk, lang=lang_code, slow=slow)
            tts.save(temp_path)
            temp_files.append(temp_path)
            print("✓")
            time.sleep(CONFIG["api_delay"])

        print(f"     Merging {total} parts...", end=" ", flush=True)
        concatenate_mp3s(temp_files, output_path)
        print("✓")

        for f in temp_files:
            try:
                os.remove(f)
            except OSError:
                pass


def detect_lang_from_filename(filename: str) -> str | None:
    """
    Try to detect language code from filename suffix.
    e.g. 'ch01_hi.txt' → 'hi', 'full_gita_ml.txt' → 'ml'
    """
    stem = Path(filename).stem  # e.g. 'ch01_hi'
    parts = stem.split("_")
    if parts:
        last = parts[-1].lower()
        if last in CONFIG["languages"]:
            return last
    return None


def process_file(txt_path: Path, lang_code: str, lang_label: str):
    """Convert one text file to audio."""
    out_dir = Path(CONFIG["output_dir"]) / lang_label
    out_dir.mkdir(parents=True, exist_ok=True)

    stem = txt_path.stem
    out_filename = f"{stem}.mp3"
    out_path = str(out_dir / out_filename)

    if os.path.exists(out_path):
        size_kb = os.path.getsize(out_path) // 1024
        print(f"  ⏭  Already exists ({size_kb} KB): {out_filename}")
        return True

    text = txt_path.read_text(encoding="utf-8").strip()
    if not text:
        print(f"  ⚠  Empty file, skipping: {txt_path.name}")
        return False

    char_count = len(text)
    num_chunks = math.ceil(char_count / CONFIG["chunk_size"])
    print(f"  🔊 {txt_path.name}  →  {out_filename}")
    print(f"     {char_count:,} chars | ~{num_chunks} chunk(s)")

    try:
        text_to_audio(text, lang_code, out_path, CONFIG["slow_speech"])
        size_kb = os.path.getsize(out_path) // 1024
        print(f"  ✅ Saved ({size_kb} KB): {out_path}")
        return True
    except Exception as e:
        print(f"  ❌ Error: {e}")
        # Remove partial file if exists
        if os.path.exists(out_path):
            os.remove(out_path)
        return False


def create_sample_structure():
    """Create the input folder with a README and sample naming guide."""
    input_dir = Path(CONFIG["input_dir"])
    input_dir.mkdir(exist_ok=True)

    readme = input_dir / "README.txt"
    if not readme.exists():
        content = """HOW TO ADD YOUR BHAGAVAD GITA TEXT FILES
==========================================

Place UTF-8 encoded .txt files here. Two naming options:

OPTION A — One file per chapter per language (RECOMMENDED):
    ch01_hi.txt   ch01_pa.txt   ch01_gu.txt ... (Chapter 1 in each language)
    ch02_hi.txt   ch02_pa.txt   ch02_gu.txt ... (Chapter 2 in each language)
    ...
    ch18_hi.txt   ch18_pa.txt   ch18_gu.txt ... (Chapter 18)

OPTION B — Full Gita per language (simpler, one file each):
    full_gita_hi.txt   → Hindi
    full_gita_pa.txt   → Punjabi
    full_gita_gu.txt   → Gujarati
    full_gita_te.txt   → Telugu
    full_gita_ml.txt   → Malayalam
    full_gita_ta.txt   → Tamil
    full_gita_mr.txt   → Marathi
    full_gita_bn.txt   → Bengali

LANGUAGE CODES:
    hi = Hindi | pa = Punjabi | gu = Gujarati | te = Telugu
    ml = Malayalam | ta = Tamil | mr = Marathi | bn = Bengali

WHERE TO DOWNLOAD THE TEXT:
    https://www.gitasupersite.iitk.ac.in/
    - Select your language
    - Select chapter(s)
    - Copy text and save as UTF-8 .txt
"""
        readme.write_text(content, encoding="utf-8")
        print(f"📄 Created guide: {readme}")


def print_summary(results: dict):
    """Print final conversion summary."""
    print("\n" + "=" * 60)
    print("  CONVERSION SUMMARY")
    print("=" * 60)
    total_ok = total_skip = total_fail = 0
    for lang, stats in results.items():
        ok = stats.get("ok", 0)
        skip = stats.get("skip", 0)
        fail = stats.get("fail", 0)
        total_ok += ok
        total_skip += skip
        total_fail += fail
        status = "✅" if fail == 0 else "⚠"
        print(f"  {status} {lang:<12} converted={ok}  skipped={skip}  errors={fail}")
    print(f"\n  Total: {total_ok} converted | {total_skip} skipped | {total_fail} errors")
    print("=" * 60)
    print(f"\n📁 Output folder: {CONFIG['output_dir']}/")
    print("   Subfolders: Hindi/ Punjabi/ Gujarati/ Telugu/")
    print("               Malayalam/ Tamil/ Marathi/ Bengali/\n")


def main():
    print("=" * 60)
    print("  Bhagavad Gita — Text to Audio Converter")
    print("  Languages: Hindi, Punjabi, Gujarati, Telugu,")
    print("             Malayalam, Tamil, Marathi, Bengali")
    print("=" * 60)

    input_dir = Path(CONFIG["input_dir"])
    output_dir = Path(CONFIG["output_dir"])
    output_dir.mkdir(exist_ok=True)

    if not input_dir.exists() or not list(input_dir.glob("*.txt")):
        print(f"\n⚠  No .txt files found in '{input_dir}/'")
        create_sample_structure()
        print(f"\n👉 Next steps:")
        print(f"   1. Read the guide in '{input_dir}/README.txt'")
        print(f"   2. Download text from: https://www.gitasupersite.iitk.ac.in/")
        print(f"   3. Save files in '{input_dir}/' using the naming convention")
        print(f"   4. Re-run this script")
        return

    # Gather all text files
    all_txt = sorted(input_dir.glob("*.txt"))
    # Exclude README
    all_txt = [f for f in all_txt if f.name != "README.txt"]

    if not all_txt:
        print("No .txt files found (only README). Please add your Gita text files.")
        return

    print(f"\n📂 Found {len(all_txt)} text file(s):")
    for f in all_txt:
        lang = detect_lang_from_filename(f.name)
        lang_name = LANGUAGE_NAMES.get(lang, "unknown") if lang else "⚠ lang code not detected"
        print(f"   • {f.name:<35} → {lang_name}")

    # Check for undetected languages
    undetected = [f for f in all_txt if not detect_lang_from_filename(f.name)]
    if undetected:
        print(f"\n⚠  WARNING: {len(undetected)} file(s) have no detectable language code in filename.")
        print("   Please rename them using the _XX suffix (e.g. ch01_hi.txt)")
        for f in undetected:
            print(f"   → {f.name}")
        print()

    results = {label: {"ok": 0, "skip": 0, "fail": 0}
               for label in CONFIG["languages"].values()}

    # Process files grouped by language
    for lang_code, lang_label in CONFIG["languages"].items():
        lang_files = [f for f in all_txt if detect_lang_from_filename(f.name) == lang_code]

        if not lang_files:
            continue

        print(f"\n{'─'*60}")
        print(f"🌐 {LANGUAGE_NAMES[lang_code]}")
        print(f"   {len(lang_files)} file(s) to process")
        print(f"{'─'*60}")

        for txt_path in lang_files:
            # Check if already done
            out_path = Path(CONFIG["output_dir"]) / lang_label / f"{txt_path.stem}.mp3"
            if out_path.exists():
                results[lang_label]["skip"] += 1
                process_file(txt_path, lang_code, lang_label)
            else:
                success = process_file(txt_path, lang_code, lang_label)
                if success:
                    results[lang_label]["ok"] += 1
                else:
                    results[lang_label]["fail"] += 1
            time.sleep(CONFIG["api_delay"])

    print_summary(results)


if __name__ == "__main__":
    main()
