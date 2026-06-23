export type CurrencyCode = "USD" | "EUR" | "RUB" | "AED" | "KZT" | "UZS";

export const CURRENCIES: {
  code: CurrencyCode;
  symbol: string;
  label: string;
}[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "RUB", symbol: "₽", label: "Рубль" },
  { code: "AED", symbol: "د.إ", label: "Dirham" },
  { code: "KZT", symbol: "₸", label: "Тенге" },
  { code: "UZS", symbol: "сўм", label: "Сўм" },
];

export const LANG_DEFAULT_CURRENCY: Record<string, CurrencyCode> = {
  ru: "RUB",
  en: "USD",
  ar: "AED",
};

export interface CurrencyRates {
  USD: number;
  EUR: number;
  RUB: number;
  AED: number;
  KZT: number;
  UZS: number;
  updatedAt: string;
}

const FALLBACK_RATES: CurrencyRates = {
  USD: 0.00066,
  EUR: 0.00059,
  RUB: 0.058,
  AED: 0.0024,
  KZT: 0.33,
  UZS: 8.5,
  updatedAt: "fallback",
};

export async function getCurrencyRates(): Promise<CurrencyRates> {
  try {
    const [frankfurtRes, altRes] = await Promise.all([
      fetch(
        "https://api.frankfurter.dev/v1/latest?from=KRW&to=USD,EUR,RUB",
        { next: { revalidate: 86400 } }
      ),
      fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/krw.json",
        { next: { revalidate: 86400 } }
      ),
    ]);

    const rates = { ...FALLBACK_RATES };

    if (frankfurtRes.ok) {
      const data = await frankfurtRes.json();
      if (data.rates?.USD) rates.USD = data.rates.USD;
      if (data.rates?.EUR) rates.EUR = data.rates.EUR;
      if (data.rates?.RUB) rates.RUB = data.rates.RUB;
    }

    if (altRes.ok) {
      const data = await altRes.json();
      const krw = data.krw;
      if (krw?.aed) rates.AED = krw.aed;
      if (krw?.kzt) rates.KZT = krw.kzt;
      if (krw?.uzs) rates.UZS = krw.uzs;
    }

    rates.updatedAt = new Date().toISOString().slice(0, 10);
    return rates;
  } catch {
    return FALLBACK_RATES;
  }
}
