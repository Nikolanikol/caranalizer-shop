import { notFound } from "next/navigation";
import { ShopBar } from "@/components/shop/shop-bar";
import { SHOP_LOCALE } from "@/lib/shop/urls";

/**
 * Раздел запчастей.
 *
 * Корзины здесь больше нет: её кнопка переехала в шапку сайта, а шапка лежит выше
 * по дереву, поэтому провайдер и выдвижная панель поднялись в `[lang]/layout.tsx`.
 * Плата за это — чтение localStorage на всех страницах; взамен отложенные детали
 * доступны с любой страницы, а не только изнутри раздела.
 *
 * Раздел одноязычный. Каталог, названия деталей и состояние приходят от донора
 * по-русски, переводов нет, и отдавать англоязычному посетителю русскую витрину —
 * значит показывать ему страницу, которой он не сможет пользоваться. Поэтому
 * на остальных языках раздела просто не существует: 404, а не пустая оболочка.
 */
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (lang !== SHOP_LOCALE) notFound();

  return (
    <>
      <ShopBar />
      {children}
    </>
  );
}
