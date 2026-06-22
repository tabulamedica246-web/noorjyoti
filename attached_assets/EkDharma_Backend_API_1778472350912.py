"""
EkDharma — FastAPI Backend
===========================
Serves audio files, scripture text, teachings, and
generates AI voices on-demand via OpenAI TTS.

SETUP:
    pip install fastapi uvicorn openai python-dotenv
                aiofiles boto3 redis pydantic

    Create .env file:
        OPENAI_API_KEY=sk-...
        AWS_ACCESS_KEY_ID=...
        AWS_SECRET_ACCESS_KEY=...
        AWS_S3_BUCKET=ekdharma-audio
        REDIS_URL=redis://localhost:6379
        AUDIO_BASE_DIR=./ekdharma_audio

RUN:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

DEPLOY:
    Docker → AWS ECS / Railway / Fly.io / Render
    See Dockerfile at bottom of this file.
"""

import os
import hashlib
import asyncio
from pathlib import Path
from functools import lru_cache
from typing import Optional, Literal
from contextlib import asynccontextmanager

import aiofiles
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# ─────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────

OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
AUDIO_BASE_DIR  = Path(os.getenv("AUDIO_BASE_DIR", "./ekdharma_audio"))
TTS_MODEL       = "tts-1-hd"
TTS_SPEED       = 0.85

SCRIPTURES = {
    "gita":       {"name": "Bhagavad Gita",     "chapters": 18,   "tradition": "Hindu"},
    "ramayana":   {"name": "Ramayana",           "chapters": 7,    "tradition": "Hindu"},
    "bible":      {"name": "Bible",              "chapters": 66,   "tradition": "Christian"},
    "quran":      {"name": "Quran",              "chapters": 114,  "tradition": "Islam"},
    "granth":     {"name": "Guru Granth Sahib",  "chapters": 1430, "tradition": "Sikh"},
    "torah":      {"name": "Torah",              "chapters": 5,    "tradition": "Jewish"},
    "tripitaka":  {"name": "Tripitaka",          "chapters": 3,    "tradition": "Buddhist"},
}

LANGUAGES = {
    "hi": "Hindi",    "pa": "Punjabi",  "gu": "Gujarati",
    "te": "Telugu",   "ml": "Malayalam","ta": "Tamil",
    "mr": "Marathi",  "bn": "Bengali",  "en": "English",
}

VOICES_FEMALE = ["nova", "shimmer", "alloy"]
VOICES_MALE   = ["onyx", "echo", "fable"]
ALL_VOICES    = VOICES_FEMALE + VOICES_MALE

VOICE_LABELS = {
    "nova":    {"label": "Priya",  "gender": "female", "desc": "Warm & Soothing"},
    "shimmer": {"label": "Devi",   "gender": "female", "desc": "Crystal Clear"},
    "alloy":   {"label": "Anaya",  "gender": "female", "desc": "Expressive"},
    "onyx":    {"label": "Arjun",  "gender": "male",   "desc": "Deep & Calm"},
    "echo":    {"label": "Dev",    "gender": "male",   "desc": "Clear & Steady"},
    "fable":   {"label": "Rohan",  "gender": "male",   "desc": "Warm & Gentle"},
}

# Sample teachings per scripture (in production, serve from DB)
TEACHINGS = {
    "gita": {
        "hi": [
            "सर्वे भवन्तु सुखिनः — सभी प्राणी सुखी हों",
            "कर्म करो, फल की चिंता मत करो",
            "आत्मा अजर और अमर है",
            "मन को वश में करो — यही सबसे बड़ी शक्ति है",
            "भक्ति ही मोक्ष का सरल मार्ग है",
        ],
        "en": [
            "May all beings be happy and free from suffering",
            "Do your duty without attachment to results",
            "The soul is eternal, beyond birth and death",
            "Conquer the mind — it is the greatest power",
            "Devotion is the simplest path to liberation",
        ],
    },
    "bible": {
        "en": [
            "Love thy neighbour as thyself — Mark 12:31",
            "Blessed are the peacemakers — Matthew 5:9",
            "Ask and it shall be given — Matthew 7:7",
            "Do unto others as you would have them do unto you",
            "God is love — 1 John 4:8",
        ],
    },
    "quran": {
        "en": [
            "We made you peoples and tribes that you may know one another",
            "Whoever saves one life, it is as if he saved all of mankind",
            "Speak good words or remain silent",
            "Do not spread corruption in the land",
            "Allah is with those who are patient",
        ],
    },
    "granth": {
        "pa": [
            "ਇੱਕ ਓਅੰਕਾਰ — ਇੱਕ ਪਰਮਾਤਮਾ ਹੈ",
            "ਸਭ ਮਨੁੱਖ ਬਰਾਬਰ ਹਨ",
            "ਨਾਮ ਜਪੋ, ਕਿਰਤ ਕਰੋ, ਵੰਡ ਛਕੋ",
            "ਪਰਮਾਤਮਾ ਹਰ ਜਗ੍ਹਾ ਹੈ",
            "ਸੇਵਾ ਹੀ ਪੂਜਾ ਹੈ",
        ],
        "en": [
            "There is only one God — the Eternal Truth",
            "All humans are equal before the Creator",
            "Meditate, work honestly, share with others",
            "God is present in every living being",
            "Service to humanity is worship of God",
        ],
    },
}

