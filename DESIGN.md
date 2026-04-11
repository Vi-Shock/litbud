# Literacy Buddy (LitBud) — Project Documentation

> *Every child's patient, tireless reading buddy — powered by Gemma 4, running offline on any phone.*

---

## The Problem

**250 million children** worldwide cannot read at a basic proficiency level (UNESCO, 2024). In sub-Saharan Africa, **9 out of 10 children** cannot read a simple sentence by age 10. The global teacher shortage exceeds 44 million, and in many regions the teacher-to-student ratio surpasses 1:80.

Private tutoring costs $50–200/month — beyond what most affected families earn. Existing educational apps require stable internet, which 2.6 billion people lack. The children who need help most are the least likely to get it.

**Core problem:** A child in a low-resource community has to teach themselves to read because there is no teacher, no affordable tutoring, and no app that works without internet.

---

## The Solution

LitBud transforms any Android phone into an adaptive, offline reading tutor. A child points their camera at any book, reads aloud, and receives real-time coaching — pronunciation help, phonics hints, encouragement, and progress tracking. Everything runs on-device. No internet. No subscription. No teacher required.

### How it works

```
1. Child opens LitBud on any Android phone (airplane mode is fine)
2. Points camera at any book or textbook page
3. Gemma 4 E2B vision extracts text from the page (OCR)
4. Clean text appears on screen, highlighted sentence by sentence
5. Child taps "Read" and reads the first sentence aloud
6. Gemma 4 E2B processes the child's speech natively on-device (up to 30 sec)
7. Thinking mode compares spoken words to extracted text
8. Model identifies correctly read words, skipped words, and mispronunciations
9. Generates age-appropriate coaching response:
   - Celebration for correct reading
   - Phonics hint for struggled words
   - Simple definition if requested
10. Function calling logs accuracy, words per minute, and vocabulary
11. Progress dashboard shows improvement over sessions
```

### Why Gemma 4 makes this possible

Previous approaches to AI-powered reading tutoring required cloud connectivity, expensive APIs, and separate models for speech recognition, OCR, and language understanding. Gemma 4's E2B model unifies all of these in a single model that runs entirely on a phone:

| Gemma 4 Feature | How LitBud Uses It |
|-----------------|-------------------|
| **Audio input** | Processes child reading aloud — the core interaction |
| **Vision input** | OCR of textbook pages via camera |
| **Thinking mode** | Reasons about pedagogical approach before responding |
| **Function calling** | Tracks progress, retrieves hints, adjusts difficulty |
| **Multilingual** (35+) | Supports reading tutoring in Hindi, Tamil, Telugu, English, Spanish, and more |
| **On-device** (E2B) | Runs offline with <1.5GB RAM via LiteRT-LM |
| **128K context** | Maintains session history for adaptive responses |

---

## Technical Architecture

LitBud is built as a fork of Google's open-source **AI Edge Gallery** app, which provides a production-ready on-device inference engine via **LiteRT-LM**. We customize the user interface and prompts for the reading tutor experience while leveraging Google's proven inference pipeline.

