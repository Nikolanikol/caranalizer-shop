/**
 * Проход 1: индекс группы. Читает страницы листинга, а не карточки товаров.
 *
 * Запуск: node scripts/partsfit/scrape-index.mjs headlights
 *         node scripts/partsfit/scrape-index.mjs headlights --pages=5   (проба)
 *
 * В листинге донора уже лежит всё, по чему принимается решение о публикации: корейский
 * заголовок целиком (а в нём и партномер), цена и product_no. 48 товаров за запрос —
 * значит индекс группы в 13 тысяч позиций стоит 273 запроса, а не 13 тысяч.
 *
 * Отсюда правило: детальные страницы (проход 2) тянем только под отобранное. Обратный
 * порядок — сначала выкачать всё, потом отбирать — дороже в полсотни раз и даёт то же самое.
 *
 * Повторный прогон не перезаписывает файл, а сливается с ним: цена и lastSeen обновляются,
 * firstSeen сохраняется. По нему видно новые поступления и ушедшие позиции.
 */

import {
  fetchHtml,
  groupByName,
  indexPath,
  listUrl,
  mapLimit,
  readJson,
  writeJson,
} from './lib.mjs';

const CARD_RE = /<li id="anchorBoxId_(\d+)"[\s\S]*?(?=<li id="anchorBoxId_|<\/ul>)/g;
const PAGE_RE = /\?cate_no=\d+&page=(\d+)/g;

/** Значение поля карточки: `<span>상품명</span><span>BMW 5시리즈 …</span>`. */
function field(card, label) {
  const at = card.indexOf(`>${label}<`);
  if (at < 0) return '';
  const value = card.slice(at).match(/<span[^>]*>([^<]*)<\/span>\s*<\/?\w[^>]*>\s*<span[^>]*>([^<]*)/);
  return value ? decode(value[2]) : '';
}

function decode(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseCards(html, groupName) {
  const rows = [];

  for (const [card, productNo] of [...html.matchAll(CARD_RE)].map((m) => [m[0], m[1]])) {
    // Заголовок берём из alt картинки: там он всегда целиком, тогда как в подписи
    // под карточкой донор местами обрезает длинные названия многоточием.
    const title = decode(card.match(/alt="([^"]{5,})"/)?.[1] || '') || field(card, '상품명');
    const priceText = field(card, '판매가') || card.match(/([\d,]{4,})\s*원/)?.[1] || '';
    const thumb = card.match(/(\/\/ecimg[^"']+\/product\/[^"']+\.jpg)/)?.[1] || '';

    if (!title) continue;

    rows.push({
      productNo,
      group: groupName,
      titleKr: title,
      priceKrw: Number(priceText.replace(/[^\d]/g, '')) || 0,
      thumb: thumb ? `https:${thumb}` : '',
      listedAt: thumb.match(/\/(20\d{2})(\d{2})(\d{2})\//)?.slice(1, 4).join('-') || '',
    });
  }

  return rows;
}

async function totalPages(group) {
  const html = await fetchHtml(listUrl(group.no, 1));
  const pages = [...html.matchAll(PAGE_RE)].map((m) => Number(m[1]));
  return { html, pages: pages.length ? Math.max(...pages) : 1 };
}

const [groupName, ...flags] = process.argv.slice(2);
if (!groupName) {
  console.error('Укажи группу: node scripts/partsfit/scrape-index.mjs headlights');
  process.exit(1);
}

const group = groupByName(groupName);
const limitFlag = Number(flags.find((f) => f.startsWith('--pages='))?.split('=')[1]) || 0;

const first = await totalPages(group);
const pageCount = limitFlag ? Math.min(limitFlag, first.pages) : first.pages;
console.log(`${group.ru} (cate_no=${group.no}): страниц ${first.pages}, снимаем ${pageCount}`);

const rest = Array.from({ length: pageCount - 1 }, (_, i) => i + 2);
const pages = await mapLimit(rest, 5, (page) => fetchHtml(listUrl(group.no, page)), {
  onProgress: (done, total) => process.stdout.write(`\r  страниц: ${done + 1}/${total + 1}`),
});
process.stdout.write('\n');

const scraped = new Map();
for (const html of [first.html, ...pages]) {
  for (const row of parseCards(html, groupName)) scraped.set(row.productNo, row);
}

const today = new Date().toISOString().slice(0, 10);
const previous = new Map((readJson(indexPath(groupName), []) || []).map((row) => [row.productNo, row]));
const merged = [];
let added = 0;
let repriced = 0;

for (const [productNo, row] of scraped) {
  const before = previous.get(productNo);
  if (!before) added++;
  else if (before.priceKrw !== row.priceKrw) repriced++;
  merged.push({ ...row, firstSeen: before?.firstSeen || today, lastSeen: today });
}

// Позиции, пропавшие из листинга, оставляем с прежним lastSeen: деталь могли продать,
// и это факт о каталоге, а не повод стереть строку. Отсев по lastSeen — при сборке таблиц.
for (const [productNo, before] of previous) {
  if (!scraped.has(productNo)) merged.push(before);
}

merged.sort((a, b) => Number(a.productNo) - Number(b.productNo));
writeJson(indexPath(groupName), merged);

const gone = merged.filter((row) => row.lastSeen !== today).length;
const withOem = merged.filter((row) => /\s[0-9A-Z][0-9A-Z\- ]{4,}(?:\s+\d{1,2})?$/i.test(row.titleKr)).length;

console.log(`Индекс «${group.ru}»: ${merged.length} позиций -> data/partsfit/index/${groupName}.json`);
console.log(`  новых ${added}, цена изменилась у ${repriced}, нет в листинге ${gone}`);
console.log(`  похоже на партномер в заголовке: ${withOem}`);
