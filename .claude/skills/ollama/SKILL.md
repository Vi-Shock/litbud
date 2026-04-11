# ollama/SKILL.md — LitBud Dev Environment + Ollama Prize Track

Load this skill when working in the `ollama/` directory.

---

## What This Is

Two purposes in one folder:
1. **Dev environment** — test and iterate on prompts without rebuilding the Android app
2. **Ollama prize track** — a documented Modelfile + working demo qualifies for the special Ollama prize (~$10K)

This is NOT the real product. The real product is the Android app. Keep that clear in all documentation.

---

## Critical Limitation (Always Document This)

**Ollama cannot process native audio input from Gemma 4.**
llama.cpp has not implemented the Gemma 4 audio encoder (issues #21325, #21334).

The PWA test harness uses the **Web Speech API** (browser speech-to-text) as a workaround.
This means the PWA requires Chrome and an internet connection for speech recognition.
This is a dev tool limitation — the Android app uses LiteRT-LM for true on-device audio.
Always state this distinction clearly in code comments and the README.

---

## Ollama API Rules

- Base URL: `http://localhost:11434`
- Use `/api/generate` (not `/api/chat`) when passing image data for OCR — it supports the `images[]` field cleanly.
- Use `/api/chat` for the coaching call (Call 3) — it supports `tools` for function calling.
- Always `"stream": false` in the PWA test harness. Streaming adds complexity, not needed for testing.
- Temperature for OCR calls: `0.1` (deterministic). Temperature for coaching: `0.7`.
- Function calling in Ollama v0.20 is **buggy** — if tools don't fire consistently, fall back to parsing tool JSON from the response text manually.

---

## 3-Call Architecture (Locked)

The PWA makes exactly 3 calls per reading interaction. Do not combine them.

| Call | Endpoint | Input | Output |
|---|---|---|---|
| 1 | `/api/generate` | Book page image (base64) | Extracted page text |
| 2 | Web Speech API | Browser microphone | Transcribed spoken text (NOT Ollama) |
| 3 | `/api/chat` | Page text + spoken text + tool defs | Coaching response + tool calls |

Between Call 2 and Call 3: run JavaScript Levenshtein comparison to identify struggling words, then pass only those words in Call 3's prompt.

---

## PWA Structure Rules

- Single HTML file entry point: `test_harness/index.html`
- No build tools, no npm, no node_modules. Vanilla HTML/CSS/JS only.
- Separate JS files for concerns: `camera.js`, `speech.js`, `api.js`, `fuzzy.js`
- Must run from a local server (`python -m http.server 8000`) — NOT file:// — because Web Speech API and camera require a secure origin (localhost counts as secure).
- CORS: Ollama's default config blocks cross-origin requests. Add `OLLAMA_ORIGINS=http://localhost:8000` to environment before starting Ollama.

---

## Modelfile Rules (Ollama Prize Track)

- File lives at `ollama/Modelfile`. This is what judges will look at for the prize.
- Base model: `gemma4:e2b` (pulled via `ollama pull gemma4:e2b`).
- Must include the full LitBud system prompt as the `SYSTEM` block.
- Set `PARAMETER temperature 0.7` and `PARAMETER num_ctx 8192`.
- After building the fine-tuned GGUF (Phase 3), create a second file `ollama/Modelfile.finetuned` that uses the GGUF path instead of the base model.
- Custom model name for judging: `litbud` (base) and `litbud-ft` (fine-tuned).

---

## Prompt Testing Workflow

When iterating on the system prompt via the PWA:
1. Edit `ollama/prompts/tutor_system.txt`
2. Rebuild the Ollama model: `ollama create litbud -f ollama/Modelfile`
3. Run 5 standard test cases (defined in `ollama/prompts/test_cases.txt`)
4. Only update `android/assets/prompts/tutor_system.txt` when all 5 pass

The 5 required test cases:
- Perfect reading → model celebrates, calls `track_progress(100, wpm, [])`
- One word missed → phonics hint for that word
- Multiple errors → focuses on worst 1–2, stays encouraging
- Non-English text (Hindi) → responds appropriately, doesn't switch to English
- Function calling fires → response JSON includes `tool_calls` array

---

## What NOT to Do

- Do not try to implement audio in the PWA using Ollama — it won't work.
- Do not use `stream: true` in the test harness — parse errors are harder to debug.
- Do not add authentication, user accounts, or persistence to the PWA — it's a dev tool.
- Do not deploy the PWA anywhere publicly — it's internal tooling only.
- Do not claim the PWA is the product in any documentation or writeup.
