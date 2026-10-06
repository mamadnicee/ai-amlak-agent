# AGENTS.md

## What this project is
A **pure static site** — Persian (fa / RTL) "AI Real Estate" landing page plus two chat panels.
No package manager, no build step, no backend, no tests. Plain HTML/CSS/JS + assets.

Pages:
- `index.html` — landing page (GSAP/ScrollTrigger + three.js 3D car, floating tool dock: calculator,
  live prices, notes, mortgage)
- `chat.html` — generic chat panel
- `chat-property.html` — property-analysis chat panel

## Running it (Base44 dev environment)
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
One service: `nginx:alpine` serving the repo root from a bind mount, **host port 3000**.
Verify: `curl -sI http://localhost:3000/` → 200, and `docker inspect --format '{{.State.Health.Status}}' app-web-1` → healthy.

### There is no live-reload dev server
Static files are read from disk on every request (`sendfile off`), so an edit is live as soon as
it is written — but the **browser** still needs a refresh. After any change, call `reload_preview`
(no HMR websocket exists to push updates).

### Two non-obvious things about the nginx setup
1. `nginx.base44.conf` runs with **`user root`**. The bind-mounted repository root is mode 700, and
   the default unprivileged nginx worker cannot traverse it — without this, every request is 403.
2. `nginx-prices.conf.template` is a **conf.d-style fragment** (only `location` blocks, no `server`)
   rendered at container start by the image's envsubst step into the `nginx-generated` volume, and
   included *inside* the server block of `nginx.base44.conf`. The output dir is overridden with
   `NGINX_ENVSUBST_OUTPUT_DIR` and must pre-exist as a writable directory (hence the volume).

## API keys
Both price providers are called **server-side through nginx** (`/api/fiat`, `/api/crypto`), so the
keys never reach the browser. The page fetches same-origin and nginx injects the credential.
Do not move these calls back into the page or hardcode a key in `index.html`.

- `EXCHANGE_API_KEY` — ExchangeRate-API, used by `/api/fiat`.
- `CRYPTOCOMPARE_API_KEY` — CoinDesk/CryptoCompare, used by `/api/crypto` (the keyless endpoint now
  answers `401 API key required`).

`.env.base44-defaults` holds **placeholders only** so envsubst always has both variables defined
(an undefined one is left as literal `${...}` and nginx then dies with `unknown variable`).
It is listed first in `env_file:` so `/run/base44/app.env` always overrides it.

### Known limitations, not environment problems
- The chat panels POST to a hardcoded n8n webhook (`https://mragent.app.n8n.cloud/webhook/chat`).
  It is the owner's own service, needs no secret, and responds 200.
- `index.html` polls its prices every 10 s **on every page load**. That is far more than the
  ExchangeRate-API free tier allows (1,500 req/month), so any free key is exhausted within days.
  The 429 `quota-reached` response is the provider refusing the key, not a proxy bug.

### Pre-existing broken links
`index.html` links to `chat-car.html`, `chat-contract.html`, `chat-finance.html`, `chat-search.html`
and `chat-property.html` references `assets/property-bg.mp4` — none of these files exist (404).
