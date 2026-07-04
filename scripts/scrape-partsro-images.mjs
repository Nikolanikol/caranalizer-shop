// ============================================================
// PartsRO image scraper: detail_url → og:image URL
//
// ЗАПУСК (в отдельном терминале, вне Claude):
//   node scripts/scrape-partsro-images.mjs            — полный прогон
//   node scripts/scrape-partsro-images.mjs --test 20  — тест
//
// Возобновление: перезапустить — обработанные пропускаются.
//
// Выход:  data/partsro-images.jsonl
// Лог:    logs/partsro-images.log
//
// Безопасность: пауза 0.6–1.2с, backoff при 403/429/5xx,
// автостоп после 5 неудачных циклов, Ctrl+C безопасен.
// ============================================================
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const envLines = fs.readFileSync('.env', 'utf8').split('\n');
for (const l of envLines) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }

const OUT = 'data/partsro-images.jsonl';
const LOG_DIR = 'logs';
const LOG = path.join(LOG_DIR, 'partsro-images.log');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const DELAY_MIN = 600, DELAY_MAX = 1200;
const BACKOFFS = [60_000, 300_000, 900_000];
const MAX_BACKOFF_CYCLES = 5;

const args = process.argv.slice(2);
let testLimit = 0;
const ti = args.indexOf('--test');
if (ti !== -1) testLimit = parseInt(args[ti + 1] || '20', 10);

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const logFd = fs.openSync(LOG, 'a');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.writeSync(logFd, line + '\n');
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- все продукты с detail_url ---
log('Читаю продукты из БД...');
const products = [];
let offset = 0;
while (true) {
  const { data, error } = await s.from('parts_products')
    .select('id,part_number,detail_url')
    .not('detail_url', 'is', null)
    .order('id', { ascending: true })
    .range(offset, offset + 999);
  if (error) { log('DB error: ' + error.message); process.exit(1); }
  if (!data || data.length === 0) break;
  products.push(...data);
  offset += 1000;
}
log(`Продуктов с detail_url: ${products.length}`);

// --- уже обработанные ---
const done = new Set();
if (fs.existsSync(OUT)) {
  for (const l of fs.readFileSync(OUT, 'utf8').trim().split('\n')) {
    if (!l) continue;
    try {
      const r = JSON.parse(l);
      if (r.status === 'ok' || r.status === 'no_image') done.add(r.id);
    } catch {}
  }
}

let queue = products.filter(p => !done.has(p.id));
if (testLimit > 0) queue = queue.slice(0, testLimit);

log(`=== СТАРТ ${testLimit ? '(ТЕСТ ' + testLimit + ')' : ''} | готово: ${done.size}, в очереди: ${queue.length} ===`);

const outFd = fs.openSync(OUT, 'a');
let stopping = false;
process.on('SIGINT', () => { log('SIGINT — завершаю...'); stopping = true; });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = () => DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN);

let ok = 0, noImg = 0, errors = 0, backoffCycle = 0;
const t0 = Date.now();

for (let i = 0; i < queue.length && !stopping; i++) {
  const p = queue[i];
  let rec;
  try {
    const res = await fetch(p.detail_url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(25_000),
    });

    if (res.status === 403 || res.status === 429 || res.status >= 500) {
      if (backoffCycle >= MAX_BACKOFF_CYCLES) {
        log(`СТОП: ${MAX_BACKOFF_CYCLES} backoff-циклов — перезапусти позже.`);
        break;
      }
      const wait = BACKOFFS[Math.min(backoffCycle, BACKOFFS.length - 1)];
      log(`HTTP ${res.status} на id=${p.id} — пауза ${wait / 60000}м (цикл ${backoffCycle + 1}/${MAX_BACKOFF_CYCLES})`);
      backoffCycle++;
      await sleep(wait);
      i--;
      continue;
    }
    backoffCycle = 0;

    if (res.status !== 200) {
      rec = { id: p.id, part_number: p.part_number, status: 'error', http: res.status, ts: Date.now() };
      errors++;
    } else {
      const html = await res.text();
      const img = html.match(/og:image"\s+content="([^"]+)"/);

      // официальное название детали (정식 부품명)
      const official = html.match(/정식 부품명<\/span><\/th>\s*<td><span[^>]*>([^<]*)</);
      // совместимость (적용차) — список моделей через <BR>
      const compatM = html.match(/적용차\(생산연도\)<\/span><\/th>\s*<td><span[^>]*>([\s\S]*?)<\/span><\/td>/);
      const compat = compatM
        ? compatM[1].split(/<BR\s*\/?>/i).map(t => t.replace(/<[^>]+>/g, '').trim()).filter(Boolean)
        : [];
      // актуальная цена
      const priceM = html.match(/span_product_price_text">([\d,]+)원/);
      const price = priceM ? parseInt(priceM[1].replace(/,/g, ''), 10) : null;
      // бренд
      const brandM = html.match(/브랜드<\/span><\/th>\s*<td><span[^>]*>([^<]*)</);

      if (img && img[1]) {
        rec = {
          id: p.id, part_number: p.part_number, status: 'ok',
          image_url: img[1],
          official_name_ko: official ? official[1].trim() : null,
          compat,
          price_krw: price,
          brand: brandM ? brandM[1].trim() : null,
          ts: Date.now(),
        };
        ok++;
      } else {
        rec = { id: p.id, part_number: p.part_number, status: 'no_image', ts: Date.now() };
        noImg++;
      }
    }
  } catch (e) {
    rec = { id: p.id, part_number: p.part_number, status: 'error', err: String(e.message || e).slice(0, 120), ts: Date.now() };
    errors++;
  }

  fs.writeSync(outFd, JSON.stringify(rec) + '\n');

  if (testLimit && rec) log(`  ${p.part_number} → ${rec.status}${rec.image_url ? ': ' + rec.image_url.slice(0, 70) : ''}`);
  if ((i + 1) % 100 === 0) {
    const el = (Date.now() - t0) / 1000;
    const speed = (i + 1) / el;
    const eta = ((queue.length - i - 1) / speed / 3600).toFixed(1);
    log(`${i + 1}/${queue.length} | ok=${ok} no_img=${noImg} err=${errors} | ${speed.toFixed(2)}/с | ETA ${eta}ч`);
  }

  await sleep(jitter());
}

const min = ((Date.now() - t0) / 60000).toFixed(1);
log(`=== ФИНИШ: ok=${ok}, no_image=${noImg}, errors=${errors} за ${min}м ===`);
fs.closeSync(outFd);
fs.closeSync(logFd);
