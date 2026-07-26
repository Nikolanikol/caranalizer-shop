import type { Metadata } from "next";
import { useTranslations, useLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Search, FileText, MessageCircle, Truck } from "lucide-react";
import { DeliveryMap } from "@/components/DeliveryMap";
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
    ru: "Как мы работаем — проверка и покупка авто из Кореи | Caranalizer",
    en: "How It Works — Korean Car Check & Purchase | Caranalizer",
    ar: "كيف نعمل — فحص وشراء السيارات من كوريا | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "4 шага: заявка на проверку, бесплатный мини-отчёт, полная проверка и подбор, покупка и доставка через K-Axis.",
    en: "4 steps: check request, free mini-report, full check and sourcing, purchase and delivery via K-Axis.",
    ar: "4 خطوات: طلب الفحص، تقرير مصغر مجاني، فحص كامل واختيار، شراء وتوصيل عبر K-Axis.",
  };

  const title = titles[lang];
  const description = descriptions[lang];

  return {
    title,
    description,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/how-it-works`])),
      canonical: `${BASE}/${lang}/how-it-works`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE}/${lang}/how-it-works`,
    },
  };
}

const STEP_ICONS = [Search, FileText, MessageCircle, Truck];

export default function HowItWorksPage() {
  const t = useTranslations("howItWorks");
  const locale = useLocale();

  const steps = [1, 2, 3, 4].map((n) => ({
    title: t(`step${n}Title`),
    desc: t(`step${n}Desc`),
    Icon: STEP_ICONS[n - 1],
  }));

  const deliveryTitle = t("deliveryTitle");
  const deliveryDesc = t("deliveryDesc");

  return (
    <>
      <section className="py-8">
        <Container className="max-w-4xl">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-12">
            {t("title")}
          </h1>
          <div className="grid gap-8 sm:grid-cols-2">
            {steps.map(({ title, desc, Icon }, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-border-subtle bg-elevated p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{title}</h3>
                  <p className="text-sm text-text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 border-t border-border-subtle">
        <Container className="max-w-5xl">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase mb-2">
            {deliveryTitle}
          </h2>
          <div className="w-10 h-0.5 bg-primary mb-4" />
          <p className="text-text-muted mb-8">{deliveryDesc}</p>
          <DeliveryMap locale={locale} />
        </Container>
      </section>

    </>
  );
}
