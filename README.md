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

### Backend (port 3002)

```bash
cd backend
npm install
npm run dev
```

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

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

**Current:** Placeholders or images from `data/image-mapping.json`.

**Real images:**
1. Edit `data/image-mapping.json` – add `"id": "https://image-url"` to `mapping`
2. Or save files in `frontend/public/images/brainrots/[id].png` and set mapping: `"id": "/images/brainrots/id.png"`
3. Details: `scripts/fetch-images.md`

Sources: stealabrainrot.fandom.com, game8.co, escapetsunamiforbrainrots.info

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
- **npm run update-values** — `node scripts/update-values.js` — update values from shigjeta.net
- **npm run detect-new** — `node scripts/detect-new-brainrots.js` — detect new brainrots from Fandom wiki
- **npm run add-wiki-items** — `node scripts/add-more-items-from-wiki.js` — add missing items from wiki Category:Brainrots (syncs `backend/data` + `frontend/public/brainrots.json`)
- **npm run fill-etfb-images** — fill missing thumbnails from ETFB wiki `pageimages`
- **npm run fill-wiki-search-images** — fill remaining gaps via safe wiki search (skips misleading Lucky Block pages)
