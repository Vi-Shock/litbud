# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LitBud (Literacy Buddy) is an offline AI reading tutor for children ages 5-12, powered by Gemma 4 E4B-it running locally via Ollama. A child points their phone camera at a book page, reads aloud, and receives real-time coaching (phonics hints, encouragement, progress tracking). Built for the Gemma 4 Good Hackathon (deadline: May 18, 2026).

**Target prize tracks:** Future of Education, Digital Equity, Ollama Prize, Unsloth Prize.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Model | Gemma 4 E4B-it (instruction-tuned), quantized to GGUF q4_k_m |
| Model Serving | Ollama v0.20+ (localhost) |
| Fine-tuning | Unsloth QLoRA (r=16, alpha=32) on Kaggle T4 GPU |
| Frontend | React PWA (or HTML/JS) — browser-based, installable |
| Backend | FastAPI (or direct Ollama REST API) |
| Database | SQLite or IndexedDB — offline-native, zero-config |
| Audio/Camera | Web Audio API, MediaRecorder, getUserMedia |

## Architecture

The app is a PWA that communicates with a locally-running Ollama instance:

```
Frontend (PWA)
├── Camera Module → capture book page images
├── Microphone Module → record child reading (≤30 sec clips)
└── Progress Dashboard → session history & charts
    ↓
Ollama (localhost API)
├── Vision: image → OCR → extracted text
├── Audio: speech → transcription
├── Thinking mode: pedagogical reasoning
├── Function calling: track_progress, get_hint, adjust_difficulty, log_session
└── Response: age-appropriate coaching
    ↓
Local Database (SQLite/IndexedDB)
└── Sessions, progress, vocabulary history
```

## Planned Repo Structure

```
src/
├── backend/
│   ├── app.py          # FastAPI entry point
│   ├── ollama_client.py # Ollama API wrapper
│   ├── tools.py        # Function calling tool definitions
│   ├── prompts.py      # System prompts & templates
│   └── database.py     # SQLite progress tracking
└── frontend/
    ├── index.html
    ├── app.js
    ├── camera.js
    ├── audio.js
    ├── dashboard.js
    └── styles.css
fine-tuning/
├── prepare_dataset.py
├── train.py            # Unsloth QLoRA script
├── evaluate.py
└── data/training_examples.jsonl
notebooks/
└── litbud_kaggle.ipynb
```

## Key Design Constraints

- **Offline-first:** Everything must work without internet. No cloud API calls in the core flow.
- **30-second audio limit:** Gemma 4 E4B caps audio input at 30 seconds, so reading passages must be 1-2 sentences.
- **Age-appropriate responses:** Always warm, encouraging, never critical. 2-3 sentences max. Simple vocabulary.
- **Function calling over plain prompting:** Use Gemma 4's native function calling for structured progress data.
- **Performance target:** <10 seconds per interaction on consumer hardware.
- **Multilingual:** Support ≥3 languages (English, Spanish, Hindi minimum).

## Function Calling Tools

Four core tools the model invokes:
- **track_progress** — log accuracy %, WPM, struggled words
- **get_hint** — phonics hint for a specific word (difficulty 1-5)
- **adjust_difficulty** — check if child is ready for harder text
- **log_session** — save completed session to local database

## Strategic Files (Not in Git)

- `project-brain.md` — compact AI context file with full project spec
- `LitBud_Strategy.md` — 37-day execution roadmap, competitive analysis, demo script

These are in `.gitignore` but available locally for reference.
