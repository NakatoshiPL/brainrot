#!/usr/bin/env node
/**
 * Downloads remote thumbnail URLs from image-mapping.json into
 * frontend/public/images/brainrots/[id].(jpg|png|webp|svg) and rewrites
 * mapping to /images/brainrots/... so the UI loads files same-origin (no Beebom/Wikia proxy failures).
 *
 * Run: node scripts/cache-local-thumbnails.js
 *      node scripts/cache-local-thumbnails.js --dry-run
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const FANDOM_API = 'https://escape-tsunami-for-brainrots.fandom.com/api.php';

/** Same as fetch-etfb-images.js — alternate page titles on ETFB wiki */
const ALTERNATIVE_NAMES = {
  'bisonte-gupitere': 'Bisonte Giuppitere',
  'dug-dug-dug': 'Dug Dug Dug',
  'job-job-sahur': 'Job Job Sahur',
  'udin-din-din-dun': 'Udin Din Din Dun',
  'giraffa-celeste': 'Giraffa Celeste',
  'bombardilo-crocodilo': 'Bombardilo Crocodilo',
  'tric-tric-baraboom': 'Tric Tric Baraboom',
  'bobrito-bandito': 'Bobrito Bandito',
  'garama-madundung': 'Garama and Madundung',
  '67': '67',
  'rainbow-67': 'Rainbow 67',
};

function nameToFandomTitle(name) {
  return String(name || '').replace(/\s+/g, '_');
}

async function fetchWikiThumbByItem(item) {
  const titles = [];
  if (ALTERNATIVE_NAMES[item.id]) titles.push(nameToFandomTitle(ALTERNATIVE_NAMES[item.id]));
  titles.push(nameToFandomTitle(item.name));
  const seen = new Set();
  for (const t of titles) {
    if (!t || seen.has(t)) continue;
    seen.add(t);
    const url = `${FANDOM_API}?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&format=json&pithumbsize=400`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const page = Object.values(data?.query?.pages || {})[0];
      if (page?.missing) continue;
      const th = page?.thumbnail?.source;
      if (th && /^https?:\/\//i.test(th)) return th;
    } catch (_) {}
  }
  return null;
}

const ROOT = path.join(__dirname, '..');
const MAPPING_PATHS = [
  path.join(ROOT, 'data', 'image-mapping.json'),
  path.join(ROOT, 'backend', 'data', 'image-mapping.json'),
  path.join(ROOT, 'frontend', 'public', 'image-mapping.json'),
];
const BRAINROTS_PATH = path.join(ROOT, 'data', 'brainrots.json');
const OUT_DIR = path.join(ROOT, 'frontend', 'public', 'images', 'brainrots');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extFrom(ct, url) {
  const c = (ct || '').toLowerCase();
  if (c.includes('png')) return 'png';
  if (c.includes('webp')) return 'webp';
  if (c.includes('gif')) return 'gif';
  if (c.includes('svg')) return 'svg';
  if (c.includes('jpeg') || c.includes('jpg')) return 'jpg';
  const m = String(url).match(/\.(jpe?g|png|webp|gif|svg)(\?|$)/i);
  if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  return 'jpg';
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const brainrots = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
  const byId = Object.fromEntries((brainrots.items || []).map((i) => [i.id, i]));

  const primary = MAPPING_PATHS[0];
  const raw = fs.readFileSync(primary, 'utf8').replace(/^\uFEFF/, '');
  const data = JSON.parse(raw);
  const mapping = { ...(data.mapping || {}) };
  const ids = Object.keys(mapping).sort();

  let ok = 0;
  let skip = 0;
  let fail = 0;
  let wikiOk = 0;

  for (const id of ids) {
    const u = String(mapping[id] || '').trim();
    if (!u) continue;
    if (u.startsWith('/images/')) {
      const rel = path.join(ROOT, 'frontend', 'public', u.replace(/^\//, ''));
      if (fs.existsSync(rel)) {
        skip++;
        continue;
      }
    }
    if (!u.startsWith('http')) {
      skip++;
      continue;
    }

    if (dry) {
      console.log(`[dry-run] would fetch ${id} ← ${u.slice(0, 72)}…`);
      ok++;
      continue;
    }

    try {
      const res = await axios.get(u, {
        responseType: 'arraybuffer',
        maxRedirects: 6,
        timeout: 35000,
        headers: {
          'User-Agent': UA,
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: (() => {
            try {
              return new URL(u).origin + '/';
            } catch {
              return 'https://www.google.com/';
            }
          })(),
        },
        validateStatus: (s) => s === 200,
      });
      const ct = res.headers['content-type'] || '';
      if (/text\/html/i.test(ct)) throw new Error('received HTML not image');
      const ext = extFrom(ct, u);
      const buf = Buffer.from(res.data);
      if (buf.length < 32) throw new Error('file too small');
      const finalPath = path.join(OUT_DIR, `${id}.${ext}`);
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });
      fs.writeFileSync(finalPath, buf);
      mapping[id] = `/images/brainrots/${id}.${ext}`;
      ok++;
      process.stdout.write(`✓ ${id}\n`);
    } catch (e) {
      const item = byId[id];
      let recovered = false;
      if (item && !dry) {
        try {
          const wikiUrl = await fetchWikiThumbByItem(item);
          await new Promise((r) => setTimeout(r, 200));
          if (wikiUrl) {
            const res = await axios.get(wikiUrl, {
              responseType: 'arraybuffer',
              maxRedirects: 6,
              timeout: 35000,
              headers: {
                'User-Agent': UA,
                Accept: 'image/*,*/*',
                Referer: 'https://escape-tsunami-for-brainrots.fandom.com/',
              },
              validateStatus: (s) => s === 200,
            });
            const ct = res.headers['content-type'] || '';
            if (!/text\/html/i.test(ct)) {
              const ext = extFrom(ct, wikiUrl);
              const buf = Buffer.from(res.data);
              if (buf.length >= 32) {
                const finalPath = path.join(OUT_DIR, `${id}.${ext}`);
                fs.mkdirSync(path.dirname(finalPath), { recursive: true });
                fs.writeFileSync(finalPath, buf);
                mapping[id] = `/images/brainrots/${id}.${ext}`;
                wikiOk++;
                recovered = true;
                process.stdout.write(`✓ ${id} (wiki fallback)\n`);
              }
            }
          }
        } catch (_) {}
      }
      if (!recovered) {
        fail++;
        process.stdout.write(`✗ ${id} — ${e.message}\n`);
      } else {
        ok++;
      }
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  data.mapping = mapping;
  data._cachedLocal = new Date().toISOString().slice(0, 10);
  data._source = (data._source || '') + ' + local /images/brainrots cache';

  const out = JSON.stringify(data, null, 2) + '\n';
  if (!dry) {
    for (const p of MAPPING_PATHS) {
      try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, out, 'utf8');
      } catch (e) {
        console.warn('write failed', p, e.message);
      }
    }
  }

  console.log(
    `\nDone: downloaded ${ok}${wikiOk ? ` (incl. ${wikiOk} from ETFB wiki after Beebom fail)` : ''}, skipped ${skip}, failed ${fail}${dry ? ' (dry-run)' : ''}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
