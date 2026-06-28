import type { Metadata } from "next";

const titles: Record<string, string> = {
  ru: "Корзина | Caranalizer",
  en: "Cart | Caranalizer",
  ar: "السلة | Caranalizer",
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

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