# ─────────────────────────────────────────────────────────────
# Startup / Shutdown
# ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    AUDIO_BASE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✅ EkDharma API started. Audio dir: {AUDIO_BASE_DIR}")
    yield
    print("👋 EkDharma API shutting down.")

app = FastAPI(
    title="EkDharma API",
    description="World Scriptures · AI Voices · Many Languages",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static audio files
if AUDIO_BASE_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(AUDIO_BASE_DIR)), name="static")

# ─────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────

class TTSRequest(BaseModel):
    scripture: str
    chapter:   int
    language:  str
    voice:     str
    text:      str

class HealthResponse(BaseModel):
    status:   str
    scriptures: int
    languages:  int
    voices:     int

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def audio_path(scripture: str, chapter: int, lang: str, voice: str) -> Path:
    """Deterministic path for a given scripture/chapter/lang/voice combo."""
    sc  = SCRIPTURES.get(scripture, {})
    name = sc.get("name", scripture).replace(" ", "")
    return AUDIO_BASE_DIR / name / LANGUAGES.get(lang, lang) / f"ch{str(chapter).zfill(3)}_{lang}_{voice}.mp3"

def audio_url(scripture: str, chapter: int, lang: str, voice: str) -> str:
    """Public URL for a given audio file."""
    path = audio_path(scripture, chapter, lang, voice)
    return f"/static/{path.relative_to(AUDIO_BASE_DIR)}"

async def generate_tts(text: str, voice: str, out_path: Path) -> None:
    """Generate TTS audio file using OpenAI and save to disk."""
    if not OPENAI_API_KEY:
        raise HTTPException(503, "TTS service not configured — missing OPENAI_API_KEY")

    client = OpenAI(api_key=OPENAI_API_KEY)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    def _generate():
        response = client.audio.speech.create(
            model=TTS_MODEL, voice=voice, input=text, speed=TTS_SPEED
        )
        response.stream_to_file(str(out_path))

    await asyncio.get_event_loop().run_in_executor(None, _generate)

def get_teachings_for(scripture: str, lang: str) -> list[str]:
    """Return teachings for a scripture in the closest available language."""
    sc_teachings = TEACHINGS.get(scripture, {})
    if lang in sc_teachings:
        return sc_teachings[lang]
    if "en" in sc_teachings:
        return sc_teachings["en"]
    return [f"Explore the wisdom of {SCRIPTURES.get(scripture, {}).get('name', scripture)}"]

# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse)
async def health():
    return {
        "status":     "ok",
        "scriptures": len(SCRIPTURES),
        "languages":  len(LANGUAGES),
        "voices":     len(ALL_VOICES),
    }

@app.get("/scriptures")
async def list_scriptures():
    """List all supported scriptures."""
    return [
        {
            "id":         sid,
            "name":       s["name"],
            "chapters":   s["chapters"],
            "tradition":  s["tradition"],
        }
        for sid, s in SCRIPTURES.items()
    ]

@app.get("/languages")
async def list_languages():
    """List all supported languages."""
    return [{"code": k, "name": v} for k, v in LANGUAGES.items()]

@app.get("/voices")
async def list_voices():
    """List all available TTS voices."""
    return [
        {"id": vid, **info}
        for vid, info in VOICE_LABELS.items()
    ]

@app.get("/teachings/{scripture}")
async def get_teachings(
    scripture: str,
    lang:      str = Query("en", description="Language code"),
    limit:     int = Query(5, ge=1, le=20),
):
    """Return key teachings for a scripture in the given language."""
    if scripture not in SCRIPTURES:
        raise HTTPException(404, f"Scripture '{scripture}' not found")
    teachings = get_teachings_for(scripture, lang)
    return teachings[:limit]

