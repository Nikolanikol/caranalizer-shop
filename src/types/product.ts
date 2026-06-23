export interface Product {
  id: number;
  part_number: string;
  name_ru: string;
  name_en: string;
  name_ko: string | null;
  price_krw: number;
  image_url: string | null;
  is_new: boolean;
  weight_kg: number | null;
  manufacturer: string | null;
  category_id: number | null;
  subcategory_id: number | null;
}

export interface ProductWithRelations extends Product {
  category?: { id: number; slug: string; name_ru: string; name_en: string } | null;
  subcategory?: { id: number; slug: string; name_ru: string; name_en: string } | null;
  compatible_models?: { brand: string; model: string }[];
}

export interface CatalogFilters {
  q?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  model?: string;
  min?: string;
  max?: string;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: string;
}

export interface CatalogResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    brands: { slug: string; name: string; count: number }[];
    categories: { slug: string; name: string; count: number }[];
  };
}
