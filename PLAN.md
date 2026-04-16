# PLAN.md — LitBud (Literacy Buddy)

> **What:** Offline AI reading tutor for children ages 5-12, built for the Gemma 4 Good Hackathon.
> **Why:** 250 million children can't read at basic proficiency. No teacher, no affordable tutor, no offline app. LitBud turns any Android phone into a patient reading buddy using Gemma 4 E2B — camera sees the book, mic hears the child, model coaches them. 100% on-device, airplane mode, $0.
> **Deadline:** May 18, 2026 23:59 UTC (May 19 5:29 AM IST). Self-imposed submit: **May 17**.
> **Tracks:** Future of Education (primary), Digital Equity (secondary), Ollama special prize, Unsloth special prize.

---

## Current Status

**Last updated:** Apr 16, 2026
**Phase:** Phase 2 — Feature 1 scaffold complete
**Next task:** Feature 1 completion — phone test when phone available + then Feature 2 (FuzzyMatcher + audio)
**Blockers:** Moto G54 5G has chipset issues. Alternative Android phone pending. APK install/phone test blocked until phone resolved.
**Notes:** Gallery minSdk=31 (Android 12) — overrides CLAUDE.md's API 24. Java 21 required for LiteRT-LM builds (added to .zshrc).
**Days remaining:** 31 (Apr 16 - May 17)

---

## Locked Decisions (from Q&A — do not revisit)

### Hardware & Environment
- **Mac:** Apple Silicon 16GB+ — runs Claude Code + Ollama + Android SDK locally
- **Phone (primary):** Moto G54 5G, 8GB RAM, MediaTek Dimensity 7020, Android 13/14
- **Phone (backup):** Moto G32 (likely 4-6GB RAM — probably too small for E2B)
- **Phone fallback:** If Moto G54 is too slow (<5 tok/s), borrow a Snapdragon phone for free
- **Build toolchain:** Command-line only — `./gradlew` + `adb` from Mac terminal. No Android Studio GUI.
- **Android SDK:** Install CLI tools on Mac (sdkmanager, platform-tools, build-tools)
- **Ollama:** Runs on Mac locally for prompt iteration
- **Claude Code:** Local Mac terminal — primary coding tool for ALL code

### Person
- Product owner with tech background. Zero Kotlin, zero Android dev experience.
- Claude Code writes all code. User reviews, tests on phone, and makes product decisions.
- **Available time:** 3-4 hours/day
- **Timezone:** IST (UTC+5:30)
- **Budget:** Minimal ($0 target). Borrow phone if needed. Kaggle free tier.

### Architecture (locked — from CLAUDE.md)
- **Android app:** Forked Google AI Edge Gallery (Kotlin). LiteRT-LM runtime. Gemma 4 E2B-it.
- **Dev environment:** Ollama + PWA test harness on Mac. Web Speech API for audio workaround.
- **Fine-tuning:** Unsloth QLoRA on Kaggle T4 (fp16 only). Export Q4_K_M GGUF for Ollama.
- **Format wall:** No GGUF-to-.litertlm converter. Android uses official Google weights + prompt engineering.
- **Never touch:** `engine/`, `litert/`, `inference/` directories in the Gallery fork.

### Scope (MVP freeze Day 16 = April 29)
- **Languages:** English-only for MVP. Hindi + Tamil added in Phase 4.
- **Word highlighting:** Bold text (SpannableString + StyleSpan) in MVP. Colored underlines (green/orange/red) in Phase 4.
- **Dashboard:** Single accuracy-over-time line chart. No vocabulary list, no streaks, no session history until Phase 4.
- **PWA:** Screenshot-worthy for writeup, not judge-interactive. Half-day polish in Phase 4.
- **No stretch features:** No comprehension questions, no flashcards, no parent reports until after submission.

### Fine-Tuning
- **Dataset:** 25 gold examples (Claude drafts, user reviews) + template-expand to 500 via `prepare_dataset.py`
- **Book passages:** Claude curates from Project Gutenberg children's section
- **Kaggle dataset:** Create new public dataset "litbud-reading-tutor-examples" with training JSONL
- **Before/after metric:** Qualitative side-by-side (5 prompts) + 3-dimension rubric (warmth 1-5, hint quality 1-5, tool use accuracy 1-5) with bar chart
- **GGUF distribution:** Local build with reproduction instructions in README. Ollama Hub only if spare time on Day 35.

