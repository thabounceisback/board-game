# Audit Analytics: The Board Game (PWA)

A Progressive Web App board game where you navigate from **Engagement Kick-Off** to **Partner Sign-Off**, facing audit analytics challenges along the way.

## Features
- **Installable** — "Add to Home Screen" on mobile or install via Chrome on desktop
- **Works offline** — service worker caches all assets for offline play
- **No backend** — 100% client-side, deploy anywhere that serves static files

---

## Quick Start (Local)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. This folder is your entire deployable app.

---

## Deploy

### Option 1: Vercel (fastest)
```bash
npx vercel
```
Follow prompts. Done. You'll get a live URL in ~30 seconds.

### Option 2: Netlify
```bash
npm run build
npx netlify deploy --prod --dir=dist
```
Or drag-and-drop the `dist` folder at [app.netlify.com](https://app.netlify.com).

### Option 3: Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy dist --project-name=audit-board-game
```

### Option 4: GitHub Pages
1. Push this repo to GitHub
2. Go to Settings → Pages → Source: GitHub Actions
3. Add this workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Option 5: Any static server
```bash
npm run build
# Serve the dist folder with any HTTP server:
npx serve dist
# or
python3 -m http.server -d dist 8080
```

---

## Installing the PWA

Once deployed to HTTPS:
- **iOS**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Chrome will show an install banner, or Menu → "Install app"
- **Desktop**: Chrome/Edge will show an install icon in the address bar

> **Note:** PWA install requires HTTPS. `localhost` works for testing.

---

## Project Structure

```
├── index.html              # Entry HTML with PWA meta tags
├── package.json
├── vite.config.js          # Vite + vite-plugin-pwa config
├── public/
│   └── icons/
│       ├── icon-192.png    # PWA icon (home screen)
│       └── icon-512.png    # PWA icon (splash screen)
└── src/
    ├── main.jsx            # React entry
    └── App.jsx             # The full board game
```
