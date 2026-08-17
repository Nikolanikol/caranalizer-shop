/**
 * Слой доступа к каталогу. Единственное место, откуда приложение берёт товары.
 *
 * Источник — data/catalog.json (результат `npm run normalize`). Когда данные переедут
 * в базу, меняются только функции этого файла, компоненты не трогаются. Поэтому все
 * функции async, хотя json читается синхронно.
 *
 * ВАЖНО: файл серверный. Не импортировать в клиентские компоненты — каталог весит ~2 МБ
 * и целиком уедет в браузерный бандл.
 */

import 'server-only';
import catalogData from '@/data/catalog.json';
import type { AutoPart, PartCategory } from '@/types/part';

export type { AutoPart };

const CATALOG = catalogData as AutoPart[];

export const ITEMS_PER_PAGE = 15;

export const CATEGORIES: Record<PartCategory, { title: string; plural: string; description: string }> = {
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
};

export function isCategory(value: string): value is PartCategory {
  return value in CATEGORIES;
}

export type SortBy = 'popular' | 'newest' | 'price_asc' | 'price_desc';

export interface CatalogQuery {
  category?: PartCategory;
  brand?: string;
  model?: string;
  /**
   * Фильтр посадочных страниц. Отбираем по сегменту адреса, а не по имени: у 17 товаров
   * модель не указана, её каноническое имя — пустая строка, и фильтр по имени их бы пропустил.
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

export async function getAllParts(): Promise<AutoPart[]> {
  return CATALOG;
}

/** Модели с наибольшим числом позиций — для навигационных блоков на главной и в каталоге. */
export async function getTopModels(limit = 12): Promise<(Facet & { category: PartCategory; brandSlug: string; brand: string })[]> {
  const counts = new Map<string, Facet & { category: PartCategory; brandSlug: string; brand: string }>();
  for (const part of CATALOG) {
    if (!part.model) continue;
    const key = `${part.category}/${part.brandSlug}/${part.modelSlug}`;
    const entry = counts.get(key) ?? {
      name: `${part.brand} ${part.model}`,
      slug: part.modelSlug,
      brandSlug: part.brandSlug,
      brand: part.brand,
      category: part.category,
      count: 0,
    };
    entry.count += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
}

/**
 * Товар по полному адресу. Искать по одному только слагу нельзя: он уникален
 * внутри своей марки и модели, а не глобально.
 */
export async function getPartByPath(path: {
  category: string;
  brand: string;
  model: string;
  slug: string;
}): Promise<AutoPart | null> {
  return (
    CATALOG.find(
      (part) =>
        part.category === path.category &&
        part.brandSlug === path.brand &&
        part.modelSlug === path.model &&
        part.slug === path.slug,
    ) ?? null
  );
}

/** Марка по сегменту адреса. Отдаёт каноническое имя — по нему дальше фильтруется каталог. */
export async function getBrandBySlug(category: PartCategory, brandSlug: string): Promise<string | null> {
  const found = CATALOG.find((part) => part.category === category && part.brandSlug === brandSlug);
  return found ? found.brand : null;
}

/**
 * Модель по сегменту адреса. Возвращает и имя, и сам сегмент: у 17 товаров модель
 * не указана, они живут под `prochee`, и там каноническое имя — пустая строка.
 */
export async function getModelBySlug(
  category: PartCategory,
  brandSlug: string,
  modelSlug: string,
): Promise<{ name: string } | null> {
  const found = CATALOG.find(
    (part) => part.category === category && part.brandSlug === brandSlug && part.modelSlug === modelSlug,
  );
  return found ? { name: found.model } : null;
}

function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-zа-я0-9]/gi, '');
}

function matchesSearch(part: AutoPart, term: string): boolean {
  const haystack = [part.titleRu, part.oemNumber, part.brand, part.brandRu, part.model, ...part.keywords]
    .join(' ')
    .toLowerCase();
  // Артикул ищут и с разделителями, и без них: «92401-L1000» == «92401L1000».
  return haystack.includes(term) || normalizeTerm(haystack).includes(normalizeTerm(term));
}

