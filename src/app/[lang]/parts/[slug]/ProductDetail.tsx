"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useCart } from "@/providers/CartProvider";
import { getProductName, normalizeManufacturer } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Locale } from "@/i18n/routing";

interface ProductDetailProps {
  product: Product;
  compatibleModels: { brand: string; model: string }[];
  categoryName: string;
  labels: Record<string, string>;
}

export function ProductDetail({
  product,
  compatibleModels,
  categoryName,
  labels,
}: ProductDetailProps) {
  const locale = useLocale() as Locale;
  const { currency, rate } = useCurrency();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const name = getProductName(product.name_ru, product.name_en, product.name_ko, product.part_number, locale);
  const manufacturer = normalizeManufacturer(product.manufacturer);

  function handleAdd() {
    addItem({
      productId: product.id,
      partNumber: product.part_number,
      nameRu: product.name_ru,
      nameEn: product.name_en,
      priceKrw: product.price_krw,
      imageUrl: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <div className="relative aspect-square rounded-xl bg-elevated border border-border-subtle overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-dim">
            No image
          </div>
        )}
        {product.is_new && (
          <Badge variant="cta" className="absolute top-4 start-4 text-sm">
            {labels.new}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-text-dim font-mono mb-2">
            {labels.partNumber}: {product.part_number}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)]">
            {name}
          </h1>
        </div>

        <PriceDisplay
          priceKrw={product.price_krw}
          currency={currency}
          rate={rate}
          size="lg"
        />

        <Button
          variant={added ? "primary" : "cta"}
          size="lg"
          onClick={handleAdd}
          className="gap-2 w-full sm:w-auto"
        >
          {added ? (
            <>
              <Check className="h-5 w-5" />
              {labels.added}
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              {labels.addToCart}
            </>
          )}
        </Button>

        <div className="space-y-4 border-t border-border-subtle pt-6">
          {manufacturer && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{labels.manufacturer}</span>
              <span className="text-text">{manufacturer}</span>
            </div>
          )}
          {categoryName && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{labels.category}</span>
              <span className="text-text">{categoryName}</span>
            </div>
          )}
        </div>

        {compatibleModels.length > 0 && (
          <div className="border-t border-border-subtle pt-6">
            <h3 className="text-sm font-semibold text-text mb-3">
              {labels.compatibleModels}
            </h3>
            <div className="flex flex-wrap gap-2">
              {compatibleModels.map((m, i) => (
                <Badge key={i} variant="outline">
                  {m.brand} {m.model}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
