"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import type { Locale } from "@/i18n/routing";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const { items, totalItems, totalKrw, updateQty, removeItem } = useCart();
  const { currency, rate } = useCurrency();

  if (items.length === 0) {
    return (
      <section className="py-8">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-8">
            {t("title")}
          </h1>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <ShoppingCart className="h-16 w-16 text-text-dim" />
            <p className="text-lg text-text-muted">{t("empty")}</p>
            <p className="text-sm text-text-dim">{t("emptyDesc")}</p>
            <Link href="/catalog">
              <Button variant="primary">{t("goToCatalog")}</Button>
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-8">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-8">
          {t("title")} ({totalItems})
        </h1>

        <div className="space-y-4">
          {items.map((item) => {
            const name = locale === "ru" ? item.nameRu : item.nameEn;
            return (
              <div
                key={item.productId}
                className="flex gap-4 rounded-xl border border-border-subtle bg-elevated p-4"
              >
                <div className="relative w-20 h-20 rounded-lg bg-surface/30 shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-text-dim text-xs">
                      No img
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-dim font-mono">{item.partNumber}</p>
                  <p className="text-sm font-medium text-text truncate">{name}</p>
                  <PriceDisplay
                    priceKrw={item.priceKrw * item.quantity}
                    currency={currency}
                    rate={rate}
                    size="sm"
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col items-end justify-between shrink-0">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-text-dim hover:text-error transition-colors cursor-pointer"
                    aria-label={t("remove")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="p-1 rounded-md bg-surface/50 text-text-secondary hover:text-text cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-medium text-text w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="p-1 rounded-md bg-surface/50 text-text-secondary hover:text-text cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-border-subtle bg-elevated p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">{t("total")}</p>
            <PriceDisplay
              priceKrw={totalKrw}
              currency={currency}
              rate={rate}
              size="lg"
            />
          </div>
          <Link href="/checkout">
            <Button variant="cta" size="lg">
              {t("checkout")}
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
