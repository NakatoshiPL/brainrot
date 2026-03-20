/**
 * Fill missing image-mapping entries using ETFB wiki (exact page title first).
 * Avoids misleading Special:Search hits (e.g. Lucky Block pages).
 *
 * Run: node scripts/fill-missing-images-wiki-search.js
 */
const fs = require('fs');
const path = require('path');

const ETFB_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';
const BRAINROTS_PATH = path.join(__dirname, '..', 'backend', 'data', 'brainrots.json');
const ROOT_MAP = path.join(__dirname, '..', 'data', 'image-mapping.json');
const BACK_MAP = path.join(__dirname, '..', 'backend', 'data', 'image-mapping.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extra page titles to try (wiki spelling differs) */
const TITLE_ALIASES = {
  'crystallini-masterclockini': ['Crystallini Masterclockini', 'Crystallini MasterClockini'],
  'don-magmito': ['Don Magmito', 'Don magmito'],
};

async function fetchJson(url) {
  const res = await fetch(url);
  return res.json();
}

/** pageimages thumbnail if present */
async function fetchPageThumb(title) {
  const t = title.replace(/\s+/g, '_');
  const url = `${ETFB_API}?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&format=json&pithumbsize=256`;
  const data = await fetchJson(url);
  const page = Object.values(data?.query?.pages || {})[0];
  if (page?.missing) return null;
  return page?.thumbnail?.source || null;
}

/** list File: titles on page */
async function listImagesOnPage(title) {
  const t = title.replace(/\s+/g, '_');
  const url = `${ETFB_API}?action=query&titles=${encodeURIComponent(t)}&prop=images&imlimit=10&format=json`;
  const data = await fetchJson(url);
  const page = Object.values(data?.query?.pages || {})[0];
  if (!page?.images?.length) return [];
  return page.images.map((i) => i.title).filter(Boolean);
}

/** full image URL from File: page */
async function imageUrlFromFileTitle(fileTitle) {
  if (/TBA\.png/i.test(fileTitle)) return null;
  const url = `${ETFB_API}?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
  const data = await fetchJson(url);
  const page = Object.values(data?.query?.pages || {})[0];
  const ii = page?.imageinfo?.[0];
  return ii?.url || null;
}

/** Search — only used to find an exact title match */
async function wikiSearchExact(name) {
  const url = `${ETFB_API}?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&srlimit=10`;
  const data = await fetchJson(url);
  const hits = data?.query?.search || [];
  const want = norm(name);
  for (const h of hits) {
    if (norm(h.title) === want) return h.title;
  }
  return null;
}

async function bestUrlForBrainrot(item) {
  const names = [item.name, ...(TITLE_ALIASES[item.id] || [])];
  const tried = new Set();

  for (const name of names) {
    const key = norm(name);
    if (tried.has(key)) continue;
    tried.add(key);

    let thumb = await fetchPageThumb(name);
    if (thumb) return thumb;

    const files = await listImagesOnPage(name);
    for (const ft of files) {
      const u = await imageUrlFromFileTitle(ft);
      if (u) return u;
      await new Promise((r) => setTimeout(r, 80));
    }

    const exactTitle = await wikiSearchExact(name);
    if (exactTitle) {
      thumb = await fetchPageThumb(exactTitle);
      if (thumb) return thumb;
      const files2 = await listImagesOnPage(exactTitle);
      for (const ft of files2) {
        const u = await imageUrlFromFileTitle(ft);
        if (u) return u;
        await new Promise((r) => setTimeout(r, 80));
      }
    }
  }

  return null;
}

async function main() {
  const brainrots = readJson(BRAINROTS_PATH);
  const rootData = readJson(ROOT_MAP);
  const backData = readJson(BACK_MAP);
  const rootM = rootData.mapping || {};
  const backM = backData.mapping || {};

  const missing = (brainrots.items || []).filter((it) => {
    const a = (rootM[it.id] || '').trim();
    const b = (backM[it.id] || '').trim();
    return !a || !b;
  });

  console.log(`Items needing mapping: ${missing.length}`);

  let filled = 0;
  for (const item of missing) {
    const url = await bestUrlForBrainrot(item);
    if (url) {
      rootM[item.id] = url;
      backM[item.id] = url;
      filled++;
      console.log(`✓ ${item.id}`);
    } else {
      console.log(`✗ ${item.id} (${item.name})`);
    }
    await new Promise((r) => setTimeout(r, 220));
  }

  rootData.mapping = rootM;
  backData.mapping = backM;
  rootData._wikiSearchFilled = new Date().toISOString().slice(0, 10);
  backData._wikiSearchFilled = rootData._wikiSearchFilled;
  writeJson(ROOT_MAP, rootData);
  writeJson(BACK_MAP, backData);
  console.log(`\nFilled ${filled} / ${missing.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