### Submission
- **GitHub repo:** No model files — download instructions linking HuggingFace and Ollama
- **Demo video format:** Decide in Phase 5
- **Airplane mode timing:** Decide in Phase 5
- **Video hosting:** Decide in Phase 5
- **Cover image:** Claude creates HTML/CSS mockup, user screenshots
- **Demo reader:** Decide in Phase 5 (adult or child with permission). Child testing available 1-2 times.

### Fallback Decisions
- **Audio inaccurate:** Spend days debugging (prompts, fuzzy thresholds, thinking mode). Reassess timeline dynamically — no pre-committed limit.
- **Gallery fork won't build:** 2-day time-box (Days 3-4). Debug using Gallery's GitHub issues. If not resolved by end of Day 4, build from scratch with LiteRT-LM SDK.
- **Phone too slow:** Borrow Snapdragon phone for free. LAN demo is rejected — breaks offline narrative.

---

## Timeline Overview

| Phase | Days | Dates | Duration | Focus |
|-------|------|-------|----------|-------|
| 0 | 0 | Apr 12-13 | 2 days | Phone validation (tonight) |
| 1 | 1-4 | Apr 14-17 | 4 days | Full validation + dev environment setup |
| 2 | 5-16 | Apr 18-29 | 12 days | Core MVP (6 features) → **MVP FREEZE** |
| 3 | 17-22 | Apr 30 - May 5 | 6 days | Fine-tuning + Ollama prize track |
| 4 | 23-27 | May 6-10 | 5 days | Polish, multilingual, UX, testing |
| 5 | 28-34 | May 11-17 | 7 days | Video, writeup, notebook, repo → **SUBMIT** |

---

## Phase 0: Phone Validation (Apr 12-13, before plan starts)

### Day 0 — Tonight

- [ ] Install AI Edge Gallery from Play Store on Moto G54 5G
- [ ] Download Gemma 4 E2B model within the app
- [ ] Test Ask Image (vision/OCR) — take photo of a book page, confirm text extraction
- [ ] Test Audio Scribe (audio) — speak a sentence, confirm transcription
- [ ] Test AI Chat with thinking mode — confirm thinking trace visible
- [ ] Test Agent Skills (function calling) — confirm tool calls in response
- [ ] Toggle airplane mode ON → confirm all of the above still work
- [ ] Measure inference speed — is coaching response under 10 seconds? Note tok/s.
- [ ] **GATE:** If all pass → proceed to Day 1. If audio fails or speed <5 tok/s → arrange to borrow Snapdragon phone before Day 1.

---

## Phase 1: Validation + Environment Setup (Days 1-4, Apr 14-17)

### Day 1 (Apr 14) — Mac dev environment

- [x] Install Ollama on Mac: `brew install ollama`
- [x] Pull Gemma 4 E2B: `ollama pull gemma4:e2b`
- [x] Test text generation: `ollama run gemma4:e2b "Hello"`
- [x] Test vision: send a base64 image via `/api/generate` with `images[]`
- [x] Start Ollama with CORS: `OLLAMA_ORIGINS=http://localhost:8000 ollama serve`
- [x] Install Android SDK command-line tools on Mac via Homebrew: `brew install --cask android-commandlinetools`
- [x] Install platform-tools (adb): `sdkmanager "platform-tools"`
- [x] Install build-tools: `sdkmanager "build-tools;34.0.0"`
- [x] Install Android platform: `sdkmanager "platforms;android-34"`
- [x] Accept licenses: `sdkmanager --licenses`
- [x] Set `ANDROID_HOME` in shell profile
- [ ] Enable USB debugging on Moto G54 5G (Settings → Developer Options)
- [ ] Connect phone via USB, verify `adb devices` shows the phone
- [ ] **GATE:** `adb devices` lists the phone AND Ollama runs gemma4:e2b

### Day 2 (Apr 15) — System prompt + Ollama dev workflow

