import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";

const PAGE_SIZE = 24;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Q = any;

const getBrands = unstable_cache(
  async () => {
    const { data } = await createServerClient()
      .from("parts_brands")
      .select("id, slug, name");
    return data ?? [];
  },
  ["parts-brands"],
  { revalidate: 3600 }
);

const getCategories = unstable_cache(
  async () => {
    const { data } = await createServerClient()
      .from("parts_categories")
      .select("id, slug, name_ru, name_en, parent_id");
    return data ?? [];
  },
  ["parts-categories"],
  { revalidate: 3600 }
);

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;

    const lang = sp.get("lang") ?? "ru";
    const brandSlug = sp.get("brand") ?? "";
    const catSlug = sp.get("cat") ?? "";
    const subSlug = sp.get("sub") ?? "";
    const modelName = sp.get("model") ?? "";
    const q = sp.get("q") ?? "";
    const minPrice = sp.get("min") ? Number(sp.get("min")) : null;
    const maxPrice = sp.get("max") ? Number(sp.get("max")) : null;
    const sort = sp.get("sort") ?? "default";
    const page = Math.max(1, Number(sp.get("page") ?? "1"));

    const hasSearch = !!(q || minPrice || maxPrice);
    const hasFilters = !!(brandSlug || catSlug || subSlug || modelName || sort !== "default");
    const cacheHeader = hasSearch
      ? "no-store"
      : hasFilters
      ? "s-maxage=30, stale-while-revalidate=120"
      : "s-maxage=60, stale-while-revalidate=300";

    const [brandsData, catsData] = await Promise.all([getBrands(), getCategories()]);

    const brandId = brandSlug ? brandsData.find((b) => b.slug === brandSlug)?.id ?? null : null;
    const catId = catSlug ? catsData.find((c) => c.slug === catSlug)?.id ?? null : null;
    const subId = subSlug ? catsData.find((c) => c.slug === subSlug)?.id ?? null : null;

    if (brandSlug && !brandId) {
      return NextResponse.json({ products: [], total: 0, facets: { brands: [], categories: [] } });
    }

    const supabase = createServerClient();

    let modelProductIds: number[] | null = null;
    if (modelName && brandId) {
      const { data: modelRows } = await supabase
        .from("parts_vehicle_models")
        .select("id")
        .eq("name_en", modelName)
        .eq("brand_id", brandId);

      const modelIds = modelRows?.map((m) => m.id) ?? [];
      if (modelIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, facets: { brands: [], categories: [] } });
      }

      const { data: fitmentRows } = await supabase
        .from("parts_fitment")
        .select("product_id")
        .in("vehicle_model_id", modelIds);

      modelProductIds = [...new Set(fitmentRows?.map((f) => f.product_id) ?? [])];
      if (modelProductIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, facets: { brands: [], categories: [] } });
      }
    }

    function applyBase(query: Q): Q {
      if (brandId) query = query.eq("brand_id", brandId);
      if (modelProductIds) query = query.in("id", modelProductIds);
      if (minPrice !== null) query = query.gte("price_krw", minPrice);
      if (maxPrice !== null) query = query.lte("price_krw", maxPrice);
      if (q) query = query.or(`part_number.ilike.%${q}%,name_ru.ilike.%${q}%,name_en.ilike.%${q}%,name_ko.ilike.%${q}%`);
      return query;
    }

    function applyFull(query: Q): Q {
      query = applyBase(query);
      if (catId) query = query.eq("category_id", catId);
      if (subId) query = query.eq("subcategory_id", subId);
      return query;
    }

    const from = (page - 1) * PAGE_SIZE;

    let productQuery = applyFull(
      supabase
        .from("v_catalog_combined")
        .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new, weight_kg, manufacturer")
    );

    switch (sort) {
      case "price_asc": productQuery = productQuery.order("price_krw", { ascending: true }); break;
      case "price_desc": productQuery = productQuery.order("price_krw", { ascending: false }); break;
      default: productQuery = productQuery.order("name_ru", { ascending: true, nullsFirst: false }).order("part_number", { ascending: true }); break;
    }
    productQuery = productQuery.range(from, from + PAGE_SIZE - 1);

    const hasBaseFilters = !!(q || minPrice !== null || maxPrice !== null || brandId || modelProductIds);

    const [productsRes, catCountsRes, filteredCountRes] = await Promise.all([
      productQuery,
      supabase.rpc("get_category_counts"),
      hasBaseFilters
        ? applyFull(
            supabase.from("v_catalog_combined").select("*", { count: "exact", head: true })
          )
        : null,
    ]);

    const countMap = new Map<number, number>();
    if (catCountsRes.data) {
      for (const row of catCountsRes.data) {
        countMap.set(row.category_id, Number(row.cnt));
      }
    }

    const catCounts = catsData
      .filter((c) => c.parent_id === null)
      .map((c) => {
        const name = lang === "en" ? (c.name_en ?? c.name_ru) : lang === "ar" ? (c.name_en ?? c.name_ru) : c.name_ru;
        return { slug: c.slug, name, count: countMap.get(c.id) ?? 0 };
      })
      .filter((c) => c.count > 0);

    let total: number;
    if (filteredCountRes) {
      total = filteredCountRes.count ?? 0;
    } else if (catId) {
      total = countMap.get(catId) ?? 0;
    } else {
      total = Array.from(countMap.values()).reduce((s, v) => s + v, 0);
    }

    return NextResponse.json(
      {
        products: productsRes.data ?? [],
        total,
        page,
        pageSize: PAGE_SIZE,
        facets: { categories: catCounts },
      },
      { headers: { "Cache-Control": cacheHeader } }
    );
  } catch (err) {
    console.error("[/api/parts/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