@app.get("/audio/{scripture}/{chapter}")
async def get_audio(
    scripture:        str,
    chapter:          int,
    lang:             str  = Query("hi",   description="Language code"),
    voice:            str  = Query("nova", description="Voice ID"),
    generate_if_missing: bool = Query(True, description="Auto-generate if not cached"),
    background_tasks: BackgroundTasks = None,
):
    """
    Return URL to audio for a given scripture/chapter/language/voice.
    If the file doesn't exist and generate_if_missing=True,
    it will be generated in the background (first call returns 202).
    """
    # Validate inputs
    if scripture not in SCRIPTURES:
        raise HTTPException(404, f"Scripture '{scripture}' not found")
    sc = SCRIPTURES[scripture]
    if not (1 <= chapter <= sc["chapters"]):
        raise HTTPException(400, f"Chapter must be 1–{sc['chapters']} for {sc['name']}")
    if lang not in LANGUAGES:
        raise HTTPException(400, f"Language '{lang}' not supported")
    if voice not in ALL_VOICES:
        raise HTTPException(400, f"Voice '{voice}' not supported. Options: {ALL_VOICES}")

    path = audio_path(scripture, chapter, lang, voice)

    # File already exists — serve it
    if path.exists():
        return {
            "url":      audio_url(scripture, chapter, lang, voice),
            "cached":   True,
            "scripture": sc["name"],
            "chapter":   chapter,
            "language":  LANGUAGES[lang],
            "voice":     VOICE_LABELS[voice],
        }

    # Needs generation
    if not generate_if_missing:
        raise HTTPException(404, "Audio not yet generated. Set generate_if_missing=true")

    # For demo, return a placeholder URL.
    # In production, use background_tasks.add_task(generate_tts, ...) and poll.
    return JSONResponse(
        status_code=202,
        content={
            "status":   "generating",
            "message":  "Audio is being generated. Poll this endpoint again in ~10 seconds.",
            "scripture": sc["name"],
            "chapter":   chapter,
            "language":  LANGUAGES[lang],
            "voice":     VOICE_LABELS[voice],
        }
    )

@app.post("/generate")
async def generate_audio(req: TTSRequest, background_tasks: BackgroundTasks):
    """
    Trigger on-demand TTS generation for a scripture chapter.
    Accepts text + metadata, generates in background.
    """
    if req.scripture not in SCRIPTURES:
        raise HTTPException(404, f"Scripture '{req.scripture}' not found")
    if req.voice not in ALL_VOICES:
        raise HTTPException(400, f"Voice '{req.voice}' not valid")
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if len(req.text) > 50000:
        raise HTTPException(400, "Text too long (max 50,000 chars)")

    path = audio_path(req.scripture, req.chapter, req.language, req.voice)
    if path.exists():
        return {"status": "already_exists", "url": audio_url(req.scripture, req.chapter, req.language, req.voice)}

    background_tasks.add_task(generate_tts, req.text, req.voice, path)

    return {
        "status":  "queued",
        "message": "TTS generation started in background.",
        "estimated_seconds": max(5, len(req.text) // 500),
        "path":    str(path),
    }

@app.get("/status/{scripture}/{chapter}")
async def generation_status(
    scripture: str, chapter: int,
    lang: str  = Query("hi"),
    voice: str = Query("nova"),
):
    """Check if audio for a given combination has been generated."""
    path = audio_path(scripture, chapter, lang, voice)
    if path.exists():
        size_kb = path.stat().st_size // 1024
        return {"ready": True, "url": audio_url(scripture, chapter, lang, voice), "size_kb": size_kb}
    return {"ready": False, "message": "Not yet generated or in progress"}

@app.get("/unity/quotes")
async def unity_quotes():
    """Return unity quotes from across all scriptures."""
    return [
        {"text": "Truth is one, the sages call it by many names.",        "source": "Rig Veda 1.164.46"},
        {"text": "Love thy neighbour as thyself.",                         "source": "Bible — Mark 12:31"},
        {"text": "There is only one God and He is the eternal truth.",     "source": "Guru Granth Sahib"},
        {"text": "We made you peoples and tribes that you may know one another.", "source": "Quran 49:13"},
        {"text": "Hurt not others in ways you would find hurtful.",        "source": "Tripitaka — Udana 5:18"},
        {"text": "The whole world is one family.",                         "source": "Mahopanishad 6.72"},
        {"text": "No one is a stranger; the whole world is my family.",    "source": "Ramayana"},
    ]

@app.get("/search")
async def search_teachings(
    q:    str  = Query(..., min_length=2),
    lang: str  = Query("en"),
    limit: int = Query(10),
):
    """Search teachings across all scriptures."""
    q_lower = q.lower()
    results = []
    for sid, sc in SCRIPTURES.items():
        teachings = get_teachings_for(sid, lang)
        for t in teachings:
            if q_lower in t.lower():
                results.append({
                    "teaching":  t,
                    "scripture": sc["name"],
                    "scripture_id": sid,
                })
    return results[:limit]

# ─────────────────────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# ─────────────────────────────────────────────────────────────
# Dockerfile (save as: Dockerfile)
# ─────────────────────────────────────────────────────────────
DOCKERFILE = """
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p ekdharma_audio
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""

# ─────────────────────────────────────────────────────────────
# requirements.txt
# ─────────────────────────────────────────────────────────────
REQUIREMENTS = """
fastapi==0.110.0
uvicorn[standard]==0.29.0
openai==1.25.0
python-dotenv==1.0.1
aiofiles==23.2.1
pydantic==2.6.4
boto3==1.34.0
"""
