/**
 * Слой доступа к каталогу. Единственное место, откуда приложение берёт товары.
 *
 * Источник — Supabase, таблицы `partsfit_*` (собираются скрапером, см.
 * `scripts/partsfit/README.md`). Раньше здесь читался `data/catalog.json` на 2.5 МБ;
 * файл писался с расчётом на этот переезд, поэтому все функции и были async —
 * поменялись только они, компоненты не тронуты.
 *
 * ВАЖНО: файл серверный. В клиентские компоненты не импортировать — нужны только пути,
 * берите их из `urls.ts`.
 */

import 'server-only';
import { createServerClient } from '@/lib/supabase';
import type { AutoPart, Offer, PartCategory } from '@/types/part';

export type { AutoPart };

export const ITEMS_PER_PAGE = 15;

/**
 * PostgREST отдаёт не больше тысячи строк за запрос, и молча: запрос на 18 тысяч
 * товаров вернёт первую тысячу без единой ошибки. Всё, что может выйти за предел,
 * обязано читаться через эту функцию — иначе карта сайта окажется вчетверо короче,
 * чем каталог, и никто этого не заметит.
 */
const PAGE = 1000;

// Клиент не типизирован схемой базы, поэтому `select()` возвращает данные как unknown —
// приводим их на границе, один раз здесь, а не в каждом вызывающем месте.
type PageResult = { data: unknown; error: { message: string } | null };

async function selectAll<T>(build: (from: number, to: number) => PromiseLike<PageResult>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(`Каталог: ${error.message}`);
    const chunk = (data ?? []) as T[];
    if (!chunk.length) break;
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
  }
  return rows;
}

/**
 * Русские тексты категорий — маркетинговая копия, а не данные, поэтому живут в коде.
 * Реестр единственный: от него зависят карта сайта, пилюли в шапке и все посадочные.
 */
export const CATEGORIES: Record<PartCategory, { title: string; plural: string; description: string }> = {
  'perednie-fary': {
    title: 'Передняя фара',
    plural: 'Передние фары',
    description:
      'Оригинальные передние фары б/у с авторазборок Южной Кореи. Поиск по OEM-артикулу, марке и модели, фото каждой детали, доставка по России.',
  },
  'zadnie-fonari': {
    title: 'Задний фонарь',
    plural: 'Задние фонари',
    description:
      'Оригинальные задние фонари б/у с авторазборок Южной Кореи. Поиск по OEM-артикулу, марке и модели, фото каждой детали, доставка по России.',
  },
  'protivotumannye-fary': {
    title: 'Противотуманная фара',
    plural: 'Противотуманные фары',
    description:
      'Оригинальные противотуманные фары б/у с авторазборок Южной Кореи. Поиск по OEM-артикулу, марке и модели, фото каждой детали, доставка по России.',
  },
  'bokovye-zerkala': {
    title: 'Боковое зеркало',
    plural: 'Боковые зеркала',
    description:
      'Боковые зеркала б/у с авторазборок Южной Кореи: код цвета кузова, число контактов, камера и датчик слепых зон. Поиск по OEM-артикулу.',
  },
  'blok-komforta-bcm': {
    title: 'Блок комфорта (BCM)',
    plural: 'Блоки комфорта BCM',
    description:
      'Блоки кузовной электроники BCM и ETACS б/у из Кореи. Поиск по OEM-артикулу, VIN донорской машины у большинства позиций.',
  },
  'blok-upravleniya-dvigatelem': {
    title: 'Блок управления двигателем (ECU)',
    plural: 'Блоки управления двигателем',
    description:
      'Блоки управления двигателем ECU б/у из Кореи. Артикул у каждой позиции, VIN донорской машины, фотографии маркировки.',
  },
  'blok-upravleniya-akpp': {
    title: 'Блок управления АКПП (TCU)',
    plural: 'Блоки управления АКПП',
    description:
      'Блоки управления автоматической коробкой TCU б/у из Кореи. Поиск по OEM-артикулу, VIN донорской машины.',
  },
  'blok-abs': {
    title: 'Блок ABS',
    plural: 'Блоки ABS',
    description:
      'Блоки ABS и гидроблоки б/у с авторазборок Южной Кореи. Поиск по OEM-артикулу, фотографии маркировки, VIN донора.',
  },
  'elektronnye-bloki': {
    title: 'Электронный блок',
    plural: 'Электронные блоки',
    description:
      'Электронные блоки и модули б/у из Кореи: двери, сиденья, освещение. Поиск по OEM-артикулу, VIN донорской машины.',
  },
  'nakladka-zadney-paneli': {
    title: 'Накладка задней панели',
    plural: 'Накладки задней панели',
    description:
      'Накладки задней панели и планки между фонарями б/у из Кореи. Код цвета кузова, поиск по OEM-артикулу.',
  },
  'obshivka-dveri-bagazhnika': {
    title: 'Обшивка двери багажника',
    plural: 'Обшивки двери багажника',
    description:
      'Обшивки двери багажника б/у с авторазборок Южной Кореи. Поиск по OEM-артикулу, фото каждой детали.',
  },
};

