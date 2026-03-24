#!/usr/bin/env node
/**
 * Uses the same sources as the UI "Data sources" block, via public APIs / one HTML fetch:
 *  - Game8 (single page scrape — img.game8.co)
 *  - MediaWiki API: escape-tsunami-for-brainrots.fandom.com (ETFB)
 *  - MediaWiki API: stealabrainrot.fandom.com (same meme characters; accents in titles)
 *
 * Traderie blocks server-side HTTP (403) — not used here. Run in browser if needed.
 *
 * Targets only rows still on /images/brainrot-missing.svg (or empty).
 *
 * Optional: --allow-tba — map wiki TBA.png (many tiles look identical). Prefer leaving these on
 * brainrot-missing.svg so the UI shows rarity-colored initials instead of the TBA graphic.
 *
 * Then run: npm run cache-thumbnails
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ROOT = path.join(__dirname, '..');
const BRAINROTS_PATH = path.join(ROOT, 'data', 'brainrots.json');
const MAPPING_PATHS = [
  path.join(ROOT, 'data', 'image-mapping.json'),
  path.join(ROOT, 'backend', 'data', 'image-mapping.json'),
  path.join(ROOT, 'frontend', 'public', 'image-mapping.json'),
];
const PLACEHOLDER = '/images/brainrot-missing.svg';
const GAME8_URL = 'https://game8.co/games/Roblox/archives/581250';

const ETFB_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';
const STEAL_API = 'https://stealabrainrot.fandom.com/api.php';
const ALLOW_TBA = process.argv.includes('--allow-tba');

const ALTERNATIVE_NAMES = {
  'bisonte-gupitere': 'Bisonte Giuppitere',
  'dug-dug-dug': 'Dug Dug Dug',
  'job-job-sahur': 'Job Job Sahur',
  'udin-din-din-dun': 'Udin Din Din Dun',
  'giraffa-celeste': 'Giraffa Celeste',
  'bombardilo-crocodilo': 'Bombardilo Crocodilo',
  'tric-tric-baraboom': 'Tric Tric Baraboom',
  'bobrito-bandito': 'Bobrito Bandito',
  'garama-madundung': 'Garama and Madundung',
  '67': '67',
  'rainbow-67': 'Rainbow 67',
  'crystallini-masterclockini': ['Crystallini Masterclockini', 'Crystallini MasterClockini', 'Crystallini'],
  'dariungini-pandanneli': [
    'Darlungini Pandanneli',
    'Darlungini Pandenneli',
    'Dariungini Pandanneli',
    'Darlungini',
  ],
};

function nameToFandomTitle(name) {
  return String(name || '').replace(/\s+/g, '_');
}

/** Reject wiki search hits like "Brainrots" / "Leaks" that are not the character page */
function titleMatchesItem(wikiTitle, itemName) {
  const t = String(wikiTitle || '').toLowerCase();
  if (/^(brainrots|leaks|list of|category:)/i.test(t.trim())) return false;
  const words = String(itemName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (words.length === 0) return false;
  return words.every((w) => t.includes(w));
}

function isBadThumb(url, itemName = '') {
  if (!url || typeof url !== 'string') return true;
  const u = url;
  const n = (itemName || '').toLowerCase();
  if (/TBA\.png/i.test(u)) return true;
  if (/Gangster_Footera/i.test(u) && !n.includes('gangster')) return true;
  if (/Lucky_Block|Leprechaun_Lucky|Volcanic_Lucky/i.test(u)) return true;
  if (/Lirili[-_]Larila/i.test(u) && !n.includes('lirili')) return true;
  if (/Blackhole_Goat|Black_Hole_Goat/i.test(u) && !n.includes('black') && !n.includes('goat')) return true;
  return false;
}

function needsFill(url) {
  const u = String(url || '').trim();
  return !u || u === PLACEHOLDER || u.includes('brainrot-missing');
}

async function fetchGame8Map() {
  const res = await axios.get(GAME8_URL, {
    timeout: 35000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      Accept: 'text/html',
    },
  });
  const html = res.data;
  const nameToImg = {};
  const brainrots = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
  for (const item of brainrots.items) {
    const escaped = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped + '[^<]*(https://img\\.game8\\.co/[^"\'\\s]+)', 'i');
    const m = html.match(regex);
    if (m) {
      nameToImg[item.id] = m[1].replace(/\/thumb$/, '/original').split('?')[0];
    }
  }
  return nameToImg;
}

async function wikiPageImage(apiBase, title, itemName) {
  const url = `${apiBase}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=400`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const data = await res.json();
  const page = Object.values(data?.query?.pages || {})[0];
  if (!page || page.missing) return null;
  const th = page.thumbnail?.source;
  if (th && !isBadThumb(th, itemName)) return th;
  return null;
}

