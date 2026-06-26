import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { createServerClient } from "@/lib/supabase";
import { parsePartSlug, generatePartSlug } from "@/lib/slug";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ProductDetail } from "./ProductDetail";
import { getProductName, normalizeManufacturer } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

export const dynamicParams = true;
export const revalidate = false;

async function getProduct(slug: string) {
  const { partNumber, productId } = parsePartSlug(slug);
  const supabase = createServerClient();

  let query = supabase
    .from("parts_products")
    .select("id, part_number, name_ru, name_en, name_ko, price_krw, image_url, is_new, weight_kg, manufacturer, category_id, subcategory_id");

  if (partNumber) {
    query = query.eq("part_number", partNumber);
  } else if (productId) {
    query = query.eq("id", productId);
  } else {
    return null;
  }

  const { data } = await query.single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const product = await getProduct(slug);

  if (!product) return {};

  const name = getProductName(product.name_ru, product.name_en, product.name_ko, product.part_number, locale);
  const brand = normalizeManufacturer(product.manufacturer) || "";
  const title = `${name} ${product.part_number}${brand ? ` ${brand}` : ""} — купить | Caranalizer`;

  const description = locale === "ru"
    ? `Купить ${name} ${product.part_number}${brand ? ` ${brand}` : ""} — оригинальная корейская запчасть с доставкой по всему миру за 7–14 дней.`
    : `Buy ${name} ${product.part_number}${brand ? ` ${brand}` : ""} — genuine Korean OEM part shipped worldwide in 7–14 days.`;

  const canonicalSlug = generatePartSlug(product.part_number, product.name_ru, product.id);

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${lang}/parts/${canonicalSlug}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE}/${l}/parts/${canonicalSlug}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `${BASE}/${lang}/parts/${canonicalSlug}`,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "product" });

  const product = await getProduct(slug);
  if (!product) notFound();

  const name = locale === "ru" ? product.name_ru : product.name_en;
  const supabase = createServerClient();

  const { data: fitmentData } = await supabase
    .from("parts_fitment")
    .select("vehicle_model_id")
    .eq("product_id", product.id);

  let compatibleModels: { brand: string; model: string }[] = [];
  if (fitmentData?.length) {
    const modelIds = fitmentData.map((f) => f.vehicle_model_id);
    const { data: models } = await supabase
      .from("parts_vehicle_models")
      .select("name_en, brand_id, parts_brands(name)")
      .in("id", modelIds);

    if (models) {
      compatibleModels = models.map((m) => {
        const brandData = m.parts_brands as unknown as { name: string } | null;
        return {
          brand: brandData?.name ?? "",
          model: m.name_en,
        };
      });
    }
  }

  let categoryName = "";
  if (product.category_id) {
    const { data: cat } = await supabase
      .from("parts_categories")
      .select(locale === "ru" ? "name_ru" : "name_en")
      .eq("id", product.category_id)
      .single();
    if (cat) categoryName = Object.values(cat)[0] as string;
  }

  const canonicalSlug = generatePartSlug(product.part_number, product.name_ru, product.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name || product.part_number,
    sku: product.part_number,
    mpn: product.part_number,
    ...(product.image_url && { image: product.image_url }),
    ...(product.manufacturer && {
      brand: { "@type": "Brand", name: product.manufacturer },
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "KRW",
      price: product.price_krw,
      availability: "https://schema.org/InStock",
      url: `${BASE}/${lang}/parts/${canonicalSlug}`,
      seller: { "@type": "Organization", name: "Caranalizer" },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("home"), item: `${BASE}/${lang}` },
      { "@type": "ListItem", position: 2, name: t("catalog"), item: `${BASE}/${lang}/catalog` },
      { "@type": "ListItem", position: 3, name: name || product.part_number },
    ],
  };

  return (
    <section className="py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]) }}
      />
      <Container>
        <Breadcrumbs
          items={[
            { label: t("home"), href: "/" },
            { label: t("catalog"), href: "/catalog" },
            { label: name },
          ]}
        />
        <ProductDetail
          product={product}
          compatibleModels={compatibleModels}
          categoryName={categoryName}
          labels={{
            partNumber: tp("partNumber"),
            manufacturer: tp("manufacturer"),
            compatibleModels: tp("compatibleModels"),
            category: tp("category"),
            addToCart: tp("addToCart"),
            added: tp("added"),
            new: tp("new"),
            priceKrw: tp("priceKrw"),
          }}
        />
      </Container>
    </section>
  );
}
