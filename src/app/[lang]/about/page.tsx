import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Camera, Shield, MapPin, TrendingDown, CheckCircle } from "lucide-react";
import { StatCounter } from "@/components/StatCounter";
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
  const t = await getTranslations({ locale: lang as Locale, namespace: "about" });

  const titles: Record<string, string> = {
    ru: "О компании — поставки запчастей из Кореи | Caranalizer",
    en: "About Us — Korean Car Parts Supplier | Caranalizer",
    ar: "من نحن — موردو قطع غيار السيارات الكورية | Caranalizer",
  };

  return {
    title: titles[lang] ?? t("title"),
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/about`])),
      canonical: `${BASE}/${lang}/about`,
    },
  };
}

export default function AboutPage() {
  const t = useTranslations("about");

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  const whyUs = [
    { icon: MapPin, title: t("why1Title"), desc: t("why1Desc") },
    { icon: Camera, title: t("why2Title"), desc: t("why2Desc") },
    { icon: Shield, title: t("why3Title"), desc: t("why3Desc") },
    { icon: TrendingDown, title: t("why4Title"), desc: t("why4Desc") },
  ];

  const guarantees = [
    t("guarantee1"),
    t("guarantee2"),
    t("guarantee3"),
    t("guarantee4"),
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        {/* Glow */}
        <div
          className="absolute top-0 left-0 right-0 h-[500px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)",
          }}
        />
        <Container className="max-w-4xl relative z-10">
          <ScrollReveal>
            <h1 className="font-[family-name:var(--font-heading)] text-[clamp(32px,4vw,52px)] font-extrabold tracking-tight uppercase mb-6 leading-[1.05]">
              {t("hero")}
            </h1>
            <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
              {t("heroSub")}
            </p>
          </ScrollReveal>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-y border-border-subtle">
        <div
          style={{
            background: "linear-gradient(180deg, rgba(59,130,246,0.03) 0%, transparent 100%)",
          }}
        >
          <Container className="max-w-4xl py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border-subtle">
              {stats.map((s, i) => (
                <div key={s.label} className="text-center px-6 py-4">
                  <span
                    className="font-[family-name:var(--font-heading)] text-[32px] font-bold block"
                    style={{
                      background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    <StatCounter value={s.value} />
                  </span>
                  <span className="text-[11px] text-text-dim uppercase tracking-[0.08em] mt-2 block">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </section>

      {/* Why us */}
      <section className="py-24">
        <Container className="max-w-4xl">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(22px,3vw,36px)] font-bold uppercase mb-2">
              {t("whyTitle")}
            </h2>
            <div className="w-10 h-0.5 bg-primary mb-12" />
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyUs.map((item, i) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.title} delay={i * 0.1}>
                  <div
                    className="group relative flex gap-4 p-8 rounded-2xl border border-border-subtle bg-elevated overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_40px_rgba(59,130,246,0.08)] h-full"
                  >
                    {/* Edge gradient */}
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                      style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 50%)" }}
                    />
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, transparent 50%)" }}
                    />
                    <div className="w-12 h-12 min-w-12 rounded-xl bg-primary/10 flex items-center justify-center relative z-10">
                      <Icon className="w-[22px] h-[22px] text-primary" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-[family-name:var(--font-heading)] font-semibold mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Location */}
      <section
        className="py-24 border-t border-border-subtle"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.02) 0%, transparent 50%)",
          backgroundColor: "var(--color-base-darker)",
        }}
      >
        <Container className="max-w-4xl">
          <div className="grid md:grid-cols-[55%_45%] gap-12 items-center">
            <ScrollReveal>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(22px,3vw,36px)] font-bold uppercase mb-2">
                {t("locationTitle")}
              </h2>
              <div className="w-16 h-0.5 bg-primary mb-6" />
              <p className="text-text-muted leading-relaxed max-w-[480px]">
                {t("locationDesc")}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div className="relative rounded-2xl overflow-hidden border border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.3)] aspect-[4/3]">
                <img
                  src="/mobis-factory.jpg"
                  alt="Hyundai Mobis factory in Asan, South Korea"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(11,15,26,0.5) 0%, transparent 40%)" }}
                />
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Guarantees */}
      <section className="py-24 border-t border-border-subtle relative overflow-hidden">
        {/* Decorative blur */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.06), transparent)",
          }}
        />
        <Container className="max-w-4xl relative z-10">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(22px,3vw,36px)] font-bold uppercase mb-2">
              {t("guaranteeTitle")}
            </h2>
            <div className="w-10 h-0.5 bg-primary mb-12" />
          </ScrollReveal>

          <div className="space-y-4 max-w-xl">
            {guarantees.map((g, i) => (
              <ScrollReveal key={g} delay={i * 0.1}>
                <div className="group flex items-center gap-4 px-4 py-3 rounded-xl transition-colors duration-200 hover:bg-success/[0.03] cursor-default">
                  <div className="w-8 h-8 min-w-8 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ background: "rgba(34,197,94,0.1)" }}>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-base font-medium text-text">{g}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
