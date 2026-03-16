# Escape Tsunami Brainrots – Trade Calculator

Strona do porównywania itemów z gry **Escape Tsunami For Brainrots** (Roblox). Pozwala obliczyć **verschil** (różnicę wartości) między dwoma zestawami itemów i ocenić, czy wymiana jest Win / Fair / Loss.

## Funkcje

- **Pełna lista Brainrots** – 93+ itemów ze źródeł: escapetsunamiforbrainrotswiki.com, shigjeta.net
- **3 kolumny** – Twoje itemy | Verschil | Ich itemy
- **Trade calculator** – Verschil = sum(Ich) − sum(Twoje), wynik: Big Win / Win / Fair / Loss / Big Loss
- **Wyszukiwarka** – po nazwie itemu
- **Filtry** – po rarity (Common → Infinity)
- **Drag & drop** – przeciągnij itemy z listy do kolumn
- **Tooltips** – rarity, income, źródła wartości, data aktualizacji

## Uruchomienie lokalne

### Backend (port 3001)

```bash
cd backend
npm install
npm run dev
```

### Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Otwórz: **http://localhost:3000**

## Struktura

```
strona/
├── data/
│   └── brainrots.json    # Baza itemów
├── backend/
│   ├── server.js         # Express API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Główny komponent
│   │   └── ...
│   └── package.json
└── README.md
```

## API

- `GET /api/items` – lista wszystkich itemów
- `GET /api/items/:id` – pojedynczy item
- `POST /api/calculate-trade` – body: `{ yourItems: string[], theirItems: string[] }` → `{ verschil, result }`

## Obrazki (miniaturki)

**Obecnie:** Placeholdery z [UI Avatars](https://ui-avatars.com) – inicjały + kolor rarity.

**Prawdziwe obrazy:**
1. Edytuj `data/image-mapping.json` – dodaj `"id": "https://url-obrazka"` do `mapping`
2. Lub zapisz pliki w `frontend/public/images/brainrots/[id].png` i dodaj do mapping: `"id": "/images/brainrots/id.png"`
3. Szczegóły: `scripts/fetch-images.md`

Źródła: stealabrainrot.fandom.com, game8.co, escapetsunamiforbrainrots.info

## Wdrożenie

- **Frontend**: Vercel / Netlify
- **Backend**: Render / Heroku
- **Domena**: Namecheap, GoDaddy, OVH

## WFL (Win / Fair / Loss)

- **WIN** → dostajesz **>15%** więcej $/s (zielony).
- **FAIR** → różnica między **-10%** a **+15%** (żółty).
- **LOSS** → oddajesz **>10%** więcej $/s (czerwony).

API zwraca `status` (z emoji), `color`, `diffPercent`. Opcjonalnie w body: `levelMultipliers: { "id": 1.2 }` dla levela.  
Tier list **F → D → C → B → A → S → SS → God**, mutacje (Lucky, level): **docs/ESCAPE_TSUNAMI_CONTEXT.md**.

## Źródła danych

| Źródło | Zawartość |
|--------|-----------|
| escapetsunamiforbrainrotswiki.com | Pełna lista, income, rarity |
| shigjeta.net | Divine/Infinity, Celestial, Secret |
| valuesrbx.com, gamerant.com, pvpbank.com | Tier listy, $/s (marzec 2026) |
| escapetsunamiforbrainrots.com | Brainrot stats |
