/**
 * ============================================================================
 *  SCRAPER: hyunkistore.com (현대모비스부품몰 — Hyundai Mobis запчасти)
 * ============================================================================
 *
 *  Скрипт скачивает каталог запчастей со страниц категорий hyunkistore.com
 *  и сохраняет в JSONL файлы: data/scraped/hyunki_<категория>.jsonl
 *  (одна строка = один товар, append-only, не тормозит на больших файлах)
 *
 *  Скрипт НЕ использует Claude/AI — работает как обычная Node.js программа.
 *  Запускай в терминале, токены не тратятся.
 *
 * ── ЗАПУСК ──────────────────────────────────────────────────────────────────
 *
 *  Тестовый прогон (ничего не сохраняет, только показывает что найдёт):
 *    node scripts/scrape-hyunki.mjs --category 엔진 --pages 3 --dry-run
 *
 *  Реальный запуск одной категории (600 страниц, безопасный темп):
 *    node scripts/scrape-hyunki.mjs --category 엔진 --pages 600 --delay 3000
 *
 *  Продолжение после остановки (скрипт подскажет --start-page в конце):
 *    node scripts/scrape-hyunki.mjs --category 엔진 --pages 600 --start-page 601 --delay 3000
 *
 *  Все категории сразу (осторожно — долго!):
 *    node scripts/scrape-hyunki.mjs --all --pages 100 --delay 3000
 *
 * ── ПАРАМЕТРЫ (CLI) ────────────────────────────────────────────────────────
 *
 *  --category <имя>    Категория: 엔진, 트림, 전기장치, 미션, 샤시, 바디, 기타
 *  --pages <N>         Сколько страниц скрейпить (по умолчанию: 2)
 *  --start-page <N>    С какой страницы начать (по умолчанию: 1, для resume)
 *  --delay <мс>        Задержка между запросами в мс (по умолчанию: 2000)
 *  --dry-run           Только парсить и показывать, не сохранять файлы
 *  --all               Скрейпить все категории подряд
 *
 * ── ЗАЩИТА ОТ БАНА ─────────────────────────────────────────────────────────
 *
 *  - Один User-Agent на весь сеанс (как настоящий браузер)
 *  - Адаптивные паузы: каждые 10 стр. пауза 8-15с, каждые 50 стр. — 30-60с
 *  - Jitter: случайный разброс задержки чтобы не быть роботом
 *  - Экспоненциальный backoff при 429 (rate limit)
 *  - Автостоп: 5 подряд 429 или 403 = сразу выход
 *  - Между категориями (--all): пауза 60-120с
 *
 * ── РЕКОМЕНДАЦИИ ────────────────────────────────────────────────────────────
 *
 *  - delay 2000-3000 — нормальный темп, ~3-4с реально между запросами
 *  - За одну сессию не больше 500-700 страниц, потом перерыв 2-4ч
 *  - Если получил 403 — подожди несколько часов, IP разбанят
 *  - Данные сохраняются после каждой страницы (append), потеря данных невозможна
 *  - Формат JSONL: дедупликация будет при импорте в Supabase, не при записи
 *
 * ============================================================================
 */

import { load } from "cheerio";
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  НАСТРОЙКИ — меняй под себя                                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// Адрес магазина
const BASE = "https://hyunkistore.com";

// Категории: имя → { id на сайте, примерное кол-во страниц }
// totalPages — ориентировочно, скрипт сам остановится когда страницы кончатся
const CATEGORIES = {
  "엔진":     { id: 50, totalPages: 3560 },   // Двигатель    (~71k товаров)
  "트림":     { id: 51, totalPages: 10000 },  // Отделка      (~200k товаров)
  "전기장치": { id: 52, totalPages: 7422 },   // Электрика    (~148k товаров)
  "미션":     { id: 53, totalPages: 1583 },   // Трансмиссия  (~32k товаров)
  "샤시":     { id: 54, totalPages: 2608 },   // Шасси        (~52k товаров)
  "바디":     { id: 55, totalPages: 1725 },   // Кузов        (~34k товаров)
  "기타":     { id: 56, totalPages: 2296 },   // Прочее       (~46k товаров)
};

// Через сколько пустых страниц подряд считать что категория кончилась
const EMPTY_PAGE_THRESHOLD = 3;

// Сколько ошибок fetch подряд до автоостановки
const MAX_CONSECUTIVE_FAILS = 5;

// Сколько 429 (rate limit) подряд до автоостановки
const MAX_CONSECUTIVE_429 = 5;

// Адаптивные паузы: каждые N страниц — длинная пауза (чтобы не забанили)
const MEDIUM_PAUSE_EVERY = 10;    // Каждые 10 стр.: пауза 8-15 сек
const MEDIUM_PAUSE_MIN = 8000;
const MEDIUM_PAUSE_MAX = 15000;

