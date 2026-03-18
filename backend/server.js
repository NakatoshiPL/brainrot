require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const OpenAI = require('openai').default;

const app = express();
const PORT = process.env.PORT || 3002;

const ALLOWED_ORIGINS = [
  'https://TWOJ-PROJEKT.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(null, false);
  }
}));
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'data', 'brainrots.json');
const IMAGE_MAPPING_PATH = path.join(__dirname, 'data', 'image-mapping.json');

function loadImageMapping() {
  try {
    const raw = fs.readFileSync(IMAGE_MAPPING_PATH, 'utf8');
    const data = JSON.parse(raw);
    return data.mapping || {};
  } catch {
    return {};
  }
}

/** Return image URL only when we have a verified mapping or item.imageUrl. No guesswork URL to avoid wrong/fake thumbnails. */
function getItemImage(item) {
  const mapping = loadImageMapping();
  if (mapping[item.id] && mapping[item.id].trim()) return mapping[item.id].trim();
  if (item.imageUrl && item.imageUrl.startsWith('http')) return item.imageUrl;
  return '';
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

// Image proxy (Fandom blocks hotlink – we serve via backend)
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
// WFL: Win >15%, Fair -10%..15%, Loss <-10%. Value = baseIncome * (levelMult or mutationMult).
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

// --- AI Chatbot ---
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.get('/api/chat/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: 'OpenAI API key not configured' });
  }
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const data = loadData();
    const brainrotsList = data.items
      .map(i => `${i.name} | ${i.rarity} | value: ${i.value ?? i.baseIncome ?? i.income ?? 0} | income: ${i.income ?? i.baseIncome ?? 0} $/s`)
      .join('\n');

    const systemPrompt = `You are an expert on the Roblox game Escape Tsunami for Brainrots.
You know the values of all brainrots. You help players judge whether a trade is fair.
Reply briefly and concretely. Use numbers from the data.
Current brainrots list (name | rarity | value | income):
${brainrotsList}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.filter(m => m.role && m.content).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Brainrots API running on http://localhost:${PORT}`);
});
