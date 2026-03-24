/**
 * Removes brainrots that only have brainrot-missing (no real wiki/game thumbnail).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BRAINROTS_PATH = path.join(ROOT, 'data', 'brainrots.json');
const MAPPING_PATHS = [
  path.join(ROOT, 'data', 'image-mapping.json'),
  path.join(ROOT, 'backend', 'data', 'image-mapping.json'),
  path.join(ROOT, 'frontend', 'public', 'image-mapping.json'),
];
const COPY_BRAINROTS = [
  path.join(ROOT, 'backend', 'data', 'brainrots.json'),
  path.join(ROOT, 'frontend', 'public', 'brainrots.json'),
];

const brainrots = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
const mapData = JSON.parse(fs.readFileSync(MAPPING_PATHS[0], 'utf8'));
const mapping = { ...(mapData.mapping || {}) };

function hasRealThumb(it) {
  const m = (mapping[it.id] || '').trim();
  if (m && !m.includes('brainrot-missing')) return true;
  const u = (it.imageUrl || '').trim();
  if (u.startsWith('http')) return true;
  return false;
}

const before = brainrots.items.length;
const removed = brainrots.items.filter((it) => !hasRealThumb(it));
brainrots.items = brainrots.items.filter(hasRealThumb);
for (const it of removed) {
  delete mapping[it.id];
}

brainrots.meta = brainrots.meta || {};
brainrots.meta.totalItems = brainrots.items.length;
brainrots.meta.lastUpdated = new Date().toISOString().slice(0, 10);

mapData.mapping = mapping;

const outB = JSON.stringify(brainrots, null, 2) + '\n';
const outM = JSON.stringify(mapData, null, 2) + '\n';

fs.writeFileSync(BRAINROTS_PATH, outB, 'utf8');
for (const p of MAPPING_PATHS) {
  fs.writeFileSync(p, outM, 'utf8');
}
for (const p of COPY_BRAINROTS) {
  fs.writeFileSync(p, outB, 'utf8');
}

console.log(`Removed ${removed.length} items (no real thumb). ${before} → ${brainrots.items.length}`);
removed.forEach((it) => console.log('  -', it.id, it.name));
