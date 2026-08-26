/**
 * Проход 2: карточки товара. Только то, чего нет в листинге.
 *
 * Запуск: node scripts/partsfit/scrape-details.mjs headlights          (все с партномером)
 *         node scripts/partsfit/scrape-details.mjs headlights --limit=50
 *         node scripts/partsfit/scrape-details.mjs headlights --all    (включая без номера)
 *         node scripts/partsfit/scrape-details.mjs headlights --refresh (перечитать снятое)
 *
 * По умолчанию берём только позиции с партномером: остальные всё равно не публикуются,
 * а запрос на каждую стоит столько же. По фарам это 7 273 карточки вместо 13 096.
 *
 * Что даёт карточка сверх листинга:
 *   부품번호  партномер отдельным полем — надёжнее, чем хвост заголовка
 *   차대번호  VIN донорской машины (есть примерно у четверти позиций)
 *   meta      описание донора: состояние, число пинов, тип лампы, кросс-номера, цвет
 *   галерея   полноразмерные фото
 *
 * Описание берём из <meta name="description">, а не из тела страницы: тело рисует
 * редактор CAFE24 уже в браузере, а метатег отдаётся сервером. Из-за этого прошлый скрап
 * остался без состояния у всех 383 фар — на них смотрели глазами через браузер.
 */

import {
  detailUrl,
  detailsPath,
  fetchHtml,
  groupByName,
  indexPath,
  mapLimit,
  readJson,
  writeJson,
} from './lib.mjs';
import { parseTitle } from './parse.mjs';

