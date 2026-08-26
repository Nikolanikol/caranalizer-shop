import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ContactClient } from "./ContactClient";
import { mainAlternates, mainUrl } from "@/lib/seo";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang as Locale, namespace: "contact" });

  const titles: Record<string, string> = {
    ru: "Контакты — проверка авто и б/у запчасти из Кореи",
    en: "Contact Us — Order Korean Car Parts | Caranalizer",
    ar: "اتصل بنا — طلب قطع غيار السيارات الكورية | Caranalizer",
  };
  const descriptions: Record<string, string> = {
    ru: "Свяжитесь с нами: проверка автомобиля по VIN, подбор б/у запчастей с корейских разборов, расчёт доставки. Отвечаем в Telegram и WhatsApp.",
    en: "Contact us to order genuine Hyundai, Kia, Genesis parts from Korea. Fast response, expert help finding the right part.",
    ar: "تواصل معنا لطلب قطع غيار هيونداي وكيا وجينيسيس الأصلية من كوريا. رد سريع ومساعدة في اختيار القطعة المناسبة.",
  };

  const title = titles[lang] ?? t("title");
  const description = descriptions[lang];

  return {
    title,
    description,
    alternates: mainAlternates("/contact"),
    openGraph: {
      title,
      description,
      url: mainUrl("/contact"),
    },
  };
}

export default function ContactPage() {
  return <ContactClient />;
}
