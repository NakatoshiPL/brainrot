# Escape Tsunami for Brainrots – kontekst dla Cursor / projektu

Gra Roblox (Do Big Studios), podobna do Steal a Brainrot: zamiast kradzieży – **ucieczka przed tsunami**, zbieranie brainrotów na trasie i przynoszenie do bazy, gdzie generują **$/s** (money per second). Jest PvP (baseball bat), lucky blocks, **mutacje**, upgrade'y bazy, trade tokeny. **Level do 300** mocno mnoży $/s.

## Wartości i WFL (Win / Fair / Loss)

- **Wartość itemu** = **baseIncome** ($/s na level 1). W tradzie: `baseIncome * (levelMultiplier || 1)` – level i mutacje mnożą.
- **Win (zielony)** → dostajesz ≥15% więcej łącznego $/s.
- **Fair (żółty)** → różnica między -10% a +15%.
- **Loss (czerwony)** → oddajesz ≥10% więcej $/s.

### Zasady w API (marzec 2026)

- **WIN** – `diffPercent > 15` → status `"WIN 🔥"`, kolor `#00ff00`.
- **FAIR** – `diffPercent` w przedziale `[-10, 15]` → status `"FAIR ⚖️"`, kolor `#ffff00`.
- **LOSS** – `diffPercent < -10` → status `"LOSS ❌"`, kolor `#ff0000`.

Rarity: Common → Uncommon → Rare → Epic → Legendary → Mythical → Cosmic → Secret → Celestial → Divine → Infinity.

## Tier list (F → God)

Pełna skala w `brainrots.json`: **F → D → C → B → A → S → SS → God**.

| Tier | Opis | Przykłady |
|------|------|-----------|
| **F** | Najsłabsze, common | Noobini Cakenini, Lirili Larila, Tim Cheese |
| **D** | Uncommon / słabe rare | Trippi Troppi, 67, Pipi Avocado |
| **C** | Rare | Cappuccino Assassino, Bambini Crostini |
| **B** | Epic | Chef Crabracadabra, Glorbo Fruttodrillo, Sigma Boy |
| **A** | Legendary / Mythical | Frigo Camelo, Cocofanto Elefanto, Ballerino Lololo |
| **S** | Cosmic / Secret (wysokie $/s) | La Grande Combinasion, Matteo, Vroosh Boosh |
| **SS** | Secret top | Aura Farma, Rainbow 67, Fragola La La La |
| **God** | Celestial / Divine / Infinity | Esok Sekolah, Alessio, Galactio Fantasma, Noobini Infeeny, Anububu, Magmew |

## Mutacje (realne multiplikatory)

W eventach / lucky blocks: **Emerald 1.2x**, **Gold 1.5x**, **Blood 2x**, **Diamond 2.5x**, **Electric 3x**. Doom tylko na admin event.

W API `POST /api/calculate-trade` można podać:
- `yourMutation`, `theirMutation` – np. `"Emerald"`, `"Diamond"` – wtedy cała strona mnoży się przez ten multiplier.
- `levelMultipliers: { "item-id": 1.5 }` – per-item (level).

Pole w każdym brainrocie: `mutationNote` (np. „Emerald 1.2x / Diamond 2.5x (event)”).

## Dane w projekcie

- **data/brainrots.json** – itemy: `id`, `name`, `rarity`, `category`, `baseIncome`, `income`, `tier` (F→God), `mutationNote`, `imageUrl` (placeholder). Posortowane od najsłabszych do najmocniejszych.
- **data/image-mapping.json** – mapowanie `id` → URL obrazka (Fandom / playbrainrot.org).
- **imageUrl** w każdym itemcie – na razie pusty; można wstawić link do screenu (z gry, wiki lub imgur).

### Jak dodać zdjęcia (imageUrl)

1. **Fandom**: https://escape-tsunami-for-brainrots.fandom.com → szukaj nazwy brainrota → kliknij obrazek → „Kopiuj adres obrazka”.
2. **W grze**: zrób screen → wrzuć na imgur.com → wklej link do obrazka w `imageUrl` (albo do `data/image-mapping.json` pod `id`).
3. Backend używa najpierw `image-mapping.json`, potem `item.imageUrl` jeśli zaczyna się od `http`, na końcu avatar z ui-avatars.com.
- Backend: **calculate-trade** przyjmuje opcjonalnie `levelMultipliers`; zwraca `result`, `status` (z emoji), `color`, `diffPercent`, `yourIncome`, `theirIncome`.

## Źródła do aktualizacji wartości (na żywo)

- **valuesrbx.com/escape-tsunami-for-brainrots-value-list** – kalkulator + tier list
- **gamerant.com/roblox-escape-tsunami-for-brainrots-all-brainrots-list-values** – pełna lista $/s (marzec 2026)
- **pvpbank.com/all-brainrots-tier-list-escape-tsunami-for-brainrots** – ranking $/s
- **Fandom**: roblox.fandom.com/wiki/Wave_of_Brainrots/Escape_Tsunami_For_Brainrots
