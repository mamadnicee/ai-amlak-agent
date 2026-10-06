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

## Motion / animation rules (index.html + style.css)
Hard-won constraints — please keep them when touching the animation code:
- **Never put `filter: blur()` in scroll-driven GSAP tweens**, and never put `drop-shadow()` filters on
  the rotating `.led-border::after` ring. Both force an offscreen blur pass *per element per frame*;
  on this page (many glass cards over a WebGL canvas) they were the main source of scroll jank.
  LED bloom comes from the **static** `box-shadow` on `.led-border` instead.
- The three scene cuts live in one scrubbed timeline. Two details matter:
  - the timeline is padded to exactly 1.0 with `tl.to({}, { duration: 0.0001 }, 1)` so a cut at
    timeline position 0.25 lines up with scroll progress 0.25 — that is what the `ledFlash`
    thresholds in `onUpdate` compare against;
  - the car's rotation tween is centred **on** the cut (`at - CUT`, duration `CUT * 2`,
    `power1.inOut`) so its peak angular velocity lands exactly at the background crossfade and the
    cut is hidden by the motion, film-style. The car is never toggled `visible` — that used to blink.
- Motion should stay transform/opacity only; `ScrollTrigger` scrub is deliberately tight (0.65) so
  the 3D does not trail the scroll.

## API keys
Both price providers are called **server-side through nginx** (`/api/fiat`, `/api/crypto`), so the
keys never reach the browser. The page fetches same-origin and nginx injects the credential.
Do not move these calls back into the page or hardcode a key in `index.html`.

- `EXCHANGE_API_KEY` — ExchangeRate-API, used by `/api/fiat`.
- `CRYPTOCOMPARE_API_KEY` — CoinDesk/CryptoCompare, used by `/api/crypto` (the keyless endpoint
  answers `401 API key required`).

Both proxies are **cached** (`proxy_cache_path ... keys_zone=prices` in `nginx.base44.conf`, TTLs in
the template: 1 h fiat / 60 s crypto) because the page polls every 10 s. Upstream is called at most
once per TTL per endpoint regardless of how many tabs are open, and
`proxy_cache_use_stale ... http_429` keeps serving the last good rates when the provider refuses a
call. The `X-Price-Cache` response header reports `HIT`/`MISS`/`STALE`, which is how to tell a cached
panel from a live one.

`.env.base44-defaults` holds **placeholders only** so envsubst always has both variables defined
(an undefined one is left as literal `${...}` and nginx then dies with `unknown variable`).
It is listed first in `env_file:` so `/run/base44/app.env` always overrides it.

### Known limitations, not environment problems
- The chat panels POST to a hardcoded n8n webhook (`https://mragent.app.n8n.cloud/webhook/chat`).
  It is the owner's own service, needs no secret, and responds 200.
- `index.html` polls its prices every 10 s on every page load — far more than the ExchangeRate-API
  free tier allows (1,500 req/month). The nginx proxy cache absorbs that (see `## API keys`); without
  it any free key is exhausted within days and the provider answers `429 quota-reached`. That 429 is
  the provider refusing the key, not a proxy bug.

### Pre-existing broken links
`index.html` links to `chat-car.html`, `chat-contract.html`, `chat-finance.html`, `chat-search.html`
and `chat-property.html` references `assets/property-bg.mp4` — none of these files exist (404).
