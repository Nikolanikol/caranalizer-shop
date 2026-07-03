import type { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; brand: string; model: string }>;
}): Promise<Metadata> {
  const { lang, brand, model } = await params;
  const entry = await findModel(brand, model);
  if (!entry) return {};

  const t = await getTranslations({ locale: lang as Locale, namespace: "vehicles" });
  const vars = { brand: entry.brandName, model: entry.modelName };
  const title = t("metaTitle", vars);
  const description = t("metaDescription", vars);
  const path = `/vehicles/${brand}/${model}`;

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
    openGraph: { title, description, url: `${BASE}/${lang}${path}` },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ lang: string; brand: string; model: string }>;
}) {
  const { lang, brand, model } = await params;
  const locale = lang as Locale;

  const entry = await findModel(brand, model);
  if (!entry) notFound();

  const t = await getTranslations({ locale, namespace: "vehicles" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  const { data: products } = await createServerClient()
    .from("v_catalog_combined")
    .select(PRODUCT_COLUMNS)
    .in("id", entry.productIds)
    .order("name_ru", { ascending: true, nullsFirst: false })
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <Breadcrumbs
          items={[
            { label: tn("home"), href: "/" },
            { label: tn("catalog"), href: "/catalog" },
            { label: pageName },
          ]}
        />
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mt-4 mb-4">
          {t("h1", vars)}
        </h1>
        <p className="text-sm text-text-secondary max-w-3xl mb-2">{t("intro", vars)}</p>
        <p className="text-sm text-text-muted mb-8">
          {t("partsCount", { count: entry.productIds.length })}
        </p>

        <ModelProductsGrid products={(products ?? []) as Product[]} />

        {siblings.length > 0 && (
          <nav aria-label={t("otherModels", { brand: entry.brandName })} className="mt-12">
            <h2 className="text-lg font-semibold text-text mb-3">
              {t("otherModels", { brand: entry.brandName })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((m) => (
                <Link
                  key={m.modelSlug}
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
