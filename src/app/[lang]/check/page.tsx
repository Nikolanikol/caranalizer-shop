import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { kmotorsUrl } from "@/lib/kmotors";
import { VIN_PATHS, vinAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CheckLeadForm } from "./CheckLeadForm";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Search, Link2, FileText, AlertTriangle, Wrench, Gauge, User, ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/routing";

const BOT = "https://t.me/koreancarss_bot";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "check" });
  const title = t("metaTitle");
  const description = t("metaDesc");

  return {
    title,
    description,
    alternates: vinAlternates(lang),
    openGraph: { title, description, url: `${SITE_URL}/${lang}${VIN_PATHS.ru}` },
  };
}

export default function CheckPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = useTranslations("check");
  // Блок «купить авто» после проверки — услуга kmotors, у нас её нет.
  const carsUrl = kmotorsUrl(useLocale(), "catalog", "check");

  const steps = [
    { icon: Search, t: t("step1t"), d: t("step1d") },
    { icon: Link2, t: t("step2t"), d: t("step2d") },
    { icon: FileText, t: t("step3t"), d: t("step3d") },
  ];
  const features = [
    { icon: AlertTriangle, t: t("feat1t"), d: t("feat1d") },
    { icon: Wrench, t: t("feat2t"), d: t("feat2d") },
    { icon: Gauge, t: t("feat3t"), d: t("feat3d") },
    { icon: User, t: t("feat4t"), d: t("feat4d") },
  ];
  const platforms = [
    { name: "Encar", d: t("encarD") },
    { name: "KBChachacha", d: t("kbD") },
    { name: "Kcar", d: t("kcarD") },
  ];
  const tiers = [
    { n: t("p1n"), d: t("p1d"), p: t("p1p"), per: t("p1per"), popular: false },
    { n: t("p2n"), d: t("p2d"), p: t("p2p"), per: t("p2per"), popular: false },
    { n: t("p3n"), d: t("p3d"), p: t("p3p"), per: t("p3per"), popular: true },
    { n: t("p4n"), d: t("p4d"), p: t("p4p"), per: t("p4per"), popular: false },
  ];
  const faqs = [
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
    { q: t("faq3q"), a: t("faq3a") },
    { q: t("faq4q"), a: t("faq4a") },
  ];

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Caranalizer — Korean Car Check",
    url: SITE_URL,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Telegram",
    description: t("metaDesc"),
    offers: tiers.map((x) => ({
      "@type": "Offer",
      name: x.n,
      price: x.p.replace(/[^\d]/g, "") || "0",
      priceCurrency: "USD",
      description: x.per,
    })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([softwareLd, faqLd]) }} />

      {/* Hero */}
      <section className="py-16 sm:py-24 border-b border-border-subtle">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-elevated border border-border-subtle text-xs uppercase tracking-wide text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-heading)] leading-tight mb-5">
              {t("h1a")} <span className="text-primary">{t("h1b")}</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8">{t("sub")}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="#free-check"
                className="inline-flex items-center justify-center gap-2 px-8 py-[15px] bg-primary text-white font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.04em] rounded-[10px] hover:bg-primary-hover transition-colors">
                {t("ctaTry")}
              </a>
              <a href="#how"
                className="inline-flex items-center justify-center gap-2 px-8 py-[15px] bg-transparent text-text border-[1.5px] border-border font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.04em] rounded-[10px] hover:border-primary hover:text-primary transition-colors">
                {t("ctaMore")}
              </a>
            </div>
            <div className="flex justify-center gap-10 mt-14 pt-8 border-t border-border-subtle">
              {[["stat1v", "stat1l"], ["stat2v", "stat2l"], ["stat3v", "stat3l"]].map(([v, l]) => (
                <div key={v} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-[family-name:var(--font-heading)]">{t(v)}</div>
                  <div className="text-xs text-text-muted uppercase tracking-wide mt-1">{t(l)}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Free check form */}
      <section id="free-check" className="py-16 sm:py-20 scroll-mt-16">
        <Container>
          <div className="max-w-2xl mx-auto space-y-8">
            {/*
              Выбор языка стоит здесь, перед формой: это единственная многоязычная
              страница сайта, и до заполнения заявки посетитель должен успеть
              переключиться на свой язык.
            */}
            <LanguageSwitcher />

            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">{t("formTitle")}</h2>
                <p className="text-text-secondary">{t("formSub")}</p>
              </div>
              <CheckLeadForm />
            </div>
          </div>
        </Container>
      </section>

      {/* Steps */}
      <section id="how" className="py-16 sm:py-20 bg-surface/30">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">{t("stepsTitle")}</h2>
            <p className="text-text-secondary">{t("stepsSub")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="h-full bg-elevated border border-border-subtle rounded-xl p-8 text-center">
                    <div className="text-5xl font-bold font-[family-name:var(--font-heading)] text-border mb-4">0{i + 1}</div>
                    <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-surface/50 border border-border-subtle flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-text mb-2">{s.t}</h3>
                    <p className="text-sm text-text-secondary">{s.d}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">{t("featTitle")}</h2>
            <p className="text-text-secondary">{t("featSub")}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex gap-4 bg-elevated border border-border-subtle rounded-xl p-6">
                  <div className="w-11 h-11 min-w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text mb-1">{f.t}</h3>
                    <p className="text-sm text-text-secondary">{f.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Example report */}
      <section className="py-16 sm:py-20 bg-surface/30 border-y border-border-subtle">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">{t("exTitle")}</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">{t("exSub")}</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Main data */}
            <div className="bg-elevated border border-border-subtle rounded-xl p-7">
              <div className="flex items-center gap-2 mb-1">
                <span>🚗</span>
                <span className="text-xl font-bold font-[family-name:var(--font-heading)] text-text">Kia Ray</span>
              </div>
              <div className="text-xs text-text-muted uppercase tracking-wide mb-6">Deluxe Special · Encar.com</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">{t("exMainData")}</div>
              <dl className="divide-y divide-border-subtle text-sm">
                {[
                  ["VIN", "KNACH811BDT050022"],
                  [t("exYear"), "2013"],
                  [t("exMileage"), "93 801 km"],
                  [t("exPrice"), "5 390 000 ₩"],
                  [t("exTrans"), t("exAuto")],
                  [t("exFuel"), t("exGasoline")],
                  [t("exEngine"), "1.0 L"],
                  [t("exColor"), t("exBlue")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5 gap-3">
                    <dt className="text-text-muted whitespace-nowrap">{k}</dt>
                    <dd className="font-medium text-text text-end">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {/* Insurance + inspection */}
            <div className="flex flex-col gap-6">
              <div className="bg-elevated border border-border-subtle rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-text">🔍 {t("exInsurance")}</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cta/10 text-cta">{t("exHasAccidents")}</span>
                </div>
                <div className="px-5 py-4 text-sm text-text-secondary space-y-2.5">
                  <div>⚠️ {t("exAtFault")}: <strong className="text-text">2</strong> — 5 140 820 ₩</div>
                  <div>⚠️ {t("exVictim")}: <strong className="text-text">1</strong> — 360 598 ₩</div>
                  <div className="text-xs text-text-muted pt-1">{t("exFirstReg")}: 18.01.2013</div>
                </div>
              </div>
              <div className="bg-elevated border border-border-subtle rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-text">🔧 {t("exTech")}</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success">✅ {t("exUnitsOk")}</span>
                </div>
                <div className="divide-y divide-border-subtle text-sm">
                  {[
                    ["🔴", t("exFender"), t("exReplace")],
                    ["🔴", t("exHood"), t("exReplace")],
                    ["🔴", t("exTrunk"), t("exReplace")],
                    ["⚠️", t("exSill"), t("exWeld")],
                    ["⚠️", t("exRearPanel"), t("exReplace")],
                  ].map(([icon, part, status], i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <span>{icon}</span>
                      <span className="flex-1 text-text">{part}</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cta/10 text-cta">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Platforms */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">{t("platTitle")}</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">{t("platSub")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {platforms.map((p) => (
              <div key={p.name} className="bg-elevated border border-border-subtle rounded-xl p-8 text-center">
                <div className="text-xl font-bold font-[family-name:var(--font-heading)] text-primary mb-3">{p.name}</div>
                <p className="text-sm text-text-secondary">{p.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">{t("priceTitle")}</h2>
            <p className="text-text-secondary">{t("priceSub")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((x, i) => (
              <div key={i} className={`relative flex flex-col bg-elevated border rounded-xl p-7 ${x.popular ? "border-primary" : "border-border-subtle"}`}>
                {x.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[11px] font-semibold uppercase tracking-wide">
                    {t("popular")}
                  </span>
                )}
                <div className="font-semibold text-text mb-1">{x.n}</div>
                <div className="text-xs text-text-muted mb-5">{x.d}</div>
                <div className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-1">{x.p}</div>
                <div className="text-sm text-text-muted mb-6">{x.per}</div>
                <a href={BOT} target="_blank" rel="noopener noreferrer"
                  className={`mt-auto text-center py-3 rounded-lg text-sm font-semibold transition-colors ${x.popular ? "bg-primary text-white hover:bg-primary-hover" : "border border-border text-text hover:border-primary hover:text-primary"}`}>
                  {t("priceStart")}
                </a>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Апселл: полный отчёт по VIN */}
      <section className="py-8">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-elevated border border-border rounded-2xl p-8">
            <div>
              <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">
                {t("reportLabel")}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-heading)] text-text mb-2">
                {t("reportTitle")}
              </h2>
              <p className="text-sm text-text-secondary max-w-xl">{t("reportDesc")}</p>
            </div>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap"
            >
              {t("reportCta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* Funnel to parts */}
      <section className="py-8">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-primary/10 to-elevated border border-primary/30 rounded-2xl p-8">
            <div>
              <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">{t("funnelLabel")}</div>
              <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-heading)] text-text mb-2">{t("funnelTitle")}</h2>
              <p className="text-sm text-text-secondary max-w-xl">{t("funnelDesc")}</p>
            </div>
            <a href={carsUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap">
              {t("funnelCta")}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-center mb-10">{t("faqTitle")}</h2>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {faqs.map((f, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-[family-name:var(--font-heading)] font-medium text-text">
                    {f.q}
                    <span className="ml-4 text-text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
