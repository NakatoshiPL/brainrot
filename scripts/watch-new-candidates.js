#!/usr/bin/env node
/**
 * Daily watcher: compare external brainrot names with local data and write
 * a report to new-candidates.txt.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'brainrots.json');
const REPORT_PATH = path.join(ROOT, 'new-candidates.txt');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SOURCES = [
  {
    key: 'techwiser',
    url: 'https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/',
    parser: parseTechWiser,
  },
  {
    key: 'shigjeta-trade-values',
    url: 'https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/',
    parser: parseShigjetaTradeValues,
  },
  {
    key: 'shigjeta-every-brainrot',
    url: 'https://www.shigjeta.net/every-brainrot-in-escape-tsunami-for-brainrots-ranked-by-rarity-and-income/',
    parser: parseShigjetaEveryBrainrot,
  },
];

// Common misspellings/variants used by sources -> our canonical IDs
const KNOWN_SOURCE_ALIASES = {
  'glacierello-inferniti': 'glacierello-infernetti',
  'bisonte-gupitere': 'bisonte-giuppitere',
  'orangutini-ananassini': 'orangutini-ananasini',
  'strawberrilli-flamengilli': 'strawberrilli-flamingelli',
  'job-job-sahur': 'job-job-job-sahur',
};

function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\u2019/g, "'")
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function isLikelyBrainrotName(name) {
  if (!name) return false;
  if (name.length < 3 || name.length > 80) return false;
  if (/^\$/.test(name)) return false;
  if (/^image$/i.test(name)) return false;
  if (/^name$/i.test(name)) return false;
  if (/money\/second/i.test(name)) return false;
  if (/^tba$/i.test(name)) return false;
  if (/^rebirth\s*\d+$/i.test(name)) return false;
  return true;
}

function parseTechWiser(html) {
  const $ = cheerio.load(html);
  const out = [];
  $('table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 2) return;
    const name = $(cells[1]).text().trim();
    if (isLikelyBrainrotName(name)) out.push(name);
  });
  return out;
}

function parseShigjetaTradeValues(html) {
  const $ = cheerio.load(html);
  const out = [];
  $('table tbody tr, table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 2) return;
    const name = $(cells[0]).text().trim();
    if (isLikelyBrainrotName(name)) out.push(name);
  });
  return out;
}

function parseShigjetaEveryBrainrot(html) {
  const $ = cheerio.load(html);
  const out = [];
  $('table tbody tr, table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 2) return;
    const name = $(cells[0]).text().trim();
    if (isLikelyBrainrotName(name)) out.push(name);
  });
  return out;
}

async function fetchNames(source) {
  const res = await axios.get(source.url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    timeout: 20000,
    validateStatus: (s) => s === 200,
  });
  const names = source.parser(res.data)
    .map((n) => n.trim())
    .filter(Boolean);
  const uniq = [...new Set(names)];
  return uniq;
}

function buildReport({ existingItems, sourceResults, candidates, generatedAt }) {
  const lines = [];
  lines.push('# New Brainrot Candidates Report');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Local items: ${existingItems.length}`);
  lines.push('');
  lines.push('## Source Stats');
  for (const s of sourceResults) {
    if (s.error) lines.push(`- ${s.key}: ERROR (${s.error})`);
    else lines.push(`- ${s.key}: ${s.names.length} names`);
  }
  lines.push('');
  lines.push(`## New candidates (${candidates.length})`);
  if (candidates.length === 0) {
    lines.push('No new candidates found today.');
  } else {
    candidates.forEach((c) => {
      lines.push(`- ${c.slug} | "${c.name}" | sources: ${c.sources.join(', ')}`);
    });
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const existingItems = data.items || [];
  const existingIds = new Set(existingItems.map((i) => i.id));
  const existingByNameSlug = new Set(existingItems.map((i) => normalizeName(i.name)));

  const sourceResults = [];
  for (const source of SOURCES) {
    try {
      const names = await fetchNames(source);
      sourceResults.push({ key: source.key, names });
    } catch (e) {
      sourceResults.push({ key: source.key, names: [], error: e.message });
    }
  }

  const seen = new Map();
  for (const src of sourceResults) {
    if (src.error) continue;
    for (const name of src.names) {
      const slug = normalizeName(name);
      if (!slug) continue;
      if (/^rebirth-\d+$/i.test(slug)) continue;
      const canonicalSlug = KNOWN_SOURCE_ALIASES[slug] || slug;
      if (existingIds.has(canonicalSlug) || existingByNameSlug.has(canonicalSlug)) continue;
      const row = seen.get(canonicalSlug) || { slug: canonicalSlug, name, sources: [] };
      if (!row.sources.includes(src.key)) row.sources.push(src.key);
      seen.set(canonicalSlug, row);
    }
  }

  const candidates = [...seen.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  const report = buildReport({
    existingItems,
    sourceResults,
    candidates,
    generatedAt: new Date().toISOString(),
  });

  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(`watch-new-candidates: wrote ${REPORT_PATH}`);
  console.log(`watch-new-candidates: ${candidates.length} candidates`);
}

main().catch((e) => {
  console.error('watch-new-candidates failed:', e.message);
  process.exit(1);
});

