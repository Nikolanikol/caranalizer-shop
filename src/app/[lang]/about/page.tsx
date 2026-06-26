import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Camera, Shield, MapPin, TrendingDown, CheckCircle } from "lucide-react";
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
      <section className="relative py-20 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.05)_0%,transparent_60%)]" />
        <Container className="max-w-4xl relative">
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,52px)] font-bold tracking-tight uppercase mb-6">
            {t("hero")}
          </h1>
          <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
            {t("heroSub")}
          </p>
        </Container>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border bg-elevated/30">
        <Container className="max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <span className="font-[family-name:var(--font-heading)] text-3xl font-bold text-primary block">
                  {s.value}
                </span>
                <span className="text-xs text-text-dim uppercase tracking-wide mt-1 block">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why us */}
      <section className="py-16 border-b border-border">
        <Container className="max-w-4xl">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase mb-10">
            {t("whyTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyUs.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 p-6 rounded-xl border border-border bg-elevated"
                >
                  <div className="w-10 h-10 min-w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-[family-name:var(--font-heading)] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Location + Mobis factory image */}
      <section className="py-16 border-b border-border">
        <Container className="max-w-4xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase mb-4">
                {t("locationTitle")}
              </h2>
              <p className="text-text-muted leading-relaxed">{t("locationDesc")}</p>
            </div>
            <div className="rounded-xl overflow-hidden border border-border aspect-video bg-elevated flex items-center justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Hyundai_Mobis_headquarters.jpg/1280px-Hyundai_Mobis_headquarters.jpg"
                alt="Hyundai Mobis factory in Asan, South Korea"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Guarantees */}
      <section className="py-16">
        <Container className="max-w-4xl">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase mb-8">
            {t("guaranteeTitle")}
          </h2>
          <div className="space-y-4">
            {guarantees.map((g) => (
              <div key={g} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-text-muted">{g}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
