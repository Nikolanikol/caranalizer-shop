import type { Metadata } from "next";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { VinCheckCTA } from "@/components/VinCheckCTA";
import { ScrollReveal } from "@/components/ScrollReveal";
import { GUIDES, type GuideLocale } from "@/lib/guides";
import { partsDestination } from "@/lib/parts-destination";
import { kmotorsUrl } from "@/lib/kmotors";
import { mainAlternates, mainUrl, VIN_PATHS, type VinLocale } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import {
  CATEGORIES,
  findParts,
  getBrands,
  getTopModels,
  type AutoPart,
  type Facet,
} from "@/lib/shop/catalog";
import { SHOP_BASE, categoryUrl, isShopLocale, modelUrl } from "@/lib/shop/urls";
import { categoryPlural } from "@/lib/shop/labels";
import type { ShopLocale } from "@/lib/shop/terms";
import type { PartCategory } from "@/types/part";
import { SearchForm } from "@/components/shop/search-form";
import { ProductCard } from "@/components/shop/product-card";

// Крупная кнопка в блоке внизу главной. Вынесена в константу: она нужна и внешней
// ссылке на kmotors, и внутренней на свой раздел, а класс длинный.
const KM_CTA_PRIMARY =
  "inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-primary text-white font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:bg-primary-hover hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all duration-300";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  /*
   * Русский и английский заголовки — про каталог: главная стала входом в раздел
   * запчастей, и с 28.08.2026 раздел есть на обоих языках. Арабский оставлен про
   * проверку по VIN: каталога на нём нет, и middleware уводит `/ar` на неё.
   */
  const titles: Record<string, string> = {
    ru: "Запчасти с авторазборов Южной Кореи — оптика, зеркала, блоки управления",
    en: "Used car parts from South Korean salvage yards — worldwide shipping",
    ar: "فحص السيارات من كوريا — تقرير مجاني Encar وKBChachacha | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "Оригинальные б/у запчасти с авторазборов Южной Кореи: фары и фонари, зеркала, блоки управления. Поиск по OEM-артикулу, фото каждого экземпляра, VIN донорской машины. Плюс бесплатная проверка авто из Кореи по VIN.",
    en: "Used genuine parts from South Korean salvage yards: headlights and tail lights, mirrors, control modules. Search by OEM number, photos of every single item, donor car VIN. Plus a free Korean car history check.",
    ar: "أرسل رابط إعلان من Encar أو KBChachacha أو Kcar — فحص مجاني للتاريخ: الحوادث، مدفوعات التأمين، المسافة، المواصفات حسب VIN.",
  };

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: mainAlternates("", lang),
    openGraph: {
      title: titles[lang],
      description: descriptions[lang],
      url: mainUrl(),
    },
  };
}
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Wrench,
  FileSearch,
  Car,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { CheckLeadForm } from "./proverka-avto-po-vin/CheckLeadForm";

const HOME_GUIDE_SLUGS = [
  "kbchachacha-na-russkom",
  "encar-proverka-vin",
  "avto-iz-korei-v-kazahstan",
];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  // Язык сообщаем next-intl явно: иначе `useTranslations` ниже читает заголовки запроса,
  // и страница уходит в динамический рендер. Тело вынесено в синхронный компонент —
  // хуки в асинхронном серверном компоненте вызывать нельзя.
  const { lang } = await params;
  setRequestLocale(lang);

  /*
   * Каталог тянем здесь, а не в теле: тело синхронное из-за `useTranslations`.
   *
   * Главная — вход в каталог, а не второй его список. Ни фильтра, ни пагинации здесь
   * быть не должно: витрина раздела уже такая, и второй список ровно того же товара —
   * это то, от чего раздел уводили, убирая `/zapchasti/katalog`.
   */
  const [brands, models, fresh] = await Promise.all([
    getBrands(),
    getTopModels(8),
    findParts({ sort: 'newest', page: 1 }),
  ]);

  const total = brands.reduce((sum, brand) => sum + brand.count, 0);

  return (
    <HomeContent
      brands={brands.slice(0, 14)}
      models={models}
      fresh={fresh.items.slice(0, 8)}
      total={total}
      brandCount={brands.length}
    />
  );
}

