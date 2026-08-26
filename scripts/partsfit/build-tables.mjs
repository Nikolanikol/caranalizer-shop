/**
 * Индекс + карточки + словари -> таблицы, готовые к заливке в Supabase.
 *
 * Запуск: node scripts/partsfit/build-tables.mjs headlights
 *         node scripts/partsfit/build-tables.mjs headlights taillights   (несколько групп)
 *
 * Результат — data/partsfit/tables/*.json, по файлу на таблицу, строки уже в тех полях,
 * что описаны в schema.sql. Пока витрина читает JSON, это просто данные; когда каталог
 * переедет в базу, те же файлы заливаются без переделки.
 *
 * ГЛАВНОЕ ОБ УСТРОЙСТВЕ: деталь и экземпляр — разные сущности.
 *
 * Донор торгует разбором, и одна и та же деталь лежит у него в нескольких экземплярах
 * с разных машин: у левой фары Genesis G80 их шестьдесят три. У каждого своя цена,
 * своё состояние, свои фотографии и свой VIN — но артикул, марка, модель и сторона общие.
 *
 * Поэтому `products` — это страница детали (тип + марка + модель + сторона + позиция +
 * артикул), а `offers` — физические экземпляры на ней. Если сложить их в одну таблицу,
 * получится 7 272 адреса вместо 3 161, из них 4 111 почти одинаковых. Сайту с исчерпанным
 * краулинговым бюджетом (307 755 адресов «обнаружена, не проиндексирована») это ровно
 * то, чего делать нельзя.
 *
 * Что НЕ публикуется (и почему это осознанный отсев, а не потеря):
 *   без партномера      — по нему ищут, без него страница не находится
 *   незнакомый термин   — иначе на витрину уедут иероглифы
 *   негодный год        — «2616» у донора опечатка, а не год выпуска
 *   страница снята      — товара у донора больше нет
 *
 * Прогон детерминирован: на тех же входных файлах даёт байт в байт тот же результат.
 */

import {
  GROUPS,
  detailsPath,
  groupByName,
  indexPath,
  readJson,
  tablePath,
  writeJson,
} from './lib.mjs';
import {
  LINCOLN_MODELS,
  PART_TYPES,
  POSITIONS,
  SIDES,
  TAGS,
  parseTitle,
  resolveBrand,
  resolveModel,
} from './parse.mjs';
import { attributes, condition, crossNumbers } from './describe.mjs';

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Модель указана не у всех — сегменту адреса нужна заглушка, иначе ломается уровень. */
const NO_MODEL_SLUG = 'prochee';

/** Донор ошибается в годе: встречается «2616» и «0». Машин старше 1985 у него нет. */
const YEAR_MIN = 1985;
const YEAR_MAX = new Date().getFullYear() + 2;

const names = process.argv.slice(2);
if (!names.length) {
  console.error(`Укажи группы: node scripts/partsfit/build-tables.mjs headlights\nЕсть: ${Object.keys(GROUPS).join(', ')}`);
  process.exit(1);
}

const brands = new Map();
const models = new Map();
const partTypes = new Map();
const catalog = new Map();
const offers = [];
const images = [];
const skipped = { noOem: 0, unknownTerm: 0, badYear: 0, gone: 0, unparsed: 0, noDetail: 0 };

