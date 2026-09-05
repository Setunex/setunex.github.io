Dynamic Olympiad Quiz (Cards)

This folder contains a small PWA-ready dynamic quiz generator intended for olympiad-style questions.

Files:

- `quiz.html` — main UI
- `generator.js` — parameterized question templates and dynamic generation logic
- `app.js` — UI wiring
- `styles.css` — basic styling
- `manifest.json`, `sw.js` — PWA files
- `sample_data.json` — placeholder data

How it works

- The generator contains templates that produce questions with random parameters.
- A recent-pattern history stored in `localStorage` avoids repeating question patterns frequently.

Next steps / Packaging to APK

- PWA: open `quiz.html` in a browser, use 'Install' to add to device.
- APK: the simplest path is to host the PWA and use PWABuilder or Trusted Web Activity (TWA) wrappers. If you want an APK inside the repo, I can scaffold a minimal TWA project or create an Ionic wrapper — tell me which.

Offline & Install testing

- Serve the folder (localhost or HTTPS). Localhost supports service workers for testing.
  ```bash
  # from c:\Maulik\Code\Community\Cards
  python -m http.server 8000
  ```
- Open `http://localhost:8000/quiz.html` on desktop to register the service worker.
- On Android Chrome, you should see "Install" in the address bar or use menu → "Install app". On iOS, use Share → "Add to Home Screen" (no automatic prompt).
- To test offline behavior, after first load: disable network in DevTools or on device, then reload — the app shell should come from cache and navigation should show the offline fallback when necessary.

Recommended PWA checks

- Use Chrome DevTools → Application to inspect the Service Worker and Cache Storage.
- Run Lighthouse (Audits) to confirm installability and performance.
