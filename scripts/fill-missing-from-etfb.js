/**
 * For items with Beebom URLs (that 404), fetch from ETFB wiki as fallback.
 * Tries multiple title variants and Steal A Brainrot wiki as second fallback.
 * Run: node scripts/fill-missing-from-etfb.js
 */

const fs = require('fs');
const path = require('path');

const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const ETFB_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';
const STEALABRAINROT_API = 'https://stealabrainrot.fandom.com/api.php';

const TITLE_VARIANTS = {
  'dariungini-pandanneli': ['Dariungini_Pandanneli', 'Dariungini Pandanneli'],
  'capybara-monitora': ['Capybara_Monitora', 'Capybara Monitora'],
};

async function fetchImageUrl(apiBase, fandomTitle) {
  const url = `${apiBase}?action=query&titles=${encodeURIComponent(fandomTitle)}&prop=pageimages&format=json&pithumbsize=256`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (page?.thumbnail?.source) return page.thumbnail.source;
  } catch (e) {}
  return null;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  const mapping = data.mapping || {};
  const brainrots = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
  const itemsById = Object.fromEntries(brainrots.items.map(i => [i.id, i]));

  let filled = 0;
  for (const [id, url] of Object.entries(mapping)) {
    if (!url || !url.includes('beebom.com')) continue;
    const item = itemsById[id];
    if (!item) continue;

    const titles = TITLE_VARIANTS[id] || [item.name.replace(/\s+/g, '_'), item.name];
    let imgUrl = null;
    for (const title of titles) {
      imgUrl = await fetchImageUrl(ETFB_API, title);
      if (imgUrl) break;
      await new Promise(r => setTimeout(r, 150));
    }
    if (!imgUrl) {
      const fallbackTitle = item.name.replace(/\s+/g, '_');
      imgUrl = await fetchImageUrl(STEALABRAINROT_API, fallbackTitle);
    }
    if (imgUrl) {
      mapping[id] = imgUrl;
      filled++;
      console.log(`✓ ${id} (ETFB/fallback)`);
    } else {
      console.log(`✗ ${id} (no thumbnail found)`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  data.mapping = mapping;
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(data, null, 2));
  console.log(`\nFilled ${filled} from ETFB. Run download-images.js to save locally.`);
}

main().catch(console.error);
