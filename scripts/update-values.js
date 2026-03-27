#!/usr/bin/env node
/**
 * Scrapes brainrot values from shigjeta.net and updates data/brainrots.json.
 * Only updates existing items. Does NOT overwrite file on scrape failure.
 *
 * SCRAPED_ALIASES — when the wiki/app slug differs from shigjeta’s row name.
 * data/income-overrides.json — optional { "item-id": incomePerSecond } for rows
 * missing from shigjeta’s short table (merge after scrape; overrides win).
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DATA_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const OVERRIDES_PATH = path.join(__dirname, '..', 'data', 'income-overrides.json');
const SOURCE_SHIGJETA = 'https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/';
const SOURCE_TECHWISER = 'https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Our normalized slug (from app name) -> shigjeta table slug when spelling differs. */
const SCRAPED_ALIASES = {
  'glacierello-infernetti': 'glacierello-inferniti',
};

function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function parseIncome(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().replace(/[\s,_]/g, '');
  const m = s.match(/\$?([\d.]+)\s*(K|M|B)?\/?s?/i);
  if (!m) return null;
  let num = parseFloat(m[1]);
  if (!Number.isFinite(num) || num <= 0) return null;
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') num *= 1e3;
  else if (suffix === 'M') num *= 1e6;
  else if (suffix === 'B') num *= 1e9;
  return Math.round(num);
}

function fetchUrl(url) {
  return axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 15000,
    validateStatus: (s) => s === 200,
  }).then((res) => res.data);
}

function scrapeShigjeta(html) {
  const $ = cheerio.load(html);
  const rows = [];
  $('table tbody tr, table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length >= 3) {
      const name = $(cells[0]).text().trim();
      const incomeStr = $(cells[2]).text().trim();
      if (name && incomeStr) rows.push({ name, incomeStr });
    } else if (cells.length === 2) {
      const name = $(cells[0]).text().trim();
      const incomeStr = $(cells[1]).text().trim();
      if (name && incomeStr && incomeStr.includes('$')) rows.push({ name, incomeStr });
    }
  });
  return rows;
}

function scrapeTechWiser(html) {
  const $ = cheerio.load(html);
  const rows = [];
  $('table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length >= 3) {
      const name = $(cells[1]).text().trim();
      const incomeStr = $(cells[2]).text().trim();
      if (name && incomeStr && incomeStr.includes('$')) rows.push({ name, incomeStr });
    }
  });
  return rows;
}

/**
 * Returns two Maps: primary (Shigjeta — trusted, higher values) and fallback (TechWiser).
 * Shigjeta values always win; TechWiser only fills items with income=0.
 */
async function scrapeValues() {
  const results = await Promise.allSettled([
    fetchUrl(SOURCE_SHIGJETA).then((html) => ({ source: 'shigjeta', rows: scrapeShigjeta(html) })),
    fetchUrl(SOURCE_TECHWISER).then((html) => ({ source: 'techwiser', rows: scrapeTechWiser(html) })),
  ]);

  const primary = new Map();
  const fallback = new Map();

  for (const r of results) {
    if (r.status === 'rejected') {
      console.warn(`[update-values] source failed: ${r.reason?.message || r.reason}`);
      continue;
    }
    const { source, rows } = r.value;
    const target = source === 'shigjeta' ? primary : fallback;
    let count = 0;
    for (const { name, incomeStr } of rows) {
      const slug = normalizeName(name);
      const income = parseIncome(incomeStr);
      if (!slug || income == null) continue;
      if (!target.has(slug)) { target.set(slug, income); count++; }
    }
    console.log(`[update-values] ${source}: ${rows.length} rows → ${count} slugs`);
  }

  if (primary.size + fallback.size < 5) throw new Error('All sources failed or returned too few rows');
  return { primary, fallback };
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

  let primary, fallback;
  try {
    ({ primary, fallback } = await scrapeValues());
    console.log(`[update-values] primary(shigjeta): ${primary.size}, fallback(techwiser): ${fallback.size}`);
  } catch (e) {
    console.error('Scraping failed:', e.message);
    console.error('File NOT overwritten.');
    process.exit(1);
  }

  let overrides = {};
  if (fs.existsSync(OVERRIDES_PATH)) {
    try {
      overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
      if (!overrides || typeof overrides !== 'object') overrides = {};
    } catch (_) {
      overrides = {};
    }
  }

  const updated = [];
  data.items.forEach((item) => {
    const slug = normalizeName(item.name);
    const currentIncome = item.income ?? item.baseIncome ?? 0;

    // 1. Overrides always win
    let income = overrides[item.id];

    // 2. Primary (Shigjeta) — trusted for any item it covers
    if (income == null || typeof income !== 'number' || !Number.isFinite(income)) {
      income = primary.get(slug);
      if (income == null && slug && SCRAPED_ALIASES[slug]) {
        income = primary.get(SCRAPED_ALIASES[slug]);
      }
    }

    // 3. Fallback (TechWiser) — only fills items currently at income=0
    if (income == null && currentIncome === 0) {
      income = fallback.get(slug);
      if (income == null && slug && SCRAPED_ALIASES[slug]) {
        income = fallback.get(SCRAPED_ALIASES[slug]);
      }
    }

    if (income == null) return;
    if (currentIncome === income) return;
    item.baseIncome = income;
    item.income = income;
    updated.push({ name: item.name, prev: currentIncome, income });
  });

  if (updated.length > 0) {
    data.meta = data.meta || {};
    data.meta.lastUpdated = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${updated.length} items:`);
    updated.forEach((u) => console.log(`  ${u.name}: ${u.prev} → ${u.income}`));
  } else {
    console.log('No values changed.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
