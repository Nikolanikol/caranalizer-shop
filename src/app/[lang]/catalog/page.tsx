import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "@/i18n/navigation";
import { CatalogClient } from "./CatalogClient";
import { createServerClient } from "@/lib/supabase";
import { getModelIndex } from "@/lib/models-data";
import {
  CATALOG_PAGE_SIZE,
  PRODUCT_COLUMNS,
  getCategoryFacets,
} from "@/lib/catalog-data";
import type { Locale } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

type SearchParams = Promise<{ cat?: string; page?: string; [key: string]: string | undefined }>;

function pageSuffix(page: number) {
  return page > 1 ? `?page=${page}` : "";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { lang } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const t = await getTranslations({ locale: lang as Locale, namespace: "catalog" });

  const title = t("title");
  const description = t("metaDescription");
  const path = `/catalog${pageSuffix(page)}`;

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

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  const locale = lang as Locale;

  // Legacy filter URLs: /catalog?cat=engine → /catalog/engine (301)
  if (sp.cat) {
    const rest = new URLSearchParams();
    for (const key of ["q", "min", "max", "sort", "page"] as const) {
      if (sp[key]) rest.set(key, sp[key]!);
    }
    const qs = rest.toString();
    permanentRedirect(`/${lang}/catalog/${sp.cat}${qs ? `?${qs}` : ""}`);
  }

  const t = await getTranslations({ locale, namespace: "catalog" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const tv = await getTranslations({ locale, namespace: "vehicles" });

  const [{ facets, total }, models] = await Promise.all([
    getCategoryFacets(locale),
    getModelIndex().catch(() => []),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(sp.page ?? "1") || 1));
  const from = (page - 1) * CATALOG_PAGE_SIZE;

  const { data: products } = await createServerClient()
    .from("v_catalog_combined")
    .select(PRODUCT_COLUMNS)
    .order("name_en", { ascending: true, nullsFirst: false })
    .order("part_number", { ascending: true })
    .range(from, from + CATALOG_PAGE_SIZE - 1);

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

        {models.length > 0 && (
          <nav aria-label={tv("shopByModel")} className="mt-14">
            <h2 className="text-lg font-semibold text-text mb-3">{tv("shopByModel")}</h2>
            <div className="flex flex-wrap gap-2">
              {models.map((m) => (
                <Link
                  key={`${m.brandSlug}/${m.modelSlug}`}
                  href={`/vehicles/${m.brandSlug}/${m.modelSlug}`}
                  className="text-sm px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text hover:border-primary/30 transition-colors"
                >
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
