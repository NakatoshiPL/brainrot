#!/usr/bin/env node
/**
 * Scrapes brainrot values from shigjeta.net and updates data/brainrots.json.
 * Only updates existing items. Does NOT overwrite file on scrape failure.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DATA_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const SOURCE_URL = 'https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
  const s = str.trim().replace(/\s/g, '');
  const m = s.match(/\$?([\d.]+)\s*(K|M|B)?\/?s?/i);
  if (!m) return null;
  let num = parseFloat(m[1]);
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') num *= 1e3;
  else if (suffix === 'M') num *= 1e6;
  else if (suffix === 'B') num *= 1e9;
  return Math.round(num);
}

function scrapeValues() {
  return axios.get(SOURCE_URL, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 15000,
    validateStatus: (s) => s === 200
  }).then((res) => {
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const $ = cheerio.load(res.data);
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
    if (rows.length < 5) throw new Error('Could not parse enough table rows');
    return rows.map((r) => ({ name: r.name, income: parseIncome(r.incomeStr) })).filter((r) => r.income != null);
  });
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

  let scraped;
  try {
    scraped = await scrapeValues();
    console.log(`Scraped ${scraped.length} brainrot values from ${SOURCE_URL}`);
  } catch (e) {
    console.error('Scraping failed:', e.message);
    console.error('File NOT overwritten.');
    process.exit(1);
  }

  const nameToSlug = new Map();
  data.items.forEach((item) => {
    const slug = normalizeName(item.name);
    if (slug) nameToSlug.set(slug, item);
  });

  const updated = [];
  scraped.forEach(({ name, income }) => {
    const slug = normalizeName(name);
    const item = nameToSlug.get(slug);
    if (!item) return;
    const prev = item.income ?? item.baseIncome ?? 0;
    if (prev === income) return;
    item.baseIncome = income;
    item.income = income;
    updated.push({ name: item.name, prev, income });
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