- [x] Create directory structure: `ollama/prompts/`, `ollama/test_harness/`, `demo/sample_pages/`
- [x] Write `ollama/prompts/tutor_system.txt` — the LitBud system prompt (from strategy doc, refined)
- [x] Write `ollama/Modelfile` — `FROM gemma4:e2b`, `SYSTEM` block from tutor_system.txt, `PARAMETER temperature 0.7`, `PARAMETER num_ctx 8192`
- [x] Build LitBud model: `ollama create litbud -f ollama/Modelfile`
- [x] Test 5 prompts manually via `ollama run litbud` — perfect reading, one error, multiple errors, Hindi text, function calling
- [x] Iterate on system prompt until responses are warm, age-appropriate, and include tool calls
- [x] Write `ollama/prompts/test_cases.txt` — the 5 required test cases with expected behavior
- [x] Source 5 sample book pages from Project Gutenberg (children's level, public domain) → save to `demo/sample_pages/`
- [x] **GATE:** `ollama run litbud` produces good coaching responses for all 5 test cases

### Day 3 (Apr 16) — Fork AI Edge Gallery + first build

- [x] Fork `google-ai-edge/gallery` on GitHub → https://github.com/Vi-Shock/gallery
- [x] Clone fork into `android/` directory
- [x] Read Gallery's README and build instructions
- [x] Attempt first build: `cd android/Android/src && ./gradlew assembleDebug`
  - Fixed: Java 21 required (LiteRT-LM JAR is class file v65.0). Installed via `brew install openjdk@21`. Added JAVA_HOME to .zshrc.
  - Note: Gallery minSdk=31, not 24. Build directory is `android/Android/src/`, not `android/`.
  - APK produced: `app/build/outputs/apk/debug/app-debug.apk` (131MB — under 150MB budget)
- [ ] Install debug APK on phone: `adb install android/Android/src/app/build/outputs/apk/debug/app-debug.apk` ← BLOCKED (no phone yet)
- [ ] Verify forked app launches and works identically to Play Store version ← BLOCKED
- [ ] Test all 4 modalities in the forked app (vision, audio, thinking, tools) ← BLOCKED
- [ ] **GATE:** Forked app builds from source ✅ | runs on phone ← pending phone
- [ ] **FALLBACK TRIGGER:** If build fails by end of Day 4 → switch to LiteRT-LM SDK from scratch

### Day 4 (Apr 17) — Gallery codebase orientation + PWA scaffold

- [x] Study Gallery's codebase structure — it's Compose-based, not Activities
  - Gallery uses `CustomTask` interface + Hilt `@IntoSet` for adding new tasks
  - System prompt → `Task.defaultSystemPrompt` field; load from assets at runtime
  - Function calling → `@Tool`/`@ToolParam` SDK annotations (LitBud: parse JSON from text instead)
  - Key IDs: LLM_ASK_IMAGE (OCR), LLM_ASK_AUDIO (reading), LLM_CHAT (coaching), LLM_AGENT_CHAT (tools)
- [x] Document the Gallery activity → LitBud screen mapping → `android/LITBUD_MAPPING.md`
  - LitBud plan: create `customtasks/litbud/` package implementing full flow as one CustomTask
- [x] Create PWA scaffold: `ollama/test_harness/index.html` (single entry point)
- [x] Create `ollama/test_harness/camera.js` — webcam capture + base64 encoding
- [x] Create `ollama/test_harness/api.js` — Ollama 3-call architecture (generate + chat)
- [x] Create `ollama/test_harness/speech.js` — Web Speech API integration (Chrome only, needs internet)
- [x] Create `ollama/test_harness/fuzzy.js` — Levenshtein word comparison (JS port of Android logic)
- [x] Test PWA end-to-end: Ollama /api/chat returns coaching + tool_calls JSON ✅
- [x] **GATE:** PWA server runs at localhost:8000 ✅ | Full API flow tested via curl ✅

---

## Phase 2: Core MVP (Days 5-16, Apr 18-29)

### Feature 1: Page Capture & OCR (Days 5-7)

**Goal:** Child points camera at book page → Gemma 4 vision extracts text → clean text displayed on screen.

- [x] Modify Gallery's Ask Image activity to use LitBud's OCR prompt
  - Created `customtasks/litbud/` package as single CustomTask (not patching built-in Ask Image)
  - Prompt: "Extract all text from this book page. Return only the text, preserving paragraph breaks."
- [x] Customize camera UI: child-friendly colors, large capture button (64dp), Nunito font (already in theme)
  - LitBudScreen.kt: 4-phase UI, LitBudGreen (#1B8A6B) brand color
- [x] Add Nunito font — already present in Gallery theme, no action needed
- [x] Display extracted text in a readable format (20sp font, padded, scrollable) — ResultPanel
- [x] Handle edge cases: blurry/empty OCR result → friendly retry message in ErrorPanel
- [x] Add Gemma-4-E2B-it to model_allowlist.json (vision + audio + thinking support)
- [x] Copy tutor_system.txt → `assets/prompts/tutor_system.txt`
- [x] Build: SUCCESS (131MB APK)
- [ ] Test with 5 sample pages from `demo/sample_pages/` ← pending phone
- [ ] **Done when:** Camera captures page → OCR extracts text → text displays cleanly on screen. Works in airplane mode. ← phone test pending

### Feature 2: Listen & Follow + Gap Detection (Days 8-10)

**Goal:** Child reads aloud → audio processed → spoken words compared to page text → errors identified.

- [ ] Modify Gallery's Audio Scribe activity for reading recording
  - Large "Read" button (56dp+), 30-second timer with visual countdown, auto-stop at 28s
- [ ] Pass recorded audio + page text to Gemma 4 E2B in a single prompt
  - Prompt structure: system prompt + "PAGE TEXT: {ocr_text}\n\nThe child just read this aloud. Listen to their audio and compare."
- [ ] Add `apache commons-text` to `build.gradle` for LevenshteinDistance
  - File: `android/app/build.gradle`
- [ ] Implement `FuzzyMatcher.kt` — word-by-word Levenshtein comparison
  - Normalize: lowercase, strip punctuation, trim whitespace
  - Thresholds: >=85 CORRECT, 60-84 STRUGGLING, <60 MISSED
  - Input: page word list + spoken word list (positional)
  - Output: list of (word, status, score) triples
- [ ] Run fuzzy matching BEFORE sending to model — model receives only struggling/missed words
- [ ] Display page text with bold styling on struggled/missed words (SpannableString + StyleSpan)
- [ ] Write unit test: `FuzzyMatcherTest.kt` — test all threshold boundaries
- [ ] Run unit tests: `./gradlew test --tests "*.FuzzyMatcherTest"`
- [ ] **Done when:** Child reads aloud → audio recorded (≤30s) → fuzzy matching identifies errors → struggled words bolded in displayed text. Works in airplane mode.

### Feature 3: Coaching Response (Days 11-12)

**Goal:** Model generates warm, age-appropriate coaching with phonics hints for struggled words.

- [ ] Modify Gallery's AI Chat activity to display coaching in a speech bubble (24dp radius, rounded)
  - XML layout: rounded background drawable, 20sp+ text, Nunito font, padding
- [ ] Integrate system prompt from `ollama/prompts/tutor_system.txt` into the Android app
  - Copy to `android/app/src/main/assets/prompts/tutor_system.txt`
  - Load at runtime as the system message for the coaching call
- [ ] Build the coaching prompt: system prompt + page text + struggled words list + "Coach the child"
- [ ] Ensure thinking mode is enabled (via system prompt instruction, not API flag)
- [ ] Parse model response — extract coaching text, separate from any tool call JSON
- [ ] Display coaching response in the speech bubble UI
- [ ] Handle model errors gracefully — never show raw errors to the child
- [ ] Test with all 5 test cases from `ollama/prompts/test_cases.txt`
- [ ] **Done when:** After reading, child sees a warm coaching response in a speech bubble. Phonics hints are specific. Thinking trace is used internally. Works in airplane mode.

### Feature 4: Function Calling Tools (Days 13-14)

**Goal:** Model calls tools to track progress, provide hints, adjust difficulty, and log sessions.

- [ ] Implement `ToolCallHandler.kt` — parse tool call JSON from model response text
  - Parse with `org.json.JSONObject`
  - Handle 4 tools: `track_progress`, `get_hint`, `adjust_difficulty`, `log_session`
  - If JSON parse fails: log error, show coaching text anyway, never crash
- [ ] Implement Room database
  - File: `LitBudDatabase.kt` — singleton, database name `litbud.db`
  - Table `progress`: id, timestamp, accuracy_percent (float), words_per_minute (float), struggled_words (JSON string)
  - Table `sessions`: id, date (string), duration_seconds (int), overall_accuracy (float), new_vocabulary (JSON string)
  - DAOs with Kotlin Flow for reactive queries
- [ ] Wire `track_progress` → insert into `progress` table
- [ ] Wire `log_session` → insert into `sessions` table
- [ ] Wire `get_hint` → return hint text to coaching display (no DB write)
- [ ] Wire `adjust_difficulty` → persist to SharedPreferences (key: `current_difficulty_level`, int 1-5)
- [ ] Include tool definitions in the system prompt / model call so model knows to call them
- [ ] Test: complete a reading → verify `track_progress` row appears in DB
- [ ] **Done when:** Model response includes tool calls → tools parsed and executed → data persists to Room DB / SharedPreferences. No crashes on malformed tool JSON.

### Feature 5: Progress Dashboard (Days 15-16)

**Goal:** Visual chart showing reading accuracy over time. Proves progress tracking works end-to-end.

- [ ] Add chart library to `build.gradle` — MPAndroidChart or equivalent
  - Alternative: Android Canvas drawing if dependency is problematic
- [ ] Create dashboard activity/fragment
  - X-axis: session number (1, 2, 3, ...)
  - Y-axis: accuracy percentage (0-100%)
  - Line chart, Nunito font labels, child-friendly colors
- [ ] Query `progress` table via Room DAO with Kotlin Flow
- [ ] Add navigation from home screen to dashboard (large button, 56dp+)
- [ ] Handle empty state: "Read your first page to see your progress!" (friendly, not empty)
- [ ] **Done when:** Dashboard shows accuracy-over-time line chart from Room DB data. Updates reactively after each reading session. Works in airplane mode.

### Feature 6: App Navigation + Home Screen (Day 16 — shared with Feature 5)

**Goal:** LitBud home screen with branding and clear navigation to reading flow + dashboard.

- [ ] Customize Gallery's MainActivity → LitBud home screen
  - App name: "LitBud" with tagline "Your Reading Buddy"
  - Nunito font, child-friendly colors, large buttons (56dp+)
  - Two primary actions: "Read a Book" → camera flow, "My Progress" → dashboard
  - Model download flow preserved from Gallery (first launch only)
- [ ] Verify complete user flow: Home → Camera → OCR → Read Aloud → Coaching → Dashboard
- [ ] Test full flow in airplane mode end-to-end
- [ ] Run `./gradlew assembleDebug` → install → full walkthrough on phone
- [ ] **MVP FREEZE (Apr 29):** No new features after this point. Only bug fixes and polish.

---

## Phase 3: Fine-Tuning + Ollama Prize Track (Days 17-22, Apr 30 - May 5)

### Day 17 (Apr 30) — Gold examples + dataset preparation

- [ ] Claude drafts 25 gold fine-tuning examples covering:
  - 8 examples: perfect reading → celebration + `track_progress(100, ...)`
  - 10 examples: 1-2 word errors → specific phonics hints
  - 5 examples: multiple errors → focus on worst 1-2, stay encouraging
  - 2 examples: Hindi text → respond in Hindi appropriately
- [ ] User reviews each example for: age-appropriate language, warm tone, specific phonics hints
- [ ] Claude revises rejected examples and resubmits
- [ ] Finalize 25 approved gold examples

### Day 18 (May 1) — Template expansion + dataset upload

- [ ] Claude curates 50+ children's book passages from Project Gutenberg for template substitution
- [ ] Build `fine-tuning/prepare_dataset.py`:
  - Load 25 gold examples as templates
  - Substitute words and passages to generate variations
  - Maintain distribution: 30% perfect, 40% 1-2 errors, 20% multiple errors, 10% non-English
  - Output: `fine-tuning/data/training_examples.jsonl` (500 examples)
  - JSONL format: `instruction` (system prompt), `input` ("PAGE: '...'\nCHILD SAID: '...'"), `output` (coaching response)
- [ ] Run `python fine-tuning/prepare_dataset.py` → verify 500 examples generated
- [ ] Spot-check 20 random examples for quality
- [ ] Create public Kaggle dataset "litbud-reading-tutor-examples" with the JSONL + README
- [ ] Upload dataset to Kaggle

### Day 19-20 (May 2-3) — Kaggle notebook + training

- [ ] Create `notebooks/litbud_kaggle.ipynb` with the 10-cell structure from the skill file
- [ ] Cell 1: Title + problem statement
- [ ] Cell 2: Install Unsloth (`pip install unsloth`), GPU check (confirm T4, print memory)
- [ ] Cell 3: Load model — `unsloth/gemma-4-E2B-it`, `load_in_4bit=True`
  - Verify model slug exists on Unsloth HF before running
  - `finetune_vision_layers=False` — text-only fine-tuning
- [ ] Cell 4: Dataset preview — load JSONL, display 5 example rows in a table
- [ ] Cell 5: Dataset stats — distribution pie chart (accuracy levels, language breakdown)
- [ ] Cell 6: Training run
  - LoRA config: `r=16`, `lora_alpha=32`, `lora_dropout=0`, `bias="none"`
  - `max_seq_length=2048`, chat template `gemma-4`
  - `per_device_train_batch_size=2`, `gradient_accumulation_steps=4`
  - `num_train_epochs=3`, `optimizer="adamw_8bit"`
  - **`fp16=True`, `bf16=False`** (T4 — no bfloat16)
  - Loss curve visible in output
- [ ] Cell 7: **Before/After comparison** — same 5 test prompts through base and fine-tuned model
  - Display side-by-side responses
  - 3-dimension rubric: warmth (1-5), hint quality (1-5), tool use accuracy (1-5)
  - Bar chart showing score delta
- [ ] Cell 8: GGUF export — Q4_K_M format to `outputs/litbud-gguf/`
  - Save LoRA adapter first, then merge + export
- [ ] Cell 9: Ollama integration — show `ollama create litbud-ft` command and sample output
- [ ] Cell 10: Conclusion + metrics summary
- [ ] Run notebook end-to-end on Kaggle T4 — save with all outputs visible
- [ ] **GATE:** Training completes, GGUF exports, before/after shows improvement

### Day 21-22 (May 4-5) — Ollama fine-tuned model + documentation

- [ ] Download GGUF from Kaggle `/kaggle/working/outputs/litbud-gguf/`
- [ ] Create `ollama/Modelfile.finetuned` — `FROM <path-to-gguf>`, same SYSTEM block and parameters
- [ ] Build fine-tuned model: `ollama create litbud-ft -f ollama/Modelfile.finetuned`
- [ ] Test `ollama run litbud-ft` with all 5 test cases — compare quality to base model
- [ ] Run before/after comparison locally: `ollama run litbud` vs `ollama run litbud-ft`
- [ ] Update `ollama/README.md` with 3-step setup instructions for judges:
  1. `git clone` the repo
  2. `ollama create litbud -f ollama/Modelfile` (base) or `ollama create litbud-ft -f ollama/Modelfile.finetuned` (fine-tuned)
  3. `ollama run litbud` or `ollama run litbud-ft`
- [ ] Capture PWA screenshots showing Ollama integration working (for writeup)
- [ ] **GATE:** Both `litbud` and `litbud-ft` models work in Ollama. Before/after quality difference is visible.

---

## Phase 4: Polish (Days 23-27, May 6-10)

### Day 23 (May 6) — Multilingual: Hindi

- [ ] Source 3 Hindi children's book page images → `demo/sample_pages/hindi/`
- [ ] Test OCR on Hindi pages via the Android app
- [ ] Test reading aloud in Hindi → coaching response in Hindi
- [ ] Verify system prompt handles Hindi without switching to English
- [ ] Test same flow via Ollama PWA with Hindi text

### Day 24 (May 7) — Multilingual: Tamil + verification

- [ ] Source 3 Tamil children's book page images → `demo/sample_pages/tamil/`
- [ ] Test OCR + reading flow in Tamil
- [ ] Run all 5 standard test cases in English, Hindi, and Tamil
- [ ] Fix any language-specific issues in the system prompt

### Day 25 (May 8) — UX polish + colored word highlighting

- [ ] Implement colored underlines for word highlighting (replacing MVP bold):
  - Green underline: correct words (Levenshtein >=85)
  - Orange underline: struggling words (60-84)
  - Dotted red underline: missed words (<60)
  - Use SpannableString with custom spans
- [ ] Polish coaching speech bubble: animation on appearance, adequate padding
- [ ] Polish home screen: LitBud branding, app icon
- [ ] Review all error states: friendly messages, no raw errors visible to child

### Day 26 (May 9) — PWA screenshot polish + crash testing

- [ ] Half-day: polish PWA layout for clean screenshots (colors, spacing, typography)
- [ ] Capture 2-3 screenshots of PWA showing Ollama integration for writeup
- [ ] Crash testing on phone: rapid taps, back button during recording, rotate screen during OCR
- [ ] Memory testing: run 10 consecutive reading sessions without closing app
- [ ] Test with airplane mode ON for entire session (never toggle off)

### Day 27 (May 10) — Final testing + child test session

- [ ] If available: test with a child (age 5-12) — observe real usage
  - Note: confusion points, reading speed, audio pickup quality, UI usability
  - Fix critical issues found
- [ ] If child not available: test with adult reading at different speeds and accuracy levels
- [ ] Final full flow test: Home → Camera → OCR → Read → Coaching → Dashboard → repeat 3 sessions
- [ ] Verify dashboard chart updates correctly across multiple sessions
- [ ] **GATE:** App is stable, tested, and ready for demo recording

---

## Phase 5: Submission (Days 28-34, May 11-17)

### Day 28-29 (May 11-12) — Demo video

- [ ] Decide video format: screen recording + voiceover, external camera, or face cam
- [ ] Decide airplane mode moment: toggle at start or mid-demo
- [ ] Decide demo reader: adult or child (with permission)
- [ ] Write video script (based on strategy doc script: problem → solution → demo → impact, ~3 min)
- [ ] Record demo video (may need multiple takes)
- [ ] Edit video: trim, add title cards if needed
- [ ] Decide hosting: YouTube (unlisted or public) or direct Kaggle upload
- [ ] Upload video

### Day 30-31 (May 13-14) — Kaggle writeup

- [ ] Join the Gemma 4 Good Hackathon on Kaggle (if not already joined)
- [ ] Write Kaggle writeup (~1,500 words):
  - Problem statement (UNESCO stats, teacher shortage)
  - Solution overview (how LitBud works)
  - Technical architecture (3-component diagram, Gemma 4 features used)
  - Innovation (audio + vision + thinking + function calling in one on-device model)
  - Impact potential (250M children, $0 cost, 35+ languages, Apache 2.0)
  - Accessibility (airplane mode, mid-range phones, no infrastructure)
  - Embed demo video
  - Include PWA screenshots showing Ollama dev workflow
- [ ] Claude creates cover image (HTML/CSS mockup → user screenshots)
- [ ] Add cover image to writeup

### Day 32 (May 15) — GitHub repo cleanup

- [ ] Write root `README.md`:
  - Project description, demo video embed/link
  - Architecture diagram
  - Setup instructions for all 3 components (Android, Ollama, fine-tuning)
  - Model download links (HuggingFace for .litertlm, Ollama for GGUF)
  - License (Apache 2.0)
- [ ] Verify `LICENSE` file is Apache 2.0
- [ ] Remove any private files from tracking (project-brain.md, LitBud_Strategy.md already in .gitignore)
- [ ] Verify `demo/sample_pages/` has representative pages (English, Hindi, Tamil)
- [ ] Clean up any TODO comments or debug logging
- [ ] Verify repo builds from clean clone: `git clone → cd android → ./gradlew assembleDebug`

### Day 33 (May 16) — Kaggle notebook finalization

- [ ] Ensure notebook has all outputs saved (loss curve, before/after, charts)
- [ ] Attach "litbud-reading-tutor-examples" dataset to the notebook
- [ ] Verify notebook runs cleanly from top to bottom on Kaggle T4
- [ ] Add notebook link to Kaggle writeup

### Day 34 (May 17) — **SUBMIT**

- [ ] Final review of all submission components:
  - [ ] Working demo APK on phone
  - [ ] Public GitHub repo with clean README
  - [ ] Kaggle writeup with embedded video and cover image
  - [ ] Kaggle notebook with training outputs
- [ ] Submit via Kaggle Writeups with Project Files attached
- [ ] Verify submission appears correctly on the competition page
- [ ] **DONE. Submitted 24 hours before deadline (May 18 23:59 UTC).**

---

## Verification Checklist (run before submission)

- [ ] Full reading flow works in airplane mode: Camera → OCR → Read Aloud → Coaching → Dashboard
- [ ] 10 consecutive sessions without crash or memory issue
- [ ] English, Hindi, and Tamil pages all produce coaching responses
- [ ] Function calling tools fire and data appears in Room DB
- [ ] Dashboard chart shows accuracy data from multiple sessions
- [ ] Ollama base model (`litbud`) responds to all 5 test cases
- [ ] Ollama fine-tuned model (`litbud-ft`) shows visible improvement over base
- [ ] Kaggle notebook runs end-to-end on T4 with all outputs saved
- [ ] GitHub repo builds from clean clone
- [ ] Demo video is under 3 minutes and shows airplane mode
- [ ] Kaggle writeup is ~1,500 words with embedded video and cover image
- [ ] No personal data, children's audio recordings, or API keys in the repo
- [ ] No Firebase, analytics, or telemetry in the app
