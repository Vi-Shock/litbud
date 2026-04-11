# Literacy Buddy (LitBud) — Project Documentation

> *Every child's patient, tireless reading buddy — powered by Gemma 4, running offline on any phone.*

---

## The Problem

**250 million children** worldwide cannot read at a basic proficiency level (UNESCO, 2024). In sub-Saharan Africa, **9 out of 10 children** cannot read a simple sentence by age 10. The global teacher shortage exceeds 44 million, and in many regions the teacher-to-student ratio surpasses 1:80.

Private tutoring — the most effective intervention for reading — costs $50–200/month, far beyond what most affected families earn. Existing educational apps require stable internet connections, which 2.6 billion people still lack. Children who need help the most are the least likely to get it.

**Core problem statement:** A child in a low-resource community has to teach themselves to read because there is no teacher available, no tutoring they can afford, and no app that works without internet.

---

## The Solution

LitBud transforms any smartphone into an adaptive, offline reading tutor. A child points their camera at any book, reads aloud, and receives real-time coaching — pronunciation help, phonics hints, encouragement, and progress tracking. Everything runs locally on-device. No internet. No subscription. No teacher required.

### How it works

```
1. Child opens LitBud on any Android phone
2. Points camera at any book or textbook page
3. Gemma 4 vision extracts text from the page (OCR)
4. Clean text appears on screen, highlighted sentence by sentence
5. Child taps "Read" and reads the first sentence aloud
6. Gemma 4 audio processes the child's speech (up to 30 seconds)
7. Thinking mode compares spoken words to extracted text
8. Model identifies: correctly read words, skipped words, mispronounced words
9. Generates age-appropriate coaching response:
   - Celebration for correct reading
   - Phonics hint for struggled words ("This word sounds like 'hat' but starts with M")
   - Simple definition if requested
10. Function calling logs: accuracy %, words per minute, vocabulary encountered
11. Child continues to next sentence
12. After session: progress dashboard shows improvement over time
```

### Why Gemma 4 makes this possible

Previous approaches to AI-powered reading tutoring required cloud connectivity, expensive APIs, and separate models for speech recognition, OCR, and language understanding. Gemma 4's E4B model unifies all of these capabilities in a single model that runs on consumer hardware:

| Gemma 4 Feature | How LitBud Uses It |
|-----------------|------------------------|
| **Audio input** | Processes child reading aloud — the core interaction |
| **Vision input** | OCR of textbook pages via camera — reads any physical book |
| **Thinking mode** | Reasons about pedagogical approach before responding |
| **Native function calling** | Tracks progress, retrieves hints, adjusts difficulty |
| **Multilingual** (35+ languages) | Supports reading tutoring across languages |
| **Edge deployment** (E4B) | Runs offline on consumer hardware via Ollama |
| **128K context** | Maintains session history for adaptive responses |
| **Structured output** | JSON responses for progress tracking |

---

## Target Users

**Primary:** Children ages 5–12 in low-resource settings — developing countries, refugee camps, under-resourced schools — who are learning to read but lack access to a teacher or tutor.

**Secondary:** Parents and teachers in these settings who want to support reading development but lack training or time for 1-on-1 tutoring.

---

## Technical Architecture

