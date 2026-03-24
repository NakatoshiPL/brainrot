# Escape Tsunami Brainrots – Trade Calculator

A page to compare items from **Escape Tsunami For Brainrots** (Roblox). It calculates the **value difference** between two sets of items and shows whether the trade is Win / Fair / Loss.

## Features

- **Full Brainrots list** – 160+ items from sources: escapetsunamiforbrainrotswiki.com, shigjeta.net, ETFB Fandom
- **3 columns** – Your items | Difference | Their items
- **Trade calculator** – Difference = sum(Theirs) − sum(Yours), result: Big Win / Win / Fair / Loss / Big Loss
- **Search** – by item name
- **Filters** – by rarity (Common → Infinity)
- **Drag & drop** – drag items from the list into columns
- **Tooltips** – rarity, income, value sources, last updated

## Local setup

### Easiest: backend + frontend together (recommended)

From the **project root** (`strona/`):

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
npm run dev:all
```

Open in the browser: **http://localhost:5173**  
(API is proxied to the backend on **3002** — do not open `localhost:3002` for the UI; that URL is API-only.)

### Or two terminals

**Terminal 1 – API**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 – UI**

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

If you see `http proxy error: /api/items` / `ECONNREFUSED` in the Vite terminal, the **backend is not running** — start it with `npm run backend` from the root or `npm run dev` inside `backend/`.

## Structure

```
project/
├── data/
│   └── brainrots.json    # Item database
├── backend/
│   ├── server.js         # Express API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main component
│   │   └── ...
│   └── package.json
└── README.md
```

## API

- `GET /api/items` – list all items
- `GET /api/items/:id` – single item
- `POST /api/calculate-trade` – body: `{ yourItems: string[], theirItems: string[] }` → `{ status, result, diffPercent }`

## Images (thumbnails)

1. **`npm run fill-beebom-images`** — **Beebom** article thumbnails (known filenames) for Escape Tsunami, then **ETFB Fandom** `pageimages` for IDs still missing (same wiki as the game). Does **not** mix in TechWiser or generic `playbrainrot.org` packs (those often show the wrong meme character).
2. **`npm run prefer-playbrainrot`** — optional: rebuild from `playbrainrot.org` slugs only (Steal-a-Brainrot-style art; can mismatch names).
3. **`npm run fill-empty-images`** — strips **misleading** wiki thumbs (Lucky Block, wrong character files), then fills gaps: **Beebom HEAD** → exact wiki **pageimage** only → **`/images/brainrot-missing.svg`** placeholder. Does **not** use broad wiki search (that caused wrong images).

- **`npm run cache-thumbnails`** — pobiera zdalne URL-e z mapowania do `frontend/public/images/brainrots/` i ustawia ścieżki `/images/brainrots/...` (miniaturki działają bez proxy Beebom/Wikia).
- **`npm run fill-ui-sources`** — uzupełnia braki z **Game8** (HTML) + **MediaWiki API** (wiki Escape Tsunami + Steal a Brainrot), zgodnie z listą w UI „Data sources”. Potem zwykle `npm run cache-thumbnails`. Traderie blokuje skrypty (403).

Manual: edit `data/image-mapping.json` `mapping`, or put files in `frontend/public/images/brainrots/[id].png`. **Pełna lista stron** (wiki, Game8, Traderie, przewodniki itd.): `scripts/fetch-images.md`.

## Deployment

- **Frontend**: Vercel / Netlify
- **Backend**: Render / Heroku
- **Domain**: Namecheap, GoDaddy, OVH

## WFL (Win / Fair / Loss)

- **WIN** → you get **>15%** more $/s (green).
- **FAIR** → difference between **-10%** and **+15%** (yellow).
- **LOSS** → you give **>10%** more $/s (red).

API returns `status` (with emoji), `color`, `diffPercent`. Optional body: `levelMultipliers: { "id": 1.2 }` for level.  
Tier list **F → D → C → B → A → S → SS → God**, mutations (Lucky, level): **docs/ESCAPE_TSUNAMI_CONTEXT.md**.

## Data sources

| Source | Content |
|--------|---------|
| escapetsunamiforbrainrotswiki.com | Full list, income, rarity |
| shigjeta.net | Divine/Infinity, Celestial, Secret |
| valuesrbx.com, gamerant.com, pvpbank.com | Tier lists, $/s (March 2026) |
| escapetsunamiforbrainrots.com | Brainrot stats |

## AI Features

- **POST /api/chat** — chatbot for players (streaming, trade advice)
- **Automatic data refresh (backend)** — set `AUTO_UPDATE_ENABLED=1` in `backend/.env` (long-running Node only). Schedules **daily** `update-values` + `sync-data` (income from shigjeta) and **weekly** `detect-new` + `sync-data` (wiki + OpenAI for new entries). Repo root must have run `npm install` so scripts resolve `axios` / `cheerio`. See `backend/.env.example` for cron env vars.
- **npm run update-values** — `node scripts/update-values.js` — update values from shigjeta.net
- **npm run detect-new** — `node scripts/detect-new-brainrots.js` — detect new brainrots from Fandom wiki
- **npm run add-wiki-items** — `node scripts/add-more-items-from-wiki.js` — add missing items from wiki Category:Brainrots (syncs `backend/data` + `frontend/public/brainrots.json`)
- **npm run fill-etfb-images** — fill missing thumbnails from ETFB wiki `pageimages`
- **npm run fill-wiki-search-images** — fill remaining gaps via safe wiki search (skips misleading Lucky Block pages)
- **npm run prefer-playbrainrot** — merge **playbrainrot.org** `.webp` URLs (in-game art) on top of TechWiser/wiki, then copy mapping to `backend/data/`