export function isCategory(value: string): value is PartCategory {
  return value in CATEGORIES;
}

/**
 * Вес, габариты и сроки: у донора этих полей не существует вовсе.
 * Это оценка, и она в одном месте, потому что от веса считается доставка и порог
 * «море выгоднее авиа» на `dostavka-i-oplata`.
 */
const PART_DEFAULTS: Record<PartCategory, { weightKg: number; dimensionsCm: [number, number, number] }> = {
  'perednie-fary': { weightKg: 5, dimensionsCm: [70, 45, 35] },
  'zadnie-fonari': { weightKg: 2.1, dimensionsCm: [50, 26, 20] },
  'protivotumannye-fary': { weightKg: 1, dimensionsCm: [25, 20, 15] },
  'bokovye-zerkala': { weightKg: 1.8, dimensionsCm: [35, 25, 20] },
  'blok-komforta-bcm': { weightKg: 0.8, dimensionsCm: [25, 20, 10] },
  'blok-upravleniya-dvigatelem': { weightKg: 1.2, dimensionsCm: [25, 20, 10] },
  'blok-upravleniya-akpp': { weightKg: 0.9, dimensionsCm: [25, 20, 10] },
  'blok-abs': { weightKg: 2.5, dimensionsCm: [30, 25, 20] },
  'elektronnye-bloki': { weightKg: 0.7, dimensionsCm: [25, 20, 10] },
  'nakladka-zadney-paneli': { weightKg: 2.5, dimensionsCm: [120, 30, 15] },
  'obshivka-dveri-bagazhnika': { weightKg: 3, dimensionsCm: [110, 70, 20] },
};

const DELIVERY_DAYS = '7-12 дней';

export type SortBy = 'popular' | 'newest' | 'price_asc' | 'price_desc';

export interface CatalogQuery {
  category?: PartCategory;
  brand?: string;
  model?: string;
  /**
   * Фильтр посадочных страниц. Отбираем по сегменту адреса, а не по имени: у части
   * товаров модель не указана, их сегмент — `prochee`, и фильтр по имени их бы пропустил.
   */
  brandSlug?: string;
  modelSlug?: string;
  side?: string;
  position?: string;
  search?: string;
  sort?: SortBy;
  page?: number;
}

