const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/image-mapping.json'), 'utf8')).mapping;
const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/brainrots.json'), 'utf8'));
const pub = path.join(ROOT, 'frontend/public');
const nofile = [];
for (const it of b.items) {
  const u = (m[it.id] || '').trim();
  if (!u.startsWith('/images/brainrots/')) continue;
  const rel = u.replace(/^\//, '');
  const f = path.join(pub, rel);
  if (!fs.existsSync(f)) nofile.push(it.id);
}
console.log('brainrots', b.items.length);
console.log('local brainrots path but file missing', nofile.length, nofile.slice(0, 30));
