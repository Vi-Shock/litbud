# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Is

LitBud (Literacy Buddy) is an offline AI reading tutor for children ages 5–12, built for the Gemma 4 Good Hackathon (Kaggle × Google DeepMind, deadline May 18, 2026). A child points their Android camera at a book page, reads aloud, and Gemma 4 E2B coaches them — entirely on-device, no internet.

**Four prize tracks:** Future of Education (primary), Digital Equity (secondary), Ollama special prize, Unsloth special prize.

---

## Architecture (Locked — Do Not Redesign)

Three independent components:

```
android/          → Real product. Forked Google AI Edge Gallery. Kotlin + LiteRT-LM.
ollama/           → Dev environment + Ollama prize track. Ollama + PWA test harness.
fine-tuning/      → Unsloth prize track. QLoRA on Kaggle T4. Exports GGUF for Ollama only.
notebooks/        → litbud_kaggle.ipynb — Kaggle submission notebook.
demo/             → Sample book pages for testing.
```

**The one fact that locks everything:** Gemma 4 audio input only works via LiteRT-LM, not Ollama (llama.cpp issues #21325, #21334). Since LitBud's core is hearing children read, LiteRT-LM on Android is non-negotiable.

**Format incompatibility:** Fine-tuned weights export as GGUF → Ollama only. No GGUF → `.litertlm` converter exists. The Android app uses official Google Gemma 4 E2B weights + prompt engineering, never fine-tuned weights.

---

## Skills (Load Before Working in Each Area)

Each component has a detailed skill. Always invoke before working in that directory:

- **`/android`** — when working in `android/`
- **`/finetuning`** — when working in `fine-tuning/` or `notebooks/litbud_kaggle.ipynb`
- **`/ollama`** — when working in `ollama/`

---

## Build Commands

### Android

**Environment — must export before every build session (not inherited from shell):**
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

```bash
cd android/Android/src
./gradlew assembleDebug                                                    # Build APK
adb install -r app/build/outputs/apk/debug/app-debug.apk                  # Install (use -r to replace)
adb logcat -d -s AndroidRuntime:E LitBud:V                                 # Dump crash logs
adb logcat -s LitBud:V                                                     # Live filtered logs
./gradlew test --tests "*.FuzzyMatcherTest"                                # Fuzzy matching unit tests
```
Always test in airplane mode before marking any feature done.

### Ollama (Dev Environment)
```bash
OLLAMA_ORIGINS=http://localhost:8000 ollama serve                # Start Ollama with CORS
ollama pull gemma4:e2b                                           # Pull base model
ollama create litbud -f ollama/Modelfile                         # Build LitBud model
ollama create litbud-ft -f ollama/Modelfile.finetuned            # Build fine-tuned model
python -m http.server 8000                                       # Serve PWA (from ollama/test_harness/)
```

### Fine-Tuning (Kaggle — runs on T4, not locally)
```bash
python fine-tuning/prepare_dataset.py                            # Generate training JSONL
# Training runs in notebooks/litbud_kaggle.ipynb on Kaggle
# Always fp16=True, bf16=False on T4
```

---

## Key Constraints Summary

| Constraint | Detail |
|---|---|
| Audio per clip | 30-second hard limit → design around 1–2 sentence passages |
| Android API minimum | 24 (Android 7.0) |
| Model RAM | <1.5GB via LiteRT-LM |
| UI font | Nunito, min text 20sp, min touch 56dp |
| DB | Room, two tables only: `progress` + `sessions` |
| Training precision | `fp16=True`, `bf16=False` (T4 has no bfloat16) |
| Ollama API | `/api/generate` for OCR (supports `images[]`), `/api/chat` for coaching (supports `tools`) |
| PWA | Vanilla HTML/CSS/JS only, no build tools, runs via `python -m http.server` |

---

## Function Calling Tools (4 Only)

`track_progress` · `get_hint` · `adjust_difficulty` · `log_session`

Tool calls arrive as JSON in model response text on Android. Parse with `org.json.JSONObject`. `track_progress` and `log_session` write to Room DB. `adjust_difficulty` persists to SharedPreferences. `get_hint` returns to UI only.

---

## Android Audio Rules (Hard-Won)

- `AudioRecord` produces **raw PCM-16 mono at 16 kHz** — never pass this directly to LiteRT-LM.
- LiteRT-LM's internal miniaudio decoder requires a valid **WAV file** (44-byte RIFF header + PCM data). Passing raw PCM throws `LiteRtLmJniException: Failed to initialize miniaudio decoder, error code: -10` (`MA_INVALID_FILE`) and crashes the app.
- Always wrap PCM → WAV before `runInference(audioClips = ...)`. Use `pcmToWav()` in `LitBudViewModel` (mirrors Gallery's `genByteArrayForWav()` in `ChatMessage.kt`).
- The Gallery's own code always calls `genByteArrayForWav()` — check how Gallery handles something before reimplementing it independently.
- `AudioRecord` lifecycle race condition: the UI stop-button and the IO recording coroutine both touch the same `AudioRecord`. Always guard `recorder.stop()` / `recorder.release()` with a `recordingState` check + `try-catch(IllegalStateException)` — the UI may have already released the recorder before the coroutine loop exits.

---

## Bug Fix Log

| Date | Bug | Root Cause | Fix |
|------|-----|-----------|-----|
| 2026-04-16 | App crash on Stop Recording | Race: UI thread released `AudioRecord` while IO coroutine still looped; coroutine called `stop()` on released instance → `IllegalStateException` | Guard `stop()/release()` in `recordAudio()` with state check + try-catch — `LitBudScreen.kt` |
| 2026-04-16 | App crash after stop — `miniaudio error -10` | Raw PCM bytes passed to `runInference(audioClips)` without WAV header; LiteRT-LM miniaudio decoder requires valid WAV file | Added `pcmToWav()` helper in `LitBudViewModel.kt`; wraps PCM in 44-byte RIFF/WAV header before inference |

---

## What Never to Touch

- Anything inside `engine/`, `litert/`, or `inference/` in the Android fork — the inference pipeline is Google's, leave it unchanged.
- Do not attempt GGUF → `.litertlm` conversion — no converter exists.
- Do not add Firebase, analytics, or telemetry.
- Do not store children's audio recordings — process and discard immediately.
- Do not add features beyond MVP scope until Phase 4 (post-May 5).
