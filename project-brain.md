# PROJECT BRAIN — LitBud

> **What this file is:** The single compact context file for any AI coding tool (Claude Code, Cursor, Codex, Antigravity, etc.) to understand and build this project. Drop this into any tool's context/system prompt.

---

## IDENTITY

- **Project:** Literacy Buddy (LitBud)
- **Tagline:** "Every child's patient, tireless reading buddy"
- **What it is:** An offline AI reading tutor that SEES a book page via camera and HEARS a child read aloud, then coaches them with encouragement and phonics hints.
- **Hackathon:** Gemma 4 Good Hackathon (Kaggle × Google DeepMind)
- **Deadline:** May 18, 2026 at 11:59 PM UTC
- **Team:** Solo developer + AI coding tools
- **Tracks:** Future of Education (primary), Digital Equity (secondary), Ollama prize, Unsloth prize

---

## CORE USER FLOW

```
1. Child opens app on phone
2. Points camera at any book page
3. Gemma 4 vision extracts text (OCR)
4. Text displays on screen, sentence by sentence
5. Child taps "Read" → reads aloud (≤30 sec)
6. Gemma 4 audio transcribes speech
7. Thinking mode compares spoken vs. page text
8. Identifies correct words, skipped words, mispronunciations
9. Generates coaching response (phonics hints, encouragement)
10. Function calling logs accuracy, WPM, vocabulary
11. Progress dashboard shows improvement over time
```

Everything runs **offline via Ollama**. No internet required.

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| **Model** | Gemma 4 E4B-it (instruction-tuned) — supports audio + vision + function calling + thinking |
| **Fine-tuning** | Unsloth QLoRA (r=16, alpha=32) on Kaggle free T4 GPU |
| **Quantization** | GGUF q4_k_m |
| **Model serving** | Ollama (v0.20+) on localhost |
| **Frontend** | React PWA or HTML/JS (browser-based, installable) |
| **Backend** | FastAPI (lightweight) or direct Ollama REST API |
| **Database** | SQLite or IndexedDB (local, zero-config) |
| **Audio capture** | Web Audio API / MediaRecorder |
| **Camera** | getUserMedia API |
| **Book content** | Project Gutenberg (public domain) |

---

## ARCHITECTURE

```
┌──────────────────────────────────────────────┐
│           LitBud App (PWA)              │
│                                              │
│  Camera Module → image                       │
│  Mic Module    → audio (≤30s)                │
│        │              │                      │
│        ▼              ▼                      │
│  ┌─────────────────────────────────────────┐ │
│  │     Gemma 4 E4B via Ollama localhost    │ │
│  │                                         │ │
│  │  1. Vision: image → OCR → page text     │ │
│  │  2. Audio: speech → transcription       │ │
│  │  3. Thinking: compare spoken vs text    │ │
│  │  4. Function calling: track_progress,   │ │
│  │     get_hint, adjust_difficulty,        │ │
│  │     log_session                         │ │
│  │  5. Response: coaching + encouragement  │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Local DB (SQLite/IndexedDB):                │
│  sessions, progress, vocabulary              │
└──────────────────────────────────────────────┘
```

---

## MVP FEATURES (priority order)

1. **Page Capture & OCR** — Camera → Gemma 4 vision → clean text on screen
2. **Listen & Follow** — Record child reading → audio transcription → word highlighting
3. **Gap Detection** — Compare spoken vs. extracted text → find errors/skips
4. **Coaching Response** — Phonics hints, encouragement, simple definitions (2-3 sentences max)
5. **Session Tracking** — Function calling logs accuracy %, WPM, vocabulary
6. **Progress Dashboard** — Charts showing improvement over sessions
7. **Offline First** — Zero internet dependency
8. **Multilingual** — ≥3 languages (English, Spanish, Hindi)

## STRETCH (only if time)

- Comprehension questions after passages
- Vocabulary flashcards
- Parent/teacher reports
- Adaptive difficulty auto-adjust
- TTS for model reading example words aloud

---

## REPO STRUCTURE

```
litbud/
├── README.md
├── LICENSE                    # Apache 2.0
├── requirements.txt
├── package.json
├── docs/
│   ├── architecture.png
│   ├── setup-guide.md
│   └── fine-tuning-guide.md
├── src/
│   ├── backend/
│   │   ├── app.py             # FastAPI entry point
│   │   ├── ollama_client.py   # Ollama API wrapper
│   │   ├── tools.py           # Function calling tool definitions
│   │   ├── prompts.py         # System prompts & templates
│   │   └── database.py        # SQLite progress tracking
│   └── frontend/
│       ├── index.html
│       ├── app.js
│       ├── camera.js
│       ├── audio.js
│       ├── dashboard.js
│       └── styles.css
├── fine-tuning/
│   ├── prepare_dataset.py
│   ├── train.py               # Unsloth QLoRA script
│   ├── evaluate.py
│   └── data/
│       └── training_examples.jsonl
├── notebooks/
│   └── litbud_kaggle.ipynb
└── demo/
    ├── sample_pages/
    └── demo_script.md
```

---

## FUNCTION CALLING TOOLS