const LONG_PAUSE_EVERY = 50;      // Каждые 50 стр.: пауза 30-60 сек
const LONG_PAUSE_MIN = 30000;
const LONG_PAUSE_MAX = 60000;

// Пауза между категориями при --all (60-120 сек)
const CATEGORY_BREAK_MIN = 60000;
const CATEGORY_BREAK_MAX = 120000;

// User-Agent'ы (выбирается один случайный на весь сеанс)
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
];

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}
const hasFlag = (name) => args.includes(`--${name}`);

const categoryName = getArg("category");
const maxPages = parseInt(getArg("pages") || "2", 10);
const startPage = parseInt(getArg("start-page") || "1", 10);
const delayMs = parseInt(getArg("delay") || "2000", 10);
const dryRun = hasFlag("dry-run");
const scrapeAll = hasFlag("all");

if (!categoryName && !scrapeAll) {
  console.log(`Usage:
  node scripts/scrape-hyunki.mjs --category 엔진 --pages 2 --dry-run
  node scripts/scrape-hyunki.mjs --category 엔진 --pages 100 --start-page 50
  node scripts/scrape-hyunki.mjs --all --delay 3000

Options:
  --category <name>  Category to scrape (엔진, 트림, 전기장치, 미션, 샤시, 바디, 기타)
  --pages <n>        Max pages to scrape (default: 2)
  --start-page <n>   Resume from this page (default: 1)
  --delay <ms>       Base delay between requests in ms (default: 2000)
  --dry-run          Parse and print, don't save to files
  --all              Scrape all categories`);
  process.exit(0);
}

// ── Output dir ──────────────────────────────────────────────────────────────

const OUT_DIR = join(import.meta.dirname, "..", "data", "scraped");
if (!dryRun) {
  mkdirSync(OUT_DIR, { recursive: true });
}

// ── Progress tracker ────────────────────────────────────────────────────────

const stats = {
  startedAt: null,
  totalPages: 0,
  donePages: 0,
  totalProducts: 0,
  skippedPages: 0,
  pageTimes: [],
};

function progressLine() {
  const pct = stats.totalPages > 0
    ? ((stats.donePages / stats.totalPages) * 100).toFixed(1)
    : "?";
  const bar = stats.totalPages > 0
    ? progressBar(stats.donePages, stats.totalPages, 20)
    : "";
  const eta = estimateETA();
  const speed = stats.pageTimes.length > 0
    ? (stats.pageTimes.reduce((a, b) => a + b, 0) / stats.pageTimes.length / 1000).toFixed(1)
    : "?";
  return `  ${bar} ${pct}% | ${stats.donePages}/${stats.totalPages} pages | ~${speed}s/page | ETA: ${eta} | ${stats.totalProducts} products`;
}