for (const name of names) {
  const group = groupByName(name);
  const index = readJson(indexPath(name), null);
  const details = new Map((readJson(detailsPath(name), []) || []).map((row) => [row.productNo, row]));

  if (!index) {
    console.error(`Нет индекса группы «${group.ru}». Сначала scrape-index.mjs ${name}`);
    process.exit(1);
  }

  for (const row of index) {
    const detail = details.get(row.productNo);
    if (!detail) {
      skipped.noDetail++;
      continue;
    }
    if (detail.gone) {
      skipped.gone++;
      continue;
    }

    const parsed = parseTitle(detail.titleKr || row.titleKr);
    if (!parsed) {
      skipped.unparsed++;
      continue;
    }

    // Партномер из поля карточки надёжнее хвоста заголовка: в заголовке донор
    // местами обрезает номер, а поле заполняет целиком.
    const oem = (detail.partNumber || parsed.oem).replace(/\s+/g, '').toUpperCase();
    if (!oem) {
      skipped.noOem++;
      continue;
    }
    if (!(parsed.year >= YEAR_MIN && parsed.year <= YEAR_MAX)) {
      skipped.badYear++;
      continue;
    }

    const type = PART_TYPES[parsed.typeKo];
    const brand = resolveBrand(parsed.brandKo);
    const model = resolveModel(parsed.modelKo);

    /*
     * У блоков управления стороны нет: «BMW 5시리즈 2021 ECU 5A149A601». А у «모듈(유닛)»
     * в скобках стоит слово «юнит», а не сторона, и принимать его за левое-правое нельзя.
     * Поэтому сторону читаем только у типов, у которых она вообще бывает.
     */
    const side = type?.hasSide ? SIDES[parsed.sideKo] : null;
    if (!type || !brand.known || !model.known || !brand.en || (type.hasSide && !side)) {
      skipped.unknownTerm++;
      continue;
    }

    // Корейские дилеры продают Lincoln под маркой Ford; покупатель ищет «Линкольн».
    const isLincoln = brand.en === 'Ford' && LINCOLN_MODELS.has(model.en);
    const brandName = isLincoln ? 'Lincoln' : brand.en;
    const brandRu = isLincoln ? 'Линкольн' : brand.ru;
    const brandSlug = slugify(brandName);
    const modelSlug = model.en ? slugify(model.en) : NO_MODEL_SLUG;
    const modelId = model.en ? `${brandSlug}/${modelSlug}` : null;
    const position = type.hasPosition && parsed.positionKo ? POSITIONS[parsed.positionKo] : null;

    brands.set(brandSlug, {
      slug: brandSlug,
      name: brandName,
      name_ru: brandRu,
      name_ko: parsed.brandKo,
      aliases: brand.aliases || [],
    });

    if (modelId) {
      models.set(modelId, {
        id: modelId,
        brand_slug: brandSlug,
        slug: modelSlug,
        name: model.en,
        names_ru: model.ru || [],
        name_ko: parsed.modelKo,
      });
    }

    partTypes.set(type.slug, {
      slug: type.slug,
      name_ru: type.ru,
      plural_ru: type.plural,
      gender: type.gender,
      name_ko: parsed.typeKo,
      keywords: type.keywords,
    });

    // Адрес детали. Уникален внутри марки и модели, а не глобально: тот же партномер
    // встречается у разных машин.
    const slug = [position?.slug, side?.slug, slugify(oem)].filter(Boolean).join('-');
    const productId = `${type.slug}/${brandSlug}/${modelSlug}/${slug}`;

    if (!catalog.has(productId)) {
      catalog.set(productId, {
        id: productId,
        group_key: name,
        part_type: type.slug,
        brand_slug: brandSlug,
        model_id: modelId,
        slug,
        title_ru: [type.ru, side?.ru[type.gender], position?.ru, brandName, model.en]
          .filter(Boolean)
          .join(' '),
        side: side?.full || '',
        position: position?.full || '',
        oem_number: oem,
        cross_numbers: new Set(),
        year_from: parsed.year,
        year_to: parsed.year,
      });
    }

    const product = catalog.get(productId);
    product.year_from = Math.min(product.year_from, parsed.year);
    product.year_to = Math.max(product.year_to, parsed.year);
    for (const number of crossNumbers(detail.description, [oem])) product.cross_numbers.add(number);

    const state = condition(detail.description);
    const attrs = attributes(detail.description, type.attributes);

    offers.push({
      id: row.productNo,
      product_id: productId,
      barcode: detail.barcode || '',
      title_ko: detail.titleKr || row.titleKr,
      year: parsed.year,
      lot: parsed.lot || '',
      // VIN машины, с которой снят именно этот экземпляр. Общим для детали быть не может.
      donor_vin: detail.vin || '',
      price_krw: detail.priceKrw || row.priceKrw,
      condition_grade: state.grade,
      condition_ru: state.ru,
      condition_notes: state.notes,
      condition_ko: state.raw,
      lamp_type: attrs.lampType?.code || '',
      lamp_type_ru: attrs.lampType?.ru || '',
      completeness: attrs.completeness?.code || '',
      completeness_ru: attrs.completeness?.ru || '',
      features: attrs.features.map((feature) => feature.code),
      features_ru: attrs.features.map((feature) => feature.ru),
      pins: attrs.pins || null,
      pins_layout: attrs.pinsLayout || '',
      // Цвет кузова заполняется у зеркал и кузовщины. Код важнее названия: по нему
      // покупатель сверяется с табличкой на своей машине.
      color_code: attrs.color?.code || '',
      color_name: attrs.color?.name || '',
      used: !TAGS[parsed.tag]?.aftermarket,
      aftermarket: Boolean(TAGS[parsed.tag]?.aftermarket),
      sold_out: Boolean(detail.soldOut),
      listed_at: row.listedAt || null,
      first_seen: row.firstSeen || null,
      last_seen: row.lastSeen || null,
      scraped_at: detail.scrapedAt || null,
      source_url: detail.sourceUrl,
    });

    // Фотографии принадлежат экземпляру, а не детали: покупатель смотрит на скол
    // именно того фонаря, который ему приедет.
    detail.photos.forEach((url, i) => images.push({ offer_id: row.productNo, position: i, url, kind: 'photo' }));
    detail.descriptionImages.forEach((url, i) =>
      images.push({ offer_id: row.productNo, position: i, url, kind: 'description' })
    );
  }
}