```json
{
  "tools": [
    {
      "name": "track_progress",
      "description": "Log reading accuracy and speed for the current session",
      "parameters": {
        "accuracy_percent": "float — percentage of words read correctly",
        "words_per_minute": "float — reading speed",
        "words_attempted": "int — total words in passage",
        "words_correct": "int — correctly read words",
        "struggled_words": "list[str] — words the child struggled with"
      }
    },
    {
      "name": "get_hint",
      "description": "Get a phonics hint for a specific word the child is struggling with",
      "parameters": {
        "word": "str — the word to generate a hint for",
        "difficulty_level": "int (1-5) — child's current reading level"
      }
    },
    {
      "name": "adjust_difficulty",
      "description": "Check if child is ready for harder or easier text based on performance",
      "parameters": {
        "recent_accuracy": "float — average accuracy over last 3 sessions",
        "current_level": "int (1-5)"
      }
    },
    {
      "name": "log_session",
      "description": "Save completed session data to local database",
      "parameters": {
        "date": "str — ISO date",
        "duration_seconds": "int",
        "passages_read": "int",
        "overall_accuracy": "float",
        "new_vocabulary": "list[str]"
      }
    }
  ]
}
```

---

## SYSTEM PROMPT

```
You are Literacy Buddy (LitBud), a patient and encouraging reading tutor for children ages 5-12.

You receive two inputs:
1. Text extracted from a book page (via camera OCR)
2. The child's spoken reading of that text (via microphone)

Your job:
- Compare what the child said to what the page says
- Identify words they read correctly (celebrate these!)
- Identify words they struggled with or skipped
- For struggled words: give a phonics hint (rhyming, sounding out, syllable breakdown)
- Always be warm, encouraging, age-appropriate
- Never be critical or discouraging
- Use simple vocabulary in responses
- Keep responses short (2-3 sentences max)

Available tools: track_progress, get_hint, adjust_difficulty, log_session

Use thinking mode to reason about the best pedagogical approach before responding.
```

---

## GEMMA 4 MODEL CONSTRAINTS

- **Audio input limit:** 30 seconds per clip — design around short passages (1-2 sentences)
- **E4B size:** ~4.5B effective params, ~10GB for QLoRA, smaller quantized
- **Modalities:** Text + Image + Audio + Video (E4B); 26B/31B = text + image only
- **Context window:** 128K tokens (E4B)
- **Function calling:** Native via special tokens
- **Thinking mode:** Built-in chain-of-thought reasoning
- **Multilingual:** 35+ languages, 140+ in training data
- **License:** Apache 2.0
- **Serving:** Ollama v0.20+, also Hugging Face, Google AI Studio, LM Studio

---

## KEY RISKS & MITIGATIONS

| Risk | Fix |
|------|-----|
| Children's speech transcription inaccuracy | Fine-tune on children's audio; fuzzy matching (Levenshtein); "try again" option |
| 30-sec audio too short | 1-2 sentence passages (aligns with reading pedagogy anyway) |
| OCR fails on bad photos | Image pre-processing (contrast/brightness); manual text fallback |
| Model too large for phones | Use E2B (2.3B) or aggressive quantization (q4_0) |
| Ollama doesn't support E4B audio | Verify Day 1; fallback to llama.cpp or AI Studio API |

---

## DAY 1 VALIDATION (do before writing app code)

- [ ] Gemma 4 E4B-it runs via Ollama
- [ ] Ollama accepts audio input for E4B
- [ ] Image of text → accurate OCR via E4B
- [ ] 30-sec audio → transcription via E4B
- [ ] Function calling works via Ollama API
- [ ] Thinking mode works via Ollama API
- [ ] Kaggle T4 loads E4B for Unsloth fine-tuning
- [ ] Inference latency < 10 seconds per turn

---

## BUILD PHASES

| Phase | Days | Focus |
|-------|------|-------|
| 1. Foundation | Days 1-4 | Environment setup, vision pipeline, audio pipeline, connect & validate |
| 2. Core MVP | Days 5-16 | Function calling, coaching responses, frontend UI, Ollama integration, dashboard, testing → **MVP FREEZE** |
| 3. Fine-tuning | Days 17-22 | Dataset prep, Unsloth QLoRA training, GGUF export, A/B evaluation |
| 4. Polish | Days 23-28 | Edge testing, multilingual, performance optimization, bug fixes |
| 5. Submission | Days 29-37 | Demo video, Kaggle writeup, GitHub cleanup, Kaggle notebook, submit May 17 |

---

## SUBMISSION DELIVERABLES

1. **Working demo** — functional prototype
2. **GitHub repo** — clean code, README, architecture diagram, Apache 2.0
3. **Kaggle Writeup** — ~1,500 words, cover image, embedded video
4. **3-min video** — problem → solution → live demo → impact
5. **Kaggle Notebook** — demonstrates model usage, fine-tuning, evaluation

---

## REFERENCE LINKS

| Resource | URL |
|----------|-----|
| Hackathon | https://www.kaggle.com/competitions/gemma-4-good-hackathon |
| Rules | https://www.kaggle.com/competitions/gemma-4-good-hackathon/rules |
| Gemma 4 model card | https://ai.google.dev/gemma/docs/core/model_card_4 |
| Gemma 4 HuggingFace | https://huggingface.co/collections/google/gemma-4-models |
| Ollama Gemma 4 | https://ollama.com/library/gemma4 |
| Unsloth | https://github.com/unslothai/unsloth |
| Project Gutenberg | https://www.gutenberg.org |
| Google AI Studio | https://aistudio.google.com |
