import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { createServerClient } from "@/lib/supabase";
import { parsePartSlug, generatePartSlug } from "@/lib/slug";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ProductDetail } from "./ProductDetail";
import { ModelProductsGrid } from "../../vehicles/ModelProductsGrid";
import { getProductName, normalizeManufacturer } from "@/lib/utils";
import type { Product } from "@/types/product";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
// hreflang карточки: только en+ru. /ar/parts продолжает рендериться и открываться
// (dynamicParams), но в кластер альтернатив не входит — нет name_ar, это дубль /en.
// Существующие /ar не помечаем noindex: пусть сами отваливаются как дубли.
const HREFLANG_LOCALES = ["ru", "en"] as const;

export const dynamicParams = true;
export const revalidate = false;

const getProduct = cache(async (slug: string) => {
  const { partNumber, productId } = parsePartSlug(slug);
  const supabase = createServerClient();

  let query = supabase
    .from("v_catalog_combined")
    .select("id, part_number, name_ru, name_en, name_ko, price_krw, image_url, is_new, weight_kg, manufacturer, category_id, subcategory_id");

  if (partNumber) {
    query = query.eq("part_number", partNumber);
  } else if (productId) {
    query = query.eq("id", productId);
  } else {
    return null;
  }

  // part_number встречается в v_catalog_combined по 2-3 раза (разные
  // источники) — .single() на таких падал и страница уходила в 404
  const { data } = await query.order("id", { ascending: true }).limit(1).maybeSingle();
  return data;
});