// Сводка по экземплярам: то, что показывается на странице детали до раскрытия списка.
const RANK = { 'A+': 0, A: 1, B: 2, C: 3 };
const byProduct = new Map();
for (const offer of offers) {
  if (!byProduct.has(offer.product_id)) byProduct.set(offer.product_id, []);
  byProduct.get(offer.product_id).push(offer);
}

const products = [...catalog.values()].map((product) => {
  const own = byProduct.get(product.id) || [];
  const prices = own.map((offer) => offer.price_krw).filter(Boolean);
  const grades = own.map((offer) => offer.condition_grade).filter((grade) => grade in RANK);
  const years = product.year_from === product.year_to ? `${product.year_from}` : `${product.year_from}–${product.year_to}`;

  return {
    id: product.id,
    group_key: product.group_key,
    part_type: product.part_type,
    brand_slug: product.brand_slug,
    model_id: product.model_id,
    slug: product.slug,
    title_ru: `${product.title_ru} (${years})`,
    side: product.side,
    position: product.position,
    oem_number: product.oem_number,
    cross_numbers: [...product.cross_numbers].sort(),
    year_from: product.year_from,
    year_to: product.year_to,
    offers_count: own.length,
    in_stock: own.filter((offer) => !offer.sold_out).length,
    price_krw_min: prices.length ? Math.min(...prices) : null,
    price_krw_max: prices.length ? Math.max(...prices) : null,
    // Лучший грейд среди экземпляров — чтобы на витрине не обещать больше, чем есть,
    // но и не хоронить деталь под худшим экземпляром: их на странице несколько.
    best_grade: grades.length ? grades.sort((a, b) => RANK[a] - RANK[b])[0] : '',
  };
});

/*
 * Совместимость: артикул -> машина. Собирается из products при каждой сборке,
 * своей жизни не имеет и руками не правится.
 *
 * Формулировка обязана оставаться честной: это «донор продавал этот номер под этими
 * машинами», а не «завод подтверждает применимость». Подписывать на витрине —
 * «встречается на этих машинах». Разница не косметическая: за вторую формулировку
 * отвечаем мы, и первый же возврат будет по нашей вине.
 *
 * Поэтому в таблицу идут только те артикулы, за которые можно ручаться. Отсеиваем:
 *
 *   тип детали расходится — донор отнёс один номер к 2+ типам (у него `12659379`
 *     это и блок комфорта, и блок АКПП, и электронный блок). Который верный — неизвестно.
 *   сторона расходится — номер стоит и слева, и справа. Для фары и зеркала это
 *     физически невозможно, значит в данных опечатка.
 *   модель неизвестна — строка «номер подходит к прочему» бесполезна.
 */
const REJECT = { types: 0, sides: 0, noModel: 0 };
const byOem = new Map();

for (const product of products) {
  if (!byOem.has(product.oem_number)) byOem.set(product.oem_number, []);
  byOem.get(product.oem_number).push(product);
}

