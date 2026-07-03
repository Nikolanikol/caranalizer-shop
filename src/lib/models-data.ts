import { createServerClient } from "@/lib/supabase";
import { cachedFetch } from "@/lib/server-cache";

export interface ModelEntry {
  brandSlug: string;
  brandName: string;
  modelSlug: string;
  modelName: string;
  productIds: number[];
  yearFrom: number | null;
  yearTo: number | null;
}

// Pages are generated only for models with enough products to avoid thin
// content; as parts_fitment grows, new model pages appear automatically.
export const MODEL_MIN_PRODUCTS = 12;

const BRANDS: Record<number, { slug: string; name: string }> = {
  1: { slug: "hyundai", name: "Hyundai" },
  6: { slug: "kia", name: "Kia" },
  171: { slug: "genesis", name: "Genesis" },
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Aggregates parts_fitment across model generations (same brand + name_en).
export const getModelIndex = cachedFetch(
  "vehicle-model-index",
  async () => {
    const supabase = createServerClient();

    const fitment: { product_id: number; vehicle_model_id: number }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data } = await supabase
        .from("parts_fitment")
        .select("product_id, vehicle_model_id")
        .range(offset, offset + 999);
      if (!data || data.length === 0) break;
      fitment.push(...data);
      if (data.length < 1000) break;
    }

    const modelIds = [...new Set(fitment.map((f) => f.vehicle_model_id))];
    const models: {
      id: number;
      brand_id: number;
      name_en: string | null;
      year_from: number | null;
      year_to: number | null;
    }[] = [];
    for (let i = 0; i < modelIds.length; i += 200) {
      const { data } = await supabase
        .from("parts_vehicle_models")
        .select("id, brand_id, name_en, year_from, year_to")
        .in("id", modelIds.slice(i, i + 200));
      if (data) models.push(...data);
    }
    const modelMap = new Map(models.map((m) => [m.id, m]));

    const agg = new Map<string, ModelEntry>();
    for (const f of fitment) {
      const m = modelMap.get(f.vehicle_model_id);
      if (!m || !m.name_en) continue;
      const brand = BRANDS[m.brand_id];
      if (!brand) continue;

      const key = `${brand.slug}/${slugify(m.name_en)}`;
      let entry = agg.get(key);
      if (!entry) {
        entry = {
          brandSlug: brand.slug,
          brandName: brand.name,
          modelSlug: slugify(m.name_en),
          modelName: m.name_en,
          productIds: [],
          yearFrom: m.year_from,
          yearTo: m.year_to,
        };
        agg.set(key, entry);
      }
      if (!entry.productIds.includes(f.product_id)) {
        entry.productIds.push(f.product_id);
      }
      if (m.year_from && (!entry.yearFrom || m.year_from < entry.yearFrom)) entry.yearFrom = m.year_from;
      if (m.year_to && (!entry.yearTo || m.year_to > entry.yearTo)) entry.yearTo = m.year_to;
    }

    const entries = [...agg.values()].filter(
      (e) => e.productIds.length >= MODEL_MIN_PRODUCTS
    );
    entries.sort((a, b) => b.productIds.length - a.productIds.length);
    return entries;
  },
  3600
);

export async function findModel(brandSlug: string, modelSlug: string) {
  const entries = await getModelIndex();
  return (
    entries.find((e) => e.brandSlug === brandSlug && e.modelSlug === modelSlug) ?? null
  );
}
