import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "@/i18n/navigation";
import { createServerClient } from "@/lib/supabase";
import { PRODUCT_COLUMNS } from "@/lib/catalog-data";
import { findModel, getModelIndex } from "@/lib/models-data";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";
import { ModelProductsGrid } from "../../ModelProductsGrid";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;
const PAGE_SIZE = 24;
// порог thin-content: страницы поколений с меньшим числом деталей — noindex
export const GEN_MIN_PARTS = 10;

interface VehicleRow {
  id: number;
  brand: string;
  name_en: string;
  year_from: string | null;
  year_to: string | null;
  open_ended: boolean;
  parts_count: number;
  slug: string;
  model_ko: string | null;
}

// Поколение из новой таблицы vehicles (slug без бренда)
const findVehicle = cache(async (brand: string, slug: string): Promise<VehicleRow | null> => {
  const { data } = await createServerClient()
    .from("vehicles")
    .select("id, brand, name_en, year_from, year_to, open_ended, parts_count, slug, model_ko")
    .eq("brand", brand)
    .eq("slug", slug)
    .maybeSingle();
  return data as VehicleRow | null;
});

function vehicleTitle(v: VehicleRow): string {
  const yf = v.year_from ? String(v.year_from).split(".")[0] : "";
  const yt = v.year_to ? String(v.year_to).split(".")[0] : v.open_ended ? "…" : "";
  const years = yf || yt ? ` (${yf}${yt ? "–" + yt : ""})` : "";
  return `${v.name_en}${years}`;
}

