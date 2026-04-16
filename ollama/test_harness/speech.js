/**
 * speech.js — Web Speech API integration for LitBud PWA test harness
 *
 * IMPORTANT LIMITATION: Web Speech API sends audio to Google's servers for recognition.
 * This is NOT offline. This is a dev tool workaround only.
 *
 * The real product uses LiteRT-LM's native audio input on Android — fully on-device,
 * no internet required. See CLAUDE.md and ollama/SKILL.md for details.
 *
 * Requires: Chrome browser (Firefox/Safari have limited or no Web Speech API support).
 */

const Speech = (() => {
  let recognition = null;
  let isListening = false;

  /** @returns {boolean} true if Web Speech API is available */
  function isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Start listening. Returns a Promise that resolves with the transcript string
   * when the user stops speaking (or after maxSeconds).
   *
   * @param {object} options
   * @param {number} [options.maxSeconds=28] — auto-stop after this many seconds (match Android 28s limit)
   * @param {string} [options.lang='en-US'] — BCP-47 language tag
   * @param {function} [options.onInterimResult] — called with partial transcript string during recognition
   * @param {function} [options.onStart] — called when mic opens
   * @param {function} [options.onEnd] — called when mic closes (before promise resolves)
   * @returns {Promise<string>} final transcript
   */
  function listen({ maxSeconds = 28, lang = 'en-US', onInterimResult, onStart, onEnd } = {}) {
    return new Promise((resolve, reject) => {
      if (!isSupported()) {
        reject(new Error('Web Speech API not supported. Use Chrome.'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';
      let stopTimer = null;

      recognition.onstart = () => {
        isListening = true;
        if (onStart) onStart();
        // Auto-stop at maxSeconds
        stopTimer = setTimeout(() => {
          if (isListening) recognition.stop();
        }, maxSeconds * 1000);
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }
        if (onInterimResult) onInterimResult((finalTranscript + interim).trim());
      };

      recognition.onerror = (event) => {
        clearTimeout(stopTimer);
        isListening = false;
        if (onEnd) onEnd();
        // 'no-speech' is not a real error — resolve with empty string
        if (event.error === 'no-speech') {
          resolve('');
        } else {
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      recognition.onend = () => {
        clearTimeout(stopTimer);
        isListening = false;
        if (onEnd) onEnd();
        resolve(finalTranscript.trim());
      };

      recognition.start();
    });
  }

  /** Stop listening early (e.g., user taps "Done" before maxSeconds). */
  function stop() {
    if (recognition && isListening) {
      recognition.stop();
    }
  }

  /** @returns {boolean} true if currently recording */
  function listening() {
    return isListening;
  }

  return { isSupported, listen, stop, listening };
})();