// SEO-контент caranalizer из ИЗОЛИРОВАННОЙ таблицы ca_parts_seo (ключ part_number).
// Отдельная от общих parts_products.seo_* (те — KMotors) → нет дубля на двух доменах.
// Пусто → карточка работает на прежней логике (фолбэк).
const getCaSeo = cache(async (partNumber: string | null) => {
  if (!partNumber) return null;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("ca_parts_seo")
    .select("seo_title_ru, seo_title_en, seo_desc_ru, seo_desc_en, seo_body_ru, seo_body_en, cross_refs")
    .eq("part_number", partNumber)
    .maybeSingle();
  return data;
});

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
  const titleSuffix: Record<string, string> = {
    ru: "купить",
    en: "buy",
    ar: "شراء",
  };
  const fallbackTitle = `${name} ${product.part_number}${brand ? ` ${brand}` : ""} — ${titleSuffix[locale] ?? titleSuffix.en} | Caranalizer`;

  const descriptions: Record<string, string> = {
    ru: `Купить ${name} ${product.part_number}${brand ? ` ${brand}` : ""} — оригинальная корейская запчасть с доставкой по всему миру за 7–14 дней.`,
    en: `Buy ${name} ${product.part_number}${brand ? ` ${brand}` : ""} — genuine Korean OEM part shipped worldwide in 7–14 days.`,
    ar: `شراء ${name} ${product.part_number}${brand ? ` ${brand}` : ""} — قطعة غيار كورية أصلية مع الشحن العالمي خلال 7-14 يوم.`,
  };
  const fallbackDescription = descriptions[locale] ?? descriptions.en;

  // Сгенерированные title/desc из ca_parts_seo (ru/en). ar не генерим → фолбэк.
  const caSeo = await getCaSeo(product.part_number);
  const caTitle = locale === "ru" ? caSeo?.seo_title_ru : locale === "en" ? caSeo?.seo_title_en : null;
  const caDesc = locale === "ru" ? caSeo?.seo_desc_ru : locale === "en" ? caSeo?.seo_desc_en : null;
  const title = caTitle ? `${caTitle} | Caranalizer` : fallbackTitle;
  const description = caDesc || fallbackDescription;

  const canonicalSlug = generatePartSlug(product.part_number, product.id);

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${lang}/parts/${canonicalSlug}`,
      languages: {
        ...Object.fromEntries(
          HREFLANG_LOCALES.map((l) => [l, `${BASE}/${l}/parts/${canonicalSlug}`])
        ),
        "x-default": `${BASE}/en/parts/${canonicalSlug}`,
      },
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

  // Старые URL (хвосты "--", устаревшие слаги после смены переводов)
  // сводим на канонический вариант, иначе Google копит дубликаты
  const expectedSlug = generatePartSlug(product.part_number, product.id);
  if (decodeURIComponent(slug) !== expectedSlug) {
    permanentRedirect(`/${lang}/parts/${expectedSlug}`);
  }

  // name_ru у большинства товаров пуст (RU-переводы отключены как мусорные) —
  // getProductName падает на name_en, чтобы хлебные крошки и JSON-LD не пустели
  const name = getProductName(product.name_ru, product.name_en, product.name_ko, product.part_number, locale);
  const supabase = createServerClient();

  // Совместимость из новых таблиц vehicles/part_vehicles (212k связей)
  const { data: pvData } = await supabase
    .from("part_vehicles")
    .select("vehicles(id, name_en, brand, year_from, year_to, open_ended, slug, parts_count)")
    .eq("part_id", product.id);

  const compatRows = (pvData ?? [])
    .map((row) => row.vehicles as unknown as {
      id: number; name_en: string; brand: string; year_from: string | null;
      year_to: string | null; open_ended: boolean; slug: string; parts_count: number;
    } | null)
    .filter((v): v is NonNullable<typeof v> => !!v);

  const compatVehicles = compatRows.map((v) => ({
    name: v.name_en,
    brand: v.brand,
    yearFrom: v.year_from,
    yearTo: v.year_to,
    openEnded: v.open_ended,
    href: `/${lang}/vehicles/${v.brand}/${v.slug}`,
  }));

  // Похожие запчасти: та же категория + самое популярное из совместимых авто
  let similarProducts: Record<string, unknown>[] = [];
  let similarVehicleName = "";
  if (compatRows.length && product.category_id) {
    const topVehicle = [...compatRows].sort((a, b) => b.parts_count - a.parts_count)[0];
    similarVehicleName = topVehicle.name_en;
    const { data: sameVehicle } = await supabase
      .from("part_vehicles")
      .select("part_id")
      .eq("vehicle_id", topVehicle.id)
      .neq("part_id", product.id)
      .limit(400);
    const ids = (sameVehicle ?? []).map((r) => r.part_id);
    if (ids.length) {
      const { data: sim } = await supabase
        .from("parts_products")
        .select("id, name_ru, name_en, name_ko, part_number, price_krw, image_url, is_new, weight_kg, manufacturer, category_id, subcategory_id")
        .in("id", ids)
        .eq("category_id", product.category_id)
        .limit(8);
      similarProducts = sim ?? [];
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

  // Сгенерированный SEO-контент caranalizer (ru/en; для ar берём en как фолбэк).
  const caSeo = await getCaSeo(product.part_number);
  const seoBody = locale === "ru" ? caSeo?.seo_body_ru : caSeo?.seo_body_en;
  const seoDesc = locale === "ru" ? caSeo?.seo_desc_ru : caSeo?.seo_desc_en;
  const crossRefs = Array.isArray(caSeo?.cross_refs) ? (caSeo!.cross_refs as string[]) : [];
  const descLabels: Record<string, string> = { ru: "Описание", en: "Description", ar: "الوصف" };
  const crossLabels: Record<string, string> = { ru: "Кросс-номера (аналоги)", en: "Cross-reference numbers", ar: "أرقام بديلة" };

  const canonicalSlug = generatePartSlug(product.part_number, product.id);

  const brandName = normalizeManufacturer(product.manufacturer) || "Hyundai Mobis";
  const productName = name || product.part_number;

  const descriptions: Record<string, string> = {
    ru: `${productName} ${product.part_number} — оригинальная запчасть ${brandName}.${categoryName ? ` Категория: ${categoryName}.` : ""} Доставка из Кореи 7–14 дней.`,
    en: `${productName} ${product.part_number} — genuine OEM part by ${brandName}.${categoryName ? ` Category: ${categoryName}.` : ""} Ships from Korea in 7–14 days.`,
    ar: `${productName} ${product.part_number} — قطعة غيار أصلية ${brandName}.${categoryName ? ` الفئة: ${categoryName}.` : ""} الشحن من كوريا خلال 7-14 يوم.`,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: seoDesc || descriptions[locale] || descriptions.en,
    sku: product.part_number,
    mpn: product.part_number,
    ...(categoryName && { category: categoryName }),
    ...(product.image_url && { image: product.image_url }),
    brand: { "@type": "Brand", name: brandName },
    offers: {
      "@type": "Offer",
      priceCurrency: "KRW",
      price: product.price_krw,
      availability: "https://schema.org/InStock",
      url: `${BASE}/${lang}/parts/${canonicalSlug}`,
      seller: { "@type": "Organization", name: "Caranalizer" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "EARTH",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "d" },
          transitTime: { "@type": "QuantitativeValue", minValue: 7, maxValue: 14, unitCode: "d" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "KR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
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
          compatVehicles={compatVehicles}
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
            showAllVehicles: tp.raw("showAllVehicles"),
            showLessVehicles: tp("showLessVehicles"),
            presentYear: tp("presentYear"),
          }}
        />
        {seoBody && (
          <div className="mt-10 max-w-3xl">
            <h2 className="text-lg font-semibold text-text mb-3">{descLabels[locale] ?? descLabels.en}</h2>
            <p className="text-text-secondary leading-relaxed whitespace-pre-line">{seoBody}</p>
            {crossRefs.length > 0 && (
              <p className="mt-4 text-sm text-text-muted">
                <span className="font-medium text-text">{crossLabels[locale] ?? crossLabels.en}:</span>{" "}
                {crossRefs.join(", ")}
              </p>
            )}
          </div>
        )}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-text mb-4">
              {tp("moreForVehicle", { model: similarVehicleName })}
            </h2>
            <ModelProductsGrid products={similarProducts as unknown as Product[]} />
          </div>
        )}
      </Container>
    </section>
  );
}
