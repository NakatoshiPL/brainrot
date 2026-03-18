# Fetching Brainrots list and images

## LIST sources (values, rarity, income)

| URL | Content |
|-----|---------|
| https://escapetsunamiforbrainrotswiki.com/escape-tsunami-for-brainrots-value | 93+ units, income, rarity |
| https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/ | Divine/Infinity, trade values |
| https://gamerant.com/roblox-escape-tsunami-for-brainrots-all-brainrots-list-values/ | Full value list |
| https://escape-tsunami-for-brainrots.com/wiki | 93+ Brainrots, stats |
| https://traderie.com/escapetsunamiforbrainrots/products | Item list (names) |

## IMAGE sources

| URL | How to fetch |
|-----|--------------|
| **Traderie** https://traderie.com/escapetsunamiforbrainrots/product/[id] | Product page (e.g. rainbow-67, burgerini-bearini) – right-click image → Copy address |
| **Game8** https://game8.co/games/Roblox/archives/581250 | List with thumbnails – DevTools → inspect img |
| **Steal A Brainrot Fandom** https://stealabrainrot.fandom.com/wiki/[Name] | e.g. Noobini_Pizzanini, Tralalero_Tralala – same characters |
| **escapetsunamiforbrainrots.info** https://escapetsunamiforbrainrots.info/brainrots/[id] | Character pages (dug-dug-dug, esok-sekolah) |

## Local files

Download images and save to `frontend/public/images/brainrots/[id].png`

## Adding to mapping

Edit `data/image-mapping.json`:

```json
{
  "mapping": {
    "rainbow-67": "https://example.com/rainbow67.png",
    "meta-technetta": "/images/brainrots/meta-technetta.png"
  }
}
```

- **External URL** – full address (https://…)
- **Local** – `/images/brainrots/[id].png` (file in `frontend/public/images/brainrots/`)

## Identifiers (id)

Use `id` from `data/brainrots.json`, e.g.:  
`meta-technetta`, `rainbow-67`, `esok-sekolah`, `pipi-corni`.
