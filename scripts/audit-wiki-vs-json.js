const fs = require('fs');
const path = require('path');

const ETFB_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';
const BRAINROTS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'brainrots.json'), 'utf8'));

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

(async () => {
  const our = new Set(BRAINROTS.items.map((i) => norm(i.name)));
  const titles = [];
  let cmcontinue;
  do {
    const p = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: 'Category:Brainrots',
      cmlimit: '500',
      format: 'json',
    });
    if (cmcontinue) p.set('cmcontinue', cmcontinue);
    const res = await fetch(`${ETFB_API}?${p}`);
    const data = await res.json();
    for (const m of data.query?.categorymembers || []) {
      if (m.ns === 0) titles.push(m.title.replace(/_/g, ' '));
    }
    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);

  const wikiSet = new Set(titles.map(norm));
  const missingInJson = titles.filter((t) => !our.has(norm(t)));
  const extraInJson = BRAINROTS.items.filter((i) => !wikiSet.has(norm(i.name))).map((i) => i.name);

  console.log('wiki category:', titles.length);
  console.log('brainrots.json:', BRAINROTS.items.length);
  console.log('In wiki but not matched in JSON by name:', missingInJson.length);
  missingInJson.slice(0, 30).forEach((n) => console.log('  -', n));
  if (missingInJson.length > 30) console.log('  ...');
  console.log('In JSON but not in wiki category (by name):', extraInJson.length);
  extraInJson.slice(0, 30).forEach((n) => console.log('  -', n));
})();
