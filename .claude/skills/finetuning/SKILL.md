# fine-tuning/SKILL.md — LitBud Unsloth Fine-Tuning (Kaggle T4)

Load this skill when working in `fine-tuning/` or `notebooks/litbud_kaggle.ipynb`.

---

## What This Is

Fine-tuning Gemma 4 E2B to produce better coaching responses, running on Kaggle T4 GPU using Unsloth QLoRA. This module qualifies for the **Unsloth special prize track**.

---

## Critical Constraint (Repeat in Every Script Header)

**Fine-tuned weights export as GGUF → Ollama only.**
There is no GGUF → .litertlm converter.
The Android app CANNOT use fine-tuned weights.
The Android app uses official Google E2B weights + the system prompt from `android/assets/prompts/`.
Fine-tuning improves: Ollama demo quality, Unsloth prize eligibility.
Fine-tuning does NOT improve: the on-device Android experience.

---

## Kaggle Environment Rules

- GPU: T4 (16GB VRAM, 29GB CPU RAM, 12h session limit)
- **`fp16=True`, `bf16=False`** always. T4 has no bfloat16 hardware support. Using `bf16=True` will silently produce bad results or crash.
- Save all outputs to `/kaggle/working/` for post-session download.
- Install Unsloth at notebook start: `pip install unsloth` (check Unsloth docs for Gemma 4 E2B support before running — verify at https://unsloth.ai/docs/models/gemma-4/train).
- Attach a public Kaggle dataset (create one with sample training data) so the notebook shows up in search results for judges.

---

## Dataset Rules

- Format: JSONL, one example per line, 3 fields: `instruction`, `input`, `output`
- Target size: **500 examples minimum** to see meaningful improvement
- Distribution to follow:
  - 30% perfect reading → celebration + `track_progress(100, ...)`
  - 40% 1–2 word errors → specific phonics hints
  - 20% multiple errors → focus on worst 1–2, never overwhelm the child
  - 10% non-English → Hindi, Tamil, or Spanish examples
- `instruction` field: always the same system prompt text (consistent across all examples)
- `input` field: `"PAGE: '...'\nCHILD SAID: '...'"` format — exactly this structure
- `output` field: the ideal coaching response in 2–3 sentences, warm tone, age-appropriate

Generate examples using `prepare_dataset.py`. Do not handwrite 500 examples manually — build a generator using templates and word-substitution.

---

## Training Configuration Rules

- Model: `unsloth/gemma-4-E2B-it` (verify this slug at Unsloth HF before running)
- `load_in_4bit=True` (QLoRA — required for T4 memory budget)
- LoRA: `r=16`, `lora_alpha=32`, `lora_dropout=0`, `bias="none"`
- `finetune_vision_layers=False` — text-only fine-tuning (audio and vision layers waste T4 budget)
- `max_seq_length=2048` — coaching examples are short, this is generous
- Batch size: `per_device_train_batch_size=2`, `gradient_accumulation_steps=4` (effective batch = 8)
- Epochs: `num_train_epochs=3`
- Optimizer: `adamw_8bit`
- Chat template: `gemma-4` (apply via `get_chat_template`)

---

## Export Rules

- Export format: **Q4_K_M GGUF** — best quality/size tradeoff for Ollama
- Save LoRA adapter first (`model.save_pretrained`), then merge + export GGUF
- Output path: `outputs/litbud-gguf/`
- After export: copy GGUF file path into `ollama/Modelfile.finetuned` as the `FROM` line
- Verify the GGUF loads in Ollama before marking Phase 3 done: `ollama create litbud-ft -f ollama/Modelfile.finetuned`

---

## Kaggle Notebook Structure (Judges Read This)

The notebook must tell a clear story. Cell order matters:

1. Title + problem statement (why fine-tuning improves coaching)
2. Install + GPU check (show T4 confirmed, memory available)
3. Model load (show output — confirms Unsloth + Gemma 4 E2B working)
4. Dataset preview (show 5 example rows in a table)
5. Dataset stats (distribution chart: accuracy, language breakdown)
6. Training run (loss curve visible in output)
7. **Before/After comparison** ← most important cell for judges. Same 5 prompts, base vs fine-tuned.
8. GGUF export
9. Ollama integration demo (show `ollama run litbud-ft` output)
10. Conclusion + metrics summary

---

## What NOT to Do

- Do not use `bf16=True` on T4 — it will silently fail or crash.
- Do not fine-tune vision or audio layers — wastes T4 budget, no benefit for text coaching.
- Do not use more than 500 examples until basic training works end-to-end.
- Do not include personal data or real children's speech in training data.
- Do not try to convert GGUF to .litertlm — no converter exists, don't attempt it.
- Do not start fine-tuning until the Android MVP is frozen (Phase 2 complete).
