/**
 * For items with Beebom URLs (that 404), fetch from ETFB wiki as fallback.
 * Run: node scripts/fill-missing-from-etfb.js
 */

const fs = require('fs');
const path = require('path');

const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const FANDOM_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';

async function fetchImageUrl(fandomTitle) {
  const url = `${FANDOM_API}?action=query&titles=${encodeURIComponent(fandomTitle)}&prop=pageimages&format=json&pithumbsize=128`;
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

    const title = item.name.replace(/\s+/g, '_');
    const imgUrl = await fetchImageUrl(title);
    if (imgUrl) {
      mapping[id] = imgUrl;
      filled++;
      console.log(`✓ ${id} (ETFB fallback)`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  data.mapping = mapping;
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(data, null, 2));
  console.log(`\nFilled ${filled} from ETFB. Run download-images.js to save locally.`);
}

main().catch(console.error);
