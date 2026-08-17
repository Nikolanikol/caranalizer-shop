import type { Metadata } from "next";
import { useTranslations, useLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ScrollReveal";
import { KmotorsBanner } from "@/components/KmotorsBanner";
import { CheckLeadForm } from "./CheckLeadForm";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ReportExampleAccordion } from "./ReportExampleAccordion";
import type { GuideLocale } from "@/lib/guides";
import type { Locale } from "@/i18n/routing";
import { VIN_PATHS, vinAlternates, type VinLocale } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  Gauge,
  Coins,
  Wrench,
  Droplets,
  ShieldAlert,
  Car,
  Users,
  FileText,
  ArrowRight,
  Check,
  Minus,
} from "lucide-react";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "report" });
  const title = t("metaTitle");
  const description = t("metaDesc");

  return {
    title,
    description,
    alternates: vinAlternates(lang),
    openGraph: { title, description, url: vinAlternates(lang).canonical },
  };
}

const WHAT_ICONS = [Gauge, Coins, Wrench, Droplets, ShieldAlert, Car, Users, FileText];
const COMPARE_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function VinCheckPage() {
  const t = useTranslations("report");
  // Строки бывшей страницы бесплатной проверки: страницы склеены, тексты переиспользуем
  const tc = useTranslations("check");
  const locale = useLocale() as GuideLocale;

  const faqs = [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq${n}q`), a: t(`faq${n}a`) }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: t("metaTitle"),
      serviceType: "Vehicle history report",
      description: t("metaDesc"),
      areaServed: ["KZ", "RU", "UZ"],
      provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      url: `${SITE_URL}/${locale}${VIN_PATHS[locale as VinLocale] ?? VIN_PATHS.ru}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-border-subtle">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-elevated border border-border-subtle text-xs uppercase tracking-wide text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-heading)] leading-tight mb-5">
              {t("h1a")} <span className="text-primary">{t("h1b")}</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8">
              {t("sub")}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="#order"
                className="inline-flex items-center justify-center gap-2 px-8 py-[15px] bg-primary text-white font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.04em] rounded-[10px] hover:bg-primary-hover transition-colors"
              >
                {t("ctaOrder")}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#example"
                className="inline-flex items-center justify-center gap-2 px-8 py-[15px] bg-transparent text-text border-[1.5px] border-border font-[family-name:var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.04em] rounded-[10px] hover:border-primary hover:text-primary transition-colors"
              >
                {t("ctaExample")}
              </a>
            </div>

            {/* Счётчики из бывшей страницы бесплатной проверки: тот же продукт, одна страница */}
            <div className="flex justify-center gap-8 sm:gap-10 mt-12 pt-8 border-t border-border-subtle">
              {[["stat1v", "stat1l"], ["stat2v", "stat2l"], ["stat3v", "stat3l"]].map(([v, l]) => (
                <div key={v} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-[family-name:var(--font-heading)]">
                    {tc(v)}
                  </div>
                  <div className="text-xs text-text-muted uppercase tracking-wide mt-1">{tc(l)}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Платформы — принимаем ссылку с любой из трёх */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">
              {tc("platTitle")}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">{tc("platSub")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Encar", d: tc("encarD") },
              { name: "KBChachacha", d: tc("kbD") },
              { name: "Kcar", d: tc("kcarD") },
            ].map((p) => (
              <div key={p.name} className="bg-elevated border border-border-subtle rounded-xl p-8 text-center">
                <div className="text-xl font-bold font-[family-name:var(--font-heading)] text-primary mb-3">
                  {p.name}
                </div>
                <p className="text-sm text-text-secondary">{p.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Что показывает отчёт */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">
              {t("whatTitle")}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">{t("whatSub")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHAT_ICONS.map((Icon, i) => (
              <ScrollReveal key={i} delay={(i % 4) * 0.08}>
                <div className="h-full bg-elevated border border-border-subtle rounded-xl p-6">
                  <div className="w-11 h-11 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text mb-2 leading-snug">
                    {t(`w${i + 1}t`)}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {t(`w${i + 1}d`)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Пример отчёта */}
      <section id="example" className="py-16 sm:py-20 bg-surface/30 border-y border-border-subtle scroll-mt-16">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">
              {t("exampleTitle")}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">{t("exampleSub")}</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <ReportExampleAccordion lang={locale} />
          </div>
        </Container>
      </section>

      {/* Сравнение бесплатной и полной проверки */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">
              {t("compareTitle")}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">{t("compareSub")}</p>
          </div>

          <div className="max-w-3xl mx-auto overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-elevated">
                  <th className="px-5 py-4 text-start font-semibold text-text-muted text-xs uppercase tracking-wide">
                    {t("colFeature")}
                  </th>
                  <th className="px-5 py-4 text-start font-semibold text-text-muted text-xs uppercase tracking-wide">
                    {t("colFree")}
                  </th>
                  <th className="px-5 py-4 text-start font-semibold text-primary text-xs uppercase tracking-wide">
                    {t("colFull")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {COMPARE_ROWS.map((n) => {
                  const free = t(`cmp${n}free`);
                  const isNo = free === t("cmpNo");
                  return (
                    <tr key={n} className="bg-base-darker/40">
                      <td className="px-5 py-3.5 text-text">{t(`cmp${n}`)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            isNo ? "text-text-dim" : "text-text-secondary"
                          }`}
                        >
                          {isNo ? (
                            <Minus className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 shrink-0 text-success" />
                          )}
                          {free}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-text font-medium">
                          <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                          {t(`cmp${n}full`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="max-w-3xl mx-auto mt-6 text-center">
            {/* Раньше вела на отдельную страницу бесплатной проверки; теперь это
                тот же вариант в форме ниже, поэтому просто якорь. */}
            <a
              href="#order"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {t("colFree")}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* Как заказать */}
      <section className="py-16 sm:py-20 bg-surface/30 border-y border-border-subtle">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">
              {t("howTitle")}
            </h2>
            <p className="text-text-secondary">{t("howSub")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n, i) => (
              <ScrollReveal key={n} delay={i * 0.08}>
                <div className="h-full bg-elevated border border-border-subtle rounded-xl p-6">
                  <div className="text-4xl font-bold font-[family-name:var(--font-heading)] text-transparent [-webkit-text-stroke:1px_var(--color-border)] leading-none mb-4">
                    0{n}
                  </div>
                  <h3 className="font-semibold text-text mb-2">{t(`s${n}t`)}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{t(`s${n}d`)}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Форма заявки */}
      <section id="order" className="py-16 sm:py-20 scroll-mt-16">
        <Container>
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Единственная многоязычная страница сайта — выбор языка стоит до формы */}
            <LanguageSwitcher />
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] mb-3">
                {t("formTitle")}
              </h2>
              <p className="text-text-secondary">{t("formSub")}</p>
            </div>
            <CheckLeadForm defaultSource="report" />
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-surface/30 border-y border-border-subtle">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-center mb-10">
              {t("faqTitle")}
            </h2>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {faqs.map((f, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-[family-name:var(--font-heading)] font-medium text-text">
                    {f.q}
                    <span className="ml-4 text-text-muted transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* K-Axis */}
      <section className="py-14">
        <Container className="max-w-3xl space-y-4">
          <KmotorsBanner variant="cars" placement="report" />
          <KmotorsBanner variant="calc" placement="report" compact />
        </Container>
      </section>
    </>
  );
}
