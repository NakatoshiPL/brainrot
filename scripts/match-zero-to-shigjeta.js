const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

function norm(n) {
  return String(n || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function parseIncome(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().replace(/\s/g, '');
  const m = s.match(/\$?([\d.]+)\s*(K|M|B)?\/?s?/i);
  if (!m) return null;
  let num = parseFloat(m[1]);
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') num *= 1e3;
  else if (suffix === 'M') num *= 1e6;
  else if (suffix === 'B') num *= 1e9;
  return Math.round(num);
}

(async () => {
  const URL =
    'https://www.shigjeta.net/escape-tsunami-for-brainrots-trade-values-every-brainrot-ranked-by-income-and-rarity/';
  const res = await axios.get(URL, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
  const $ = cheerio.load(res.data);
  const scraped = [];
  $('table tbody tr, table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length >= 3) {
      const name = $(cells[0]).text().trim();
      const incomeStr = $(cells[2]).text().trim();
      const inc = parseIncome(incomeStr);
      if (name && inc != null) scraped.push({ slug: norm(name), name, income: inc });
    }
  });

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'brainrots.json'), 'utf8'));
  const zeros = data.items.filter((i) => (i.income ?? i.baseIncome ?? 0) <= 0);

  console.log('Suggested aliases (our slug -> shigjeta slug) if substring/close match:\n');
  for (const it of zeros) {
    const s = norm(it.name);
    let best = null;
    for (const r of scraped) {
      if (r.slug === s) {
        best = { r, reason: 'exact' };
        break;
      }
    }
    if (!best) {
      for (const r of scraped) {
        if (s.includes(r.slug) || r.slug.includes(s)) {
          best = { r, reason: 'substring' };
          break;
        }
      }
    }
    if (!best) {
      // one char diff heuristic: same length
      for (const r of scraped) {
        if (Math.abs(s.length - r.slug.length) <= 2 && levenshtein(s, r.slug) <= 3) {
          best = { r, reason: 'lev3' };
          break;
        }
      }
    }
    console.log(it.id, '|', s, '->', best ? `${best.r.slug} (${best.reason} ${best.r.income})` : 'NO MATCH');
  }
})();

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + c);
    }
  }
  return dp[m][n];
}
