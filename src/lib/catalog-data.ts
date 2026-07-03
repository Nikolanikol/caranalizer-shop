import { createServerClient } from "@/lib/supabase";
import { cachedFetch } from "@/lib/server-cache";
import { getCategoryName } from "@/lib/utils";

export interface CategoryRow {
  id: number;
  slug: string;
  name_ru: string | null;
  name_en: string | null;
  // Present only after the name_ar migration is applied
  name_ar?: string | null;
  parent_id: number | null;
}

export const CATALOG_PAGE_SIZE = 24;

export const PRODUCT_COLUMNS =
  "id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new, weight_kg, manufacturer";

// select("*") so the query keeps working before and after the name_ar migration
export const getCatalogCategories = cachedFetch(
  "catalog-categories-full",
  async () => {
    const { data } = await createServerClient()
      .from("parts_categories")
      .select("*");
    return (data ?? []) as CategoryRow[];
  },
  3600
);

export const getCatalogCategoryCounts = cachedFetch(
  "catalog-category-counts",
  async () => {
    const { data } = await createServerClient().rpc("get_category_counts");
    return (data ?? []) as { category_id: number; cnt: number }[];
  },
  300
);

export async function getCategoryFacets(locale: string) {
  const [cats, counts] = await Promise.all([
    getCatalogCategories(),
    getCatalogCategoryCounts(),
  ]);

  const countMap = new Map<number, number>();
  for (const row of counts) countMap.set(row.category_id, Number(row.cnt));

  const facets = cats
    .filter((c) => c.parent_id === null)
    .map((c) => ({
      slug: c.slug,
      name: getCategoryName(c, locale),
      count: countMap.get(c.id) ?? 0,
    }))
    .filter((c) => c.count > 0);

  const total = Array.from(countMap.values()).reduce((s, v) => s + v, 0);

  return { facets, countMap, cats, total };
}
