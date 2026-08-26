import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Склейка классов Tailwind с разрешением конфликтов.
 *
 * Единственное, что здесь осталось. Рядом жили `normalizeManufacturer`,
 * `getCategoryName` и `getProductName` — они работали с моделью товара первого
 * магазина (`name_ru`, `part_number`, `category_id`), которой больше нет.
 * Настоящая модель — `types/part.ts`: деталь и экземпляр разведены, данные приходят
 * из Supabase через `lib/shop/catalog.ts`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
