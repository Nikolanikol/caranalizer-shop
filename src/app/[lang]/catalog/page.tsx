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

const getBrands = unstable_cache(
  async () => {
    const { data } = await createServerClient()
      .from("parts_brands")
      .select("id, slug, name");
    return data ?? [];
  },
  ["catalog-brands"],
  { revalidate: 3600 }
);

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

  const [productsRes, countRes, brandsData, catsData] = await Promise.all([
    supabase
      .from("parts_products")
      .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new, weight_kg, manufacturer")
      .order("name_ru", { ascending: true })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from("parts_products")
      .select("*", { count: "exact", head: true }),
    getBrands(),
    getCategories(),
  ]);

  const brandCountsPromise = Promise.all(
    brandsData.map(async (b) => {
      const { count } = await supabase
        .from("parts_products")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", b.id);
      return { slug: b.slug, name: b.name, count: count ?? 0 };
    })
  );

  const catCountsPromise = Promise.all(
    catsData
      .filter((c) => c.parent_id === null)
      .map(async (c) => {
        const { count } = await supabase
          .from("parts_products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", c.id);
        return { slug: c.slug, name: c.name_ru, count: count ?? 0 };
      })
  );

  const [brandCounts, catCounts] = await Promise.all([brandCountsPromise, catCountsPromise]);

  const initialData = {
    products: productsRes.data ?? [],
    total: countRes.count ?? 0,
    page: 1,
    pageSize: PAGE_SIZE,
    facets: {
      brands: brandCounts.filter((b) => b.count > 0),
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
