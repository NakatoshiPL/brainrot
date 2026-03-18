/**
 * Fetches image URLs from Steal A Brainrot Fandom API
 * and saves to image-mapping.json
 * Run: node scripts/fetch-fandom-images.js
 */

const fs = require('fs');
const path = require('path');

const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const FANDOM_API = 'https://stealabrainrot.fandom.com/api.php';

function nameToFandomTitle(name) {
  return name.replace(/\s+/g, '_');
}

const ALTERNATIVE_NAMES = {
  'bisonte-gupitere': 'Bisonte Giuppitere',
  'dug-dug-dug': 'Dug dug dug',
  'job-job-sahur': 'Job Job Job Sahur',
  'udin-din-din-dun': 'Odin Din Din Dun',
  'giraffa-celeste': 'Girafa Celestre',
  'bombardilo-crocodilo': 'Bombardiro Crocodilo',
  'tric-tric-baraboom': 'Tric Trac Baraboom',
  'bobrito-bandito': 'Bandito Bobritto',
  'noobini-cakenini': 'Noobini Cakenini',
  'lirili-larila': 'Lirili Larila',
  'frulli-frulla': 'Frulli Frulla',
  'svinino-bombondino': 'Svinina Bombardino',
  'blueberrinni-octopussini': 'Blueberrinni Octopussini',
  'strawberrilli-flamengilli': 'Strawberrelli Flamingelli',
  'burbaloni-luliloli': 'Burbaloni Loliloli',
  'ta-ta-ta-sahur': 'Ta Ta Ta Ta Sahur',
  'grappellino-doro': "Grappellino D'Oro",
  'rattini-machini': 'Rattini Machini',
  'cioccolatone-draghettone': 'Cioccolatone Draghettone',
  'money-elephant': 'Money Elephant',
  'capuccino-policia': 'Cappuccino Policia',
  'los-orcaleritos': 'Los Orcaleritos',
  'diamantusa': 'Diamantusa',
  'la-malita': 'La Malita',
  'polpo-semaforini': 'Polpo Semaforini',
  'aura-farma': 'Aura Farma',
  'onionello-penguini': 'Onionello Penguini',
  'patito-dinerito': 'Patito Dinerito',
  'patatino-astronauta': 'Patatino Astronauta',
  'kissarini-heartini': 'Kissarini Heartini',
  'capybara-monitora': 'Capybara Monitora',
  'tartarughi-attrezzini': 'Tartarughi Attrezzini',
  'guesto-angelic': 'Guesto Angelic',
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

  let found = 0;
  for (const item of brainrots.items) {
    if (mapping[item.id]) continue;
    const altName = ALTERNATIVE_NAMES[item.id];
    const title = nameToFandomTitle(altName || item.name);
    let imgUrl = await fetchImageUrl(title);
    if (!imgUrl && altName) {
      imgUrl = await fetchImageUrl(nameToFandomTitle(item.name));
    }
    if (imgUrl) {
      mapping[item.id] = imgUrl;
      found++;
      console.log(`✓ ${item.name}`);
    } else {
      console.log(`✗ ${item.name} (not on Fandom)`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  const data = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  data.mapping = mapping;
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(data, null, 2));
  console.log(`\nFound ${found} images. Saved to image-mapping.json`);
}

main().catch(console.error);
