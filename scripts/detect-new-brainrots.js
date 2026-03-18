#!/usr/bin/env node
/**
 * Fetches brainrot list from Fandom wiki, detects new ones, estimates income via OpenAI, adds to brainrots.json.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai').default;

const DATA_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const WIKI_URL = 'https://escape-tsunami-for-brainrots.fandom.com/wiki/Brainrots';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function slug(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function fetchWikiBrainrots() {
  const res = await axios.get(WIKI_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/'
    },
    timeout: 20000,
    validateStatus: (s) => s === 200
  });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const $ = cheerio.load(res.data);
  const found = [];
  $('a[href^="/wiki/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const name = $(el).text().trim();
    const match = href.match(/^\/wiki\/(.+)$/);
    if (!match || !name) return;
    const wikiSlug = decodeURIComponent(match[1]);
    if (/^(Category|File|Template|User|Help|Special|Brainrots):/i.test(wikiSlug)) return;
    if (wikiSlug === 'Brainrots' || wikiSlug === 'Main_Page') return;
    if (name.length < 2 || name.length > 80) return;
    found.push({ name, wikiSlug });
  });
  const byName = new Map();
  found.forEach((f) => byName.set(f.name, f));
  return [...byName.values()];
}

async function estimateIncome(openai, name, rarity, examples) {
  const exStr = examples.map((e) => `${e.name}: ${e.income} $/s`).join(', ');
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Brainrot "${name}" has rarity "${rarity}" in the game Escape Tsunami for Brainrots.
Based on the following examples of other brainrots with the same rarity, estimate the income ($/s) value for this brainrot.
Examples: ${exStr}
Reply with ONLY a number, e.g.: 45000`
      }
    ],
    temperature: 0.3
  });
  const text = (res.choices[0]?.message?.content || '').trim();
  const num = parseInt(String(text).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(num) ? num : 1000;
}

async function main() {
  let data;
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read brainrots.json:', e.message);
    process.exit(1);
  }

  const existingNames = new Set(data.items.map((i) => i.name));
  const existingIds = new Set(data.items.map((i) => i.id));
  const byRarity = {};
  data.items.forEach((i) => {
    const r = i.rarity || 'Common';
    if (!byRarity[r]) byRarity[r] = [];
    byRarity[r].push({ name: i.name, income: i.income ?? i.baseIncome ?? 0 });
  });

  let wikiList;
  try {
    wikiList = await fetchWikiBrainrots();
    console.log(`Fetched ${wikiList.length} brainrot links from wiki`);
  } catch (e) {
    console.error('Failed to fetch wiki:', e.message);
    process.exit(1);
  }

  const newOnes = wikiList.filter((f) => !existingNames.has(f.name));
  if (newOnes.length === 0) {
    console.log('No new brainrots detected.');
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set in backend/.env');
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey });

  const added = [];
  for (const { name } of newOnes) {
    let rarity = 'Common';
    const rarities = Object.keys(byRarity);
    if (rarities.length) rarity = rarities[Math.floor(rarities.length / 2)];
    const examples = (byRarity[rarity] || byRarity.Common || []).slice(0, 5);
    const income = await estimateIncome(openai, name, rarity, examples);

    let id = slug(name);
    if (existingIds.has(id)) id = `${id}-${Date.now().toString(36)}`;
    existingIds.add(id);

    const item = {
      id,
      name,
      rarity,
      category: rarity,
      image: '',
      value: income,
      income,
      baseIncome: income,
      source_values: { estimated: true },
      lastUpdated: new Date().toISOString().slice(0, 10),
      imageUrl: '',
      tier: 'F',
      mutationNote: 'Emerald 1.2x / Diamond 2.5x (event)'
    };
    data.items.push(item);
    added.push({ name, rarity, income });
  }

  data.meta = data.meta || {};
  data.meta.lastUpdated = new Date().toISOString().slice(0, 10);
  data.meta.totalItems = data.items.length;
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Added ${added.length} new brainrots:`);
  added.forEach((a) => console.log(`  ${a.name} (${a.rarity}): ~${a.income} $/s`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
