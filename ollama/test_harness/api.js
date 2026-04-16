/**
 * api.js — Ollama API calls for LitBud PWA test harness
 *
 * Implements the 3-call architecture (locked per ollama/SKILL.md):
 *   Call 1: /api/generate   — OCR: image → page text
 *   Call 2: Web Speech API  — handled by speech.js (NOT Ollama)
 *   Call 3: /api/chat       — Coaching: page text + struggled words → coaching response + tool calls
 *
 * Rules:
 *   - Always stream: false
 *   - OCR temperature: 0.1 (deterministic)
 *   - Coaching temperature: 0.7
 *   - Base URL: http://localhost:11434
 *   - CORS: Ollama must be started with OLLAMA_ORIGINS=http://localhost:8000
 */

const OllamaAPI = (() => {
  const BASE_URL = 'http://localhost:11434';
  const MODEL_NAME = 'litbud';

  /**
   * Call 1: OCR — extract text from a book page image.
   *
   * @param {string} imageBase64 — base64 JPEG (no data URI prefix)
   * @returns {Promise<string>} extracted page text
   * @throws {Error} on network failure or Ollama error
   */
  async function extractPageText(imageBase64) {
    const prompt =
      'Extract all the text from this book page image. ' +
      'Return only the text as it appears, preserving line breaks between paragraphs. ' +
      'Do not add any commentary, explanations, or formatting. ' +
      'If the image is unclear or not a book page, return: UNCLEAR_IMAGE';

    const body = {
      model: MODEL_NAME,
      prompt: prompt,
      images: [imageBase64],
      stream: false,
      options: { temperature: 0.1 },
    };

    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OCR request failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(`Ollama error: ${data.error}`);
    return (data.response || '').trim();
  }

  /**
   * Call 3: Coaching — generate warm coaching response with tool calls.
   *
   * @param {string} pageText — extracted page text (from Call 1)
   * @param {string} spokenText — what the child said (from Call 2 / speech.js)
   * @param {Array<{word, status, score}>} struggled — output from FuzzyMatcher.struggledWords()
   * @param {string} [lang='en'] — detected language: 'en', 'hi', or 'ta'
   * @returns {Promise<{coachingText: string, toolCalls: Array, rawResponse: string}>}
   */
  async function getCoaching(pageText, spokenText, struggled, lang = 'en') {
    // Build language label for the prompt
    const langLabel = lang === 'hi' ? '(Hindi)' : lang === 'ta' ? '(Tamil)' : '(English)';
    const langInstruction = lang !== 'en'
      ? `\n\nIMPORTANT: The page is in ${lang === 'hi' ? 'Hindi' : 'Tamil'}. Respond entirely in ${lang === 'hi' ? 'Hindi' : 'Tamil'}.`
      : '';

    // Format struggled words list
    let struggledStr = 'none';
    if (struggled.length > 0) {
      struggledStr = struggled
        .map(w => `${w.word} (${w.status}, score ${w.score})`)
        .join(', ');
    }

    const userMessage =
      `PAGE TEXT ${langLabel}: ${pageText}\n\n` +
      `CHILD SAID: ${spokenText}\n\n` +
      `STRUGGLED WORDS: ${struggledStr}${langInstruction}\n\n` +
      `Coach the child.`;

    const body = {
      model: MODEL_NAME,
      messages: [{ role: 'user', content: userMessage }],
      stream: false,
      options: { temperature: 0.7 },
    };

    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Coaching request failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(`Ollama error: ${data.error}`);

    const rawResponse = (data.message?.content || '').trim();
    return parseCoachingResponse(rawResponse);
  }

  /**
   * Parse the model response into coaching text and tool calls.
   * The model embeds a ```json { "tool_calls": [...] } ``` block.
   *
   * @param {string} raw — full model response string
   * @returns {{ coachingText: string, toolCalls: Array, rawResponse: string }}
   */
  function parseCoachingResponse(raw) {
    // Extract JSON block (```json ... ``` or bare { ... })
    let toolCalls = [];
    let coachingText = raw;

    const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
    const bareJsonMatch = raw.match(/(\{[\s\S]*"tool_calls"[\s\S]*\})/);
    const jsonStr = jsonBlockMatch ? jsonBlockMatch[1] : (bareJsonMatch ? bareJsonMatch[1] : null);

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        toolCalls = parsed.tool_calls || [];
        // Remove the JSON block from coaching text
        coachingText = raw
          .replace(/```json[\s\S]*?```/, '')
          .replace(/\{[\s\S]*"tool_calls"[\s\S]*\}/, '')
          .trim();
      } catch (e) {
        console.warn('Failed to parse tool_calls JSON:', e.message);
        // Keep coachingText as full raw response, toolCalls stays empty
      }
    }

    return { coachingText, toolCalls, rawResponse: raw };
  }

  /** @returns {Promise<boolean>} true if Ollama is reachable */
  async function isAvailable() {
    try {
      const res = await fetch(`${BASE_URL}/api/tags`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** @returns {Promise<boolean>} true if litbud model exists */
  async function isModelReady() {
    try {
      const res = await fetch(`${BASE_URL}/api/tags`);
      const data = await res.json();
      return (data.models || []).some(m => m.name.startsWith('litbud'));
    } catch {
      return false;
    }
  }

  return { extractPageText, getCoaching, parseCoachingResponse, isAvailable, isModelReady };
})();
