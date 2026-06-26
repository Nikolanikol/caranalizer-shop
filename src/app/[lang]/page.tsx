import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { VinCheckCTA } from "@/components/VinCheckCTA";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { Locale } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  const titles: Record<string, string> = {
    ru: "Запчасти Hyundai, Kia, Genesis из Кореи — 48 000+ деталей | Caranalizer",
    en: "Genuine Korean Car Parts — 48,000+ Hyundai, Kia, Genesis Parts | Caranalizer",
    ar: "قطع غيار هيونداي وكيا وجينيسيس من كوريا — 48,000+ قطعة | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "Оригинальные запчасти Hyundai, Kia, Genesis с прямой поставкой из Кореи. 48 000+ деталей в каталоге. Доставка по всему миру за 7–14 дней.",
    en: "Genuine OEM parts for Hyundai, Kia, Genesis shipped directly from Korea. 48,000+ parts in catalog. Worldwide delivery in 7–14 days.",
    ar: "قطع غيار OEM أصلية لهيونداي وكيا وجينيسيس مشحونة مباشرة من كوريا. أكثر من 48,000 قطعة. توصيل عالمي خلال 7-14 يوم.",
  };

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}`])),
      canonical: `${BASE}/${lang}`,
    },
  };
}
import {
  Search,
  ShoppingCart,
  MessageCircle,
  Truck,
  ArrowRight,
  ExternalLink,
  Shield,
  Globe,
  DollarSign,
  FileSearch,
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations("home");
  const th = useTranslations("howItWorks");

  const steps = [
    { icon: Search, num: "01", title: th("step1Title"), desc: th("step1Desc") },
    { icon: ShoppingCart, num: "02", title: th("step2Title"), desc: th("step2Desc") },
    { icon: MessageCircle, num: "03", title: th("step3Title"), desc: th("step3Desc") },
    { icon: Truck, num: "04", title: th("step4Title"), desc: th("step4Desc") },
  ];

  const features = [
    { icon: Shield, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: Globe, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: DollarSign, title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: FileSearch, title: t("feature4Title"), desc: t("feature4Desc") },
  ];

  return (
    <>
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
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-primary text-white font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:bg-primary-hover hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {t("shopNow")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://t.me/caranalizer_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-transparent text-text border-[1.5px] border-border font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] hover:border-primary hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
            >
              {t("checkVin")}
              <ExternalLink className="w-5 h-5" />
            </a>
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

      {/* ===== How It Works ===== */}
      <section className="relative py-24 bg-base-darker border-y border-border">
        <Container>
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,48px)] font-bold tracking-tight uppercase mb-4">
              {t("stepsTitle")}
            </h2>
            <p className="text-lg text-text-muted max-w-[600px] mb-14">
              {t("stepsSubtitle")}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.num} delay={i * 0.1}>
                  <div className="group bg-elevated border border-border rounded-2xl p-10 text-center transition-all duration-300 hover:border-surface hover:-translate-y-1 relative overflow-hidden h-full">
                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="font-[family-name:var(--font-heading)] text-7xl font-bold text-transparent [-webkit-text-stroke:1px_var(--color-surface)] leading-none mb-6 group-hover:[-webkit-text-stroke-color:var(--color-primary)] transition-all duration-300">
                      {step.num}
                    </div>
                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-base rounded-[10px] border border-border">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[15px] text-text-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ===== Features ===== */}
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

      {/* ===== VIN Check Banner ===== */}
      <ScrollReveal>
        <VinCheckCTA />
      </ScrollReveal>

      {/* ===== Bottom CTA ===== */}
      <section className="py-24 bg-[linear-gradient(180deg,var(--color-base-darker)_0%,var(--color-elevated)_100%)] border-t border-border text-center">
        <Container>
          <ScrollReveal>
            <div className="max-w-[600px] mx-auto">
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,48px)] font-bold uppercase tracking-tight mb-4">
                {t("ctaTitle")}
              </h2>
              <p className="text-lg text-text-muted mb-10 leading-relaxed">
                {t("ctaSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-primary text-white font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:bg-primary-hover hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t("shopNow")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2.5 px-10 py-[18px] bg-transparent text-text border-[1.5px] border-border font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.05em] rounded-[10px] hover:border-primary hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t("ctaContact")}
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </>
  );
}
