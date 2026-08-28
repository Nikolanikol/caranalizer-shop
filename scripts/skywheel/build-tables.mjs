/**
 * Таблицы под Supabase из разобранных объявлений skywheel.kr.
 *
 * Запуск: node scripts/skywheel/build-tables.mjs
 *
 * Читает data/skywheel/wheels.json, пишет data/skywheel/tables/*.json — по файлу
 * на таблицу, поля совпадают с колонками миграции. Файлы выводятся из скрапа целиком
 * и руками не правятся: правка исчезнет на следующем прогоне.
 *
 * Таблиц три, а не семь, как у partsfit, и это соразмерно источнику: там донор торгует
 * разбором, и у одной детали до 64 экземпляров с разной ценой и своими фотографиями —
 * без разделения «деталь/экземпляр» получились бы тысячи почти одинаковых адресов.
 * Здесь объявление и есть товар: один комплект, одна цена, свои фотографии.
 */

import { readJson, wheelsPath, writeJson, DATA } from './lib.mjs';
import { resolve } from 'node:path';

const tablePath = (name) => resolve(DATA, 'tables', `${name}.json`);
const today = new Date().toISOString().slice(0, 10);

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};

/** Слаг только из латиницы и цифр: корейское и кириллица в адрес не идут. */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => TRANSLIT[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Адрес товара. В нём марка, модель и диаметр — то, чем диск на самом деле подбирают,
 * раз партномера у донора нет. Номер объявления в хвосте обязателен: у одного продавца
 * бывает два одинаковых лота на одну машину, и без него слаги столкнутся.
 */
function wheelSlug(row) {
  const parts = [
    slugify(row.brand ?? 'other'),
    row.model ? slugify(row.model) : null,
    row.diameter ? `${row.diameter}` : null,
    row.id,
  ];
  return parts.filter(Boolean).join('-');
}

function buildBrands(rows) {
  const brands = new Map();
  for (const row of rows) {
    const name = row.brand ?? 'Other';
    const slug = slugify(name);
    const brand = brands.get(slug) ?? { slug, name, name_ko: '', count: 0 };
    // Корейское написание берём из поля донора — оно пригодится при следующем скрапе
    // и для сверки, что марка распознана той же, а не соседней.
    if (!brand.name_ko && row.maker) brand.name_ko = row.maker;
    brand.count += 1;
    brands.set(slug, brand);
  }
  // Считали товары только ради порядка: крупные марки первыми. В таблицу счётчик
  // не идёт — он устареет в тот же день, когда продадут первый диск.
  return [...brands.values()]
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    .map((brand) => ({ slug: brand.slug, name: brand.name, name_ko: brand.name_ko }));
}

function buildWheels(rows) {
  return rows.map((row) => ({
    id: row.id,
    slug: wheelSlug(row),
    brand_slug: slugify(row.brand ?? 'Other'),
    model: row.model ?? '',
    diameter: row.diameter,

    // Корейский заголовок и описание донора хранятся как есть и на витрину не идут.
    // Описание — объявление чужой розницы: реклама точек продавца, скидка за упоминание
    // доски, цена за наличные против карты. Публикуемое описание собирается из полей
    // на границе показа, как и заголовок. Здесь это исходник для закупщика.
    title_ko: row.title,
    description_ko: row.descriptionKo,

    condition: row.condition,                    // 'new' | 'used'
    grade: row.grade?.code ?? '',                // 'good' | 'fair' | 'repair'
    wheel_kind: row.wheelKind?.code ?? '',       // 'forged' | 'restored' | 'oem' | 'diamond-cut'
    quantity: row.quantity ?? '',                // 'set' | 'single' | ''
    with_tyres: row.withTyres,

    // Цена продажи с налогом, только в вонах. Рубли и доллары считает
    // lib/shop/pricing.ts по курсу ЦБ. null — «по запросу», см. classify.mjs.
    price_krw: row.priceKrw,
    // Продавец назвал НДС отдельно, и 10% уже вошли в price_krw. Флаг нужен,
    // чтобы при закупке было видно, почему наша цена выше объявления.
    vat_included: row.vatIncluded,

    // Параметры подбора. Донор их почти не заполняет (PCD у 8 объявлений из 120),
    // поэтому все они необязательные, и фильтр на них строить нельзя.
    width_j: row.specs.widthsJ,
    pcd: row.specs.pcd,
    offset_et: row.specs.offsetsEt,
    bore_cb: row.specs.boreCb,
    tyre: row.specs.tyre ?? '',

    certified: row.certified,
    sold: row.sold,
    region: row.region ?? '',
    seller_ref: row.sellerRef ?? '',
    hits: row.hits,
    posted: row.posted ?? '',
    source_url: row.sourceUrl,
    scraped_at: today,
  }));
}

function buildImages(rows) {
  return rows.flatMap((row) =>
    row.images.map((url, position) => ({ wheel_id: row.id, position, url })),
  );
}

function main() {
  const rows = readJson(wheelsPath());
  if (!rows) throw new Error('Нет data/skywheel/wheels.json — сначала npm run skywheel:classify');

  const brands = buildBrands(rows);
  const wheels = buildWheels(rows);
  const images = buildImages(rows);

  const slugs = new Set(wheels.map((w) => w.slug));
  if (slugs.size !== wheels.length) throw new Error('Слаги столкнулись — адреса не уникальны');

  writeJson(tablePath('skywheel_brands'), brands);
  writeJson(tablePath('skywheel_wheels'), wheels);
  writeJson(tablePath('skywheel_wheel_images'), images);

  console.log(`skywheel_brands        ${brands.length}`);
  console.log(`skywheel_wheels        ${wheels.length}  (в продаже ${wheels.filter((w) => !w.sold).length})`);
  console.log(`skywheel_wheel_images  ${images.length}`);
  console.log(`\nТаблицы в ${resolve(DATA, 'tables')}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
