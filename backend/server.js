const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const IMAGE_MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');

const ORIGINAL_IMAGE_BASE = 'https://www.playbrainrot.org/images/characters/';

function loadImageMapping() {
  try {
    const raw = fs.readFileSync(IMAGE_MAPPING_PATH, 'utf8');
    const data = JSON.parse(raw);
    return data.mapping || {};
  } catch {
    return {};
  }
}

/** Tylko oryginalne URL-e: mapping, item.imageUrl (http), lub playbrainrot.org. Bez placeholderów. */
function getItemImage(item) {
  const mapping = loadImageMapping();
  if (mapping[item.id] && mapping[item.id].trim()) return mapping[item.id].trim();
  if (item.imageUrl && item.imageUrl.startsWith('http')) return item.imageUrl;
  return ORIGINAL_IMAGE_BASE + item.id + '.webp';
}

function computeRP(income) {
  if (!income || income <= 0) return 1;
  const rp = Math.round(10 * Math.log10(income + 1));
  return Math.min(100, Math.max(1, rp));
}

function loadData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// Proxy obrazków (Fandom blokuje hotlink – serwujemy przez backend)
app.get('/api/image', (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith('http')) {
    return res.status(400).send('Missing or invalid url');
  }
  const client = url.startsWith('https') ? https : http;
  client.get(url, { headers: { 'Accept': 'image/*' } }, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      res.status(proxyRes.statusCode).end();
      return;
    }
    const ct = proxyRes.headers['content-type'] || 'image/png';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    proxyRes.pipe(res);
  }).on('error', () => res.status(502).end());
});

// GET all items
app.get('/api/items', (req, res) => {
  try {
    const data = loadData();
    const items = data.items.map(item => {
      const income = item.income ?? item.baseIncome ?? 0;
      const image = getItemImage(item);
      return {
        ...item,
        income: income,
        rp: computeRP(income),
        image,
        imageThumb: image
      };
    });
    res.json({ items, meta: data.meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single item by id
app.get('/api/items/:id', (req, res) => {
  try {
    const data = loadData();
    const item = data.items.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const income = item.income ?? item.baseIncome ?? 0;
    const image = getItemImage(item);
    res.json({
      ...item,
      income,
      rp: computeRP(income),
      image,
      imageThumb: image
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multiplikatory mutacji (event / lucky block): Emerald 1.2x, Gold 1.5x, Blood 2x, Diamond 2.5x, Electric 3x
const MUTATION_MULTIPLIERS = { Emerald: 1.2, Gold: 1.5, Blood: 2, Diamond: 2.5, Electric: 3 };

// POST calculate trade (body: { yourItems, theirItems, levelMultipliers?: {}, yourMutation?: string, theirMutation?: string })
// WFL: Win >15%, Fair -10%..15%, Loss <-10%. Wartość = baseIncome * (levelMult lub mutationMult).
app.post('/api/calculate-trade', (req, res) => {
  try {
    const { yourItems = [], theirItems = [], levelMultipliers = {}, yourMutation, theirMutation } = req.body;
    const data = loadData();
    const itemMap = Object.fromEntries(data.items.map(i => [i.id, { ...i, rp: computeRP(i.income || i.baseIncome) }]));

    const mutationMult = (m) => (m && MUTATION_MULTIPLIERS[m]) ? MUTATION_MULTIPLIERS[m] : 1;
    const yourMut = mutationMult(yourMutation);
    const theirMut = mutationMult(theirMutation);
    const mult = (id) => levelMultipliers[id] ?? 1;
    const yourIncome = yourItems.reduce((sum, id) => sum + (itemMap[id]?.income ?? itemMap[id]?.baseIncome ?? 0) * mult(id) * yourMut, 0);
    const theirIncome = theirItems.reduce((sum, id) => sum + (itemMap[id]?.income ?? itemMap[id]?.baseIncome ?? 0) * mult(id) * theirMut, 0);
    const yourRp = yourItems.reduce((sum, id) => sum + (itemMap[id]?.rp || 0), 0);
    const theirRp = theirItems.reduce((sum, id) => sum + (itemMap[id]?.rp || 0), 0);

    let result = 'Fair';
    let status = 'FAIR ⚖️';
    let color = '#ffff00';
    let diffPercent = 0;
    if (yourIncome > 0) {
      diffPercent = ((theirIncome - yourIncome) / yourIncome) * 100;
      const pct = Math.round(diffPercent * 10) / 10;
      if (diffPercent > 15) {
        result = 'Win';
        status = 'WIN 🔥';
        color = '#00ff00';
      } else if (diffPercent >= -10) {
        result = 'Fair';
        status = 'FAIR ⚖️';
        color = '#ffff00';
      } else {
        result = 'Loss';
        status = 'LOSS ❌';
        color = '#ff0000';
      }
    } else if (theirIncome > 0) {
      result = 'Win';
      status = 'WIN 🔥';
      color = '#00ff00';
      diffPercent = 100;
    }

    res.json({
      yourSum: yourRp,
      theirSum: theirRp,
      yourIncome,
      theirIncome,
      diffPercent: Math.round(diffPercent * 10) / 10,
      verschil: theirRp - yourRp,
      result,
      status,
      color
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Brainrots API running on http://localhost:${PORT}`);
});
