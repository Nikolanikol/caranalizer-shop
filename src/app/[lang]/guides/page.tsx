import type { Metadata } from "next";
import { useTranslations, useLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { GUIDES, type GuideLocale } from "@/lib/guides";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { mainAlternates, mainUrl } from "@/lib/seo";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "guides" });
  const title = `${t("title")} | Caranalizer`;
  const description = t("metaDesc");

  return {
    title,
    description,
    alternates: mainAlternates("/guides"),
    openGraph: { title, description, url: mainUrl("/guides") },
  };
}

export default async function GuidesIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  // Язык сообщаем next-intl явно: иначе `useTranslations` ниже читает заголовки запроса,
  // и страница уходит в динамический рендер. Тело вынесено в синхронный компонент —
  // хуки в асинхронном серверном компоненте вызывать нельзя.
  const { lang } = await params;
  setRequestLocale(lang);
  return <GuidesIndexContent />;
}

function GuidesIndexContent() {
  const t = useTranslations("guides");
  const locale = useLocale() as GuideLocale;

  return (
    <section className="py-14 sm:py-20">
      <Container className="max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-heading)] mb-4">
          {t("title")}
        </h1>
        <p className="text-base sm:text-lg text-text-secondary mb-12 max-w-2xl">{t("sub")}</p>

        <div className="grid sm:grid-cols-2 gap-6">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group flex flex-col h-full bg-elevated border border-border rounded-2xl p-7 transition-all duration-300 hover:border-primary hover:-translate-y-1"
            >
              <BookOpen className="w-6 h-6 text-primary mb-4" />
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {g.title[locale]}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed flex-1">
                {g.teaser[locale]}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-4">
                {t("readMore")}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
