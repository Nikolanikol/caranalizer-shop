/**
 * Слой доступа к дискам. Единственное место, откуда приложение берёт товар со skywheel.kr.
 *
 * Источник — таблицы `skywheel_*` (скрапер в `scripts/skywheel/`). Отдельно от
 * `catalog.ts`, а не рядом с ним, по той же причине, по которой таблицы свои: у детали
 * из partsfit всё держится на партномере, а у диска партномера нет вовсе. Подбирают
 * диск маркой, моделью авто и диаметром.
 *
 * ВАЖНО: файл серверный. В клиентские компоненты не импортировать — пути берите
 * из `urls.ts`.
 */

import 'server-only';
import { createServerClient } from '@/lib/supabase';
import type { Wheel, WheelGrade, WheelKind, WheelQuantity } from '@/types/wheel';

export const WHEELS_PER_PAGE = 15;

interface WheelRow {
  id: string;
  slug: string;
  brand_slug: string;
  model: string;
  diameter: number;
  title_ko: string;
  description_ko: string;
  condition: 'new' | 'used';
  grade: WheelGrade;
  wheel_kind: WheelKind;
  quantity: WheelQuantity;
  with_tyres: boolean;
  price_krw: number | null;
  width_j: (number | string)[] | null;
  pcd: (number | string)[] | null;
  offset_et: number[] | null;
  bore_cb: number | string | null;
  tyre: string;
  certified: boolean;
  sold: boolean;
  region: string;
  seller_ref: string;
  source_url: string;
  skywheel_brands?: { name: string } | { name: string }[] | null;
  skywheel_wheel_images?: { position: number; url: string }[] | null;
}

const FIELDS =
  'id, slug, brand_slug, model, diameter, title_ko, description_ko, condition, grade, ' +
  'wheel_kind, quantity, with_tyres, price_krw, width_j, pcd, offset_et, bore_cb, tyre, ' +
  'certified, sold, region, seller_ref, source_url, ' +
  'skywheel_brands ( name ), skywheel_wheel_images ( position, url )';

/**
 * `numeric` PostgREST отдаёт строкой, а не числом: точность десятичного типа
 * в JSON не выражается, и драйвер честно не округляет за нас. Ширина обода и вылет
 * при этом сравниваются и печатаются как числа — приводим здесь, на границе.
 */
const num = (value: number | string | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

const nums = (values: (number | string)[] | null | undefined): number[] =>
  (values ?? []).map(Number).filter((value) => Number.isFinite(value));

function toWheel(row: WheelRow): Wheel {
  const brand = Array.isArray(row.skywheel_brands) ? row.skywheel_brands[0] : row.skywheel_brands;
  const images = [...(row.skywheel_wheel_images ?? [])].sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    slug: row.slug,
    brandSlug: row.brand_slug,
    brandName: brand?.name ?? row.brand_slug,
    model: row.model,
    diameter: row.diameter,
    titleKo: row.title_ko,
    descriptionKo: row.description_ko,
    condition: row.condition,
    grade: row.grade,
    wheelKind: row.wheel_kind,
    quantity: row.quantity,
    withTyres: row.with_tyres,
    priceKrw: row.price_krw,
    widthJ: nums(row.width_j),
    pcd: nums(row.pcd),
    offsetEt: nums(row.offset_et),
    boreCb: num(row.bore_cb),
    tyre: row.tyre,
    certified: row.certified,
    sold: row.sold,
    region: row.region,
    sellerRef: row.seller_ref,
    sourceUrl: row.source_url,
    images,
  };
}

export interface WheelFilters {
  brand?: string;
  diameter?: number;
  condition?: 'new' | 'used';
  sort?: string;
  page?: number;
}

export interface WheelListing {
  wheels: Wheel[];
  total: number;
  page: number;
  pages: number;
}

/**
 * Список дисков с фильтром и пагинацией.
 *
 * Проданное не показываем вовсе: объявление у донора висит и после продажи, он лишь
 * дописывает метку в заголовок. Товар, которого нет, на витрине быть не должен.
 */
