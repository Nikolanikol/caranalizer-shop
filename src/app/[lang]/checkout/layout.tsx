import type { Metadata } from "next";

const titles: Record<string, string> = {
  ru: "Оформление заказа | Caranalizer",
  en: "Checkout | Caranalizer",
  ar: "إرسال الطلب | Caranalizer",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: titles[lang] ?? titles.en,
    robots: { index: false },
  };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
