import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogClient } from "./CatalogClient";
import { createServerClient } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;
const PAGE_SIZE = 24;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "catalog" });

  const title = t("title");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${lang}/catalog`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE}/${l}/catalog`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${BASE}/${lang}/catalog`,
    },
  };
}

const getCategories = unstable_cache(
  async () => {
    const { data } = await createServerClient()
      .from("parts_categories")
      .select("id, slug, name_ru, name_en, parent_id");
    return data ?? [];
  },
  ["catalog-categories"],
  { revalidate: 3600 }
);

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  const supabase = createServerClient();

  const [productsRes, countRes, catsData, catCountsRes] = await Promise.all([
    supabase
      .from("v_catalog_combined")
      .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new, weight_kg, manufacturer")
      .order("name_ru", { ascending: true, nullsFirst: false })
      .order("part_number", { ascending: true })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from("v_catalog_combined")
      .select("*", { count: "exact", head: true }),
    getCategories(),
    supabase.rpc("get_category_counts"),
  ]);

  const countMap = new Map<number, number>();
  if (catCountsRes.data) {
    for (const row of catCountsRes.data as { category_id: number; cnt: number }[]) {
      countMap.set(row.category_id, Number(row.cnt));
    }
  }

  const catCounts = catsData
    .filter((c) => c.parent_id === null)
    .map((c) => ({
      slug: c.slug,
      name: c.name_ru,
      count: countMap.get(c.id) ?? 0,
    }))
    .filter((c) => c.count > 0);

  const initialData = {
    products: productsRes.data ?? [],
    total: countRes.count ?? 0,
    page: 1,
    pageSize: PAGE_SIZE,
    facets: {
      categories: catCounts.filter((c) => c.count > 0),
    },
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tn("home"), item: `${BASE}/${lang}` },
      { "@type": "ListItem", position: 2, name: tn("catalog"), item: `${BASE}/${lang}/catalog` },
    ],
  };

  return (
    <section className="py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <Breadcrumbs
          items={[
            { label: tn("home"), href: "/" },
            { label: tn("catalog") },
          ]}
        />
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mt-4 mb-8">
          {t("title")}
        </h1>
        <CatalogClient initialData={initialData} />
      </Container>
    </section>
  );
}
