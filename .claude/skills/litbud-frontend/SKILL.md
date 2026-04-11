---
name: litbud-frontend
description: Use this for any PWA, camera capture, getUserMedia, audio recording, MediaRecorder, word highlighting, progress dashboard, Chart.js, Service Worker, app.js, camera.js, audio.js, dashboard.js, styles.css, or frontend UI work in LitBud
---

## PWA Rules
- App must be installable: include `manifest.json` with `display: standalone`, icons at 192x192 and 512x512
- Register a Service Worker (`sw.js`) that caches all static assets for offline use
- All API calls go to `http://localhost:8000` (FastAPI backend) — never hardcode, use a `CONFIG.API_BASE` constant
- App must work fully offline after first load — no CDN calls for core functionality
- Only Chart.js and fonts may be CDN-loaded (cache them in Service Worker on first load)

## Camera Capture (camera.js)
- Use `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` for rear camera
- Capture frame as JPEG base64 via canvas: quality 0.85 is optimal for OCR accuracy vs. size
- Pre-process before sending: increase contrast, convert to grayscale for better OCR
- Always show a live preview feed before capture — never blind capture
- Handle permission denied gracefully: show "Enable camera in browser settings" with icon
```javascript
async function captureImage() {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.filter = 'contrast(1.4) grayscale(1)';
  ctx.drawImage(videoEl, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]; // return base64 only
}
```

## Audio Recording (audio.js)
- Use `MediaRecorder` with `audio/webm;codecs=opus` (best browser support)
- Hard limit: 30 seconds — auto-stop at 30s with a visual countdown timer
- Show waveform animation while recording (CSS animation, not canvas — keep it simple)
- Convert WebM to WAV before sending if Ollama E4B requires WAV input
- Always call `stream.getTracks().forEach(t => t.stop())` after recording to release mic
```javascript
const MAX_DURATION_MS = 30000;
let stopTimer = setTimeout(() => recorder.stop(), MAX_DURATION_MS);
```

## Word Highlighting (app.js)
- Render OCR text as individual `<span data-word-index="N">word</span>` elements
- Three CSS classes only: `word--correct` (green), `word--missed` (red), `word--struggling` (yellow)
- Animate class changes with CSS transitions: `transition: background-color 300ms ease`
- Never re-render the full word list mid-session — only toggle classes on existing spans
- Current word being read: add `word--active` class with subtle pulse animation

## Coaching Response Display
- Show in a fixed bottom card that slides up (CSS transform, not JS animation library)
- Typing effect for coaching text: reveal characters at 30ms intervals
- Celebration animation on high accuracy (>90%): CSS-only confetti using `::before`/`::after` pseudo-elements
- Always show accuracy % and WPM after each passage as a small badge

## Progress Dashboard (dashboard.js)
- Use Chart.js from CDN: `https://cdn.jsdelivr.net/npm/chart.js`
- Two charts:
  1. **Accuracy Trend**: line chart, last 10 sessions, `--color-primary` (#01696f) line color
  2. **Vocabulary Growth**: bar chart by date, new words per session
- Load data from `GET /api/progress` — show skeleton loader while fetching
- Empty state: animated illustration + "Start your first reading session!" CTA
- Charts must be responsive: `responsive: true, maintainAspectRatio: false`

## Design Tokens
Use these CSS variables throughout (matches LitBud's warm, child-friendly palette):
```css
:root {
  --color-primary: #01696f;       /* Teal — correct words, CTAs */
  --color-warning: #d19900;       /* Gold — struggling words */
  --color-error: #a12c7b;         /* — missed words */
  --color-success: #437a22;       /* Green — celebrations */
  --color-bg: #f7f6f2;
  --color-text: #28251d;
  --font-body: 'Nunito', sans-serif;  /* Child-friendly rounded font */
  --radius-lg: 0.75rem;
  --space-4: 1rem;
}
```

## Mobile-First Rules (children use phones)
- Minimum touch target: 56px (larger than standard — children have less precise taps)
- Font size floor: 18px body, 22px for word highlighting text
- Big, obvious Record button: 80px diameter, pulsing red border when recording
- Camera and mic permission prompts must be friendly: use emoji and plain language
- Test at 375px (iPhone SE) — this is the target device size

## File Ownership
- `index.html` → app shell, nav, layout structure only
- `app.js` → orchestration: coordinates camera.js, audio.js, API calls, word highlighting
- `camera.js` → getUserMedia, live preview, image capture, base64 encode
- `audio.js` → MediaRecorder, 30-sec enforcer, waveform animation, base64 encode
- `dashboard.js` → Chart.js rendering, `/api/progress` fetch, empty state
- `styles.css` → all styles, design tokens, animations
- `sw.js` → Service Worker, cache strategy
- `manifest.json` → PWA manifest

## No Build Tools
- Zero npm, zero webpack, zero bundler — plain HTML/CSS/JS files
- CDN only for Chart.js and Nunito font
- ES modules via `<script type="module">` for clean imports between files
