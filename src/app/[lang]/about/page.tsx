import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
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

  return (
    <section className="py-8">
      <Container className="max-w-4xl">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-8">
          {t("title")}
        </h1>
        <p className="text-text-secondary text-lg">{t("description")}</p>
      </Container>
    </section>
  );
}
