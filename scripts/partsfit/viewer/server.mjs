/**
 * Локальный просмотр собранных таблиц. Запуск: npm run partsfit:viewer
 *
 * Это инструмент разработчика, а не часть сайта: он читает data/partsfit/tables/*.json
 * и отдаёт их через маленький HTTP-слой. Наружу не выставляется, слушает localhost.
 *
 * Почему свой сервер, а не страница с данными внутри: таблицы весят 83 МБ, и вложить их
 * в HTML нельзя. Фильтрация и разбивка по страницам идут здесь, в браузер уезжает
 * только видимая страница.
 *
 * Запросы к базе повторяют будущие запросы витрины — по типу детали, марке, модели,
 * артикулу. Если что-то здесь неудобно выражается, значит и схема неудобна: это первая
 * проверка модели на живых данных, до всякого Supabase.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tablePath } from '../lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4123;
const PAGE_SIZE = 24;

function load(name) {
  const path = tablePath(name);
  if (!existsSync(path)) {
    console.error(`Нет таблицы ${name}.json. Сначала: npm run partsfit:tables -- <группа>`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

console.log('Читаю таблицы…');
const products = load('products');
const offers = load('offers');
const images = load('offer_images');
const brands = new Map(load('brands').map((row) => [row.slug, row]));
const models = new Map(load('models').map((row) => [row.id, row]));
const partTypes = new Map(load('part_types').map((row) => [row.slug, row]));

// Индексы строим один раз при старте: с 30 тысячами экземпляров и 216 тысячами фото
// перебор массива на каждый запрос заметен глазом.
const offersByProduct = new Map();
for (const offer of offers) {
  if (!offersByProduct.has(offer.product_id)) offersByProduct.set(offer.product_id, []);
  offersByProduct.get(offer.product_id).push(offer);
}
const photosByOffer = new Map();
for (const image of images) {
  if (image.kind !== 'photo') continue;
  if (!photosByOffer.has(image.offer_id)) photosByOffer.set(image.offer_id, []);
  photosByOffer.get(image.offer_id).push(image.url);
}

console.log(`  деталей ${products.length}, экземпляров ${offers.length}, фото ${photosByOffer.size} галерей`);

const nameOf = (product) => ({
  brand: brands.get(product.brand_slug)?.name || product.brand_slug,
  brandRu: brands.get(product.brand_slug)?.name_ru || '',
  model: product.model_id ? models.get(product.model_id)?.name || '' : '',
  type: partTypes.get(product.part_type)?.name_ru || product.part_type,
});

/** Поиск идёт по тому же, по чему ищет покупатель: артикул, кросс-номер, марка, модель. */
function matches(product, query) {
  if (!query) return true;
  const q = query.toLowerCase().replace(/\s+/g, '');
  const names = nameOf(product);
  const haystack = [
    product.oem_number,
    ...product.cross_numbers,
    names.brand,
    names.brandRu,
    names.model,
    product.title_ru,
  ]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, '');
  return haystack.includes(q);
}

function listProducts(params) {
  const type = params.get('type') || '';
  const brand = params.get('brand') || '';
  const query = params.get('q') || '';
  const sort = params.get('sort') || 'offers';
  const page = Math.max(1, Number(params.get('page')) || 1);

  let found = products;
  if (type) found = found.filter((p) => p.part_type === type);
  if (brand) found = found.filter((p) => p.brand_slug === brand);
  if (query) found = found.filter((p) => matches(p, query));

  const order = {
    offers: (a, b) => b.offers_count - a.offers_count,
    price: (a, b) => (a.price_krw_min || 0) - (b.price_krw_min || 0),
    price_desc: (a, b) => (b.price_krw_min || 0) - (a.price_krw_min || 0),
    year: (a, b) => (b.year_to || 0) - (a.year_to || 0),
  };
  found = [...found].sort(order[sort] || order.offers);

  const total = found.length;
  const slice = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items: slice.map((product) => {
      const own = offersByProduct.get(product.id) || [];
      return {
        ...product,
        ...nameOf(product),
        // Обложка — первое фото первого экземпляра: у детали своих фотографий нет,
        // они принадлежат конкретной физической детали.
        cover: photosByOffer.get(own[0]?.id)?.[0] || '',
        withVin: own.filter((offer) => offer.donor_vin).length,
      };
    }),
    // Счётчики считаем по тому же отбору, но без учёта самого фильтра по типу —
    // иначе, выбрав тип, нельзя увидеть, сколько есть в остальных.
    facets: facets(type, brand, query),
  };
}

function facets(type, brand, query) {
  const base = products.filter((p) => (!query || matches(p, query)));
  const byType = new Map();
  const byBrand = new Map();

  for (const product of base) {
    if (!brand || product.brand_slug === brand) {
      byType.set(product.part_type, (byType.get(product.part_type) || 0) + 1);
    }
    if (!type || product.part_type === type) {
      byBrand.set(product.brand_slug, (byBrand.get(product.brand_slug) || 0) + 1);
    }
  }

  const rows = (map, label) =>
    [...map.entries()]
      .map(([slug, count]) => ({ slug, count, label: label(slug) }))
      .sort((a, b) => b.count - a.count);

  return {
    types: rows(byType, (slug) => partTypes.get(slug)?.plural_ru || slug),
    brands: rows(byBrand, (slug) => brands.get(slug)?.name || slug),
  };
}

function productDetail(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return null;
  const own = (offersByProduct.get(id) || []).sort((a, b) => a.price_krw - b.price_krw);
  return {
    ...product,
    ...nameOf(product),
    offers: own.map((offer) => ({ ...offer, photos: photosByOffer.get(offer.id) || [] })),
  };
}

function stats() {
  const grades = {};
  for (const offer of offers) grades[offer.condition_grade || '—'] = (grades[offer.condition_grade || '—'] || 0) + 1;
  const filled = (field) => offers.filter((offer) => offer[field]).length;
  return {
    products: products.length,
    offers: offers.length,
    brands: brands.size,
    models: models.size,
    photos: [...photosByOffer.values()].reduce((sum, list) => sum + list.length, 0),
    grades,
    vin: filled('donor_vin'),
    description: filled('condition_ko'),
    pins: filled('pins'),
    color: filled('color_code'),
    lampType: filled('lamp_type'),
    crossNumbers: products.reduce((sum, p) => sum + p.cross_numbers.length, 0),
  };
}

const json = (response, body) => {
  response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};

createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/products') return json(response, listProducts(url.searchParams));
  if (url.pathname === '/api/stats') return json(response, stats());
  if (url.pathname.startsWith('/api/product/')) {
    const found = productDetail(decodeURIComponent(url.pathname.slice('/api/product/'.length)));
    if (!found) {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      return response.end('{"error":"не найдено"}');
    }
    return json(response, found);
  }

  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(readFileSync(resolve(HERE, 'index.html')));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Просмотр: http://localhost:${PORT}`);
});
