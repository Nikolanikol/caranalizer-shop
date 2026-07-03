// ============================================================
// PartSouq scraper: каталожный номер → официальное EN название
//
// ЗАПУСК (в отдельном терминале, вне Claude):
//   node scripts/scrape-partsouq.mjs            — полный прогон
//   node scripts/scrape-partsouq.mjs --test 20  — тест на 20 номеров
//
// Возобновление: просто перезапустить — уже обработанные
// номера пропускаются (читается выходной файл).
//
// Выход:  data/partsouq-names.jsonl  (append, по строке на номер)
// Лог:    logs/partsouq-scrape.log
//
// Безопасность:
//   - случайная пауза 1.2–2.5с между запросами
//   - экспоненциальный backoff при 403/429 (1м → 5м → 15м)
//   - стоп после 5 подряд неудачных backoff-циклов (бан CF)
//   - graceful shutdown по Ctrl+C (дописывает текущую строку)
// ============================================================
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const SRC = 'data/translations_final2.jsonl';
const OUT = 'data/partsouq-names.jsonl';
const LOG_DIR = 'logs';
const LOG = path.join(LOG_DIR, 'partsouq-scrape.log');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const DELAY_MIN = 1200, DELAY_MAX = 2500;
const BACKOFFS = [60_000, 300_000, 900_000]; // 1м, 5м, 15м
const MAX_BACKOFF_CYCLES = 5;

// --- аргументы ---
const args = process.argv.slice(2);
let testLimit = 0;
const ti = args.indexOf('--test');
if (ti !== -1) testLimit = parseInt(args[ti + 1] || '20', 10);

// --- лог ---
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const logFd = fs.openSync(LOG, 'a');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.writeSync(logFd, line + '\n');
}

// --- загрузка номеров ---
const rows = fs.readFileSync(SRC, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const allNumbers = [...new Set(rows.map(r => r.part_number).filter(Boolean))];

// --- уже обработанные ---
const done = new Set();
if (fs.existsSync(OUT)) {
  for (const l of fs.readFileSync(OUT, 'utf8').trim().split('\n')) {
    if (!l) continue;
    try {
      const r = JSON.parse(l);
      // ошибки перепрашиваем при следующем запуске, ok/not_found — нет
      if (r.status === 'ok' || r.status === 'not_found') done.add(r.part_number);
    } catch {}
  }
}

let queue = allNumbers.filter(n => !done.has(n));
if (testLimit > 0) queue = queue.slice(0, testLimit);

log(`=== СТАРТ ${testLimit ? '(ТЕСТ ' + testLimit + ')' : ''} | всего: ${allNumbers.length}, готово: ${done.size}, в очереди: ${queue.length} ===`);

const outFd = fs.openSync(OUT, 'a');
let stopping = false;
process.on('SIGINT', () => { log('SIGINT — завершаю после текущего номера...'); stopping = true; });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = () => DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN);

async function fetchTitle(pn) {
  const url = `https://partsouq.com/en/search/all?q=${encodeURIComponent(pn)}`;
  const { stdout } = await execFileP('curl', [
    '-s', '-L', '--max-time', '25',
    '-A', UA,
    '-w', '\n__HTTP:%{http_code}__',
    url,
  ], { maxBuffer: 10 * 1024 * 1024 });
  const codeM = stdout.match(/__HTTP:(\d+)__\s*$/);
  const code = codeM ? parseInt(codeM[1], 10) : 0;
  const titleM = stdout.match(/<title>([^<]*)<\/title>/);
  return { code, title: titleM ? titleM[1] : null };
}

function parseName(title, pn) {
  if (!title) return null;
  if (/\|\s*Results\s*\|\s*Search/i.test(title)) return null; // не найден
  // "TENSIONER ARM ASSY 244203F400 | Hyundai / KIA Parts | PartSouq"
  let name = title.replace(/\s*\|.*$/, '').trim();
  name = name.replace(new RegExp(pn + '\\s*$', 'i'), '').trim();
  return name || null;
}

let ok = 0, notFound = 0, errors = 0, backoffCycle = 0;
const t0 = Date.now();

for (let i = 0; i < queue.length && !stopping; i++) {
  const pn = queue[i];
  let rec;
  try {
    const { code, title } = await fetchTitle(pn);

    if (code === 403 || code === 429) {
      // backoff
      if (backoffCycle >= MAX_BACKOFF_CYCLES) {
        log(`СТОП: ${MAX_BACKOFF_CYCLES} backoff-циклов подряд — похоже на бан. Перезапусти позже.`);
        break;
      }
      const wait = BACKOFFS[Math.min(backoffCycle, BACKOFFS.length - 1)];
      log(`HTTP ${code} на ${pn} — пауза ${wait / 60000}м (цикл ${backoffCycle + 1}/${MAX_BACKOFF_CYCLES})`);
      backoffCycle++;
      await sleep(wait);
      i--; // повторить этот номер
      continue;
    }

    backoffCycle = 0;

    if (code !== 200) {
      rec = { part_number: pn, status: 'error', http: code, ts: Date.now() };
      errors++;
    } else {
      let name = parseName(title, pn);
      let queriedAs = pn;

      // не нашёлся и есть суффикс (цвет/комплектация) — пробуем базовый номер
      if (!name && pn.length > 10) {
        const base = pn.slice(0, 10);
        await sleep(jitter());
        const r2 = await fetchTitle(base);
        if (r2.code === 200) {
          name = parseName(r2.title, base);
          if (name) queriedAs = base;
        }
      }

      if (name) { rec = { part_number: pn, status: 'ok', name_en_official: name, queried_as: queriedAs, ts: Date.now() }; ok++; }
      else { rec = { part_number: pn, status: 'not_found', ts: Date.now() }; notFound++; }
    }
  } catch (e) {
    rec = { part_number: pn, status: 'error', err: e.message.slice(0, 120), ts: Date.now() };
    errors++;
  }

  fs.writeSync(outFd, JSON.stringify(rec) + '\n');

  if ((i + 1) % 50 === 0 || testLimit) {
    const el = (Date.now() - t0) / 1000;
    const speed = (i + 1) / el;
    const eta = ((queue.length - i - 1) / speed / 3600).toFixed(1);
    if ((i + 1) % 50 === 0) log(`${i + 1}/${queue.length} | ok=${ok} nf=${notFound} err=${errors} | ${speed.toFixed(2)}/с | ETA ${eta}ч`);
  }
  if (testLimit && rec) log(`  ${pn} → ${rec.status}${rec.name_en_official ? ': ' + rec.name_en_official : ''}`);

  await sleep(jitter());
}

const min = ((Date.now() - t0) / 60000).toFixed(1);
log(`=== ФИНИШ: ok=${ok}, not_found=${notFound}, errors=${errors} за ${min}м ===`);
fs.closeSync(outFd);
fs.closeSync(logFd);
