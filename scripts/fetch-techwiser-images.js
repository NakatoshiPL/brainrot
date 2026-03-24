/**
 * Fill missing image mappings using TechWiser's "All Brainrots" list.
 *
 * Source page:
 *   https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/
 *
 * It updates BOTH:
 *  - data/image-mapping.json
 *  - backend/data/image-mapping.json
 *
 * By default it OVERWRITES mappings for items present on TechWiser, because
 * playbrainrot.org fallbacks can be wrong ("fake" thumbnails). If you want
 * to only fill empty mappings, pass --fill-only.
 *
 * Run:
 *   node scripts/fetch-techwiser-images.js
 *   node scripts/fetch-techwiser-images.js --fill-only
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const SOURCE_URL = 'https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/';

const ROOT_MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const BACKEND_MAPPING_PATH = path.join(__dirname, '..', 'backend', 'data', 'image-mapping.json');
const PUBLIC_MAPPING_PATH = path.join(__dirname, '..', 'frontend', 'public', 'image-mapping.json');
const BACKEND_BRAINROTS_PATH = path.join(__dirname, '..', 'backend', 'data', 'brainrots.json');

function toId(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function absUrl(maybeUrl) {
  if (!maybeUrl) return '';
  try {
    return new URL(maybeUrl, SOURCE_URL).toString();
  } catch {
    return '';
  }
}

async function fetchTechwiserTableImages() {
  const res = await axios.get(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://techwiser.com/'
    },
    timeout: 30000
  });

  const $ = cheerio.load(res.data);
  const pairs = [];

  $('table').each((_, table) => {
    const rows = $(table).find('tr');
    rows.each((idx, tr) => {
      if (idx === 0) return; // header
      const tds = $(tr).find('td');
      if (tds.length < 2) return;

      const imgEl = $(tds[0]).find('img').first();
      const name = $(tds[1]).text().trim().replace(/\s+/g, ' ');
      if (!name) return;

      const rawImg =
        imgEl.attr('data-src') ||
        imgEl.attr('data-lazy-src') ||
        imgEl.attr('data-original') ||
        imgEl.attr('src') ||
        '';

      const imageUrl = absUrl(rawImg);
      if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return;

      pairs.push({ name, id: toId(name), imageUrl });
    });
  });

  // Deduplicate by id, prefer png/webp over others, and prefer https techwiser/wp-content
  const byId = new Map();
  for (const p of pairs) {
    if (!p.id) continue;
    const prev = byId.get(p.id);
    if (!prev) {
      byId.set(p.id, p);
      continue;
    }
    const score = (u) => {
      let s = 0;
      if (u.includes('techwiser.com/wp-content/uploads/')) s += 10;
      if (u.endsWith('.webp')) s += 3;
      if (u.endsWith('.png')) s += 2;
      if (u.endsWith('.jpg') || u.endsWith('.jpeg')) s += 1;
      return s;
    };
    if (score(p.imageUrl) > score(prev.imageUrl)) byId.set(p.id, p);
  }

  return [...byId.values()];
}

async function main() {
  const fillOnly = process.argv.includes('--fill-only');
  const brainrots = readJson(BACKEND_BRAINROTS_PATH);
  const existingIds = new Set((brainrots.items || []).map((i) => i.id));

  const rootMappingData = readJson(ROOT_MAPPING_PATH);
  const backendMappingData = readJson(BACKEND_MAPPING_PATH);
  const rootMapping = rootMappingData.mapping || {};
  const backendMapping = backendMappingData.mapping || {};

  const techwiser = await fetchTechwiserTableImages();

  let written = 0;
  let overwritten = 0;
  let matched = 0;
  let skippedExisting = 0;
  let skippedNoId = 0;

  for (const row of techwiser) {
    if (!row.id) {
      skippedNoId++;
      continue;
    }
    if (!existingIds.has(row.id)) continue; // only map items we actually have
    matched++;

    const prevRoot = (rootMapping[row.id] || '').trim();
    const prevBackend = (backendMapping[row.id] || '').trim();

    const needsRoot = !prevRoot;
    const needsBackend = !prevBackend;
    const shouldWriteRoot = fillOnly ? needsRoot : true;
    const shouldWriteBackend = fillOnly ? needsBackend : true;

    if (!shouldWriteRoot && !shouldWriteBackend) {
      skippedExisting++;
      continue;
    }

    if (shouldWriteRoot) {
      if (prevRoot && prevRoot !== row.imageUrl) overwritten++;
      rootMapping[row.id] = row.imageUrl;
      written++;
    }
    if (shouldWriteBackend) {
      if (prevBackend && prevBackend !== row.imageUrl) overwritten++;
      backendMapping[row.id] = row.imageUrl;
      written++;
    }
  }

  rootMappingData.mapping = rootMapping;
  backendMappingData.mapping = backendMapping;
  writeJson(ROOT_MAPPING_PATH, rootMappingData);
  writeJson(BACKEND_MAPPING_PATH, backendMappingData);
  if (fs.existsSync(path.dirname(PUBLIC_MAPPING_PATH))) {
    writeJson(PUBLIC_MAPPING_PATH, rootMappingData);
  }

  console.log(`✅ TechWiser parsed: ${techwiser.length} rows`);
  console.log(`✅ Matched items in our list: ${matched}`);
  console.log(`✅ Entries written: ${written} ${fillOnly ? '(fill-only)' : '(overwrite enabled)'}`);
  console.log(`✅ Entries overwritten: ${overwritten}`);
  console.log(`↩️  Skipped (no change needed): ${skippedExisting}`);
  console.log(`↩️  Skipped (no id): ${skippedNoId}`);
  console.log(`\nUpdated:\n- ${ROOT_MAPPING_PATH}\n- ${BACKEND_MAPPING_PATH}`);
  if (fs.existsSync(path.dirname(PUBLIC_MAPPING_PATH))) {
    console.log(`- ${PUBLIC_MAPPING_PATH}`);
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err?.message || err);
  process.exitCode = 1;
});

