"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/PriceDisplay";
import { generatePartSlug } from "@/lib/slug";
import { getProductName } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Locale } from "@/i18n/routing";

interface ProductCardProps {
  product: Product;
  currency: string;
  rate: number;
  onAddToCart?: () => void;
}

export function ProductCard({
  product,
  currency,
  rate,
  onAddToCart,
}: ProductCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("product");
  const name = getProductName(product.name_ru, product.name_en, product.name_ko, product.part_number, locale);
  const slug = generatePartSlug(product.part_number, product.name_ru, product.id);

  return (
    <div className="group rounded-xl border border-border-subtle bg-elevated hover:border-primary/30 transition-all duration-200 overflow-hidden flex flex-col">
      <Link href={`/parts/${slug}`} className="relative aspect-square bg-surface/30 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-dim text-sm">
            No image
          </div>
        )}
        {product.is_new && (
          <Badge variant="cta" className="absolute top-2 start-2">
            {t("new")}
          </Badge>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-xs text-text-dim font-mono">{product.part_number}</p>
        <Link href={`/parts/${slug}`}>
          <h3 className="text-sm font-medium text-text line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <PriceDisplay
            priceKrw={product.price_krw}
            currency={currency}
            rate={rate}
            size="sm"
          />
          {onAddToCart && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart();
              }}
              className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors shrink-0 cursor-pointer"
              aria-label={t("addToCart")}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
