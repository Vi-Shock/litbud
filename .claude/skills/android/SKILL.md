# android/SKILL.md — LitBud Android Component

Load this skill when working in the `android/` directory.

---

## What This Is

A fork of Google AI Edge Gallery (https://github.com/google-ai-edge/gallery, Apache 2.0).
We customize the UI and prompts. We do NOT touch the inference engine.

---

## The #1 Rule

**NEVER modify anything inside the LiteRT-LM inference engine.**
Only touch: Activities, XML layouts, Room database, assets/prompts, and app-level logic.
If a file is inside `engine/`, `litert/`, or `inference/` — read it, never edit it.

---

## Gallery Activities → LitBud Mapping

Understand which Gallery screens become which LitBud screens before writing any code:

| Gallery Activity | Becomes in LitBud | What changes |
|---|---|---|
| Ask Image | Page Capture screen | Prompt → OCR extraction. UI → child-friendly camera view |
| Audio Scribe | Read Aloud screen | Prompt → reading comprehension. UI → 30s record button with timer |
| AI Chat | Coaching Response screen | Prompt → tutor system prompt. UI → speech bubble display |
| Agent Skills | Tool execution layer | Tools → our 4 LitBud tools (track_progress etc.) |
| MainActivity | LitBud home screen | Branding, routing, model download flow |

Do not create new activities from scratch if an existing Gallery activity can be adapted.

---

## LiteRT-LM Constraints (Non-Negotiable)

- Audio clips: **hard limit 30 seconds**. Auto-stop recording at 28s to leave headroom.
- Model RAM: **<1.5GB** via LiteRT-LM. Do not load any other models alongside it.
- Model format: **.litertlm only**. GGUF files from fine-tuning cannot be loaded here.
- Function calling response: comes back as JSON inside the model's text output — parse it, don't expect a separate SDK callback.
- Thinking mode: enabled via system prompt instruction, not a separate API flag.
- Minimum Android API: **24 (Android 7.0)**. Don't use APIs above this without checking.

---

## Room Database Rules

- Two tables only: `progress` (per-passage results) and `sessions` (per-session summary).
- Use **Kotlin Flow**, not LiveData, for dashboard reactive queries.
- Database name: `litbud.db`. Singleton pattern. Never open multiple instances.
- Struggled words and new vocabulary stored as **JSON strings** (no separate join tables for MVP).
- All DB writes happen in the `ToolCallHandler` when function calls arrive from the model.

---

## UI Rules (Children Ages 5–12)

- Minimum text size for reading content: **20sp**. Never smaller.
- Minimum touch target: **56dp** for all interactive elements (larger than Material standard 44dp).
- Maximum actions visible at once: **2** (e.g., "Capture Page" and "Settings").
- Word highlighting: green underline = correct, orange underline = struggling, dotted red = missed.
- Coaching response: display in a rounded speech bubble (24dp radius), not a flat text view.
- Error states: never show raw error messages to the child. Show friendly retry prompts.
- Font: `Nunito` from Google Fonts. Add to `res/font/` or load via Fonts API.

---

## Fuzzy Word Matching Rules

- Library: `apache commons-text` (`LevenshteinDistance`). Add to `build.gradle`.
- Thresholds are **locked**: ≥85 = CORRECT, 60–84 = STRUGGLING, <60 = MISSED.
- Normalize before comparing: lowercase, strip punctuation, trim whitespace.
- Apply comparison **before** sending to LiteRT-LM. The model receives only the identified struggling/missed words — it does NOT do the comparison itself.
- Pass page word list and spoken word list positionally (index-matched).

---

## Function Tool Handling Rules

- Tool calls arrive as JSON in the model response text. Parse with `org.json.JSONObject`.
- Four tools only: `track_progress`, `get_hint`, `adjust_difficulty`, `log_session`.
- `track_progress` and `log_session` → write to Room DB.
- `get_hint` → return value to the coaching response display (no DB write).
- `adjust_difficulty` → persist preference to SharedPreferences, not DB.
- If JSON parsing fails: log the error, show coaching text anyway. Never crash on a tool parse failure.

---

## Build & Test Conventions

- Build: `./gradlew assembleDebug`
- Install: `adb install app/build/outputs/apk/debug/app-debug.apk`
- Logcat filter: `adb logcat -s LitBud:V`
- Unit test fuzzy matching before any UI work: `./gradlew test --tests "*.FuzzyMatcherTest"`
- Always test in **airplane mode** before marking any feature done.
- APK size budget: keep under **150MB** (model downloads separately, not bundled).

---

## What NOT to Do

- Do not add dependencies that require network access at runtime.
- Do not store children's audio recordings anywhere — process and discard immediately.
- Do not add Firebase, Analytics, or any telemetry.
- Do not add stretch features (comprehension questions, flashcards) until Phase 4.
- Do not refactor Gallery's inference pipeline to "improve" it — it works, leave it alone.