export async function findWheels(filters: WheelFilters = {}): Promise<WheelListing> {
  const db = createServerClient();
  const page = Math.max(1, filters.page ?? 1);

  let query = db.from('skywheel_wheels').select(FIELDS, { count: 'exact' }).eq('sold', false);

  if (filters.brand) query = query.eq('brand_slug', filters.brand);
  if (filters.diameter) query = query.eq('diameter', filters.diameter);
  if (filters.condition) query = query.eq('condition', filters.condition);

  // Сортировка по цене — единственная, которую покупатель просит на самом деле.
  // По умолчанию сначала крупный диаметр: он дороже и заметнее, а мелочь листается.
  // `nullsFirst: false` обязателен в обеих ветках: товар без цены («по запросу»)
  // должен стоять в конце списка, а Postgres по умолчанию кладёт NULL первыми при DESC.
  if (filters.sort === 'price-asc') {
    query = query.order('price_krw', { ascending: true, nullsFirst: false });
  } else if (filters.sort === 'price-desc') {
    query = query.order('price_krw', { ascending: false, nullsFirst: false });
  } else {
    query = query
      .order('diameter', { ascending: false })
      .order('price_krw', { ascending: true, nullsFirst: false });
  }

  const from = (page - 1) * WHEELS_PER_PAGE;
  const { data, error, count } = await query.range(from, from + WHEELS_PER_PAGE - 1);
  if (error) throw new Error(`Диски: ${error.message}`);

  const total = count ?? 0;
  return {
    wheels: ((data ?? []) as unknown as WheelRow[]).map(toWheel),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / WHEELS_PER_PAGE)),
  };
}

export async function getWheelBySlug(slug: string): Promise<Wheel | null> {
  const db = createServerClient();
  const { data, error } = await db.from('skywheel_wheels').select(FIELDS).eq('slug', slug).maybeSingle();
  if (error) throw new Error(`Диск: ${error.message}`);
  return data ? toWheel(data as unknown as WheelRow) : null;
}

/** Адреса всех дисков в продаже — для `generateStaticParams` и карты сайта. */
export async function getWheelSlugs(): Promise<string[]> {
  const db = createServerClient();
  // Товаров сто двадцать, предел PostgREST в тысячу строк недостижим — `selectAll`
  // здесь не нужен. Появится третий донор с тысячами позиций — понадобится.
  const { data, error } = await db.from('skywheel_wheels').select('slug').eq('sold', false).order('slug');
  if (error) throw new Error(`Диски, адреса: ${error.message}`);
  return ((data ?? []) as { slug: string }[]).map((row) => row.slug);
}

/** Марки и диаметры для фильтра — со счётчиками, как в фильтре запчастей. */
export async function getWheelFacets(): Promise<{
  brands: { slug: string; name: string; count: number }[];
  diameters: { value: number; count: number }[];
}> {
  const db = createServerClient();
  const { data, error } = await db
    .from('skywheel_wheels')
    .select('brand_slug, diameter, skywheel_brands ( name )')
    .eq('sold', false);
  if (error) throw new Error(`Диски, фильтр: ${error.message}`);

  const brands = new Map<string, { slug: string; name: string; count: number }>();
  const diameters = new Map<number, number>();

  for (const row of (data ?? []) as unknown as WheelRow[]) {
    const brand = Array.isArray(row.skywheel_brands) ? row.skywheel_brands[0] : row.skywheel_brands;
    const found = brands.get(row.brand_slug) ?? {
      slug: row.brand_slug,
      name: brand?.name ?? row.brand_slug,
      count: 0,
    };
    found.count += 1;
    brands.set(row.brand_slug, found);
    diameters.set(row.diameter, (diameters.get(row.diameter) ?? 0) + 1);
  }

  return {
    brands: [...brands.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    diameters: [...diameters.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value - b.value),
  };
}
