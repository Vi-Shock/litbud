---
name: litbud-backend
description: Use this for any FastAPI route, SQLite query, aiosqlite, Ollama API call, ollama_client.py, tools.py, database.py, prompts.py, function calling, coaching response, session tracking, or backend work in LitBud
---

## FastAPI Conventions
- Use `async def` for all route handlers
- Use `httpx.AsyncClient` for Ollama API calls (never `requests`)
- Return Pydantic v2 response models on all endpoints
- Keep `app.py` thin — business logic goes in `ollama_client.py` and `tools.py`
- Use `APIRouter` per module (vision, audio, progress, hints)
- Always handle Ollama connection errors with a clear 503 response

## SQLite Rules
- Always enable WAL mode on DB init: `PRAGMA journal_mode=WAL`
- Use `aiosqlite` for async DB access — never blocking `sqlite3` in async context
- Never use an ORM — raw parameterized queries only
- Enable FTS5 for vocabulary table:
  ```sql
  CREATE VIRTUAL TABLE vocabulary_fts USING fts5(word, definition, session_id);
  ```
- Enable JSON1 for session metadata:
  ```sql
  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    date TEXT,
    data JSON  -- stores struggled_words, new_vocabulary as JSON arrays
  );
  ```
- Always use context managers: `async with aiosqlite.connect(DB_PATH) as db:`
- Index on `session_date` and `child_id` for dashboard queries

## Ollama Client Pattern
- Base URL: `http://localhost:11434`
- Vision call (OCR): `POST /api/chat` with image as base64 in messages
- Audio call (transcription): `POST /api/chat` with audio as base64 (E4B only — verify Day 1)
- Function calling: `POST /api/chat` with `tools` array in request body
- Always `stream=False` for function calling responses
- Always `stream=True` for coaching text responses (better UX)
- Default model: `gemma4:e4b` — never hardcode, always read from config

## Ollama Request Structure
```python
# Vision (OCR)
{
  "model": "gemma4:e4b",
  "messages": [{"role": "user", "content": [
    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
    {"type": "text", "text": "Extract all text from this book page. Return plain text only."}
  ]}],
  "stream": False
}

# Audio (transcription)
{
  "model": "gemma4:e4b",
  "messages": [{"role": "user", "content": [
    {"type": "audio", "audio": {"data": audio_b64, "format": "wav"}},
    {"type": "text", "text": "Transcribe this child's reading exactly as spoken."}
  ]}],
  "stream": False
}
```

## Function Calling Tools
Define all 4 tools in `tools.py` with full JSON schemas:
- `track_progress(accuracy_percent, words_per_minute, words_attempted, words_correct, struggled_words)`
- `get_hint(word, difficulty_level)`
- `adjust_difficulty(recent_accuracy, current_level)`
- `log_session(date, duration_seconds, passages_read, overall_accuracy, new_vocabulary)`

Always validate tool call responses before writing to DB.

## System Prompt Location
- All prompts live in `prompts.py` — never inline in routes
- One base system prompt + modular inserts for difficulty level and language
- Keep coaching responses to 2-3 sentences max (by instruction in prompt)

## File Ownership
- `app.py` → route registration, CORS, startup/shutdown only
- `ollama_client.py` → all Ollama API calls (vision, audio, chat, function calling)
- `tools.py` → function calling tool definitions and response parsers
- `database.py` → all SQLite queries, DB init, migrations
- `prompts.py` → system prompts and prompt templates

## Error Handling
- Ollama not running → 503 with message "Start Ollama with: ollama serve"
- Audio too long (>30s) → 400 with message "Passage too long — read 1-2 sentences at a time"
- OCR returns empty → 422 with fallback to manual text entry prompt
- DB locked → retry once with 100ms delay before raising

## Dependencies (requirements.txt)
```
fastapi
uvicorn[standard]
httpx
aiosqlite
pydantic>=2.0
python-multipart
```
