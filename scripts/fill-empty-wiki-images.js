/**
 * Fill ONLY empty image-mapping slots:
 *  1) Try Beebom CDN filename guessed from id (HEAD)
 *  2) Else ETFB Fandom pageimages for EXACT character page only (no broad wiki search)
 * Skips TBA.png and rejects misleading thumbnails (Lucky Blocks, wrong character art).
 *
 * Run: node scripts/fill-empty-wiki-images.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const ROOT_MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const BACKEND_MAPPING_PATH = path.join(__dirname, '..', 'backend', 'data', 'image-mapping.json');
const PUBLIC_MAPPING_PATH = path.join(__dirname, '..', 'frontend', 'public', 'image-mapping.json');
const BEEBOM_BASE = 'https://static.beebom.com/wp-content/uploads/2026/01';
const FANDOM_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';

const PLACEHOLDER = '/images/brainrot-missing.svg';

function nameToFandomTitle(name) {
  return String(name || '').replace(/\s+/g, '_');
}

const EXTRA_TITLES = {
  'crystallini-masterclockini': ['Crystallini Masterclockini', 'Crystallini MasterClockini'],
  'dariungini-pandanneli': ['Darlungini Pandenneli', 'Dariungini Pandanneli'],
  'don-magmito': ['Don Magmito']
};

function idToBeebomFilename(id) {
  return `${id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-')}.jpg`;
}

function headOk(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

/** Reject placeholder / wrong wiki crops (lucky blocks, another brainrot’s file, stubs) */
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

async function fetchPageImage(title, itemName) {
  const t = nameToFandomTitle(title);
  const url = `${FANDOM_API}?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&format=json&pithumbsize=320`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    if (page?.missing) return null;
    const th = page?.thumbnail?.source;
    if (th && !isBadThumb(th, itemName)) return th;
  } catch (_) {}
  return null;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function writeAll(data) {
  const out = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(ROOT_MAPPING_PATH, out, 'utf8');
  fs.writeFileSync(BACKEND_MAPPING_PATH, out, 'utf8');
  if (fs.existsSync(path.dirname(PUBLIC_MAPPING_PATH))) {
    fs.writeFileSync(PUBLIC_MAPPING_PATH, out, 'utf8');
  }
}

async function main() {
  const brainrots = readJson(BRAINROTS_PATH);
  const data = readJson(ROOT_MAPPING_PATH);
  const mapping = { ...(data.mapping || {}) };

  let stripped = 0;
  for (const item of brainrots.items) {
    const u = (mapping[item.id] || '').trim();
    if (!u || u === PLACEHOLDER) continue;
    if (u.startsWith('http') && isBadThumb(u, item.name)) {
      delete mapping[item.id];
      stripped++;
      console.log(`Stripped bad thumb: ${item.id}`);
    }
  }
  if (stripped) console.log(`--- removed ${stripped} misleading wiki URLs ---\n`);

  const prevSource = data._source || '';
  const empty = (brainrots.items || []).filter((it) => !(mapping[it.id] || '').trim());
  console.log(`Empty slots: ${empty.length}`);

  let filled = 0;
  for (const item of empty) {
    let url = null;

    const guess = `${BEEBOM_BASE}/${idToBeebomFilename(item.id)}`;
    if (await headOk(guess)) {
      url = guess;
      console.log(`✓ ${item.id} (Beebom)`);
    }

    if (!url) {
      const names = [...(EXTRA_TITLES[item.id] || []), item.name];
      const tried = new Set();
      for (const n of names) {
        const k = n.toLowerCase();
        if (tried.has(k)) continue;
        tried.add(k);
        url = await fetchPageImage(n, item.name);
        if (url) {
          console.log(`✓ ${item.id} (wiki page)`);
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!url) {
      url = PLACEHOLDER;
      console.log(`○ ${item.id} (placeholder)`);
    }

    mapping[item.id] = url;
    filled++;
    await new Promise((r) => setTimeout(r, 120));
  }

  data.mapping = mapping;
  data._source = `${prevSource.split(' + ')[0]} + Beebom / wiki (exact pages) / placeholder`;
  data._emptySlotsFilled = new Date().toISOString().slice(0, 10);
  writeAll(data);

  console.log(`\nProcessed ${filled} empty slots (includes placeholders).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
