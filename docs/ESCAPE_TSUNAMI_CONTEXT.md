# Escape Tsunami for Brainrots – context for Cursor / project

Roblox game (Do Big Studios), similar to Steal a Brainrot: instead of stealing – **escaping a tsunami**, collecting brainrots on the track and bringing them to base, where they generate **$/s** (money per second). Has PvP (baseball bat), lucky blocks, **mutations**, base upgrades, trade tokens. **Level up to 300** strongly multiplies $/s.

## Values and WFL (Win / Fair / Loss)

- **Item value** = **baseIncome** ($/s at level 1). In trade: `baseIncome * (levelMultiplier || 1)` – level and mutations multiply.
- **Win (green)** → you get ≥15% more total $/s.
- **Fair (yellow)** → difference between -10% and +15%.
- **Loss (red)** → you give ≥10% more $/s.

### API rules (March 2026)

- **WIN** – `diffPercent > 15` → status `"WIN 🔥"`, color `#00ff00`.
- **FAIR** – `diffPercent` in range `[-10, 15]` → status `"FAIR ⚖️"`, color `#ffff00`.
- **LOSS** – `diffPercent < -10` → status `"LOSS ❌"`, color `#ff0000`.

Rarity: Common → Uncommon → Rare → Epic → Legendary → Mythical → Cosmic → Secret → Celestial → Divine → Infinity.

## Tier list (F → God)

Full scale in `brainrots.json`: **F → D → C → B → A → S → SS → God**.

| Tier | Description | Examples |
|------|-------------|----------|
| **F** | Weakest, common | Noobini Cakenini, Lirili Larila, Tim Cheese |
| **D** | Uncommon / weak rare | Trippi Troppi, 67, Pipi Avocado |
| **C** | Rare | Cappuccino Assassino, Bambini Crostini |
| **B** | Epic | Chef Crabracadabra, Glorbo Fruttodrillo, Sigma Boy |
| **A** | Legendary / Mythical | Frigo Camelo, Cocofanto Elefanto, Ballerino Lololo |
| **S** | Cosmic / Secret (high $/s) | La Grande Combinasion, Matteo, Vroosh Boosh |
| **SS** | Secret top | Aura Farma, Rainbow 67, Fragola La La La |
| **God** | Celestial / Divine / Infinity | Esok Sekolah, Alessio, Galactio Fantasma, Noobini Infeeny, Anububu, Magmew |

## Mutations (actual multipliers)

In events / lucky blocks: **Emerald 1.2x**, **Gold 1.5x**, **Blood 2x**, **Diamond 2.5x**, **Electric 3x**. Doom only on admin event.

In API `POST /api/calculate-trade` you can pass:
- `yourMutation`, `theirMutation` – e.g. `"Emerald"`, `"Diamond"` – then the whole side is multiplied by that multiplier.
- `levelMultipliers: { "item-id": 1.5 }` – per-item (level).

Field in each brainrot: `mutationNote` (e.g. "Emerald 1.2x / Diamond 2.5x (event)").

## Data in the project

- **data/brainrots.json** – items: `id`, `name`, `rarity`, `category`, `baseIncome`, `income`, `tier` (F→God), `mutationNote`, `imageUrl` (placeholder). Sorted from weakest to strongest.
- **data/image-mapping.json** – mapping `id` → image URL (Fandom / playbrainrot.org).
- **imageUrl** in each item – currently empty; you can put a link to a screenshot (from game, wiki or imgur).

### How to add images (imageUrl)

1. **Fandom**: https://escape-tsunami-for-brainrots.fandom.com → search brainrot name → click image → "Copy image address".
2. **In-game**: take a screenshot → upload to imgur.com → paste image link in `imageUrl` (or in `data/image-mapping.json` under `id`).
3. Backend uses `image-mapping.json` first, then `item.imageUrl` if it starts with `http`, finally avatar from ui-avatars.com.
- Backend: **calculate-trade** optionally accepts `levelMultipliers`; returns `result`, `status` (with emoji), `color`, `diffPercent`, `yourIncome`, `theirIncome`.

## Sources for updating values (live)

- **valuesrbx.com/escape-tsunami-for-brainrots-value-list** – calculator + tier list
- **gamerant.com/roblox-escape-tsunami-for-brainrots-all-brainrots-list-values** – full $/s list (March 2026)
- **pvpbank.com/all-brainrots-tier-list-escape-tsunami-for-brainrots** – $/s ranking
- **Fandom**: roblox.fandom.com/wiki/Wave_of_Brainrots/Escape_Tsunami_For_Brainrots
