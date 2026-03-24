/**
 * Fetches image URLs from Escape Tsunami For Brainrots Fandom wiki
 * (correct game - NOT Steal A Brainrot)
 * Run: node scripts/fetch-etfb-images.js
 */

const fs = require('fs');
const path = require('path');

const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const ROOT_MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const BACKEND_MAPPING_PATH = path.join(__dirname, '..', 'backend', 'data', 'image-mapping.json');
const PUBLIC_MAPPING_PATH = path.join(__dirname, '..', 'frontend', 'public', 'image-mapping.json');
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
  const url = `${FANDOM_API}?action=query&titles=${encodeURIComponent(fandomTitle)}&prop=pageimages&format=json&pithumbsize=256`;
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

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

async function main() {
  const brainrots = readJson(BRAINROTS_PATH);
  const rootMappingData = readJson(ROOT_MAPPING_PATH);
  const backendMappingData = readJson(BACKEND_MAPPING_PATH);
  const rootMapping = rootMappingData.mapping || {};
  const backendMapping = backendMappingData.mapping || {};

  const forceReplace = process.argv.includes('--force');
  const fillOnly = process.argv.includes('--fill-only');
  let found = 0;
  let written = 0;

  for (const item of brainrots.items) {
    const rootHas = !!(rootMapping[item.id] && String(rootMapping[item.id]).trim());
    const backendHas = !!(backendMapping[item.id] && String(backendMapping[item.id]).trim());
    if (!forceReplace) {
      if (fillOnly) {
        if (rootHas && backendHas) continue;
      } else {
        // default: fill missing only (safe)
        if (rootHas && backendHas) continue;
      }
    }

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
      if (forceReplace || !rootHas) {
        rootMapping[item.id] = imgUrl;
        written++;
      }
      if (forceReplace || !backendHas) {
        backendMapping[item.id] = imgUrl;
        written++;
      }
      found++;
      console.log(`✓ ${item.name}`);
    } else {
      console.log(`✗ ${item.name} (not found on ETFB wiki)`);
    }
    await new Promise(r => setTimeout(r, 250));
  }

  const PLACEHOLDER = '/images/brainrot-missing.svg';
  for (const item of brainrots.items) {
    if (!(rootMapping[item.id] && String(rootMapping[item.id]).trim())) {
      rootMapping[item.id] = PLACEHOLDER;
    }
    if (!(backendMapping[item.id] && String(backendMapping[item.id]).trim())) {
      backendMapping[item.id] = PLACEHOLDER;
    }
  }

  rootMappingData.mapping = rootMapping;
  rootMappingData._source =
    'beebom.com (article list) + escape-tsunami-for-brainrots.fandom.com pageimages; /images/brainrot-missing.svg if no wiki page';
  rootMappingData._updated = new Date().toISOString().slice(0, 10);
  writeJson(ROOT_MAPPING_PATH, rootMappingData);

  backendMappingData.mapping = backendMapping;
  backendMappingData._source = rootMappingData._source;
  backendMappingData._updated = new Date().toISOString().slice(0, 10);
  writeJson(BACKEND_MAPPING_PATH, backendMappingData);
  if (fs.existsSync(path.dirname(PUBLIC_MAPPING_PATH))) {
    writeJson(PUBLIC_MAPPING_PATH, rootMappingData);
  }

  console.log(`\nFound ${found} images. Entries written: ${written}`);
  console.log(`Updated:\n- ${ROOT_MAPPING_PATH}\n- ${BACKEND_MAPPING_PATH}`);
  if (fs.existsSync(path.dirname(PUBLIC_MAPPING_PATH))) {
    console.log(`- ${PUBLIC_MAPPING_PATH}`);
  }
}

function titleForItem(item, altName) {
  if (altName) return nameToFandomTitle(altName);
  return nameToFandomTitle(item.name);
}

main().catch(console.error);
