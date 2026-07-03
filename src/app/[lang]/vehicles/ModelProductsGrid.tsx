"use client";

import { ProductCard } from "@/components/ProductCard";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useCart } from "@/providers/CartProvider";
import type { Product } from "@/types/product";

export function ModelProductsGrid({ products }: { products: Product[] }) {
  const { currency, rate } = useCurrency();
  const { addItem } = useCart();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          currency={currency}
          rate={rate}
          onAddToCart={() =>
            addItem({
              productId: p.id,
              partNumber: p.part_number,
              nameRu: p.name_ru,
              nameEn: p.name_en,
              priceKrw: p.price_krw,
              imageUrl: p.image_url,
            })
          }
        />
      ))}
    </div>
  );
}