function applyFilters(query: CatalogQuery): AutoPart[] {
  const term = query.search?.trim().toLowerCase() ?? '';
  let items = CATALOG;

  if (query.category) items = items.filter((part) => part.category === query.category);
  if (query.brand) items = items.filter((part) => part.brand === query.brand);
  if (query.model) items = items.filter((part) => part.model === query.model);
  if (query.brandSlug) items = items.filter((part) => part.brandSlug === query.brandSlug);
  if (query.modelSlug) items = items.filter((part) => part.modelSlug === query.modelSlug);
  if (query.side) items = items.filter((part) => part.side === query.side);
  if (query.position) items = items.filter((part) => part.position === query.position);
  if (term) items = items.filter((part) => matchesSearch(part, term));

  if (query.sort === 'price_asc') return [...items].sort((a, b) => a.priceKrw - b.priceKrw);
  if (query.sort === 'price_desc') return [...items].sort((a, b) => b.priceKrw - a.priceKrw);
  // Дата настоящая: она зашита в путь к фотографиям и посчитана нормализатором.
  if (query.sort === 'newest') return [...items].sort((a, b) => b.listedAt.localeCompare(a.listedAt));
  return items;
}

export async function findParts(query: CatalogQuery = {}): Promise<CatalogPage> {
  const items = applyFilters(query);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const page = Math.min(Math.max(1, query.page ?? 1), totalPages);
  const start = (page - 1) * ITEMS_PER_PAGE;

  return { items: items.slice(start, start + ITEMS_PER_PAGE), total, page, totalPages };
}

export interface Facet {
  name: string;
  /** Сегмент адреса — по нему строится ссылка на посадочную страницу. */
  slug: string;
  count: number;
}

/** Марки с количеством товаров — для фильтра и для посадочных. */
export async function getBrands(category?: PartCategory): Promise<Facet[]> {
  const counts = new Map<string, Facet>();
  for (const part of CATALOG) {
    if (category && part.category !== category) continue;
    if (!part.brand) continue;
    const entry = counts.get(part.brandSlug) ?? { name: part.brand, slug: part.brandSlug, count: 0 };
    entry.count += 1;
    counts.set(part.brandSlug, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Модели выбранной марки — второй уровень. Товары без модели сюда не попадают:
 * сегмент `prochee` не посадочная страница, вести на него из фильтра нечего.
 */
export async function getModels(brand: string, category?: PartCategory): Promise<Facet[]> {
  const counts = new Map<string, Facet>();
  for (const part of CATALOG) {
    if (part.brand !== brand || !part.model) continue;
    if (category && part.category !== category) continue;
    const entry = counts.get(part.modelSlug) ?? { name: part.model, slug: part.modelSlug, count: 0 };
    entry.count += 1;
    counts.set(part.modelSlug, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Похожие товары для карточки: та же марка и модель, другой товар.
 * Сравниваем по id, а не по слагу: слаг уникален только внутри марки и модели.
 */
export async function getSimilarParts(part: AutoPart, limit = 4): Promise<AutoPart[]> {
  const sameModel = CATALOG.filter(
    (other) => other.brand === part.brand && other.model === part.model && other.id !== part.id,
  );
  if (sameModel.length >= limit) return sameModel.slice(0, limit);

  const sameBrand = CATALOG.filter(
    (other) => other.brand === part.brand && other.id !== part.id && !sameModel.includes(other),
  );
  return [...sameModel, ...sameBrand].slice(0, limit);
}

// Сборщики адресов переехали в lib/urls.ts: этот файл серверный, а корзине они
// тоже нужны. Реэкспорт — чтобы существующие импорты из '@/lib/catalog' продолжали работать.
export { SHOP_BASE, partUrl, categoryUrl, brandUrl, modelUrl, catalogUrl } from './urls';
