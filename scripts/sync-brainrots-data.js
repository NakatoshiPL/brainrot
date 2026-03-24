#!/usr/bin/env node
/**
 * Copies canonical data/brainrots.json → backend + frontend/public (API + static fallback).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'brainrots.json');
const DESTS = [
  path.join(ROOT, 'backend', 'data', 'brainrots.json'),
  path.join(ROOT, 'frontend', 'public', 'brainrots.json'),
];

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('sync-brainrots-data: missing', SRC);
    process.exit(1);
  }
  const raw = fs.readFileSync(SRC);
  for (const dest of DESTS) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, raw);
    console.log('sync-brainrots-data: wrote', dest);
  }
}

main();