export interface CatalogPage {
  items: AutoPart[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Facet {
  name: string;
  /** Сегмент адреса — по нему строится ссылка на посадочную страницу. */
  slug: string;
  count: number;
}

/** Поля товара плюс имена марки и модели: PostgREST отдаёт их вложенными объектами. */
const PRODUCT_FIELDS =
  'id, slug, part_type, brand_slug, model_id, title_ru, oem_number, cross_numbers, ' +
  'year_from, year_to, side, position, offers_count, in_stock, price_krw_min, price_krw_max, best_grade, ' +
  'partsfit_brands(name, name_ru), partsfit_models(slug, name)';

interface ProductRow {
  id: string;
  slug: string;
  part_type: string;
  brand_slug: string;
  model_id: string | null;
  title_ru: string;
  oem_number: string;
  cross_numbers: string[];
  year_from: number | null;
  year_to: number | null;
  side: string;
  position: string;
  offers_count: number;
  in_stock: number;
  price_krw_min: number | null;
  price_krw_max: number | null;
  best_grade: string;
  partsfit_brands?: { name: string; name_ru: string } | null;
  partsfit_models?: { slug: string; name: string } | null;
}

const NO_MODEL_SLUG = 'prochee';

function toPart(row: ProductRow): AutoPart {
  const category = row.part_type as PartCategory;
  const defaults = PART_DEFAULTS[category] ?? { weightKg: 2, dimensionsCm: [40, 30, 20] as [number, number, number] };
  const yearFrom = row.year_from ?? 0;
  const yearTo = row.year_to ?? yearFrom;

  return {
    id: row.id,
    slug: row.slug,
    brandSlug: row.brand_slug,
    modelSlug: row.partsfit_models?.slug ?? NO_MODEL_SLUG,
    category,
    categoryRu: CATEGORIES[category]?.title ?? '',
    titleRu: row.title_ru,
    oemNumber: row.oem_number,
    crossNumbers: row.cross_numbers ?? [],
    brand: row.partsfit_brands?.name ?? row.brand_slug,
    brandRu: row.partsfit_brands?.name_ru ?? '',
    model: row.partsfit_models?.name ?? '',
    yearFrom,
    yearTo,
    years: yearFrom === yearTo ? String(yearTo) : `${yearFrom}–${yearTo}`,
    year: yearTo,
    side: row.side,
    position: row.position,
    priceKrw: row.price_krw_min ?? 0,
    priceKrwMax: row.price_krw_max ?? row.price_krw_min ?? 0,
    offersCount: row.offers_count,
    inStock: row.in_stock,
    conditionGrade: row.best_grade,
    conditionNotes: [],
    images: [],
    connectorPins: '',
    weightKg: defaults.weightKg,
    dimensionsCm: defaults.dimensionsCm,
    deliveryDays: DELIVERY_DAYS,
    stock: row.in_stock,
    used: true,
    aftermarket: false,
  };
}

interface OfferRow {
  id: string;
  product_id: string;
  price_krw: number;
  year: number | null;
  condition_grade: string;
  condition_ru: string;
  condition_notes: string[];
  condition_ko: string;
  donor_vin: string;
  lamp_type_ru: string;
  completeness_ru: string;
  features_ru: string[];
  pins: number | null;
  pins_layout: string;
  color_code: string;
  color_name: string;
  used: boolean;
  aftermarket: boolean;
  sold_out: boolean;
  listed_at: string | null;
  source_url: string;
  partsfit_offer_images?: { url: string; position: number; kind: string }[];
}

function toOffer(row: OfferRow): Offer {
  const images = (row.partsfit_offer_images ?? [])
    .filter((image) => image.kind === 'photo')
    .sort((a, b) => a.position - b.position)
    .map((image) => image.url);

  return {
    id: row.id,
    productId: row.product_id,
    priceKrw: row.price_krw,
    year: row.year ?? 0,
    conditionGrade: row.condition_grade,
    conditionRu: row.condition_ru,
    conditionNotes: row.condition_notes ?? [],
    conditionKo: row.condition_ko,
    donorVin: row.donor_vin,
    lampTypeRu: row.lamp_type_ru,
    completenessRu: row.completeness_ru,
    featuresRu: row.features_ru ?? [],
    pins: row.pins,
    pinsLayout: row.pins_layout,
    colorCode: row.color_code,
    colorName: row.color_name,
    used: row.used,
    aftermarket: row.aftermarket,
    soldOut: row.sold_out,
    listedAt: row.listed_at ?? '',
    sourceUrl: row.source_url,
    images,
  };
}

/**
 * Обложки для списка товаров: первое фото самого дешёвого экземпляра каждой детали.
 * Отдельным запросом, потому что тянуть все фотографии всех экземпляров ради одной
 * картинки на карточку — это десятки тысяч строк на страницу списка.
 */
async function attachCovers(parts: AutoPart[]): Promise<AutoPart[]> {
  if (!parts.length) return parts;
  const db = createServerClient();

  const { data, error } = await db
    .from('partsfit_offers')
    .select('id, product_id, price_krw, condition_notes, pins, pins_layout, partsfit_offer_images(url, position, kind)')
    .in('product_id', parts.map((part) => part.id))
    .order('price_krw');
  if (error) throw new Error(`Каталог, обложки: ${error.message}`);

  const cover = new Map<string, (typeof data)[number]>();
  for (const offer of data ?? []) if (!cover.has(offer.product_id)) cover.set(offer.product_id, offer);

  return parts.map((part) => {
    const own = cover.get(part.id);
    if (!own) return part;
    const images = (own.partsfit_offer_images ?? [])
      .filter((image) => image.kind === 'photo')
      .sort((a, b) => a.position - b.position)
      .map((image) => image.url);
    return {
      ...part,
      images,
      conditionNotes: own.condition_notes ?? [],
      connectorPins: own.pins_layout || (own.pins ? String(own.pins) : ''),
    };
  });
}

/** Все детали. Только для карты сайта и `generateStaticParams` — на страницах не звать. */
export async function getAllParts(): Promise<AutoPart[]> {
  const db = createServerClient();
  const rows = await selectAll<ProductRow>((from, to) =>
    db.from('partsfit_products').select(PRODUCT_FIELDS).order('id').range(from, to),
  );
  return rows.map(toPart);
}

/**
 * Детали, которым положена страница в индексе.
 *
 * Порог — два экземпляра. Карточка, за которой стоит один экземпляр, живёт до первой
 * продажи: товар ушёл — страница умерла. Таких 12 821 из 18 655, и класть их в карту
 * сайта значит заранее наплодить 404 там, где уже 307 755 адресов висят
 * непроиндексированными. Страница у них есть (иначе товар не положить в корзину),
 * но `noindex` и вне карты сайта.
 */
export async function getIndexableParts(): Promise<AutoPart[]> {
  const db = createServerClient();
  const rows = await selectAll<ProductRow>((from, to) =>
    db.from('partsfit_products').select(PRODUCT_FIELDS).gte('offers_count', 2).order('id').range(from, to),
  );
  return rows.map(toPart);
}

/** Посадочные страницы: категория, марка, модель. Их в индекс пускаем целиком. */
export async function getLandingPaths(): Promise<{ brands: Set<string>; models: Set<string> }> {
  const db = createServerClient();

  // Через selectAll, а не одним запросом: моделей 1 860, и PostgREST молча отдал бы
  // первую тысячу — карта сайта недосчиталась бы 860 посадочных страниц, ничем
  // себя не выдав. Ровно это и случилось на первой сборке.
  const [brandRows, modelRows] = await Promise.all([
    selectAll<{ part_type: string; brand_slug: string }>((from, to) =>
      db.from('partsfit_brand_counts').select('part_type, brand_slug').order('part_type').range(from, to),
    ),
    selectAll<{ part_type: string; brand_slug: string; model_slug: string }>((from, to) =>
      db
        .from('partsfit_model_counts')
        .select('part_type, brand_slug, model_slug')
        .order('part_type')
        .range(from, to),
    ),
  ]);

  const brands = new Set(brandRows.map((row) => `${row.part_type}/${row.brand_slug}`));
  const models = new Set(modelRows.map((row) => `${row.part_type}/${row.brand_slug}/${row.model_slug}`));
  return { brands, models };
}

/** Модели с наибольшим числом позиций — для навигационных блоков на главной и в каталоге. */
export async function getTopModels(
  limit = 12,
): Promise<(Facet & { category: PartCategory; brandSlug: string; brand: string })[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from('partsfit_model_counts')
    .select('part_type, brand_slug, brand_name, model_slug, model_name, products')
    .order('products', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Каталог, топ моделей: ${error.message}`);

  return ((data ?? []) as unknown as {
    part_type: string; brand_slug: string; brand_name: string;
    model_slug: string; model_name: string; products: number;
  }[]).map((row) => ({
    name: `${row.brand_name} ${row.model_name}`,
    slug: row.model_slug,
    brandSlug: row.brand_slug,
    brand: row.brand_name,
    category: row.part_type as PartCategory,
    count: row.products,
  }));
}

/**
 * Товар по полному адресу вместе с экземплярами. Искать по одному только слагу нельзя:
 * он уникален внутри своей марки и модели, а не глобально.
 */
export async function getPartByPath(path: {
  category: string;
  brand: string;
  model: string;
  slug: string;
}): Promise<AutoPart | null> {
  const db = createServerClient();
  const id = `${path.category}/${path.brand}/${path.model}/${path.slug}`;

  const { data, error } = await db.from('partsfit_products').select(PRODUCT_FIELDS).eq('id', id).maybeSingle();
  if (error) throw new Error(`Каталог, товар: ${error.message}`);
  if (!data) return null;

  const part = toPart(data as unknown as ProductRow);

  const { data: offers, error: offersError } = await db
    .from('partsfit_offers')
    .select(
      'id, product_id, price_krw, year, condition_grade, condition_ru, condition_notes, condition_ko, ' +
        'donor_vin, lamp_type_ru, completeness_ru, features_ru, pins, pins_layout, color_code, color_name, ' +
        'used, aftermarket, sold_out, listed_at, source_url, partsfit_offer_images(url, position, kind)',
    )
    .eq('product_id', id)
    .order('price_krw');
  if (offersError) throw new Error(`Каталог, экземпляры: ${offersError.message}`);

  const list = (offers ?? []).map((row) => toOffer(row as unknown as OfferRow));
  const first = list[0];

  return {
    ...part,
    offers: list,
    // Сводка по представительному экземпляру — самому дешёвому.
    images: first?.images ?? [],
    conditionNotes: first?.conditionNotes ?? [],
    connectorPins: first?.pinsLayout || (first?.pins ? String(first.pins) : ''),
    used: first?.used ?? true,
    aftermarket: first?.aftermarket ?? false,
  };
}

/** Марка по сегменту адреса. Отдаёт каноническое имя — по нему дальше фильтруется каталог. */
export async function getBrandBySlug(category: PartCategory, brandSlug: string): Promise<string | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from('partsfit_products')
    .select('partsfit_brands(name)')
    .eq('part_type', category)
    .eq('brand_slug', brandSlug)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Каталог, марка: ${error.message}`);
  return (data as unknown as ProductRow | null)?.partsfit_brands?.name ?? null;
}

/**
 * Модель по сегменту адреса. Возвращает имя, а не сам сегмент: у части товаров модель
 * не указана, они живут под `prochee`, и там каноническое имя — пустая строка.
 */
export async function getModelBySlug(
  category: PartCategory,
  brandSlug: string,
  modelSlug: string,
): Promise<{ name: string } | null> {
  const db = createServerClient();
  const query = db
    .from('partsfit_products')
    .select('partsfit_models(name)')
    .eq('part_type', category)
    .eq('brand_slug', brandSlug);

  const { data, error } = await (modelSlug === NO_MODEL_SLUG
    ? query.is('model_id', null)
    : query.eq('model_id', `${brandSlug}/${modelSlug}`)
  )
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Каталог, модель: ${error.message}`);
  if (!data) return null;
  return { name: (data as unknown as ProductRow).partsfit_models?.name ?? '' };
}

export async function findParts(query: CatalogQuery = {}): Promise<CatalogPage> {
  const db = createServerClient();

  /*
   * Фильтр из боковой панели приходит именем марки и модели, а не сегментом адреса:
   * на витрине категория не выбрана, и слаг там взять неоткуда. Имя лежит в связанной
   * таблице, поэтому связь помечается `!inner` — без этого PostgREST вернёт все строки,
   * молча проигнорировав условие. Ровно так фильтр по марке и сломался при переезде
   * на базу: `?brand=BMW` отдавал весь каталог.
   */
  const fields =
    query.brand || query.model
      ? PRODUCT_FIELDS.replace('partsfit_brands(', 'partsfit_brands!inner(').replace(
          'partsfit_models(',
          query.model ? 'partsfit_models!inner(' : 'partsfit_models(',
        )
      : PRODUCT_FIELDS;

  let request = db.from('partsfit_products').select(fields, { count: 'exact' });

  if (query.category) request = request.eq('part_type', query.category);
  if (query.brandSlug) request = request.eq('brand_slug', query.brandSlug);
  if (query.brand) request = request.eq('partsfit_brands.name', query.brand);
  if (query.model) request = request.eq('partsfit_models.name', query.model);
  if (query.modelSlug) {
    request =
      query.modelSlug === NO_MODEL_SLUG
        ? request.is('model_id', null)
        : request.eq('model_id', `${query.brandSlug ?? ''}/${query.modelSlug}`);
  }
  if (query.side) request = request.eq('side', query.side);
  if (query.position) request = request.eq('position', query.position);

  // Артикул ищут и с разделителями, и без них: «92401-L1000» == «92401L1000».
  const term = query.search?.trim();
  if (term) {
    const bare = term.replace(/[^0-9a-zA-Zа-яА-Я]/g, '');
    const like = `%${term}%`;
    request = request.or(
      [`oem_number.ilike.${like}`, `oem_number.ilike.%${bare}%`, `title_ru.ilike.${like}`].join(','),
    );
  }

  if (query.sort === 'price_asc') request = request.order('price_krw_min', { nullsFirst: false });
  else if (query.sort === 'price_desc') request = request.order('price_krw_min', { ascending: false, nullsFirst: false });
  else if (query.sort === 'newest') request = request.order('year_to', { ascending: false, nullsFirst: false });
  // «Популярное» — там, где выбор больше: у детали с двадцатью экземплярами покупатель
  // сравнивает состояние и цену, а не берёт единственное, что осталось.
  else request = request.order('offers_count', { ascending: false });

  const page = Math.max(1, query.page ?? 1);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const { data, error, count } = await request.range(start, start + ITEMS_PER_PAGE - 1);
  if (error) throw new Error(`Каталог, поиск: ${error.message}`);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const items = await attachCovers(((data ?? []) as unknown as ProductRow[]).map(toPart));

  return { items, total, page: Math.min(page, totalPages), totalPages };
}

/** Марки с количеством товаров — для фильтра и для посадочных. */
export async function getBrands(category?: PartCategory): Promise<Facet[]> {
  const db = createServerClient();
  const rows = await selectAll<{ brand_slug: string; brand_name: string; products: number }>((from, to) => {
    let request = db.from('partsfit_brand_counts').select('brand_slug, brand_name, products').order('brand_slug');
    if (category) request = request.eq('part_type', category);
    return request.range(from, to);
  });

  // Без категории одна марка приходит несколькими строками — по одной на тип детали.
  const counts = new Map<string, Facet>();
  for (const row of rows) {
    const entry = counts.get(row.brand_slug) ?? { name: row.brand_name, slug: row.brand_slug, count: 0 };
    entry.count += row.products;
    counts.set(row.brand_slug, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Модели выбранной марки — второй уровень. Товары без модели сюда не попадают:
 * сегмент `prochee` не посадочная страница, вести на него из фильтра нечего.
 */
export async function getModels(brand: string, category?: PartCategory): Promise<Facet[]> {
  const db = createServerClient();
  let request = db.from('partsfit_model_counts').select('model_slug, model_name, products').eq('brand_name', brand);
  if (category) request = request.eq('part_type', category);

  const { data, error } = await request;
  if (error) throw new Error(`Каталог, модели: ${error.message}`);

  const counts = new Map<string, Facet>();
  for (const row of (data ?? []) as unknown as { model_slug: string; model_name: string; products: number }[]) {
    const entry = counts.get(row.model_slug) ?? { name: row.model_name, slug: row.model_slug, count: 0 };
    entry.count += row.products;
    counts.set(row.model_slug, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Одна машина, на которой встречается артикул. */
export interface FitmentEntry {
  category: PartCategory;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  side: string;
  yearFrom: number;
  yearTo: number;
  /** Сколько наших страниц и экземпляров стоит за строкой — мера уверенности. */
  products: number;
  offers: number;
}

/**
 * На каких машинах встречается артикул.
 *
 * Формулировка не случайна и менять её нельзя: это «донор продавал этот номер под этими
 * машинами», а не «завод подтверждает применимость». Таблица `partsfit_fitment` уже
 * отсеяла спорное — номера, у которых у донора расходится тип детали или сторона.
 */
export async function getFitment(oemNumber: string): Promise<FitmentEntry[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from('partsfit_fitment')
    .select('part_type, brand_slug, model_id, side, year_from, year_to, products, offers, partsfit_brands(name), partsfit_models(slug, name)')
    .eq('oem_number', oemNumber)
    .order('offers', { ascending: false });
  if (error) throw new Error(`Совместимость: ${error.message}`);

  return ((data ?? []) as unknown as (ProductRow & { products: number; offers: number })[]).map((row) => ({
    category: row.part_type as PartCategory,
    brand: row.partsfit_brands?.name ?? row.brand_slug,
    brandSlug: row.brand_slug,
    model: row.partsfit_models?.name ?? '',
    modelSlug: row.partsfit_models?.slug ?? NO_MODEL_SLUG,
    side: row.side,
    yearFrom: row.year_from ?? 0,
    yearTo: row.year_to ?? 0,
    products: row.products,
    offers: row.offers,
  }));
}

/**
 * Товары с этим артикулом — то, что можно купить прямо сейчас.
 *
 * Ищем и по основному номеру, и по кросс-номерам: покупатель приходит с тем номером,
 * который прочитал на своей детали, а он может оказаться номером аналога.
 */
export async function getPartsByOem(oemNumber: string): Promise<AutoPart[]> {
  const db = createServerClient();
  const [direct, cross] = await Promise.all([
    db.from('partsfit_products').select(PRODUCT_FIELDS).eq('oem_number', oemNumber).limit(60),
    db.from('partsfit_products').select(PRODUCT_FIELDS).contains('cross_numbers', [oemNumber]).limit(20),
  ]);
  if (direct.error) throw new Error(`Товары по артикулу: ${direct.error.message}`);

  const seen = new Set<string>();
  const rows = [...((direct.data ?? []) as unknown as ProductRow[]), ...((cross.data ?? []) as unknown as ProductRow[])]
    .filter((row) => (seen.has(row.id) ? false : seen.add(row.id)));

  return attachCovers(rows.map(toPart));
}

/**
 * Похожие товары для карточки: та же марка и модель, другой товар.
 * Сравниваем по id, а не по слагу: слаг уникален только внутри марки и модели.
 */
export async function getSimilarParts(part: AutoPart, limit = 4): Promise<AutoPart[]> {
  const db = createServerClient();

  const sameModel = part.modelSlug !== NO_MODEL_SLUG ? `${part.brandSlug}/${part.modelSlug}` : null;
  if (sameModel) {
    const { data } = await db
      .from('partsfit_products')
      .select(PRODUCT_FIELDS)
      .eq('model_id', sameModel)
      .neq('id', part.id)
      .order('offers_count', { ascending: false })
      .limit(limit);
    if (data?.length) return attachCovers((data as unknown as ProductRow[]).map(toPart));
  }

  const { data } = await db
    .from('partsfit_products')
    .select(PRODUCT_FIELDS)
    .eq('brand_slug', part.brandSlug)
    .neq('id', part.id)
    .order('offers_count', { ascending: false })
    .limit(limit);
  return attachCovers(((data ?? []) as unknown as ProductRow[]).map(toPart));
}

// Сборщики адресов переехали в lib/urls.ts: этот файл серверный, а корзине они
// тоже нужны. Реэкспорт — чтобы существующие импорты из '@/lib/catalog' продолжали работать.
export { SHOP_BASE, partUrl, categoryUrl, brandUrl, modelUrl, catalogUrl } from './urls';
