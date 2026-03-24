# Źródła listy i obrazków (brainroty)

## Listy (wartości, rarity, income)

| Strona | Uwagi |
|--------|--------|
| [escapetsunamiforbrainrotswiki.com](https://escapetsunamiforbrainrotswiki.com/) — wartości | Duża lista, często aktualizowana |
| [shigjeta.net](https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/) | Divine / Infinity, ranking $/s |
| [gamerant.com](https://gamerant.com/roblox-escape-tsunami-for-brainrots-all-brainrots-list-values/) | Pełna lista, artykuł |
| [escape-tsunami-for-brainrots.com/wiki](https://escape-tsunami-for-brainrots.com/wiki) | Baza 93+ z opisami stref |
| [escapetsunamiforbrainrots.com](https://escapetsunamiforbrainrots.com/) | Kalkulator / wiki |
| [escapetsunamiforbrainrots.org](https://escapetsunamiforbrainrots.org/) | Przewodnik |
| [escapetsunamiforbrainrots.web.id](https://escapetsunamiforbrainrots.web.id/wiki/escape-tsunami-all-brainrots/) | Lustrzane wiki (regionowe) |
| [traderie.com/escapetsunamiforbrainrots/products](https://traderie.com/escapetsunamiforbrainrots/products) | Nazwy przedmiotów pod handel |
| [valuesrbx.com](https://valuesrbx.com) / [pvpbank.com](https://pvpbank.com) | Wartości Roblox (często w tabelach) |

Skrypt w projekcie: `scripts/update-values.js` (shigjeta).

---

## Grafiki / miniatury — wiele możliwych stron

| Źródło | URL / wzorzec | Jak brać obraz |
|--------|-----------------|----------------|
| **ETFB Fandom** (ta gra) | `escape-tsunami-for-brainrots.fandom.com/wiki/...` | API `pageimages` — `scripts/fetch-etfb-images.js` |
| **Beebom** | `beebom.com` + `static.beebom.com/.../2026/01/*.jpg` | Lista w artykule — `scripts/fetch-beebom-images.js` |
| **TechWiser** | [escape-tsunami-for-brainrots-all-brainrots-list](https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/) | Tabela z `<img>` — `scripts/fetch-techwiser-images.js` (uwaga: możliwe pomyłki wierszy) |
| **Game8** | [game8.co Roblox 581250](https://game8.co/games/Roblox/archives/581250) | `img.game8.co` w HTML — `scripts/fetch-game8-images.js` |
| **Gamerant** | ten sam temat co lista | Czasem osobne obrazki w artykule |
| **Pro Game Guides** | [progameguides.com Roblox Escape Tsunami](https://progameguides.com/roblox/) — szukaj „Escape Tsunami” | Miniatury w poradnikach |
| **playbrainrot.org** | `/images/characters/*.webp` | Ta sama „rodzina” memów — `scripts/fix-image-mapping.js` (może nie pasować do ETFB) |
| **Traderie** | `traderie.com/escapetsunamiforbrainrots/product/<slug>` | Grafika produktu na stronie produktu |
| **Steal a Brainrot Fandom** | `stealabrainrot.fandom.com` | Wiele **tych samych** postaci pod inną grą — używać ostrożnie |
| **escapetsunamiforbrainrots.info** | `/brainrots/<id>` | Strony postaci (gdy żyją) |
| **YouTube** | miniatury / klatki z „All brainrots” | Tylko ręcznie, prawa autorskie |
| **Sklepy / marketplace** (np. Itemku, ogłoszenia) | losowe listy | Niespójne nazewnictwo, ręcznie |

Lokalne pliki (najpewniejsze w UI): `frontend/public/images/brainrots/[id].png` + wpis `/images/brainrots/[id].png` w `image-mapping.json`.

Zbicie do dysku z URL-i: `npm run cache-thumbnails` (`scripts/cache-local-thumbnails.js`).

---

## Które źródła są w projekcie „oficjalnie” używane

1. **Beebom** (znane nazwy plików) + **ETFB Fandom** na braki — `npm run fill-beebom-images`  
2. **Kopia lokalna** — `npm run cache-thumbnails`  
3. Opcjonalnie: **TechWiser**, **Game8**, **prefer-playbrainrot** — mogą dać **zły** rysunek przy złym dopasowaniu nazwy.

---

## Identyfikator (`id`)

Z `data/brainrots.json`, np. `meta-technetta`, `rainbow-67`, `esok-sekolah`.

```json
{
  "mapping": {
    "rainbow-67": "https://example.com/rainbow67.png",
    "meta-technetta": "/images/brainrots/meta-technetta.png"
  }
}
```

- **https://…** — zewnętrzny URL (w dev często przez `/api/image` jeśli host na liście w `backend/server.js`)  
- **`/images/...`** — plik w `frontend/public/`

---

## Community / media / oficjalne (2026)

Źródła „świeże” pod kątem hype’u, memów i grafik — **część tylko ręcznie** (prawa autorskie, brak stabilnego API).

| Źródło | Link | Uwagi |
|--------|------|--------|
| **TechWiser** — lista + wartości + miniatury w tabeli | [techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list](https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/) | Bardzo wygodne pod value calc; w repo: `npm run` → `fetch-techwiser-images.js` (sprawdź dopasowanie wierszy). Host już na liście proxy. |
| **Pinterest** — fanarty, edity | [ideas/escape-tsunami-for-brainrot](https://www.pinterest.com/ideas/escape-tsunami-for-brainrot/907294892470/) | Wyszukiwanie „escape tsunami brainrot”; **ręczne** pobieranie, respektuj licencje. |
| **Roblox Fandom** — artykuł o grze | [Wave of Brainrots / Escape Tsunami](https://roblox.fandom.com/wiki/Wave_of_Brainrots/Escape_Tsunami_For_Brainrots) | Oficjalne screeny / opis; inna składnia wiki niż ETFB. |
| **Strona gry Roblox** | [Escape Tsunami For Brainrots na Roblox](https://www.roblox.com/games/131623223084840/Escape-Tsunami-For-Brainrots) | Thumbnail gry, ikony update’ów; assetty Roblox pod ich ToS. |
| **Tenor** | [wyszukiwanie GIF](https://tenor.com/search/roblox-escape-tsunami-brainrots-gifs) (np. „roblox escape tsunami brainrots”) | Osobno od statycznych PNG w kalkulatorze. |
| **GIPHY** | [wyszukiwanie](https://giphy.com/search/escape-tsunami-brainrots) | To samo — animacje / sigma edity pod marketing, nie jako domyślne miniatury. |
| **Discord społeczności** | [discord.gg/escapetsunamiforbrainrots](https://discord.com/invite/escapetsunamiforbrainrots) | Trading, leak’i, screeny — **nie** automatyzuj ściągania; tylko inspiracja / ręczne grafiki. |
| **Social** | [#escapetsunamiforbrainrots na Instagram](https://www.instagram.com/explore/tags/escapetsunamiforbrainrots/) · [TikTok tag](https://www.tiktok.com/tag/escapetsunamiforbrainrots) | Treści użytkowników — prawa autorskie. |

**Podsumowanie pod ten projekt:** do **automatycznego** uzupełniania `image-mapping.json` nadal najlepiej: **ETFB Fandom API**, **Game8**, **Beebom**, **TechWiser (ostrożnie)**, potem **`npm run cache-thumbnails`**. Pinterest / GIF / Discord to **materiały dodatkowe**, nie zastępują spójnego źródła danych w kalkulatorze.
