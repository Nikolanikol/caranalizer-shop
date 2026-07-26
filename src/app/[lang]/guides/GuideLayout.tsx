// Общий каркас статьи-гайда: hero, секции, FAQ, CTA на бесплатную проверку
// и на K-Axis, блок «читайте также». JSON-LD Article + FAQPage собирается
// из тех же данных, что и вёрстка.
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { GUIDES, type GuideLocale } from "@/lib/guides";
import { KmotorsBanner, type KmotorsBannerVariant } from "@/components/KmotorsBanner";
import { ArrowRight, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";

export interface GuideSection {
  h: string;
  p?: string[];
  list?: string[];
}

export interface GuideContent {
  intro: string[];
  sections: GuideSection[];
  faq: { q: string; a: string }[];
}

export function GuideLayout({
  slug,
  lang,
  content,
  bannerVariant = "parts",
  showReportCta = false,
}: {
  slug: string;
  lang: GuideLocale;
  content: GuideContent;
  /** Какой баннер K-Axis показать в середине статьи */
  bannerVariant?: KmotorsBannerVariant;
  /** Добавить блок с переходом на платный отчёт по VIN */
  showReportCta?: boolean;
}) {
  const t = useTranslations("guides");
  const tc = useTranslations("check");
  const meta = GUIDES.find((g) => g.slug === slug)!;
  const related = GUIDES.filter((g) => g.slug !== slug).slice(0, 3);
  const kmUrl = `https://www.kmotors.shop/ru/parts?utm_source=caranalizer&utm_medium=guide&utm_campaign=${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.title[lang],
      description: meta.teaser[lang],
      inLanguage: lang,
      mainEntityOfPage: `${BASE}/${lang}/guides/${slug}`,
      author: { "@type": "Organization", name: "Caranalizer", url: BASE },
      publisher: { "@type": "Organization", name: "Caranalizer", url: BASE },
    },
    content.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-14 sm:py-20 border-b border-border-subtle">
        <Container className="max-w-3xl">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors mb-6"
          >
            <BookOpen className="w-4 h-4" />
            {t("title")}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-heading)] leading-tight mb-5">
            {meta.title[lang]}
          </h1>
          {content.intro.map((p, i) => (
            <p key={i} className="text-base sm:text-lg text-text-secondary leading-relaxed mb-4">
              {p}
            </p>
          ))}
        </Container>
      </section>

      {/* Body */}
      <section className="py-12">
        <Container className="max-w-3xl">
          {content.sections.map((s, i) => (
            <div key={i}>
              <div className="mb-10">
                <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-heading)] mb-4">
                  {s.h}
                </h2>
                {s.p?.map((p, j) => (
                  <p key={j} className="text-[15px] text-text-secondary leading-relaxed mb-3">
                    {p}
                  </p>
                ))}
                {s.list && (
                  <ul className="space-y-2 mt-3">
                    {s.list.map((item, j) => (
                      <li key={j} className="flex gap-3 text-[15px] text-text-secondary leading-relaxed">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Баннер K-Axis в середине статьи (после второй секции) */}
              {i === Math.min(1, content.sections.length - 1) && (
                <div className="mb-10">
                  <KmotorsBanner variant={bannerVariant} placement={`guide-${slug}`} compact />
                </div>
              )}
            </div>
          ))}
        </Container>
      </section>

      {/* CTA: free check */}
      <section className="py-8">
        <Container className="max-w-3xl">
          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-gradient-to-br from-primary/10 to-cta/5 border border-primary/20 p-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 shrink-0">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-start">
              <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] mb-1">
                {t("ctaCheckTitle")}
              </h2>
              <p className="text-sm text-text-muted">{t("ctaCheckText")}</p>
            </div>
            <Link
              href="/check"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cta text-base-darker font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {t("ctaCheckBtn")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* Переход на платный отчёт по VIN */}
      {showReportCta && (
        <section className="py-4">
          <Container className="max-w-3xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-elevated border border-border rounded-2xl p-7">
              <div className="text-center sm:text-start">
                <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-1.5">
                  {tc("reportLabel")}
                </div>
                <h2 className="text-lg font-bold font-[family-name:var(--font-heading)] text-text mb-1">
                  {tc("reportTitle")}
                </h2>
                <p className="text-sm text-text-muted max-w-md">{tc("reportDesc")}</p>
              </div>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap"
              >
                {tc("reportCta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* FAQ */}
      {content.faq.length > 0 && (
        <section className="py-12">
          <Container className="max-w-3xl">
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {content.faq.map((f, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-[family-name:var(--font-heading)] font-medium text-text">
                    {f.q}
                    <span className="ml-4 text-text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA: K-Axis */}
      <section className="py-8">
        <Container className="max-w-3xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-elevated border border-border rounded-2xl p-8">
            <div className="text-center sm:text-start">
              <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] mb-1">
                {t("ctaKmTitle")}
              </h2>
              <p className="text-sm text-text-muted max-w-md">{t("ctaKmText")}</p>
            </div>
            <a
              href={kmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap"
            >
              {t("ctaKmBtn")}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* Related */}
      <section className="py-14">
        <Container className="max-w-3xl">
          <h2 className="text-lg font-bold font-[family-name:var(--font-heading)] mb-6">
            {t("related")}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group flex flex-col bg-elevated border border-border-subtle rounded-xl p-5 transition-all hover:border-primary"
              >
                <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors leading-snug">
                  {g.title[lang]}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mt-3">
                  {t("readMore")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

/** Единые metadata для страницы гайда (canonical + hreflang по всем локалям). */
export function guideMetadata(slug: string, lang: string) {
  const meta = GUIDES.find((g) => g.slug === slug)!;
  const l = (["ru", "en", "ar"].includes(lang) ? lang : "ru") as GuideLocale;
  const title = `${meta.title[l]} | Caranalizer`;
  const description = meta.teaser[l];
  const path = `/guides/${slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${lang}${path}`,
      languages: {
        ru: `${BASE}/ru${path}`,
        en: `${BASE}/en${path}`,
        ar: `${BASE}/ar${path}`,
        "x-default": `${BASE}/ru${path}`,
      },
    },
    openGraph: { title, description, url: `${BASE}/${lang}${path}` },
  };
}
