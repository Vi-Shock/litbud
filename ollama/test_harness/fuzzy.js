/**
 * fuzzy.js — Word-by-word fuzzy matching for LitBud PWA test harness
 *
 * Mirrors the Android FuzzyMatcher.kt logic exactly.
 * Thresholds (locked): >=85 CORRECT, 60-84 STRUGGLING, <60 MISSED
 *
 * NOTE: This is a dev tool. The real product uses Apache commons-text
 * LevenshteinDistance in Kotlin on Android.
 */

const FuzzyMatcher = (() => {

  /** Levenshtein distance between two strings */
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  /** Normalize a word: lowercase, strip punctuation, trim */
  function normalize(word) {
    return word.toLowerCase().replace(/[^a-z0-9\u0900-\u097f\u0b80-\u0bff]/g, '').trim();
  }

  /**
   * Convert Levenshtein distance to a similarity score (0-100).
   * Score = (1 - dist / maxLen) * 100, clamped to 0-100.
   */
  function similarityScore(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 100;
    const dist = levenshtein(a, b);
    return Math.round((1 - dist / maxLen) * 100);
  }

  /**
   * Classify a score into a status string.
   * Thresholds locked per android/SKILL.md.
   */
  function classify(score) {
    if (score >= 85) return 'CORRECT';
    if (score >= 60) return 'STRUGGLING';
    return 'MISSED';
  }

  /**
   * Compare two word lists positionally.
   *
   * @param {string[]} pageWords   — words from the OCR text (ground truth)
   * @param {string[]} spokenWords — words from speech recognition
   * @returns {Array<{word: string, status: string, score: number}>}
   *   One entry per page word. Extra spoken words are ignored.
   *   Missing spoken words (child stopped early) are treated as MISSED (score 0).
   */
  function compare(pageWords, spokenWords) {
    return pageWords.map((raw, i) => {
      const page = normalize(raw);
      const spoken = i < spokenWords.length ? normalize(spokenWords[i]) : '';
      const score = spoken === '' ? 0 : similarityScore(page, spoken);
      return { word: raw, status: classify(score), score };
    });
  }

  /**
   * Extract only struggling and missed words from a comparison result.
   * These are passed to the coaching prompt — correct words are omitted.
   *
   * @param {Array<{word, status, score}>} result
   * @returns {Array<{word, status, score}>}
   */
  function struggledWords(result) {
    return result.filter(r => r.status !== 'CORRECT');
  }

  /**
   * Compute overall accuracy as a percentage (0.0–100.0).
   *
   * @param {Array<{word, status, score}>} result
   * @returns {number}
   */
  function accuracy(result) {
    if (result.length === 0) return 100.0;
    const correct = result.filter(r => r.status === 'CORRECT').length;
    return parseFloat(((correct / result.length) * 100).toFixed(1));
  }

  return { compare, struggledWords, accuracy, normalize, classify };
})();
