/**
 * Fetches image URLs from Escape Tsunami For Brainrots Fandom wiki
 * (correct game - NOT Steal A Brainrot)
 * Run: node scripts/fetch-etfb-images.js
 */

const fs = require('fs');
const path = require('path');

const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const FANDOM_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';

function nameToFandomTitle(name) {
  return name.replace(/\s+/g, '_');
}

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
};

async function fetchImageUrl(fandomTitle) {
  const url = `${FANDOM_API}?action=query&titles=${encodeURIComponent(fandomTitle)}&prop=pageimages&format=json&pithumbsize=128`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (page?.thumbnail?.source) {
      return page.thumbnail.source;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function main() {
  const brainrots = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
  let mapping = {};
  try {
    const existing = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    mapping = existing.mapping || {};
  } catch {}

  const forceReplace = process.argv.includes('--force');
  let found = 0;

  for (const item of brainrots.items) {
    if (mapping[item.id] && !forceReplace) continue;

    const altName = ALTERNATIVE_NAMES[item.id];
    const title = titleForItem(item, altName);
    let imgUrl = await fetchImageUrl(title);

    if (!imgUrl && altName !== undefined) {
      imgUrl = await fetchImageUrl(nameToFandomTitle(item.name));
    }
    if (!imgUrl) {
      imgUrl = await fetchImageUrl(item.name.replace(/\s+/g, '_'));
    }

    if (imgUrl) {
      mapping[item.id] = imgUrl;
      found++;
      console.log(`✓ ${item.name}`);
    } else {
      console.log(`✗ ${item.name} (not found on ETFB wiki)`);
    }
    await new Promise(r => setTimeout(r, 250));
  }

  const data = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  data.mapping = mapping;
  data._source = 'escape-tsunami-for-brainrots.fandom.com';
  data._updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(data, null, 2));
  console.log(`\nFound ${found} images. Saved to image-mapping.json`);
}

function titleForItem(item, altName) {
  if (altName) return nameToFandomTitle(altName);
  return nameToFandomTitle(item.name);
}

main().catch(console.error);