function HomeContent({
  brands,
  models,
  fresh,
  total,
  brandCount,
}: {
  brands: Facet[];
  models: (Facet & { category: PartCategory; brandSlug: string; brand: string })[];
  fresh: AutoPart[];
  total: number;
  brandCount: number;
}) {
  const t = useTranslations("home");
  const tg = useTranslations("guides");
  const tc = useTranslations("check");
  const locale = useLocale() as GuideLocale;

  /*
   * Путь страницы проверки зависит от языка: у неё свой слаг на каждой локали
   * (`VIN_PATHS`), а `/en/proverka-avto-po-vin` — рабочий, но неканонический адрес.
   * Хардкодить русский путь нельзя, иначе англоязычный посетитель уедет на дубль.
   */
  const vinPath = VIN_PATHS[locale as VinLocale] ?? VIN_PATHS.ru;
  /*
   * Язык каталога и язык сайта — не одно и то же: раздел живёт на `SHOP_LOCALES`,
   * сайт на трёх локалях. На арабской главной каталожные блоки подписываются
   * по-русски, но её самой не существует — middleware уводит `/ar` на проверку.
   */
  const shopLocale: ShopLocale = isShopLocale(locale) ? locale : "ru";
  const h = HOME[shopLocale];
  const guideTeasers = GUIDES.filter((g) => HOME_GUIDE_SLUGS.includes(g.slug));

  // Куда ведут «запчасти» на этой странице — карточка услуги и кнопка в блоке внизу.
  const parts = partsDestination(locale, "services");
  const partsCta = partsDestination(locale, "home");

  const features = [
    { icon: ShieldAlert, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: Gauge, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: Wrench, title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: FileSearch, title: t("feature4Title"), desc: t("feature4Desc") },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Caranalizer",
      url: "https://caranalizer.com",
      logo: "https://caranalizer.com/icon.png",
      sameAs: ["https://t.me/axiskorea", "https://wa.me/821058654344"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["Russian", "English", "Arabic"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Caranalizer",
      url: "https://caranalizer.com",
      // Поиск по каталогу теперь стоит на главной, и поисковику о нём стоит сказать:
      // приходят с артикулом на руках, а не листать разделы.
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `https://caranalizer.com/${shopLocale}${SHOP_BASE}?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ===== Hero ===== */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(135deg,rgba(15,23,42,0.95)_0%,rgba(15,23,42,0.7)_50%,rgba(15,23,42,0.95)_100%)]" />
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-primary),transparent)] opacity-30 animate-[scanline_4s_linear_infinite]" />
        </div>

        <div className="relative z-10 text-center max-w-[800px] px-6 py-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-elevated/80 border border-border rounded-full font-[family-name:var(--font-heading)] text-xs font-medium uppercase tracking-[0.08em] text-primary mb-8 opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.2s]">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-[pulse_2s_ease_infinite]" />
            {h.badge}
          </div>

          {/* Каталожные тексты — строками в HOME внизу файла, а не через next-intl:
              язык раздела приходит пропсом, и `useTranslations` тут был бы вторым
              источником правды. Тот же приём уже принят в самом разделе. */}
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(32px,5vw,64px)] font-bold leading-[1.1] tracking-tight uppercase mb-6 opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.4s]">
            {h.h1a}{" "}
            <span className="text-primary">{h.h1b}</span>
          </h1>

          <p className="text-[clamp(16px,2vw,20px)] text-text-muted max-w-[600px] mx-auto mb-8 leading-relaxed opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.6s]">
            {h.lead(total.toLocaleString(shopLocale === "en" ? "en-US" : "ru"), brandCount)}
          </p>

          {/* Поиск в самом верху: приходят с артикулом на руках, а не листать каталог. */}
          <div className="max-w-[560px] mx-auto mb-8 opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.7s]">
            <SearchForm size="large" locale={shopLocale} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.8s]">
            <Link
              href={SHOP_BASE}
              className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-primary text-white font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:bg-primary-hover hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {h.ctaCatalog}
              <ArrowRight className="w-5 h-5" />
            </Link>
            {/*
              Ведёт на страницу проверки, а не к форме внизу этой же страницы.
              Раньше кнопка «бесплатная проверка» открывала заявку менеджеру — теперь
              проверку человек делает сам, и его место там, где стоит декодер.
            */}
            <Link
              href={vinPath}
              className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-transparent text-text border-[1.5px] border-border font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] hover:border-primary hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
            >
              {t("ctaCheck")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-16 mt-16 pt-10 border-t border-border opacity-0 animate-[fadeInUp_0.6s_ease_forwards_1s]">
            {(
              [
                { v: t("stat1Value"), l: t("stat1Label") },
                { v: t("stat2Value"), l: t("stat2Label") },
                { v: t("stat3Value"), l: t("stat3Label") },
              ] as const
            ).map((s) => (
              <div key={s.l} className="text-center">
                <span className="font-[family-name:var(--font-heading)] text-4xl font-bold text-primary block">
                  {s.v}
                </span>
                <span className="text-xs text-text-dim uppercase tracking-[0.05em] mt-1 block">
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Free check form (лид-форма на первом скролле) ===== */}
      {/* ===== Каталог: типы деталей ===== */}
      <section className="relative py-16 border-b border-border">
        <Container>
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(22px,3vw,32px)] font-bold tracking-tight uppercase">
              {h.inStock}
            </h2>
            <Link href={SHOP_BASE} className="text-sm font-bold text-cta hover:underline">
              {h.allCatalog}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(Object.keys(CATEGORIES) as PartCategory[]).map((key) => (
              <Link
                key={key}
                href={categoryUrl(key)}
                className="px-4 py-3 rounded bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-cta hover:border-cta/40 transition-colors"
              >
                {categoryPlural(key, shopLocale, CATEGORIES[key].plural)}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ===== Свежие поступления ===== */}
      {fresh.length > 0 && (
        <section className="relative py-16 border-b border-border">
          <Container>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(22px,3vw,32px)] font-bold tracking-tight uppercase">
                {h.fresh}
              </h2>
              <Link href={`${SHOP_BASE}?sort=newest`} className="text-sm font-bold text-cta hover:underline">
                {h.showAll}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {fresh.map((part) => (
                <ProductCard key={part.id} part={part} locale={shopLocale} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ===== Марки и частые машины ===== */}
      <section className="relative py-16 border-b border-border">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(22px,3vw,32px)] font-bold tracking-tight uppercase mb-6">
                {h.makes}
              </h2>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`${SHOP_BASE}?brand=${encodeURIComponent(brand.name)}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-cta hover:border-cta/40 transition-colors"
                  >
                    {brand.name}
                    <span className="text-[10px] tabular-nums text-text-dim">{brand.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(22px,3vw,32px)] font-bold tracking-tight uppercase mb-6">
                {h.mostAsked}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {models.map((item) => (
                  <Link
                    key={`${item.category}/${item.brandSlug}/${item.slug}`}
                    href={modelUrl(item.category, item.brandSlug, item.slug)}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-cta hover:border-cta/40 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      {/* Тип детали обязателен: без него одна машина стоит в списке
                          дважды — по разу на категорию — и ссылки неотличимы. */}
                      <span className="block truncate text-[10px] uppercase tracking-widest text-text-dim mt-0.5">
                        {categoryPlural(item.category, shopLocale, CATEGORIES[item.category].plural)}
                      </span>
                    </span>
                    <span className="text-[10px] tabular-nums text-text-dim shrink-0">{item.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="report" className="relative py-20 bg-base-darker border-y border-border scroll-mt-16">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(24px,3vw,36px)] font-bold tracking-tight uppercase mb-3">
                {tc("formTitle")}
              </h2>
              <p className="text-text-muted">{tc("formSub")}</p>
            </div>
            <CheckLeadForm />
          </div>
        </Container>
      </section>

      {/* ===== Services (витрина: проверка → покупка → запчасти) ===== */}
      <section className="relative py-24">
        <Container>
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,48px)] font-bold tracking-tight uppercase mb-4">
              {t("servicesTitle")}
            </h2>
            <p className="text-lg text-text-muted max-w-[600px] mb-14">
              {t("servicesSubtitle")}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(
              [
                // Обе плитки ведут на страницу проверки: первая — прямо к декодеру,
                // вторая — на страницу целиком, где ниже форма полного отчёта.
                { icon: ShieldCheck, n: 1, href: `${vinPath}#decoder`, external: false },
                { icon: FileSearch, n: 2, href: vinPath, external: false },
                {
                  icon: Car,
                  n: 3,
                  href: kmotorsUrl(locale, "catalog", "services", "cars"),
                  external: true,
                },
                // Запчасти: по-русски свой раздел б/у, иначе kmotors — см. lib/parts-destination
                { icon: Wrench, n: 4, ...parts },
              ] as const
            ).map((svc, i) => {
              const Icon = svc.icon;
              const body = (
                <>
                  <div className="w-12 h-12 mb-5 flex items-center justify-center bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {t(`svc${svc.n}Title`)}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed flex-1">
                    {t(`svc${svc.n}Desc`)}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-5">
                    {t(`svc${svc.n}Btn`)}
                    {svc.external ? (
                      <ExternalLink className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </span>
                </>
              );
              const cls =
                "group flex flex-col h-full bg-base-darker border border-border rounded-2xl p-8 transition-all duration-300 hover:border-primary hover:-translate-y-1";
              return (
                <ScrollReveal key={svc.n} delay={i * 0.1}>
                  {svc.external ? (
                    <a href={svc.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {body}
                    </a>
                  ) : svc.href.startsWith("#") ? (
                    <a href={svc.href} className={cls}>
                      {body}
                    </a>
                  ) : (
                    <Link href={svc.href} className={cls}>
                      {body}
                    </Link>
                  )}
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ===== What you learn ===== */}
      <section className="relative py-24">
        <Container>
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,48px)] font-bold tracking-tight uppercase mb-4">
              {t("featuresTitle")}
            </h2>
            <p className="text-lg text-text-muted max-w-[600px] mb-14">
              {t("featuresSubtitle")}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="group flex gap-5 items-start bg-base-darker border border-border rounded-2xl p-9 transition-all duration-300 hover:border-primary hover:bg-elevated hover:-translate-y-0.5 h-full">
                    <div className="w-12 h-12 min-w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-[22px] h-[22px] text-primary" />
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-2">
                        {feat.title}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ===== Free Check Banner ===== */}
      <ScrollReveal>
        <VinCheckCTA />
      </ScrollReveal>

      {/* ===== Guide teasers ===== */}
      <section className="py-24 bg-base-darker border-y border-border">
        <Container>
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,48px)] font-bold tracking-tight uppercase mb-4">
                  {t("guidesTitle")}
                </h2>
                <p className="text-lg text-text-muted max-w-[600px]">
                  {t("guidesSubtitle")}
                </p>
              </div>
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
              >
                {t("guidesAll")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guideTeasers.map((g, i) => (
              <ScrollReveal key={g.slug} delay={i * 0.1}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group flex flex-col h-full bg-elevated border border-border rounded-2xl p-8 transition-all duration-300 hover:border-primary hover:-translate-y-1"
                >
                  <BookOpen className="w-6 h-6 text-primary mb-5" />
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {g.title[locale]}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed flex-1">
                    {g.teaser[locale]}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-5">
                    {tg("readMore")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ===== K-Axis CTA ===== */}
      <section className="py-24 bg-[linear-gradient(180deg,var(--color-base-darker)_0%,var(--color-elevated)_100%)] border-t border-border text-center">
        <Container>
          <ScrollReveal>
            <div className="max-w-[640px] mx-auto">
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,48px)] font-bold uppercase tracking-tight mb-4">
                {t("kmTitle")}
              </h2>
              <p className="text-lg text-text-muted mb-10 leading-relaxed">
                {t("kmSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Запчасти: свой раздел по-русски, kmotors на остальных языках */}
                {partsCta.external ? (
                  <a
                    href={partsCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={KM_CTA_PRIMARY}
                  >
                    {t("kmCtaParts")}
                    <ExternalLink className="w-5 h-5" />
                  </a>
                ) : (
                  <Link href={partsCta.href} className={KM_CTA_PRIMARY}>
                    {t("kmCtaParts")}
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </Link>
                )}
                <a
                  href={kmotorsUrl(locale, "calculator", "home")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-transparent text-text border-[1.5px] border-border font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] hover:border-primary hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t("kmCtaCalc")}
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </>
  );
}

/**
 * Каталожные тексты главной. Всё остальное на этой странице идёт через next-intl
 * (`home`, `check`, `guides`) — там переводы были всегда, включая английские.
 * Каталожный блок появился 25.08.2026 строками, когда раздел был одноязычным;
 * теперь у него два языка, но источник остался тот же — иначе получилось бы
 * два места правды на одну страницу.
 *
 * Русское «доставка по России» оставлено как есть: это её аудитория, и обезличивать
 * текст ради симметрии языков незачем. Английский говорит про доставку по миру —
 * так оно и есть.
 */
const HOME = {
  ru: {
    badge: "Б/у оригинал · доставка по России",
    h1a: "Запчасти с авторазборов",
    h1b: "Южной Кореи",
    lead: (total: string, brands: number) =>
      `${total} деталей для ${brands} марок: оптика, зеркала, блоки управления. Каждый экземпляр сфотографирован отдельно — вы видите ровно ту деталь, которая приедет.`,
    ctaCatalog: "Смотреть каталог",
    inStock: "Что есть в наличии",
    allCatalog: "Весь каталог →",
    fresh: "Свежие поступления",
    showAll: "Показать все →",
    makes: "Марки",
    mostAsked: "Чаще всего спрашивают",
  },
  en: {
    badge: "Used genuine · worldwide shipping",
    h1a: "Used car parts from",
    h1b: "South Korea",
    lead: (total: string, brands: number) =>
      `${total} parts for ${brands} makes: lighting, mirrors, control modules. Every item is photographed on its own — you see the exact part that will arrive.`,
    ctaCatalog: "Browse the catalog",
    inStock: "What we have in stock",
    allCatalog: "Full catalog →",
    fresh: "New arrivals",
    showAll: "Show all →",
    makes: "Makes",
    mostAsked: "Most asked for",
  },
} as const;
