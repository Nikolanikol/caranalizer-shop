import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogClient } from "../CatalogClient";
import { createServerClient } from "@/lib/supabase";
import {
  CATALOG_PAGE_SIZE,
  PRODUCT_COLUMNS,
  getCatalogCategories,
  getCategoryFacets,
} from "@/lib/catalog-data";
import { getCategoryName } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

async function findCategory(slug: string) {
  const cats = await getCatalogCategories();
  return cats.find((c) => c.slug === slug && c.parent_id === null) ?? null;
}

function pageSuffix(page: number) {
  return page > 1 ? `?page=${page}` : "";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { lang, category } = await params;
  const { page: pageParam } = await searchParams;
  const cat = await findCategory(category);
  if (!cat) return {};

  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const name = getCategoryName(cat, lang);
  const t = await getTranslations({ locale: lang as Locale, namespace: "catalog" });

  const title = t("categoryTitle", { category: name });
  const description = t("categoryMetaDescription", { category: name });
  const path = `/catalog/${category}${pageSuffix(page)}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${lang}${path}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}${path}`])),
        "x-default": `${BASE}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE}/${lang}${path}`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang, category } = await params;
  const { page: pageParam } = await searchParams;
  const locale = lang as Locale;

  const cat = await findCategory(category);
  if (!cat) notFound();

  const { facets, countMap } = await getCategoryFacets(locale);
  const total = countMap.get(cat.id) ?? 0;
  if (total === 0) notFound();

  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(pageParam ?? "1") || 1));
  const from = (page - 1) * CATALOG_PAGE_SIZE;

  const t = await getTranslations({ locale, namespace: "catalog" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  const { data: products } = await createServerClient()
    .from("v_catalog_combined")
    .select(PRODUCT_COLUMNS)
    .eq("category_id", cat.id)
    .order("name_en", { ascending: true, nullsFirst: false })
    .order("part_number", { ascending: true })
    .range(from, from + CATALOG_PAGE_SIZE - 1);

  const name = getCategoryName(cat, locale);

  const initialData = {
    products: products ?? [],
    total,
    page,
    pageSize: CATALOG_PAGE_SIZE,
    facets: { categories: facets },
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tn("home"), item: `${BASE}/${lang}` },
      { "@type": "ListItem", position: 2, name: tn("catalog"), item: `${BASE}/${lang}/catalog` },
      { "@type": "ListItem", position: 3, name, item: `${BASE}/${lang}/catalog/${category}` },
    ],
  };

  const introKey = `categoryIntro.${category}`;
  const intro = t.has(introKey) ? t(introKey) : null;

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
            { label: tn("catalog"), href: "/catalog" },
            { label: name },
          ]}
        />
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mt-4 mb-4">
          {t("categoryH1", { category: name })}
        </h1>
        {intro && (
          <p className="text-sm text-text-secondary max-w-3xl mb-8">{intro}</p>
        )}
        <CatalogClient
          initialData={initialData}
          fixedCategory={{ slug: category, name }}
        />
      </Container>
    </section>
  );
}