const ROW_RE = /<th scope="row">([^<]+)<\/th>\s*<td[^>]*>(?:<span[^>]*>)?([^<]*)/g;
const META_RE = /<meta name="description" content="([\s\S]*?)"\s*\/?>/;
const SOLDOUT_RE = /df-prd-action-item_soldout[^"]*"/;

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

/**
 * Фотографии. Донор отдаёт одно и то же изображение в четырёх размерах, и прошлый скрап
 * сложил их в галерею подряд: 16 адресов на 7 снимков. Берём только `big` и `extra/big`.
 *
 * Картинки из `upload/NNEditor` — это тело описания, у каждого товара своё. Кладём их
 * отдельным полем, а не в галерею: пока не известно, фото это детали или баннер продавца.
 */
function images(html) {
  const gallery = [...html.matchAll(/\/\/ecimg[^"'\s]+\/product\/(?:big|extra\/big)\/\d+\/\w+\.jpg/g)];
  const inDescription = [...html.matchAll(/\/\/ecimg[^"'\s]+\/upload\/NNEditor\/\d+\/\w+\.jpg/g)];
  const https = (list) => [...new Set(list.map((m) => `https:${m[0]}`))];
  return { photos: https(gallery), descriptionImages: https(inDescription) };
}

const [groupName, ...flags] = process.argv.slice(2);
if (!groupName) {
  console.error('Укажи группу: node scripts/partsfit/scrape-details.mjs headlights');
  process.exit(1);
}

const group = groupByName(groupName);
const limit = Number(flags.find((f) => f.startsWith('--limit='))?.split('=')[1]) || 0;
const takeAll = flags.includes('--all');
const refresh = flags.includes('--refresh');

const index = readJson(indexPath(groupName), null);
if (!index) {
  console.error(`Индекса нет. Сначала: node scripts/partsfit/scrape-index.mjs ${groupName}`);
  process.exit(1);
}

const known = new Map((readJson(detailsPath(groupName), []) || []).map((row) => [row.productNo, row]));

let queue = index.filter((row) => takeAll || parseTitle(row.titleKr)?.oem);
if (!refresh) queue = queue.filter((row) => !known.has(row.productNo));
if (limit) queue = queue.slice(0, limit);

console.log(`${group.ru}: в индексе ${index.length}, к снятию ${queue.length}, уже снято ${known.size}`);
if (!queue.length) {
  console.log('Нечего снимать.');
  process.exit(0);
}

/*
 * Снимаем пачками и пишем файл после каждой.
 *
 * Первая версия копила всё в памяти и писала один раз в конце. На группе блоков
 * управления она умерла от нехватки памяти на 14 450-й карточке из 18 838 — и унесла
 * с собой полчаса работы, потому что на диск ещё ничего не легло. Ответ на обе беды
 * один: пачка -> запись -> следующая пачка. Память не растёт, а повторный запуск
 * продолжает с того места, где оборвалось: уже снятые productNo пропускаются.
 */
const BATCH = 250;

const failed = [];
let processed = 0;

async function scrapeOne(row) {
  let html;
  try {
    html = await fetchHtml(detailUrl(row.productNo, group.no));
  } catch (error) {
    failed.push({ productNo: row.productNo, error: error.message });
    return null;
  }

  // Страница снятого товара отдаёт 200 с общим шаблоном — отличаем по метке маршрута.
  if (!html.includes('path_role" content="PRODUCT_DETAIL')) {
    return { productNo: row.productNo, group: groupName, gone: true, scrapedAt: new Date().toISOString().slice(0, 10) };
  }

  const fields = {};
  for (const [, label, value] of html.matchAll(ROW_RE)) {
    const clean = decode(value);
    if (clean) fields[decode(label)] = clean;
  }

  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').replace(/\s*-\s*Partsfit$/, '');
  const { photos, descriptionImages } = images(html);
  const soldoutTag = html.match(SOLDOUT_RE)?.[0] || '';

  return {
    productNo: row.productNo,
    group: groupName,
    gone: false,
    titleKr: title || fields['상품명'] || row.titleKr,
    priceKrw: Number((fields['판매가'] || '').replace(/[^\d]/g, '')) || row.priceKrw,
    partNumber: fields['부품번호'] || '',
    vin: fields['차대번호'] || '',
    barcode: fields['바코드'] || '',
    brandKo: fields['브랜드'] || '',
    modelKo: fields['모델'] || '',
    yearRaw: fields['연식'] || '',
    description: decode(html.match(META_RE)?.[1] || ''),
    photos,
    descriptionImages,
    // Бейдж «품절» лежит в вёрстке всегда и прячется классом. Наличие самой строки
    // ничего не значит — значит отсутствие `displaynone` на ней.
    soldOut: Boolean(soldoutTag) && !soldoutTag.includes('displaynone'),
    sourceUrl: detailUrl(row.productNo, group.no),
    scrapedAt: new Date().toISOString().slice(0, 10),
  };
}

/*
 * Почему запись прогоняется через JSON, а не отдаётся как есть.
 *
 * Всё, что мы достаём из страницы, получено регуляркой по её тексту. V8 не копирует
 * такие подстроки, а хранит ссылку на исходную строку (sliced string). Значит одно поле
 * `description` длиной в сорок знаков удерживает в памяти всю страницу целиком — 185 КБ.
 * Умножаем на восемнадцать тысяч карточек и получаем то, что и получили: 3,9 ГБ и смерть
 * процесса на 14 450-й. Разбивка на пачки этого не лечила — рост был те же 185 КБ на запись.
 *
 * Прогон через JSON собирает строки заново, и ссылка на страницу рвётся. `.trim()`
 * и `.replace()` для этого не годятся: без совпадения они возвращают ту же самую строку.
 */
const detach = (row) => (row ? JSON.parse(JSON.stringify(row)) : row);

const scrapeBatch = async (batch) => (await mapLimit(batch, 5, scrapeOne, { pause: 300 })).map(detach);

const write = () =>
  writeJson(
    detailsPath(groupName),
    [...known.values()].sort((a, b) => Number(a.productNo) - Number(b.productNo))
  );

for (let at = 0; at < queue.length; at += BATCH) {
  const batch = await scrapeBatch(queue.slice(at, at + BATCH));
  for (const row of batch) if (row) known.set(row.productNo, row);
  processed += batch.length;
  write();
  // Память в строке прогресса не для красоты: именно её рост уронил первую версию,
  // и на длинном прогоне видно сразу, вернулась ли беда.
  const mb = Math.round(process.memoryUsage().rss / 1024 / 1024);
  process.stdout.write(`\r  карточек: ${processed}/${queue.length} · записано · память ${mb} МБ`);
}
process.stdout.write('\n');

const merged = [...known.values()].sort((a, b) => Number(a.productNo) - Number(b.productNo));

const live = merged.filter((row) => !row.gone);
const stat = (predicate) => live.filter(predicate).length;
const percent = (n) => (live.length ? `${Math.round((n / live.length) * 100)}%` : '0%');

console.log(`Карточки «${group.ru}»: ${merged.length} -> data/partsfit/details/${groupName}.json`);
console.log(`  партномер полем: ${stat((r) => r.partNumber)} (${percent(stat((r) => r.partNumber))})`);
console.log(`  VIN донора:      ${stat((r) => r.vin)} (${percent(stat((r) => r.vin))})`);
console.log(`  описание:        ${stat((r) => r.description)} (${percent(stat((r) => r.description))})`);
console.log(`  продано:         ${stat((r) => r.soldOut)}`);
console.log(`  страница снята:  ${merged.filter((r) => r.gone).length}`);
console.log(`  фото на товар:   ${(live.reduce((sum, r) => sum + r.photos.length, 0) / (live.length || 1)).toFixed(1)}`);
if (failed.length) console.log(`  не открылось: ${failed.length} (повтори прогон — снимется только недостающее)`);
