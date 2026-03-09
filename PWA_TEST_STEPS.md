# PWA Test Steps & Verification

## Prerequisites

- **HTTPS** (or localhost) for installability and service worker.
- Backend running: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend built: `npm run build` then `npm run preview` (or dev with SW disabled in dev by default).

## 1. Installable (A2HS)

1. Open the app in Chrome/Edge (e.g. `https://localhost:4173` after `npm run preview` or your deployed URL).
2. Open DevTools → Application → Manifest.
3. Confirm: **name** BuildDesk, **theme_color** #0A0D12, **display** standalone, **icons** (SVG + optional 192/512 PNG).
4. Optional: generate 192/512 PNG for full Lighthouse PWA score:
   ```bash
   npx pwa-asset-generator public/icons/icon.svg public/icons --background "#0A0D12" --padding 0
   ```
5. In the browser toolbar, use “Install” / “Add to Home Screen” and launch the app in standalone mode.

## 2. App Shell & Caching

1. Application → Service Workers: after first load you should see the Vite PWA worker (e.g. `sw.js` or `dev-sw.js`).
2. Application → Cache Storage: expect caches for precache (app shell) and runtime caches (`api-cache`, `static-cache`).
3. Reload the app and confirm it loads; then go offline (DevTools → Network → Offline) and reload — the shell (navigation, layout, static assets) should still load.

## 3. Offline Report Queue & Sync

1. **Go offline**: DevTools → Network → Offline (or disconnect network).
2. **Queue reports**:
   - Select a project on the Reports page.
   - Click **Download Daily PDF** (pick a date).
   - Click **Download Weekly PDF** (pick a week).
   - Click **Download Monthly PDF** (pick month/year).
3. Confirm toasts: “Queued. Will download when back online.”
4. Confirm **offline banner** at top: “You're offline. Report downloads will be queued…”
5. Optional: confirm “3 reports pending” (or N) if the banner shows pending count when coming back online.
6. **Go online**: re-enable network.
7. **Sync**: Banner should show “N reports pending — syncing…” then process. PDFs should download automatically (or open) as each request completes.
8. Confirm queue is empty and banner hides.

## 4. Network-First API / Cache-First Static

- **API**: With network on, report PDF requests go to the server; with network off, they are queued (not served from cache for write/PDF). Other API calls use network-first (cache as fallback after timeout).
- **Static**: Images and assets under `/assets/` and common static extensions use cache-first.

## 5. Lighthouse PWA (100/100)

1. Open Lighthouse (DevTools → Lighthouse).
2. Select “Progressive Web App”, run (HTTPS or localhost).
3. Fix any issues:
   - Installable: manifest + 192/512 icons (add PNGs if needed via step 1.4).
   - Service worker: registered, offline fallback.
   - Theme color, viewport, etc. are already set.

## 6. Mobile-First & Dark Theme

- **theme_color** and **background_color**: #0A0D12 (dark).
- **Standalone** display for app-like experience.
- **48px targets**: Report action buttons (Daily/Weekly/Monthly PDF) use `min-h-[48px] min-w-[48px]`; `.touch-target` in CSS for coarse pointers.

## 7. JWT Auth (No Token Cache)

- Auth remains cookie-based (httpOnly recommended); no tokens stored in IndexedDB or service worker.
- Queue processing uses `fetch(..., { credentials: 'include' })` so cookies are sent when the app runs in the page context after reconnect.

## Quick Verification Checklist

- [ ] Manifest present; theme_color #0A0D12; standalone.
- [ ] Service worker registered; app shell works offline.
- [ ] Offline → submit any report (Daily/Weekly/Monthly PDF) → queued.
- [ ] Reconnect → sync runs; PDFs download (or open).
- [ ] Offline banner shows when offline; “N reports pending” when applicable.
- [ ] Dark theme default; 48px touch targets on report actions.
