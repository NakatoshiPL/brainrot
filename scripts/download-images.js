/**
 * Downloads images from image-mapping.json URLs and saves locally.
 * Run: node scripts/download-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'public', 'images', 'brainrots');

function getExtension(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith('.png')) return 'png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'jpg';
  if (pathname.endsWith('.gif')) return 'gif';
  if (pathname.endsWith('.webp')) return 'webp';
  return 'png';
}

function download(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const data = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  const mapping = data.mapping || {};

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let ok = 0;
  let fail = 0;

  for (const [id, url] of Object.entries(mapping)) {
    if (!url || !url.startsWith('http')) continue;

    const ext = getExtension(url);
    const outPath = path.join(OUTPUT_DIR, `${id}.${ext}`);

    try {
      const buf = await download(url);
      fs.writeFileSync(outPath, buf);
      mapping[id] = `/images/brainrots/${id}.${ext}`;
      ok++;
      console.log(`✓ ${id}`);
    } catch (e) {
      fail++;
      console.log(`✗ ${id}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  data.mapping = mapping;
  data._local_downloaded = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(data, null, 2));
  console.log(`\nDownloaded: ${ok} | Failed: ${fail}`);
}

main().catch(console.error);
