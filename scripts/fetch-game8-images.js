/**
 * Attempts to fetch image URLs from Game8 brainrots page.
 * Game8: https://game8.co/games/Roblox/archives/581250
 * Note: Game8 may load images via JS - this script tries to extract from HTML.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const GAME8_URL = 'https://game8.co/games/Roblox/archives/581250';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Game8 page...');
  const html = await fetchHtml(GAME8_URL);
  
  const game8ImgRegex = /https:\/\/img\.game8\.co\/[^"'\s]+/g;
  const game8Urls = [...new Set(html.match(game8ImgRegex) || [])].filter(u => !u.includes('favicon'));
  
  const nameToImg = {};
  for (const item of JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8')).items) {
    const escaped = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped + '[^<]*(https://img\\.game8\\.co/[^"\'\\s]+)', 'i');
    const m = html.match(regex);
    if (m) {
      nameToImg[item.id] = m[1].replace(/\/thumb$/, '/original').split('?')[0];
    }
  }
  
  let mapping = {};
  try {
    const data = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    mapping = data.mapping || {};
  } catch {}
  
  let matched = 0;
  for (const [id, url] of Object.entries(nameToImg)) {
    mapping[id] = url;
    matched++;
    console.log(`✓ ${id}`);
  }
  
  if (matched > 0) {
    const data = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    data.mapping = mapping;
    data._source = 'game8.co';
    fs.writeFileSync(MAPPING_PATH, JSON.stringify(data, null, 2));
    console.log(`\nMatched ${matched} images. Run download-images.js to save.`);
  } else {
    console.log('\nNo matches - Game8 may load images via JavaScript. Using ETFB fallback.');
  }
}

main().catch(console.error);