function progressBar(done, total, width) {
  const filled = Math.round((done / total) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function estimateETA() {
  if (stats.pageTimes.length < 2) return "calculating...";
  const avgMs = stats.pageTimes.reduce((a, b) => a + b, 0) / stats.pageTimes.length;
  const remaining = stats.totalPages - stats.donePages;
  const etaMs = remaining * avgMs;
  if (etaMs < 60000) return `${(etaMs / 1000).toFixed(0)}s`;
  if (etaMs < 3600000) return `${(etaMs / 60000).toFixed(1)}m`;
  const h = Math.floor(etaMs / 3600000);
  const m = Math.round((etaMs % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function elapsed() {
  if (!stats.startedAt) return "0s";
  const ms = Date.now() - stats.startedAt;
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms) {
  const jitter = Math.floor(Math.random() * Math.max(1000, ms * 0.5));
  return new Promise((r) => setTimeout(r, ms + jitter));
}

function adaptiveDelay(pageNum) {
  if (pageNum % LONG_PAUSE_EVERY === 0) {
    const pause = LONG_PAUSE_MIN + Math.floor(Math.random() * (LONG_PAUSE_MAX - LONG_PAUSE_MIN));
    console.log(`  🛑 Длинная пауза: ${(pause / 1000).toFixed(0)}s (каждые ${LONG_PAUSE_EVERY} стр.)`);
    return pause;
  }
  if (pageNum % MEDIUM_PAUSE_EVERY === 0) {
    const pause = MEDIUM_PAUSE_MIN + Math.floor(Math.random() * (MEDIUM_PAUSE_MAX - MEDIUM_PAUSE_MIN));
    console.log(`  ⏸  Средняя пауза: ${(pause / 1000).toFixed(0)}s (каждые ${MEDIUM_PAUSE_EVERY} стр.)`);
    return pause;
  }
  return delayMs;
}

function parsePrice(text) {
  if (!text) return null;
  const match = text.replace(/,/g, "").match(/(\d+)원/);
  return match ? parseInt(match[1], 10) : null;
}

function extractPartNumber(text) {
  const match = text.match(/\(([A-Z0-9]+)\)/i);
  return match ? match[1].toUpperCase() : null;
}

function extractName(text) {
  return text.replace(/\s*\([A-Z0-9]+\)\s*/i, "").trim();
}

function extractSourceId(href) {
  const match = href.match(/\/product\/[^/]+\/(\d+)\//);
  return match ? match[1] : null;
}

// ── Fetch page ──────────────────────────────────────────────────────────────

// Sticky UA per session (real browsers don't change UA mid-session)
const sessionUA = randomUA();
let consecutiveErrors = 0;

async function fetchPage(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": sessionUA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.5,en;q=0.3",
          "Accept-Encoding": "gzip, deflate, br",
          "Referer": `${BASE}/`,
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
        },
      });

      if (res.status === 429) {
        consecutiveErrors++;
        const wait = delayMs * Math.pow(2, consecutiveErrors) + Math.random() * 10000;
        console.warn(`  ⚠ Rate limited (429). Backing off ${(wait / 1000).toFixed(0)}s (streak: ${consecutiveErrors})...`);
        if (consecutiveErrors >= MAX_CONSECUTIVE_429) {
          console.error(`  ✗ Too many 429s in a row — stopping to avoid ban.`);
          process.exit(1);
        }
        await sleep(wait);
        continue;
      }

      if (res.status === 403) {
        console.error(`  ✗ 403 Forbidden — likely IP banned. Stop and retry later.`);
        process.exit(1);
      }

      if (!res.ok) {
        console.warn(`  ⚠ HTTP ${res.status} for ${url}`);
        if (attempt < retries) await sleep(delayMs * attempt);
        continue;
      }

      consecutiveErrors = 0;
      return await res.text();
    } catch (err) {
      console.warn(`  ⚠ Fetch error (attempt ${attempt}/${retries}): ${err.message}`);
      if (attempt < retries) await sleep(delayMs * attempt);
    }
  }
  return null;
}

// ── Parse products from HTML ────────────────────────────────────────────────

function parseProducts(html, categoryName, categoryId) {
  const $ = load(html);
  const products = [];

  $("li.item_list").each((_, el) => {
    const $el = $(el);

    const $link = $el.find('a[href*="/product/"]').first();
    if (!$link.length) return;

    const href = $link.attr("href") || "";
    const $img = $el.find("img.thumb_Img").first();
    const fullText = ($img.attr("alt") || "").trim();
    if (!fullText) return;

    const partNumber = extractPartNumber(fullText);
    if (!partNumber) return;

    const nameKo = extractName(fullText);
    const sourceId = extractSourceId(href);
    const imageUrl = $img.attr("src") || `https://hyunkitems.cafe24.com/web/hyunkistore/thum25/${partNumber}.jpg`;

    // Price from data attribute d-custom on div.custom_pro
    const dCustom = $el.find("div.custom_pro").attr("d-custom");
    const price = dCustom ? parseInt(dCustom, 10) : null;

    // Original price from d-price attribute
    const dPrice = $el.find("div.custom_pro").attr("d-price");
    const originalPrice = dPrice ? parseInt(dPrice, 10) : null;

    // Stock: check for soldout image
    const soldout = $el.find('img[src*="soldout"]').length > 0;

    products.push({
      part_number: partNumber,
      name_ko: nameKo,
      price_krw: price,
      original_price_krw: originalPrice && originalPrice !== price ? originalPrice : null,
      source_category: categoryName,
      manufacturer: "Hyundai Mobis",
      image_url: imageUrl,
      in_stock: !soldout,
      source: "hyunkistore",
      source_url: `${BASE}${href}`,
      source_id: sourceId,
      scraped_at: new Date().toISOString(),
    });
  });

  return products;
}

// ── Save to JSONL file (append-only, no re-reading) ────────────────────────
// Формат: одна строка = один JSON-объект. Быстро, не тормозит на больших файлах.
// Дедупликация по source_id — при импорте в Supabase (ON CONFLICT).

function appendPageToFile(categoryName, pageProducts) {
  const filename = `hyunki_${categoryName}.jsonl`;
  const filepath = join(OUT_DIR, filename);

  const lines = pageProducts.map(p => JSON.stringify(p)).join("\n") + "\n";
  appendFileSync(filepath, lines, "utf-8");

  return { filepath, added: pageProducts.length };
}

function countLinesInFile(categoryName) {
  const filepath = join(OUT_DIR, `hyunki_${categoryName}.jsonl`);
  if (!existsSync(filepath)) return 0;
  const content = readFileSync(filepath, "utf-8");
  return content.split("\n").filter(l => l.trim()).length;
}

// ── Scrape one category ─────────────────────────────────────────────────────

async function scrapeCategory(name, catId, pages, fromPage = 1) {
  const endPage = fromPage + pages - 1;
  stats.totalPages += pages;

  console.log(`\n━━━ ${name} (cat ${catId}) | pages ${fromPage}→${endPage} (${pages} total) ━━━`);

  let catProducts = 0;
  let emptyStreak = 0;
  let failStreak = 0;

  for (let page = fromPage; page <= endPage; page++) {
    const pageStart = Date.now();
    const url = `${BASE}/category/${encodeURIComponent(name)}/${catId}/?page=${page}`;

    const html = await fetchPage(url);
    if (!html) {
      failStreak++;
      stats.donePages++;
      stats.skippedPages++;
      console.error(`  ✗ Page ${page} failed (streak: ${failStreak})`);
      if (failStreak >= MAX_CONSECUTIVE_FAILS) {
        console.error(`\n  ✗ ${MAX_CONSECUTIVE_FAILS} consecutive failures — stopping.`);
        console.error(`  ↳ Resume: --category ${name} --start-page ${page} --pages ${endPage - page + 1}`);
        break;
      }
      continue;
    }
    failStreak = 0;

    const products = parseProducts(html, name, catId);

    if (products.length === 0) {
      emptyStreak++;
      stats.donePages++;
      if (emptyStreak >= EMPTY_PAGE_THRESHOLD) {
        console.log(`  ■ End of category — ${EMPTY_PAGE_THRESHOLD} empty pages in a row.`);
        stats.totalPages -= (endPage - page);
        break;
      }
    } else {
      emptyStreak = 0;
      catProducts += products.length;
      stats.totalProducts += products.length;
      stats.donePages++;
    }

    stats.pageTimes.push(Date.now() - pageStart);
    // Keep only last 30 page times for rolling average
    if (stats.pageTimes.length > 30) stats.pageTimes.shift();

    if (dryRun) {
      products.slice(0, 2).forEach((p) => {
        console.log(`    ${p.part_number} | ${p.name_ko} | ${p.price_krw}원 | ${p.in_stock ? "✓" : "✗"}`);
      });
    }

    if (!dryRun && products.length > 0) {
      const result = appendPageToFile(name, products);
      console.log(`  p.${page} → +${result.added} saved | ${stats.totalProducts} total`);
    } else if (products.length > 0) {
      console.log(`  p.${page} → ${products.length} products (dry run)`);
    } else {
      console.log(`  p.${page} → empty (${emptyStreak}/${EMPTY_PAGE_THRESHOLD})`);
    }

    console.log(progressLine());

    if (page < endPage) {
      const pause = adaptiveDelay(page - fromPage + 1);
      if (pause === delayMs) console.log(`  ⏳ ${delayMs}ms...`);
      await sleep(pause);
    }
  }

  console.log(`\n  ✓ ${name}: ${catProducts} products | elapsed: ${elapsed()}`);
  if (endPage < (CATEGORIES[name]?.totalPages || Infinity)) {
    console.log(`  ↳ Resume: --category ${name} --start-page ${endPage + 1}`);
  }
  return catProducts;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  stats.startedAt = Date.now();

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  hyunkistore.com scraper                     ║");
  console.log(`║  Mode:  ${dryRun ? "DRY RUN" : "LIVE (JSON)"}                          ║`);
  console.log(`║  Delay: ${delayMs}ms base + adaptive pauses        ║`);
  console.log(`║  Start: page ${startPage}                             ║`);
  console.log("╚══════════════════════════════════════════════╝");

  let total = 0;

  if (scrapeAll) {
    for (const [name, cat] of Object.entries(CATEGORIES)) {
      total += await scrapeCategory(name, cat.id, Math.min(maxPages, cat.totalPages), startPage);
      const interCat = CATEGORY_BREAK_MIN + Math.floor(Math.random() * (CATEGORY_BREAK_MAX - CATEGORY_BREAK_MIN));
      console.log(`\n  🔄 Category break: ${(interCat / 1000).toFixed(0)}s before next category...`);
      await sleep(interCat);
    }
  } else {
    const cat = CATEGORIES[categoryName];
    if (!cat) {
      console.error(`Unknown category: ${categoryName}`);
      console.error(`Available: ${Object.keys(CATEGORIES).join(", ")}`);
      process.exit(1);
    }
    total = await scrapeCategory(categoryName, cat.id, Math.min(maxPages, cat.totalPages), startPage);
  }

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  DONE                                        ║`);
  console.log(`║  Products:  ${String(total).padEnd(33)}║`);
  console.log(`║  Pages:     ${String(stats.donePages).padEnd(33)}║`);
  console.log(`║  Skipped:   ${String(stats.skippedPages).padEnd(33)}║`);
  console.log(`║  Elapsed:   ${elapsed().padEnd(33)}║`);
  console.log(`╚══════════════════════════════════════════════╝`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
