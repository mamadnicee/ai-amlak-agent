# AGENTS.md

## What this project is
A **pure static site** — Persian (fa / RTL) "AI Real Estate" landing page plus two chat panels.
No package manager, no build step, no backend, no tests. Plain HTML/CSS/JS + assets.

Pages:
- `index.html` — landing page (GSAP/ScrollTrigger + three.js 3D car, floating tool dock: calculator, live prices, notes, mortgage)
- `chat.html` — generic chat panel
- `chat-property.html` — property-analysis chat panel

## Running it (Base44 dev environment)
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- `nginx:alpine` serves the repo root from a bind mount; entry point is **host port 3000**.
- `nginx.base44.conf` is mounted as the nginx site config. It denies dotfiles and
  `*.yml` / `*.md` so repo internals (`.git`, compose file, these docs) are not web-reachable.
- Verify: `curl -sI http://localhost:3000/` → 200 and `curl -s http://localhost:3000/ | head`.

### There is no live-reload dev server
Static files are read from disk per request, so an edit is live as soon as it is written —
but the **browser** still needs a refresh. After any change, call `reload_preview`
(the site has no HMR websocket to push updates).

## Credentials
**None are required to run this project.** All external calls happen in the browser:
- `index.html` → `v6.exchangerate-api.com` (API key is hardcoded in the file) and
  `min-api.cryptocompare.com` (keyless). Called automatically on load; if either fails the
  page still renders, the price panel just stays empty.
- `chat.html` / `chat-property.html` → POST to a hardcoded n8n webhook
  (`https://mragent.app.n8n.cloud/webhook/chat`). No auth header, no secret.
Both are the repo owner's own external services and are configured in the source already.

## Known pre-existing gaps (not caused by the environment)
`index.html` links to pages and media that do not exist in the repo — they 404:
`chat-car.html`, `chat-contract.html`, `chat-finance.html`, `chat-search.html`,
and `assets/property-bg.mp4` (referenced by `chat-property.html`).