const fitment = [];
for (const [oem, group] of byOem) {
  const types = new Set(group.map((p) => p.part_type));
  if (types.size > 1) {
    REJECT.types++;
    continue;
  }
  const sides = new Set(group.map((p) => p.side).filter(Boolean));
  if (sides.size > 1) {
    REJECT.sides++;
    continue;
  }

  const rows = new Map();
  for (const product of group) {
    if (!product.model_id) continue;
    const key = `${product.part_type}|${product.model_id}|${product.side}`;
    const seen = rows.get(key);
    if (seen) {
      seen.year_from = Math.min(seen.year_from, product.year_from);
      seen.year_to = Math.max(seen.year_to, product.year_to);
      seen.products += 1;
      seen.offers += product.offers_count;
    } else {
      rows.set(key, {
        oem_number: oem,
        part_type: product.part_type,
        brand_slug: product.brand_slug,
        model_id: product.model_id,
        side: product.side,
        year_from: product.year_from,
        year_to: product.year_to,
        products: 1,
        offers: product.offers_count,
      });
    }
  }
  if (!rows.size) REJECT.noModel++;
  fitment.push(...rows.values());
}

const collator = new Intl.Collator('en', { numeric: true });
const sorted = (list, key) => [...list].sort((a, b) => collator.compare(String(key(a)), String(key(b))));

writeJson(tablePath('brands'), sorted([...brands.values()], (row) => row.slug));
writeJson(tablePath('models'), sorted([...models.values()], (row) => row.id));
writeJson(tablePath('part_types'), sorted([...partTypes.values()], (row) => row.slug));
writeJson(tablePath('products'), sorted(products, (row) => row.id));
writeJson(tablePath('offers'), sorted(offers, (row) => row.id));
writeJson(tablePath('fitment'), sorted(fitment, (row) => `${row.oem_number}/${row.part_type}/${row.model_id}/${row.side}`));
writeJson(tablePath('offer_images'), sorted(images, (row) => `${row.offer_id}/${row.kind}/${String(row.position).padStart(3, '0')}`));

const count = (list, predicate) => list.filter(predicate).length;
const grades = offers.reduce((acc, o) => ({ ...acc, [o.condition_grade || '—']: (acc[o.condition_grade || '—'] || 0) + 1 }), {});
const spread = products.filter((p) => p.offers_count > 1);

console.log(`Таблицы -> data/partsfit/tables/ (группы: ${names.join(', ')})`);
console.log(`  деталей (страниц)  ${products.length}`);
console.log(`  экземпляров        ${offers.length}`);
console.log(`    из них на деталях с несколькими экземплярами: ${spread.reduce((s, p) => s + p.offers_count, 0)} на ${spread.length} страницах`);
console.log(`    максимум на одной детали: ${Math.max(...products.map((p) => p.offers_count))}`);
console.log(`  марок              ${brands.size}`);
console.log(`  моделей            ${models.size}`);
console.log(`  фотографий         ${count(images, (i) => i.kind === 'photo')}`);
console.log(`  кросс-номеров      ${products.reduce((s, p) => s + p.cross_numbers.length, 0)}`);
console.log(`  с VIN донора       ${count(offers, (o) => o.donor_vin)}`);
console.log(`  с типом лампы      ${count(offers, (o) => o.lamp_type)}`);
console.log(`  с числом контактов ${count(offers, (o) => o.pins)} (с раскладкой ${count(offers, (o) => o.pins_layout)})`);
console.log(`  с цветом кузова    ${count(offers, (o) => o.color_code)}`);
console.log(`  состояние:`, grades);
const fitCars = new Set(fitment.map((row) => row.model_id));
const fitMulti = new Map();
for (const row of fitment) fitMulti.set(row.oem_number, (fitMulti.get(row.oem_number) || 0) + 1);
console.log(`  совместимость      ${fitment.length} строк на ${new Set(fitment.map((r) => r.oem_number)).size} артикулов и ${fitCars.size} машин`);
console.log(`    артикулов на 2+ машинах: ${[...fitMulti.values()].filter((n) => n > 1).length}`);
console.log(`    отсеяно артикулов: тип расходится ${REJECT.types}, сторона расходится ${REJECT.sides}, модель неизвестна ${REJECT.noModel}`);
console.log(`  отсеяно при сборке деталей:`, skipped);

const paths = new Set(products.map((p) => p.id));
if (paths.size !== products.length) {
  console.error(`\nАДРЕСА НЕ УНИКАЛЬНЫ: ${products.length - paths.size} совпадений. Публиковать нельзя.`);
  process.exitCode = 1;
}