```
┌──────────────────────────────────────────────────┐
│            LitBud App (PWA)                  │
│                                                    │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐   │
│  │  Camera   │   │   Mic    │   │  Progress    │   │
│  │  Module   │   │  Module  │   │  Dashboard   │   │
│  └────┬──────┘   └────┬─────┘   └──────┬───────┘   │
│       │               │                │            │
│  ┌────▼───────────────▼────────────────▼─────────┐ │
│  │        Gemma 4 E4B (via Ollama localhost)      │ │
│  │                                                │ │
│  │  1. Vision Pipeline:                           │ │
│  │     Image → OCR → Text Extraction              │ │
│  │                                                │ │
│  │  2. Audio Pipeline:                            │ │
│  │     Child's speech → Transcription             │ │
│  │                                                │ │
│  │  3. Reasoning (Thinking Mode):                 │ │
│  │     Compare spoken words ↔ page text           │ │
│  │     → Identify gaps/errors                     │ │
│  │     → Select pedagogical strategy              │ │
│  │                                                │ │
│  │  4. Function Calling:                          │ │
│  │     • track_progress(accuracy, wpm, words)     │ │
│  │     • get_hint(word, difficulty_level)          │ │
│  │     • adjust_difficulty(performance_history)    │ │
│  │     • log_session(date, duration, scores)       │ │
│  │                                                │ │
│  │  5. Response Generation:                       │ │
│  │     Age-appropriate coaching + encouragement    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Local SQLite / IndexedDB:                      │  │
│  │  Progress history, vocabulary log, session data  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Model** | Gemma 4 E4B-it (instruction-tuned) | Supports audio + vision + function calling in a single model |
| **Fine-tuning** | Unsloth QLoRA (r=16, alpha=32) | Efficient fine-tuning for children's reading interaction patterns |
| **Quantization** | GGUF q4_k_m | Optimal size-to-quality ratio for edge deployment |
| **Model serving** | Ollama (v0.20+) | Simple local API, cross-platform, well-documented |
| **Frontend** | React (PWA) or HTML/JS | Browser-based, installable, cross-platform |
| **Backend** | FastAPI or direct Ollama REST API | Minimal overhead; runs on same device as model |
| **Database** | SQLite or IndexedDB | Zero-config, offline-native, no external dependencies |
| **Audio** | Web Audio API / MediaRecorder | Browser-native, no additional libraries |
| **Camera** | getUserMedia API | Browser-native camera access |

---

## Features

### Core (MVP)

1. **Page Capture & OCR** — Camera photographs printed text → Gemma 4 vision extracts clean text → displays on screen
2. **Listen & Follow** — Child reads aloud (≤30 sec per passage) → audio processed → words highlighted as recognized
3. **Gap Detection** — Model compares spoken output to extracted text → identifies skipped/mispronounced/struggled words
4. **Coaching Response** — Age-appropriate encouragement + specific help (phonics hints, rhyming, simple definitions)
5. **Session Tracking** — Function calling logs accuracy, words per minute, vocabulary growth per session
6. **Progress Dashboard** — Visual charts showing reading improvement over time
7. **Offline First** — Complete functionality with zero internet connectivity
8. **Multilingual** — Support for English, Spanish, and Hindi at minimum

### Future Enhancements

- Comprehension questions after reading passages
- Vocabulary flashcard generator from encountered words
- Parent/teacher summary reports
- Adaptive difficulty that auto-adjusts reading level
- Text-to-speech for model reading example words aloud

---

## Design Decisions

### Why short passages (1–2 sentences)?

Gemma 4's audio input supports up to 30 seconds per clip. Rather than treating this as a limitation, we embraced it: reading pedagogy research shows that beginning readers benefit most from short, focused practice with immediate feedback. Reading 1–2 sentences at a time, getting feedback, and then continuing matches evidence-based tutoring methodology.

### Why offline-first?

The children who need LitBud most are those without reliable internet access. Building offline-first isn't a nice-to-have — it's the entire point. By serving Gemma 4 E4B locally via Ollama, we ensure the tool works in rural villages, refugee camps, and anywhere a phone exists.

### Why function calling instead of simple prompting?

We use Gemma 4's native function calling (not just text generation) for progress tracking because it produces structured, reliable data that can be stored and visualized. This enables the progress dashboard, adaptive difficulty, and session history features — turning a single interaction into a longitudinal learning tool.

### Why not a chatbot?

Most AI education tools are text-in/text-out chatbots. LitBud is fundamentally different: it SEES the book (vision) and HEARS the child (audio). This multimodal approach mirrors how a human reading tutor works — sitting next to the child, looking at the same page, listening to them read. The interaction model is tutoring, not chat.

---

## Fine-Tuning Approach

We fine-tune Gemma 4 E4B using **Unsloth QLoRA** to improve performance on our specific use case:

**Training data:** ~500 supervised examples of reading tutoring interactions, formatted as:
- Input: extracted page text + child's speech transcription (with errors)
- Output: pedagogically appropriate coaching response

**Hyperparameters:** QLoRA with r=16, alpha=32, trained on Kaggle's free T4 GPU.

**Export:** Fine-tuned adapter merged and exported to GGUF (q4_k_m quantization) for Ollama deployment.

**Evaluation:** A/B comparison of fine-tuned vs. base model on 20 held-out test cases, measuring response quality, age-appropriateness, and pedagogical accuracy.

---

## Data Sources

| Data | Source | License |
|------|--------|---------|
| Children's book pages for demo | Project Gutenberg | Public domain |
| Children's reading audio (fine-tuning) | Common Voice, LibriSpeech | CC / Open |
| Pedagogical response templates | Manually authored | Original |
| Word definitions | Wiktionary | CC BY-SA |

---

## Impact Potential

**Scale:** 250 million children who cannot read at basic proficiency; 773 million illiterate adults who could use a similar tool.

**Cost:** $0 per child. The model is Apache 2.0 licensed. Ollama is free. The app runs in a browser. The only requirement is a phone.

**Deployment path:** Partner with education-focused NGOs (UNICEF, Room to Read, Save the Children, Pratham) and local education ministries for distribution. The tool requires zero infrastructure — no servers, no accounts, no training.

**Sustainability:** No ongoing costs. Once installed, the tool works indefinitely without any external dependency.

---

## References

- UNESCO Institute for Statistics — Global literacy data: https://uis.unesco.org/en/topic/literacy
- Gemma 4 model documentation: https://ai.google.dev/gemma/docs/core/model_card_4
- Project Gutenberg — Public domain children's literature: https://www.gutenberg.org
- Ollama — Local model serving: https://ollama.com
- Unsloth — Efficient fine-tuning: https://github.com/unslothai/unsloth

---

## License

Apache 2.0 — Free to use, modify, and distribute.
