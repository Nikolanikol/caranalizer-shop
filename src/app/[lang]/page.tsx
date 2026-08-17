import type { Metadata } from "next";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { VinCheckCTA } from "@/components/VinCheckCTA";
import { ScrollReveal } from "@/components/ScrollReveal";
import { GUIDES, type GuideLocale } from "@/lib/guides";
import { partsDestination } from "@/lib/parts-destination";
import { kmotorsUrl } from "@/lib/kmotors";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;
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

  const titles: Record<string, string> = {
    ru: "Проверка авто из Кореи — бесплатный отчёт по Encar, KBChachacha | Caranalizer",
    en: "Korean Car Check — Free Encar & KBChachacha Report | Caranalizer",
    ar: "فحص السيارات من كوريا — تقرير مجاني Encar وKBChachacha | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "Пришлите ссылку на объявление Encar, KBChachacha или Kcar — бесплатная проверка истории на русском: ДТП, страховые выплаты, пробег, комплектация по VIN.",
    en: "Send an Encar, KBChachacha or Kcar listing link — free history check: accidents, insurance payouts, mileage, factory specs by VIN.",
    ar: "أرسل رابط إعلان من Encar أو KBChachacha أو Kcar — فحص مجاني للتاريخ: الحوادث، مدفوعات التأمين، المسافة، المواصفات حسب VIN.",
  };

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}`])),
      canonical: `${BASE}/${lang}`,
    },
    openGraph: {
      title: titles[lang],
      description: descriptions[lang],
      url: `${BASE}/${lang}`,
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
import { CheckLeadForm } from "./check/CheckLeadForm";

const HOME_GUIDE_SLUGS = [
  "kbchachacha-na-russkom",
  "encar-proverka-vin",
  "avto-iz-korei-v-kazahstan",
];

export default function HomePage() {
  const t = useTranslations("home");
  const tg = useTranslations("guides");
  const tc = useTranslations("check");
  const locale = useLocale() as GuideLocale;
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
            {t("badge")}
          </div>

          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(32px,5vw,64px)] font-bold leading-[1.1] tracking-tight uppercase mb-6 opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.4s]">
            {t("heroTitle")}{" "}
            <span className="text-primary">{t("heroTitleAccent")}</span>
          </h1>

          <p className="text-[clamp(16px,2vw,20px)] text-text-muted max-w-[560px] mx-auto mb-10 leading-relaxed opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.6s]">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-[fadeInUp_0.6s_ease_forwards_0.8s]">
            <a
              href="#free-check"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-primary text-white font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:bg-primary-hover hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {t("ctaCheck")}
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-transparent text-text border-[1.5px] border-border font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] hover:border-primary hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
            >
              {t("ctaHow")}
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
      <section id="free-check" className="relative py-20 bg-base-darker border-y border-border scroll-mt-16">
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
                { icon: ShieldCheck, n: 1, href: "#free-check", external: false },
                { icon: FileSearch, n: 2, href: "/report", external: false },
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
