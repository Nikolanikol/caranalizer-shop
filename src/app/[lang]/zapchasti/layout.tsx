import { notFound } from "next/navigation";
import { CartProvider } from "@/components/shop/cart-context";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { ShopBar } from "@/components/shop/shop-bar";
import { SHOP_LOCALE } from "@/lib/shop/urls";

/**
 * Раздел запчастей. Здесь и только здесь живёт корзина: провайдер и выдвижная панель
 * подняты не в корневой layout намеренно — иначе состояние корзины и её localStorage
 * грузились бы на страницах проверки VIN, которым магазин не нужен.
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
    <CartProvider>
      <ShopBar />
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
