# Pobieranie listy i obrazków Brainrots

## Źródła LISTY (wartości, rarity, income)

| URL | Zawartość |
|-----|-----------|
| https://escapetsunamiforbrainrotswiki.com/escape-tsunami-for-brainrots-value | 93 jednostki, income, rarity |
| https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/ | Divine/Infinity, trade values |
| https://gamerant.com/roblox-escape-tsunami-for-brainrots-all-brainrots-list-values/ | Pełna lista wartości |
| https://escape-tsunami-for-brainrots.com/wiki | 93+ Brainrots, statystyki |
| https://traderie.com/escapetsunamiforbrainrots/products | Lista itemów (nazwy) |

## Źródła OBRAZKÓW

| URL | Jak pobrać |
|-----|-------------|
| **Traderie** https://traderie.com/escapetsunamiforbrainrots/product/[id] | Strona produktu (np. rainbow-67, burgerini-bearini) – prawy klik na obrazek → Kopiuj adres |
| **Game8** https://game8.co/games/Roblox/archives/581250 | Lista z miniaturkami – DevTools → inspekcja img |
| **Steal A Brainrot Fandom** https://stealabrainrot.fandom.com/wiki/[Nazwa] | Np. Noobini_Pizzanini, Tralalero_Tralala – te same postacie |
| **escapetsunamiforbrainrots.info** https://escapetsunamiforbrainrots.info/brainrots/[id] | Strony postaci (dug-dug-dug, esok-sekolah) |

## Lokalne pliki

Pobierz obrazki i zapisz w `frontend/public/images/brainrots/[id].png`

## Dodawanie do mapowania

Edytuj `data/image-mapping.json`:

```json
{
  "mapping": {
    "rainbow-67": "https://example.com/rainbow67.png",
    "meta-technetta": "/images/brainrots/meta-technetta.png"
  }
}
```

- **URL zewnętrzny** – pełny adres (https://…)
- **Lokalny** – `/images/brainrots/[id].png` (plik w `frontend/public/images/brainrots/`)

## Identyfikatory (id)

Użyj `id` z `data/brainrots.json`, np.:  
`meta-technetta`, `rainbow-67`, `esok-sekolah`, `pipi-corni`.
