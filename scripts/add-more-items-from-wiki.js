/**
 * Fetches all brainrot pages from ETFB wiki (Category:Brainrots) via API
 * and adds missing items to brainrots.json + image-mapping.
 * Run: node scripts/add-more-items-from-wiki.js
 */
const fs = require('fs');
const path = require('path');

const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const ETFB_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';

function slug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function normalizeName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function fetchCategoryMembers() {
  const titles = [];
  let cmcontinue = undefined;
  do {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: 'Category:Brainrots',
      cmlimit: '500',
      format: 'json',
    });
    if (cmcontinue) params.set('cmcontinue', cmcontinue);
    const res = await fetch(`${ETFB_API}?${params}`);
    const data = await res.json();
    const members = data.query?.categorymembers || [];
    for (const m of members) {
      if (m.ns === 0 && m.title) titles.push(m.title.replace(/_/g, ' '));
    }
    cmcontinue = data.continue?.cmcontinue;
    if (cmcontinue) await new Promise(r => setTimeout(r, 150));
  } while (cmcontinue);
  return [...new Set(titles)];
}

async function fetchThumbnail(pageTitle) {
  const title = pageTitle.replace(/\s+/g, '_');
  const url = `${ETFB_API}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=256`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    return page?.thumbnail?.source || null;
  } catch (e) {
    return null;
  }
}

async function main() {
  const brainrotsData = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
  const existingNames = new Set(brainrotsData.items.map((i) => normalizeName(i.name)));
  const existingIds = new Set(brainrotsData.items.map((i) => i.id));

  let mapping = {};
  try {
    const m = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    mapping = m.mapping || {};
  } catch {}

  console.log('Fetching category members from ETFB wiki...');
  const wikiTitles = await fetchCategoryMembers();
  console.log(`Found ${wikiTitles.length} pages in Category:Brainrots`);

  const toAddRaw = wikiTitles.filter((t) => !existingNames.has(normalizeName(t)));
  const seen = new Set();
  const toAdd = toAddRaw.filter((t) => {
    const n = normalizeName(t);
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  if (toAdd.length === 0) {
    console.log('No new brainrots to add.');
    return;
  }

  console.log(`Adding ${toAdd.length} new items...`);
  for (const name of toAdd) {
    let id = slug(name);
    if (existingIds.has(id)) id = `${id}-${Date.now().toString(36)}`;
    existingIds.add(id);
    existingNames.add(normalizeName(name));

    const imageUrl = await fetchThumbnail(name);
    if (imageUrl) mapping[id] = imageUrl;

    brainrotsData.items.push({
      id,
      name,
      rarity: 'Common',
      category: 'Common',
      baseIncome: 0,
      income: 0,
      tier: 'F',
      mutationNote: 'Emerald 1.2x / Diamond 2.5x (event)',
      imageUrl: imageUrl || '',
    });
    console.log(`  + ${name}`);
    await new Promise(r => setTimeout(r, 200));
  }

  brainrotsData.meta = brainrotsData.meta || {};
  brainrotsData.meta.lastUpdated = new Date().toISOString().slice(0, 10);
  brainrotsData.meta.totalItems = brainrotsData.items.length;

  fs.writeFileSync(BRAINROTS_PATH, JSON.stringify(brainrotsData, null, 2), 'utf8');

  const mappingData = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  mappingData.mapping = mapping;
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mappingData, null, 2), 'utf8');

  console.log(`\nAdded ${toAdd.length} items. Total: ${brainrotsData.items.length}. Run download-images.js to save new images locally.`);
}

main().catch(console.error);
