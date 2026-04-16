/**
 * camera.js — Webcam capture and base64 encoding for LitBud PWA test harness
 *
 * Handles: webcam stream → canvas snapshot → base64 JPEG for Ollama /api/generate images[]
 *
 * NOTE: This is a dev tool only. The real product uses Android CameraX + LiteRT-LM on-device.
 * Web Speech API requires Chrome + internet (for speech recognition); camera works offline.
 */

const Camera = (() => {
  let stream = null;
  let videoEl = null;

  /**
   * Start the webcam stream and attach it to a <video> element.
   * @param {HTMLVideoElement} videoElement
   * @returns {Promise<void>}
   */
  async function start(videoElement) {
    videoEl = videoElement;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      videoEl.srcObject = stream;
      await videoEl.play();
    } catch (err) {
      // Fallback to any camera if rear camera unavailable (desktop webcam)
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoEl.srcObject = stream;
      await videoEl.play();
    }
  }

  /** Stop the webcam stream and release the camera. */
  function stop() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl = null;
    }
  }

  /**
   * Capture a frame from the video and return it as a base64-encoded JPEG string.
   * The string is ready to pass to Ollama's images[] field (no data URI prefix).
   *
   * @param {HTMLVideoElement} videoElement — the live video element
   * @param {number} [quality=0.85] — JPEG quality 0.0–1.0
   * @returns {string} base64 JPEG string
   */
  function capture(videoElement, quality = 0.85) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    // Strip "data:image/jpeg;base64," prefix — Ollama wants raw base64
    return dataUrl.split(',')[1];
  }

  /**
   * Capture from a <video> and display the snapshot in an <img> element.
   * @param {HTMLVideoElement} videoElement
   * @param {HTMLImageElement} previewImage
   * @returns {string} base64 JPEG string
   */
  function captureAndPreview(videoElement, previewImage) {
    const b64 = capture(videoElement);
    previewImage.src = 'data:image/jpeg;base64,' + b64;
    return b64;
  }

  return { start, stop, capture, captureAndPreview };
})();
