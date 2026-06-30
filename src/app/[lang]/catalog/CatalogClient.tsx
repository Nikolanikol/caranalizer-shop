"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useCart } from "@/providers/CartProvider";
import type { Product } from "@/types/product";

interface FacetItem {
  slug: string;
  name: string;
  count: number;
}

interface InitialData {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    categories: FacetItem[];
  };
}

export function CatalogClient({ initialData }: { initialData?: InitialData }) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currency, rate } = useCurrency();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>(initialData?.products ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [categories, setCategories] = useState<FacetItem[]>(initialData?.facets.categories ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(searchParams.get("page") ?? "1");
  const cat = searchParams.get("cat") ?? "";
  const sort = searchParams.get("sort") ?? "default";
  const q = searchParams.get("q") ?? "";
  const min = searchParams.get("min") ?? "";
  const max = searchParams.get("max") ?? "";

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (overrides.page === undefined && Object.keys(overrides).some((k) => k !== "page")) {
        params.delete("page");
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [searchParams, pathname]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (cat) params.set("cat", cat);
    if (q) params.set("q", q);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (sort !== "default") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    params.set("lang", locale);

    fetch(`/api/parts/products?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setCategories(data.facets?.categories ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLoading(false);
      });

    return () => controller.abort();
  }, [cat, q, min, max, sort, page]);

  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => setSearchInput(q), [q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q: searchInput, page: "" }));
  }

  function handleAddToCart(product: Product) {
    addItem({
      productId: product.id,
      partNumber: product.part_number,
      nameRu: product.name_ru,
      nameEn: product.name_en,
      priceKrw: product.price_krw,
      imageUrl: product.image_url,
    });
  }

  const hasActiveFilters = !!(cat || q || min || max);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Mobile filter toggle */}
      <button
        className="lg:hidden flex items-center gap-2 text-sm text-text-secondary hover:text-text cursor-pointer"
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t("filters")}
      </button>

      {/* Sidebar */}
      <aside
        className={`w-full lg:w-64 shrink-0 space-y-6 ${
          filtersOpen ? "block" : "hidden lg:block"
        }`}
      >
        <form onSubmit={handleSearch} className="relative">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search")}
            className="pe-10"
          />
          <button
            type="submit"
            className="absolute end-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text cursor-pointer"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        {categories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">{t("allCategories")}</h3>
            <div className="space-y-1">
              <button
                onClick={() => router.push(buildUrl({ cat: "", page: "" }))}
                className={`block w-full text-start text-sm px-2 py-1 rounded cursor-pointer ${
                  !cat ? "text-primary bg-primary/10" : "text-text-secondary hover:text-text hover:bg-elevated"
                }`}
              >
                {t("allCategories")}
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => router.push(buildUrl({ cat: c.slug, page: "" }))}
                  className={`flex w-full items-center justify-between text-start text-sm px-2 py-1 rounded cursor-pointer ${
                    cat === c.slug ? "text-primary bg-primary/10" : "text-text-secondary hover:text-text hover:bg-elevated"
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-text-dim">{c.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-text mb-2">{t("priceRange")}</h3>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={t("from")}
              value={min}
              onChange={(e) => router.push(buildUrl({ min: e.target.value, page: "" }))}
              className="text-xs"
            />
            <Input
              type="number"
              placeholder={t("to")}
              value={max}
              onChange={(e) => router.push(buildUrl({ max: e.target.value, page: "" }))}
              className="text-xs"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(pathname)}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            {t("clearFilters")}
          </Button>
        )}
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-sm text-text-muted">
            {t("results", { count: total })}
          </p>
          <Select
            value={sort}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value, page: "" }))}
            className="w-auto min-w-40"
          >
            <option value="default">{t("sortDefault")}</option>
            <option value="price_asc">{t("sortPriceAsc")}</option>
            <option value="price_desc">{t("sortPriceDesc")}</option>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border-subtle bg-elevated overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-6 w-24 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-text-muted">{t("noResults")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  currency={currency}
                  rate={rate}
                  onAddToCart={() => handleAddToCart(p)}
                />
              ))}
            </div>
            <div className="mt-8">
              <Pagination total={total} pageSize={24} currentPage={page} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
