/**
 * Compare how many brainrots appear on external list pages vs data/brainrots.json
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const GAME8 = 'https://game8.co/games/Roblox/archives/581250';
const TECHWISER = 'https://techwiser.com/escape-tsunami-for-brainrots-all-brainrots-list/';

function loadIds() {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'brainrots.json'), 'utf8'));
  return new Set(j.items.map((i) => i.id));
}

(async () => {
  const ourIds = loadIds();
  console.log('brainrots.json count:', ourIds.size);

  const g8 = await axios.get(GAME8, {
    timeout: 35000,
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
  });
  const $g = cheerio.load(g8.data);
  const g8Names = new Set();
  $g('table tr td:first-child').each((_, td) => {
    const t = $g(td).text().trim();
    if (t && t.length > 1 && t.length < 80) g8Names.add(t);
  });
  console.log('Game8 table first-column cells (approx rows):', g8Names.size);

  const tw = await axios.get(TECHWISER, {
    timeout: 35000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $t = cheerio.load(tw.data);
  let twRows = 0;
  $t('table tr').each((idx) => {
    if (idx > 0) twRows++;
  });
  console.log('TechWiser table rows (minus header):', twRows);

  const ETFB_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';
  let cat = 0;
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
    cat += (data.query?.categorymembers || []).filter((m) => m.ns === 0).length;
    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);
  console.log('ETFB Category:Brainrots (ns=0):', cat);
})();
