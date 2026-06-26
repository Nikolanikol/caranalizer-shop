import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const KO_MANUFACTURER_MAP: Record<string, string> = {
  "현대모비스": "Hyundai Mobis",
  "현대": "Hyundai",
  "기아": "Kia",
  "제네시스": "Genesis",
};

export function normalizeManufacturer(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (KO_MANUFACTURER_MAP[trimmed]) return KO_MANUFACTURER_MAP[trimmed];
  if (/[가-힣]/.test(trimmed)) return null;
  return trimmed;
}

export function getProductName(
  name_ru: string | null | undefined,
  name_en: string | null | undefined,
  name_ko: string | null | undefined,
  part_number: string,
  locale: string
): string {
  if (locale === "ru") return name_ru || name_en || name_ko || part_number;
  if (locale === "ar") return name_en || name_ru || part_number;
  return name_en || name_ru || name_ko || part_number;
}
