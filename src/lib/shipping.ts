import {
  EMS_WEIGHTS,
  EMS_RATES,
  EMS_COUNTRY_NAMES,
  EMS_ZONE_COUNTRIES,
  type EmsCountryCode,
  type EmsZone,
} from "@/data/ems-rates";

export interface ShippingCountry {
  id: string; // EmsCountryCode or "Z1:Cambodia" etc.
  code: EmsCountryCode | EmsZone;
  en: string;
  ru: string;
  fuelPerKg?: number;
}

// Build unified list of all countries
export function getAllShippingCountries(): ShippingCountry[] {
  const list: ShippingCountry[] = [];

  // Direct EMS countries
  for (const [code, names] of Object.entries(EMS_COUNTRY_NAMES)) {
    list.push({ id: code, code: code as EmsCountryCode, en: names.en, ru: names.ru });
  }

  // Zone countries
  const zones: EmsZone[] = ["Z1", "Z2", "Z3", "Z4"];
  for (const zone of zones) {
    for (const country of EMS_ZONE_COUNTRIES[zone]) {
      list.push({
        id: `${zone}:${country.en}`,
        code: zone,
        en: country.en,
        ru: country.ru,
        fuelPerKg: country.fuelPerKg,
      });
    }
  }

  return list.sort((a, b) => a.ru.localeCompare(b.ru, "ru"));
}

// Find weight index (ceiling — round up to next available weight)
function getWeightIndex(weightKg: number): number {
  for (let i = 0; i < EMS_WEIGHTS.length; i++) {
    if (EMS_WEIGHTS[i] >= weightKg) return i;
  }
  return EMS_WEIGHTS.length - 1;
}

// Calculate shipping cost in KRW
export function calculateShipping(country: ShippingCountry, weightKg: number): number {
  const clampedWeight = Math.max(0.5, Math.min(30, weightKg));
  const idx = getWeightIndex(clampedWeight);
  const baseRate = EMS_RATES[country.code][idx];
  const fuel = country.fuelPerKg ? country.fuelPerKg * clampedWeight : 0;
  return baseRate + fuel;
}

// Key weights for the table
export const TABLE_WEIGHTS = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30];

export function getTableRates(country: ShippingCountry): { weight: number; krw: number }[] {
  return TABLE_WEIGHTS.map((w) => ({
    weight: w,
    krw: calculateShipping(country, w),
  }));
}
