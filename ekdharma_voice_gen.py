"""
EkDharma — AI Voice Script Generator
====================================
Uses OpenAI TTS HD (`tts-1-hd`) with four named, soothing voices.

VOICES:
    Priya  (female, warm & soothing)   -> nova
    Devi   (female, crystal clear)     -> shimmer
    Arjun  (male,   deep & calm)       -> onyx
    Dev    (male,   clear & steady)    -> echo

SETUP:
    pip install openai tqdm
    Uses Replit's managed OpenAI integration via the env vars
    AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY
    (no key configuration required).

USAGE:
    1. Place UTF-8 .txt files in 'ekdharma_texts/'
       File-name suffix selects the voice, e.g.
         gita_ch01_priya.txt   ramayana_balkand_arjun.txt
         bible_psalms23_devi.txt   quran_alfatiha_dev.txt
       If no voice suffix is found, the --default-voice is used.
    2. Run:  python ekdharma_voice_gen.py
       Or:   python ekdharma_voice_gen.py --voices priya devi
    3. MP3s appear in 'ekdharma_audio/<VoiceName>/<stem>.mp3'.

NOTES:
    OpenAI TTS does not split by language; it speaks whatever text
    you provide in a neutral accent. For multilingual content, hand
    it text in the target language directly.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path

try:
    from openai import OpenAI
    from tqdm import tqdm
except ImportError:
    print("Missing dependencies. Please run:")
    print("    pip install openai tqdm")
    sys.exit(1)


@dataclass(frozen=True)
class Voice:
    id: str           # friendly name used in filenames + folder
    label: str        # display label
    openai_voice: str # one of: alloy, echo, fable, onyx, nova, shimmer
    style: str        # short description


VOICES: dict[str, Voice] = {
    "priya": Voice("priya", "Priya", "nova",    "Warm & Soothing"),
    "devi":  Voice("devi",  "Devi",  "shimmer", "Crystal Clear"),
    "arjun": Voice("arjun", "Arjun", "onyx",    "Deep & Calm"),
    "dev":   Voice("dev",   "Dev",   "echo",    "Clear & Steady"),
}

CONFIG = {
    "input_dir": "ekdharma_texts",
    "output_dir": "ekdharma_audio",
    # The Replit-managed OpenAI proxy does NOT expose POST /audio/speech.
    # We synthesize via the gpt-audio chat-completions endpoint instead,
    # which accepts a named voice and returns base64 audio. This mirrors
    # the JS helper at lib/integrations-openai-ai-server/src/audio/client.ts.
    "model": "gpt-audio",
    "format": "mp3",
    # Soft delay between API calls so we stay friendly to the proxy.
    "api_delay": 0.4,
    # gpt-audio responses can be slow for very long inputs; keep chunks
    # comfortable rather than maxing out the model's window.
    "chunk_size": 3800,
}


def make_client() -> OpenAI:
    base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key = os.environ.get(
        "AI_INTEGRATIONS_OPENAI_API_KEY"
    ) or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print(
            "ERROR: No OpenAI key found. Set AI_INTEGRATIONS_OPENAI_API_KEY "
            "(Replit-managed) or OPENAI_API_KEY.",
            file=sys.stderr,
        )
        sys.exit(2)
    if base_url:
        return OpenAI(api_key=api_key, base_url=base_url)
    return OpenAI(api_key=api_key)


def split_into_chunks(text: str, chunk_size: int) -> list[str]:
    chunks: list[str] = []
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


def synthesize_chunk(
    client: OpenAI, text: str, voice: Voice, out_path: Path
) -> None:
    import base64

    response = client.chat.completions.create(
        model=CONFIG["model"],
        modalities=["text", "audio"],
        audio={"voice": voice.openai_voice, "format": CONFIG["format"]},
        messages=[
            {
                "role": "system",
                "content": "You are an assistant that performs text-to-speech.",
            },
            {
                "role": "user",
                "content": f"Repeat the following text verbatim: {text}",
            },
        ],
    )
    message = response.choices[0].message
    audio_data = getattr(message, "audio", None)
    b64 = getattr(audio_data, "data", None) if audio_data is not None else None
    if not b64 and isinstance(audio_data, dict):
        b64 = audio_data.get("data")
    if not b64:
        raise RuntimeError("OpenAI response contained no audio data")
    out_path.write_bytes(base64.b64decode(b64))


def synthesize_text(
    client: OpenAI, text: str, voice: Voice, out_path: Path
) -> None:
    chunks = split_into_chunks(text, CONFIG["chunk_size"])
    if len(chunks) == 1:
        synthesize_chunk(client, chunks[0], voice, out_path)
        return

    parts: list[Path] = []
    try:
        for i, chunk in enumerate(chunks):
            part = out_path.with_suffix(f".part{i}.mp3")
            synthesize_chunk(client, chunk, voice, part)
            parts.append(part)
            time.sleep(CONFIG["api_delay"])
        with open(out_path, "wb") as out_f:
            for p in parts:
                out_f.write(p.read_bytes())
    finally:
        for p in parts:
            try:
                p.unlink()
            except OSError:
                pass


def detect_voice_from_filename(name: str) -> Voice | None:
    stem = Path(name).stem.lower()
    for vid in VOICES:
        if stem.endswith(f"_{vid}") or stem == vid:
            return VOICES[vid]
    return None


def create_sample_input() -> None:
    in_dir = Path(CONFIG["input_dir"])
    in_dir.mkdir(exist_ok=True)
    sample = in_dir / "sample_priya.txt"
    if not sample.exists():
        sample.write_text(
            "Welcome to EkDharma. May this voice bring you peace, "
            "and may every word remind you of the light shared by all "
            "wisdom traditions.\n",
            encoding="utf-8",
        )
        print(f"Created sample input: {sample}")
    readme = in_dir / "README.txt"
    if not readme.exists():
        lines = [
            "EkDharma voice generator — input folder",
            "=======================================",
            "",
            "Place UTF-8 .txt files here. The voice is auto-selected from",
            "the filename suffix:",
            "",
        ]
        for v in VOICES.values():
            lines.append(
                f"  *_{v.id}.txt  -> {v.label:<6} ({v.style}, OpenAI '{v.openai_voice}')"
            )
        lines += [
            "",
            "Examples:",
            "  gita_ch01_priya.txt",
            "  ramayana_balkand_arjun.txt",
            "  bible_psalms23_devi.txt",
            "  quran_alfatiha_dev.txt",
            "",
            "Files without a recognised voice suffix use --default-voice",
            "(default: priya).",
        ]
        readme.write_text("\n".join(lines), encoding="utf-8")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--voices", nargs="+", choices=list(VOICES.keys()),
        help="Restrict generation to these voice ids "
             "(default: every voice detected from filenames, "
             "or all four if --all-voices is set).",
    )
    p.add_argument(
        "--all-voices", action="store_true",
        help="Generate every input file with all four voices "
             "(ignores filename suffix).",
    )
    p.add_argument(
        "--default-voice", default="priya", choices=list(VOICES.keys()),
        help="Voice to use when filename has no recognised suffix.",
    )
    p.add_argument(
        "--overwrite", action="store_true",
        help="Re-synthesize even if the output MP3 already exists.",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    in_dir = Path(CONFIG["input_dir"])
    out_dir = Path(CONFIG["output_dir"])
    out_dir.mkdir(exist_ok=True)

    if not in_dir.exists() or not list(in_dir.glob("*.txt")):
        print(f"No .txt files found in '{in_dir}/'.")
        create_sample_input()
        print(f"\nAdd your text files to '{in_dir}/' and run again.")
        return 0

    txt_files = sorted(
        f for f in in_dir.glob("*.txt") if f.name.lower() != "readme.txt"
    )
    if not txt_files:
        print("Only README.txt found. Add real input files and re-run.")
        return 0

    default_voice = VOICES[args.default_voice]

    # Build the work list: (file, voice).
    jobs: list[tuple[Path, Voice]] = []
    voice_filter = set(args.voices) if args.voices else None
    for txt in txt_files:
        if args.all_voices:
            chosen = list(VOICES.values())
        else:
            detected = detect_voice_from_filename(txt.name) or default_voice
            chosen = [detected]
        for v in chosen:
            if voice_filter and v.id not in voice_filter:
                continue
            jobs.append((txt, v))

    if not jobs:
        print("No jobs to run after applying filters.")
        return 0

    print("=" * 60)
    print("  EkDharma — Voice Generator (OpenAI TTS HD)")
    print("=" * 60)
    print(f"Input dir : {in_dir}/")
    print(f"Output dir: {out_dir}/")
    print(f"Files     : {len(txt_files)}")
    print(f"Jobs      : {len(jobs)}")
    print("Voices    :")
    used = sorted({v.id for _, v in jobs})
    for vid in used:
        v = VOICES[vid]
        print(f"  - {v.label:<6} ({v.style}, OpenAI '{v.openai_voice}')")
    print()

    client = make_client()
    failures: list[tuple[str, str, str]] = []

    progress = tqdm(jobs, unit="job")
    for txt_path, voice in progress:
        voice_dir = out_dir / voice.label
        voice_dir.mkdir(parents=True, exist_ok=True)
        target = voice_dir / f"{txt_path.stem}.mp3"
        if target.exists() and not args.overwrite:
            progress.set_postfix_str(f"skip {voice.label}/{target.name}")
            continue

        text = txt_path.read_text(encoding="utf-8").strip()
        if not text:
            progress.write(f"empty: {txt_path.name}")
            continue

        progress.set_postfix_str(f"{voice.label} <- {txt_path.name}")
        try:
            synthesize_text(client, text, voice, target)
            time.sleep(CONFIG["api_delay"])
        except Exception as err:  # noqa: BLE001
            failures.append((txt_path.name, voice.id, str(err)))
            progress.write(
                f"FAIL {voice.label}/{txt_path.name}: {err}"
            )
            if target.exists():
                try:
                    target.unlink()
                except OSError:
                    pass

    progress.close()

    print()
    if failures:
        print(f"Done with {len(failures)} failure(s):")
        for fname, vid, err in failures:
            print(f"  - {vid}/{fname}: {err}")
        return 1

    print("All voice tracks generated.")
    print(f"Output tree: {out_dir}/<VoiceName>/<stem>.mp3")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
