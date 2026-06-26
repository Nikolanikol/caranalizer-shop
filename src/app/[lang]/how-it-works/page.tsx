import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Search, ShoppingCart, MessageCircle, Truck } from "lucide-react";
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
    ru: "Как это работает — заказ запчастей из Кореи | Caranalizer",
    en: "How It Works — Order Korean Car Parts | Caranalizer",
    ar: "كيف يعمل — طلب قطع غيار السيارات الكورية | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "4 простых шага: найдите запчасть, оформите заказ, получите подтверждение и дождитесь доставки из Кореи.",
    en: "4 simple steps: find the part, place your order, get confirmation, and receive delivery from Korea.",
    ar: "4 خطوات بسيطة: ابحث عن القطعة، أرسل الطلب، احصل على التأكيد، واستلم التوصيل من كوريا.",
  };

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}/how-it-works`])),
      canonical: `${BASE}/${lang}/how-it-works`,
    },
  };
}

const STEP_ICONS = [Search, ShoppingCart, MessageCircle, Truck];

export default function HowItWorksPage() {
  const t = useTranslations("howItWorks");

  const steps = [1, 2, 3, 4].map((n) => ({
    title: t(`step${n}Title`),
    desc: t(`step${n}Desc`),
    Icon: STEP_ICONS[n - 1],
  }));

  return (
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
  );
}
