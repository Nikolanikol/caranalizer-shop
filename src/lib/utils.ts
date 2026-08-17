import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Склейка классов Tailwind с разрешением конфликтов.
 *
 * Единственное, что здесь осталось. Рядом жили `normalizeManufacturer`,
 * `getCategoryName` и `getProductName` — они работали с моделью товара первого
 * магазина (`name_ru`, `part_number`, `category_id`), которой больше нет.
 * Настоящая модель — `types/part.ts`, названия в ней уже нормализованы
 * скриптом `normalize:parts`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
