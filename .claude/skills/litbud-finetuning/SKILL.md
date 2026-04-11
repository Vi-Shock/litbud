---
name: litbud-finetuning
description: Use this for Unsloth QLoRA fine-tuning, dataset preparation, GGUF export, Kaggle notebook, train.py, prepare_dataset.py, evaluate.py, training_examples.jsonl, or any fine-tuning and model evaluation work in LitBud
---

## Dataset Format (training_examples.jsonl)
Each line is a JSON object with exactly 3 fields:
```json
{
  "instruction": "<full system prompt — same as production>",
  "input": "PAGE TEXT:\n{extracted_text}\n\nCHILD SPOKE:\n{speech_transcript}",
  "output": "{coaching_response_2_to_3_sentences}"
}
```
- Target: 500+ examples minimum, 600 ideal
- Split: 480 train / 20 eval (hold out eval before training, never shuffle them in)
- Error distribution in input: 30% correct reading, 40% 1-2 errors, 30% multiple errors
- Output must always be 2-3 sentences, warm tone, phonics-focused, never critical

## Data Sources for Training Examples
- LibriSpeech: filter for child/young speakers, align text with audio transcripts
- Common Voice: `age=teens` filter, `cv-corpus` dataset
- Manually author 100+ examples covering: skipped words, mispronunciations, unknown words, correct reading (celebration), multi-error passages
- Use children's books from Project Gutenberg for page text variety

## Unsloth QLoRA Config
```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gemma-4-e4b-it",
    max_seq_length=2048,
    dtype=None,          # Auto-detect (bfloat16 on T4)
    load_in_4bit=True,   # Required for Kaggle T4 16GB
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_alpha=32,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)
```

## Training Config
```python
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=train_data,
    dataset_text_field="text",
    max_seq_length=2048,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,   # Effective batch = 8
        num_train_epochs=3,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
        save_steps=100,                  # Kaggle sessions disconnect — save often
        save_total_limit=3,
        output_dir="./litbud-finetuned",
        fp16=True,                       # T4 doesn't support bf16
        logging_steps=25,
        report_to="none",                # No wandb on Kaggle free tier
    ),
)
```

## GGUF Export (after training)
```python
# Merge adapter into base model
model.save_pretrained_merged("litbud-merged", tokenizer)

# Export to GGUF q4_k_m
model.save_pretrained_gguf(
    "litbud-gguf",
    tokenizer,
    quantization_method="q4_k_m"   # Best size/quality for edge deployment
)
```
Upload resulting `.gguf` file to Hugging Face for Ollama import.

## Ollama Import After Export
```bash
# Create Modelfile
echo 'FROM ./litbud-gguf/litbud-unsloth.Q4_K_M.gguf' > Modelfile
echo 'SYSTEM """<paste full LitBud system prompt here>"""' >> Modelfile

# Import into Ollama
ollama create litbud-v1 -f Modelfile

# Test it
ollama run litbud-v1 "PAGE TEXT: The cat sat on the mat.\nCHILD SPOKE: The cat sat on the"
```

## Evaluation Script (evaluate.py)
Score fine-tuned vs base model on 20 held-out examples across 3 dimensions:
- **Age-appropriateness** (1-5): Is vocabulary suitable for ages 5-12?
- **Phonics accuracy** (1-5): Is the hint phonetically correct and useful?
- **Encouragement tone** (1-5): Warm and motivating without being condescending?

Use GPT-4 or Claude as the judge (automated eval), then manually verify 5 borderline cases.
Document scores in `docs/fine-tuning-guide.md` — judges will read this.

## Kaggle Notebook Structure (litbud_kaggle.ipynb)
Must contain these sections in order:
1. Environment setup (install unsloth, check GPU)
2. Dataset loading and preview (show 3 example rows)
3. Model loading (4-bit, verify VRAM usage)
4. Training (with loss curve output)
5. Export to GGUF
6. Evaluation: side-by-side comparison table (base vs fine-tuned, 5 examples)
7. Inference demo: run the fine-tuned model on a new example

## Kaggle Constraints
- T4 GPU = 16GB VRAM — 4-bit loading is mandatory
- Session timeout: ~9 hours — full training run must complete in one session
- Save checkpoints to `/kaggle/working/` — this persists between cell runs
- Internet enabled on Kaggle: use it to pull datasets and push to HuggingFace Hub
- Estimated training time on T4: ~45-90 min for 500 examples × 3 epochs

## File Ownership
- `fine-tuning/prepare_dataset.py` → download sources, clean, format to JSONL
- `fine-tuning/train.py` → Unsloth training script (importable, not just notebook)
- `fine-tuning/evaluate.py` → A/B evaluation runner
- `fine-tuning/data/training_examples.jsonl` → final training dataset
- `notebooks/litbud_kaggle.ipynb` → Kaggle submission notebook (clean, documented)
- `docs/fine-tuning-guide.md` → written guide for judges to reproduce results