async function wikiSearch(apiBase, query) {
  const url = `${apiBase}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=8`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = await res.text();
  if (!text.trim().startsWith('{')) {
    console.warn('wikiSearch: non-JSON response, skipping', query.slice(0, 48));
    return [];
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  return (data.query?.search || []).map((s) => s.title).filter((t) => !/\/Gallery$/i.test(t));
}

async function tryEtfb(item) {
  const alt = ALTERNATIVE_NAMES[item.id];
  const nameList = (Array.isArray(alt) ? alt : [alt]).filter(Boolean).concat([item.name]);
  for (const n of nameList) {
    const t = nameToFandomTitle(n);
    let img = await wikiPageImage(ETFB_API, t, item.name);
    if (img) return img;
    await new Promise((r) => setTimeout(r, 100));
  }
  const searches = [...new Set([item.name, item.name.split(/\s+/)[0], item.id.replace(/-/g, ' ')])];
  for (const q of searches) {
    const titles = await wikiSearch(ETFB_API, q);
    for (const title of titles.slice(0, 8)) {
      if (!titleMatchesItem(title, item.name)) continue;
      const img = await wikiPageImage(ETFB_API, title, item.name);
      if (img) return img;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return null;
}

async function trySteal(item) {
  const queries = [...new Set([item.name, item.name.replace(/[ìí]/gi, 'i').replace(/[àá]/gi, 'a')])];
  for (const q of queries) {
    const titles = await wikiSearch(STEAL_API, q);
    for (const title of titles.slice(0, 6)) {
      if (!titleMatchesItem(title, item.name)) continue;
      const img = await wikiPageImage(STEAL_API, title, item.name);
      if (img) return img;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return null;
}

/**
 * All <img> in parsed article HTML (pageimages is often empty when only TBA.png is embedded).
 * Some pages put a wrong template image first (e.g. Gangster_Footera); TBA may be second.
 * TBA.png is only used when --allow-tba (otherwise skipped so initials / missing stay).
 */
async function tryEtfbParseFirstImg(item) {
  const alt = ALTERNATIVE_NAMES[item.id];
  const nameList = (Array.isArray(alt) ? alt : [alt]).filter(Boolean).concat([item.name]);
  for (const n of nameList) {
    const page = encodeURIComponent(String(n).replace(/\s+/g, '_'));
    const apiUrl = `${ETFB_API}?action=parse&page=${page}&prop=text&format=json`;
    const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    const html = data?.parse?.text?.['*'];
    if (!html) continue;
    const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
    for (const imgUrl of srcs) {
      if (/TBA\.png/i.test(imgUrl)) {
        if (!ALLOW_TBA) continue;
        console.log(`✓ ${item.id} (ETFB wiki HTML — TBA placeholder)`);
        return imgUrl;
      }
      if (!isBadThumb(imgUrl, item.name)) {
        console.log(`✓ ${item.id} (ETFB wiki HTML)`);
        return imgUrl;
      }
    }
  }
  return null;
}

function writeAll(data) {
  const out = JSON.stringify(data, null, 2) + '\n';
  for (const p of MAPPING_PATHS) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, out, 'utf8');
    } catch (e) {
      console.warn('write failed', p, e.message);
    }
  }
}

async function main() {
  const brainrots = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
  const primary = MAPPING_PATHS[0];
  const data = JSON.parse(fs.readFileSync(primary, 'utf8').replace(/^\uFEFF/, ''));
  const mapping = { ...(data.mapping || {}) };

  const toFix = (brainrots.items || []).filter((it) => needsFill(mapping[it.id]));
  console.log(`Items to fill: ${toFix.length}`);

  console.log('Fetching Game8 list page…');
  let game8Map = {};
  try {
    game8Map = await fetchGame8Map();
    console.log(`Game8 matched ${Object.keys(game8Map).length} ids from HTML`);
  } catch (e) {
    console.warn('Game8 fetch failed:', e.message);
  }

  let filled = 0;
  for (const item of toFix) {
    let url = null;

    if (game8Map[item.id] && !isBadThumb(game8Map[item.id], item.name)) {
      url = game8Map[item.id];
      console.log(`✓ ${item.id} (Game8)`);
    }

    if (!url) {
      url = await tryEtfb(item);
      if (url) console.log(`✓ ${item.id} (ETFB wiki)`);
    }

    if (!url) {
      url = await trySteal(item);
      if (url) console.log(`✓ ${item.id} (Steal a Brainrot wiki)`);
    }

    if (!url) {
      url = await tryEtfbParseFirstImg(item);
    }

    if (url) {
      mapping[item.id] = url;
      filled++;
    } else {
      console.log(`✗ ${item.id} (no API image)`);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  data.mapping = mapping;
  const tag = ALLOW_TBA
    ? ' + fill-images-from-ui-sources (Game8 + ETFB + Steal + ETFB parse HTML, allow TBA)'
    : ' + fill-images-from-ui-sources (Game8 + ETFB + Steal wiki API)';
  data._source = `${data._source || ''}${tag}`;
  data._uiSourcesFill = new Date().toISOString().slice(0, 10);
  writeAll(data);

  console.log(`\nFilled ${filled} URLs. Run: npm run cache-thumbnails`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