```
┌───────────────────────────────────────────────────┐
│  LitBud Android App                               │
│  (forked from Google AI Edge Gallery)              │
│                                                    │
│  Camera ──→ Gemma 4 E2B (on-device via LiteRT-LM) │
│  Mic    ──→   ↓ vision: OCR page text              │
│               ↓ audio: transcribe child's speech   │
│               ↓ thinking: compare spoken vs text    │
│               ↓ tools: track_progress, get_hint    │
│               ↓ response: coaching + encouragement  │
│                                                    │
│  Local SQLite: progress, vocabulary, sessions       │
│  100% offline · Airplane mode ✈️                    │
└───────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **On-device model** | Gemma 4 E2B-it via LiteRT-LM | Full multimodal: audio + vision + function calling in one model |
| **App framework** | Android (Kotlin), forked from AI Edge Gallery | Google's recommended on-device deployment path |
| **Database** | SQLite via Android Room | Zero-config, offline-native |
| **Development** | Ollama on Mac for prompt engineering | Fast iteration without rebuilding the Android app |
| **Fine-tuning** | Unsloth QLoRA on Kaggle T4 GPU | Specialized coaching responses for the desktop deployment |

### Why LiteRT-LM (not Ollama) on-device

Gemma 4 E2B supports native audio input — the model directly processes speech without a separate speech-to-text step. However, this audio capability is currently only available through Google's LiteRT-LM runtime on Android. Ollama and llama.cpp have not yet implemented Gemma 4's audio encoder. Since LitBud's core interaction is hearing a child read aloud, LiteRT-LM is the only viable on-device runtime.

### Dual deployment

LitBud supports two deployment modes:

1. **On-device (primary):** Forked AI Edge Gallery app with LiteRT-LM and official Gemma 4 E2B weights. Full multimodal including native audio. Works in airplane mode.
2. **Desktop via Ollama:** Fine-tuned GGUF model served through Ollama. Text + vision capabilities. For development, testing, and demonstrating model customization.

---

## Features

### Core (MVP)

1. **Page Capture & OCR** — Camera → Gemma 4 vision → clean text on screen
2. **Listen & Follow** — Child reads aloud → native audio → word highlighting
3. **Gap Detection** — Compare spoken vs extracted text → identify errors
4. **Coaching Response** — Phonics hints, encouragement (2-3 sentences, age-appropriate)
5. **Session Tracking** — Function calling logs accuracy, WPM, vocabulary per session
6. **Progress Dashboard** — Visual charts showing reading improvement
7. **Offline First** — 100% on-device, works in airplane mode
8. **Multilingual** — English, Hindi, Tamil at minimum

### Future Enhancements

- Comprehension questions after reading passages
- Vocabulary flashcard generator
- Parent/teacher summary reports
- Adaptive difficulty auto-adjustment

---

## Design Decisions

### Why short passages (1–2 sentences)?

Gemma 4's audio input supports 30 seconds per clip. Rather than treating this as a limitation, we embraced it: reading pedagogy research shows beginning readers benefit most from short, focused practice with immediate feedback. This matches evidence-based tutoring methodology.

### Why fork the AI Edge Gallery?

Building a native Android app with LiteRT-LM from scratch would require significant Kotlin development. Google's AI Edge Gallery is an open-source app (Apache 2.0) that already integrates LiteRT-LM with vision, audio, thinking mode, and function calling. Forking it gives us a production-ready inference engine and lets us focus on the reading tutor experience rather than low-level model serving.

### Why not a chatbot?

Most AI education tools are text-in/text-out chatbots. LitBud is fundamentally different: it SEES the book (vision) and HEARS the child (audio). This multimodal approach mirrors how a human reading tutor works — sitting next to the child, looking at the same page, listening to them read.

---

## Fine-Tuning

We fine-tune Gemma 4 E2B using **Unsloth QLoRA** to specialize coaching responses for the desktop Ollama deployment:

- **Dataset:** ~500 supervised examples of reading tutoring interactions
- **Training:** QLoRA (r=16, alpha=32) on Kaggle T4 GPU
- **Export:** GGUF format for Ollama deployment
- **Note:** The on-device app uses Google's official E2B weights with carefully crafted system prompts, as the fine-tuned GGUF format is not compatible with LiteRT-LM's `.litertlm` format

---

## Data Sources

| Data | Source | License |
|------|--------|---------|
| Children's book pages | Project Gutenberg | Public domain |
| Children's reading audio (fine-tuning) | Common Voice, LibriSpeech | CC / Open |
| Pedagogical response templates | Manually authored | Original |
| Word definitions | Wiktionary | CC BY-SA |

---

## Impact Potential

**Scale:** 250 million children who cannot read at basic proficiency.

**Cost:** $0 per child. Apache 2.0 licensed. Runs on mid-range Android phones (6GB+ RAM, 2023+). Model downloads once over WiFi, then works offline forever.

**Deployment path:** Partner with education NGOs (UNICEF, Room to Read, Pratham) for distribution. Zero infrastructure needed — no servers, no accounts, no ongoing costs.

**Language reach:** Gemma 4 supports 35+ languages out of the box, including Hindi, Tamil, Telugu, Bengali, and other Indian languages — covering regions with the highest concentrations of children who cannot read.

---

## References

- UNESCO Institute for Statistics — Global literacy data: https://uis.unesco.org/en/topic/literacy
- Gemma 4 model documentation: https://ai.google.dev/gemma/docs/core/model_card_4
- Google AI Edge Gallery: https://github.com/google-ai-edge/gallery
- LiteRT-LM SDK: https://github.com/google-ai-edge/LiteRT-LM
- Project Gutenberg: https://www.gutenberg.org
- Unsloth: https://github.com/unslothai/unsloth

---

## License

Apache 2.0 — Free to use, modify, and distribute.
