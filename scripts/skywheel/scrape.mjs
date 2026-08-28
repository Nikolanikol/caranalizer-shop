/**
 * Скрап доски объявлений skywheel.kr: листинг и карточки за один запуск.
 *
 * Запуск: node scripts/skywheel/scrape.mjs
 *         node scripts/skywheel/scrape.mjs --pages=2   (проба)
 *
 * Пишет два файла:
 *   data/skywheel/index.json — строка листинга + firstSeen/lastSeen, под контролем версий
 *   data/skywheel/items.json — разобранная карточка целиком, выводится из индекса
 *
 * Индекс сливается с прежним прогоном, а не перезаписывается: объявления исчезают
 * после продажи, и дата первого появления иначе теряется навсегда. Ушедшие позиции
 * из файла не удаляются — у них перестаёт двигаться lastSeen, и по нему видно,
 * что именно продалось.
 */

import {
  DATA,
  fetchHtml,
  htmlToText,
  imageUrl,
  indexPath,
  itemUrl,
  itemsPath,
  listUrl,
  mapLimit,
  readJson,
  writeJson,
} from './lib.mjs';

const ROW_RE = /<tr class="bg[01]">([\s\S]*?)<\/tr>/g;
const today = new Date().toISOString().slice(0, 10);

const cell = (row) => [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => htmlToText(m[1]));

/** Строка листинга: номер, фото, заголовок, новое/б-у, цена, регион, дата, просмотры. */
function parseList(html) {
  const rows = [];
  for (const [, row] of html.matchAll(ROW_RE)) {
    const cells = cell(row);
    const id = row.match(/wr_id=(\d+)/)?.[1];
    if (!id || cells.length < 8) continue;
    rows.push({
      id,
      no: Number(cells[0]) || null,
      title: cells[2],
      kind: cells[3],
      priceLabel: cells[4],
      region: cells[5],
      posted: cells[6],
      hits: Number(cells[7].replace(/,/g, '')) || 0,
      thumb: row.match(/src='([^']*thumb[^']*)'/)?.[1] ?? null,
    });
  }
  return rows;
}

/**
 * Карточка. Таблицы донора построены как «<td class="cab">поле</td><td>значение</td>»,
 * поэтому поля читаются поимённо, а не по порядку: у части объявлений строки переставлены.
 */
function parseItem(html, id) {
  const fields = {};
  // Разбираем построчно, а не парой соседних ячеек: заголовок секции («● 휠 정보 ●»)
  // стоит в своей строке одной ячейкой на две колонки, и регулярка по паре <td>
  // перескакивала через неё, склеивая заголовок со следующим полем и съедая его
  // значение. Цена молча пропадала у всех 120 объявлений.
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
    if (cells.length !== 2) continue;
    const name = htmlToText(cells[0][1]);
    if (!name || name.includes('●') || name in fields) continue;
    fields[name] = htmlToText(cells[1][1]);
  }

  const gallery = html.match(/owl-carousel owl-theme'>([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? '';
  const description = html.match(/<span id="writeContents">([\s\S]*?)<\/span>\s*<\/td>/)?.[1] ?? '';

  return {
    id,
    title: htmlToText(html.match(/<h3 class="panel-title">([\s\S]*?)<\/h3>/)?.[1] ?? ''),
    maker: fields['제조사'] ?? null,
    size: fields['사이즈'] ?? null,
    kind: fields['구분'] ?? null,
    region: fields['판매지역'] ?? null,
    grade: fields['휠상태'] ?? null,
    priceLabel: fields['판매가격'] ?? null,
    // Телефон и имя продавца читаем, чтобы отличать объявления самого SkyWheel
    // от чужих. На витрину эти поля не идут — см. classify.mjs.
    sellerName: fields['이름'] ?? null,
    sellerPhone: fields['연락처'] ?? null,
    posted: html.match(/최초등록일 <span[^>]*>([^<]+)<\/span>/)?.[1]?.trim() ?? null,
    hits: Number(html.match(/조회수 : <span[^>]*>([^<]+)<\/span>/)?.[1]?.replace(/[,\s]/g, '')) || 0,
    images: [...gallery.matchAll(/src='([^']+)'/g)].map((m) => imageUrl(m[1])),
    description: htmlToText(description),
  };
}

async function main() {
  const limit = Number(process.argv.find((a) => a.startsWith('--pages='))?.split('=')[1]) || 0;

  console.log('Листинг…');
  const rows = [];
  for (let page = 1; ; page++) {
    const html = await fetchHtml(listUrl(page));
    const found = parseList(html);
    if (!found.length) break;
    rows.push(...found);
    process.stdout.write(`  страница ${page}: ${found.length}\n`);
    if (limit && page >= limit) break;
  }

  const previous = new Map((readJson(indexPath(), []) ?? []).map((row) => [row.id, row]));
  const index = rows.map((row) => ({
    ...row,
    firstSeen: previous.get(row.id)?.firstSeen ?? today,
    lastSeen: today,
  }));
  for (const [id, row] of previous) {
    if (!index.some((r) => r.id === id)) index.push(row); // ушедшее не стираем
  }
  index.sort((a, b) => Number(b.id) - Number(a.id));
  writeJson(indexPath(), index);

  const gone = index.filter((r) => r.lastSeen !== today).length;
  console.log(`Индекс: ${rows.length} в наличии, ${gone} ушло, всего в файле ${index.length}`);

  console.log('Карточки…');
  const items = await mapLimit(
    rows,
    4,
    async (row) => parseItem(await fetchHtml(itemUrl(row.id)), row.id),
    { onProgress: (done, all) => process.stdout.write(`\r  ${done}/${all}`), pause: 250 },
  );
  process.stdout.write('\n');

  writeJson(itemsPath(), items);
  const photos = items.reduce((sum, item) => sum + item.images.length, 0);
  console.log(`Карточек ${items.length}, фотографий ${photos}. Данные в ${DATA}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