const BRAND_NAMES: Record<string, string> = {
  hyundai: "Hyundai", kia: "Kia", genesis: "Genesis", ssangyong: "SsangYong", audi: "Audi",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; brand: string; model: string }>;
}): Promise<Metadata> {
  const { lang, brand, model } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "vehicles" });
  const path = `/vehicles/${brand}/${model}`;

  // 1) старая модельная страница
  const entry = await findModel(brand, model);
  if (entry) {
    const vars = { brand: entry.brandName, model: entry.modelName };
    const title = t("metaTitle", vars);
    const description = t("metaDescription", vars);
    return {
      title, description,
      alternates: {
        canonical: `${BASE}/${lang}${path}`,
        languages: {
          ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}${path}`])),
          "x-default": `${BASE}/en${path}`,
        },
      },
      openGraph: { title, description, url: `${BASE}/${lang}${path}` },
    };
  }

  // 2) поколение из vehicles
  const vehicle = await findVehicle(brand, model);
  if (!vehicle) return {};

  const vars = {
    brand: vehicle.brand === "genesis" && vehicle.name_en.startsWith("Genesis")
      ? "" : BRAND_NAMES[vehicle.brand] ?? vehicle.brand,
    model: vehicleTitle(vehicle),
  };
  const title = t("metaTitle", vars).replace(/\s{2,}/g, " ").trim();
  const description = t("metaDescription", vars).replace(/\s{2,}/g, " ").trim();

  return {
    title, description,
    // тонкие страницы не индексируем, но по ссылкам ходить можно
    ...(vehicle.parts_count < GEN_MIN_PARTS && { robots: { index: false, follow: true } }),
    alternates: {
      canonical: `${BASE}/${lang}${path}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}${path}`])),
        "x-default": `${BASE}/en${path}`,
      },
    },
    openGraph: { title, description, url: `${BASE}/${lang}${path}` },
  };
}

export default async function ModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; brand: string; model: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang, brand, model } = await params;
  const { page: pageParam } = await searchParams;
  const locale = lang as Locale;

  const t = await getTranslations({ locale, namespace: "vehicles" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  // === 1. Старая модельная страница (хаб) ===
  const entry = await findModel(brand, model);
  if (entry) {
    const { data: products } = await createServerClient()
      .from("v_catalog_combined")
      .select(PRODUCT_COLUMNS)
      .in("id", entry.productIds)
      .order("name_en", { ascending: true, nullsFirst: false })
      .order("part_number", { ascending: true });

    const allModels = await getModelIndex();
    const siblings = allModels.filter(
      (m) => m.brandSlug === entry.brandSlug && m.modelSlug !== entry.modelSlug
    );

    const vars = { brand: entry.brandName, model: entry.modelName };
    const pageName = `${entry.brandName} ${entry.modelName}`;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tn("home"), item: `${BASE}/${lang}` },
        { "@type": "ListItem", position: 2, name: tn("catalog"), item: `${BASE}/${lang}/catalog` },
        { "@type": "ListItem", position: 3, name: pageName, item: `${BASE}/${lang}/vehicles/${brand}/${model}` },
      ],
    };

    return (
      <section className="py-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Container>
          <Breadcrumbs items={[{ label: tn("home"), href: "/" }, { label: tn("catalog"), href: "/catalog" }, { label: pageName }]} />
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mt-4 mb-4">{t("h1", vars)}</h1>
          <p className="text-sm text-text-secondary max-w-3xl mb-2">{t("intro", vars)}</p>
          <p className="text-sm text-text-muted mb-8">{t("partsCount", { count: entry.productIds.length })}</p>
          <ModelProductsGrid products={(products ?? []) as Product[]} />
          {siblings.length > 0 && (
            <nav aria-label={t("otherModels", { brand: entry.brandName })} className="mt-12">
              <h2 className="text-lg font-semibold text-text mb-3">{t("otherModels", { brand: entry.brandName })}</h2>
              <div className="flex flex-wrap gap-2">
                {siblings.map((m) => (
                  <Link key={m.modelSlug} href={`/vehicles/${m.brandSlug}/${m.modelSlug}`}
                    className="text-sm px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text hover:border-primary/30 transition-colors">
                    {m.brandName} {m.modelName}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </Container>
      </section>
    );
  }

  // === 2. Страница поколения (новые данные) ===
  const vehicle = await findVehicle(brand, model);
  if (!vehicle) notFound();

  const supabase = createServerClient();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // id деталей этого поколения (страницей)
  const { data: pv, count: totalLinks } = await supabase
    .from("part_vehicles")
    .select("part_id", { count: "exact" })
    .eq("vehicle_id", vehicle.id)
    .order("part_id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const partIds = (pv ?? []).map((r) => r.part_id);
  let products: Product[] = [];
  if (partIds.length) {
    const { data } = await supabase
      .from("parts_products")
      .select(PRODUCT_COLUMNS)
      .in("id", partIds);
    products = (data ?? []) as Product[];
  }

  const totalPages = Math.max(1, Math.ceil((totalLinks ?? 0) / PAGE_SIZE));

  // соседние поколения той же модели
  let siblingsGen: VehicleRow[] = [];
  if (vehicle.model_ko) {
    const { data } = await supabase
      .from("vehicles")
      .select("id, brand, name_en, year_from, year_to, open_ended, parts_count, slug, model_ko")
      .eq("brand", vehicle.brand)
      .eq("model_ko", vehicle.model_ko)
      .neq("id", vehicle.id)
      .gte("parts_count", GEN_MIN_PARTS)
      .order("year_from", { ascending: false })
      .limit(20);
    siblingsGen = (data ?? []) as VehicleRow[];
  }

  const brandName = BRAND_NAMES[vehicle.brand] ?? vehicle.brand;
  const displayBrand = vehicle.name_en.startsWith("Genesis") ? "" : brandName;
  const genTitle = vehicleTitle(vehicle);
  const pageName = `${displayBrand ? displayBrand + " " : ""}${genTitle}`;
  const vars = { brand: displayBrand, model: genTitle };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tn("home"), item: `${BASE}/${lang}` },
      { "@type": "ListItem", position: 2, name: tn("catalog"), item: `${BASE}/${lang}/catalog` },
      { "@type": "ListItem", position: 3, name: pageName, item: `${BASE}/${lang}/vehicles/${brand}/${model}` },
    ],
  };

  return (
    <section className="py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container>
        <Breadcrumbs items={[{ label: tn("home"), href: "/" }, { label: tn("catalog"), href: "/catalog" }, { label: pageName }]} />
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mt-4 mb-4">
          {t("h1", vars).replace(/\s{2,}/g, " ").trim()}
        </h1>
        <p className="text-sm text-text-secondary max-w-3xl mb-2">{t("intro", vars).replace(/\s{2,}/g, " ").trim()}</p>
        <p className="text-sm text-text-muted mb-8">{t("partsCount", { count: totalLinks ?? 0 })}</p>

        <ModelProductsGrid products={products} />

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2 flex-wrap" aria-label="Pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-2">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-text-dim">…</span>}
                  {p === page ? (
                    <span className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm">{p}</span>
                  ) : (
                    <Link href={`/vehicles/${brand}/${model}${p > 1 ? `?page=${p}` : ""}`}
                      className="px-3 py-1.5 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text hover:border-primary/30 transition-colors">
                      {p}
                    </Link>
                  )}
                </span>
              ))}
          </nav>
        )}

        {siblingsGen.length > 0 && (
          <nav aria-label={t("otherModels", { brand: brandName })} className="mt-12">
            <h2 className="text-lg font-semibold text-text mb-3">{t("otherModels", { brand: brandName })}</h2>
            <div className="flex flex-wrap gap-2">
              {siblingsGen.map((v) => (
                <Link key={v.id} href={`/vehicles/${v.brand}/${v.slug}`}
                  className="text-sm px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text hover:border-primary/30 transition-colors">
                  {vehicleTitle(v)}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </Container>
    </section>
  );
}
