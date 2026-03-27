#!/usr/bin/env node
/**
 * Removes brainrots with missing income (income/baseIncome <= 0)
 * from canonical data/brainrots.json and synced copies.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'brainrots.json');
const DESTS = [
  path.join(ROOT, 'backend', 'data', 'brainrots.json'),
  path.join(ROOT, 'frontend', 'public', 'brainrots.json'),
];

function getIncome(item) {
  return Number(item.income ?? item.baseIncome ?? 0) || 0;
}

function main() {
  const raw = fs.readFileSync(SRC, 'utf8');
  const data = JSON.parse(raw);
  const before = data.items.length;

  const removed = data.items.filter((i) => getIncome(i) <= 0);
  data.items = data.items.filter((i) => getIncome(i) > 0);
  data.meta = data.meta || {};
  data.meta.totalItems = data.items.length;
  data.meta.lastUpdated = new Date().toISOString().slice(0, 10);

  const out = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(SRC, out, 'utf8');
  for (const dest of DESTS) fs.writeFileSync(dest, out, 'utf8');

  console.log(`Removed ${removed.length} zero-income items: ${before} -> ${data.items.length}`);
  removed.forEach((i) => console.log(`  - ${i.id} (${i.name})`));
}

main();
