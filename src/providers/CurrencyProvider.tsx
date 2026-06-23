"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import type { CurrencyCode, CurrencyRates } from "@/lib/currency";
import { LANG_DEFAULT_CURRENCY } from "@/lib/currency";
import { convertPrice } from "@/lib/pricing";
import type { Locale } from "@/i18n/routing";

const STORAGE_KEY = "ca-currency";

const FALLBACK_RATES: CurrencyRates = {
  USD: 0.00066,
  EUR: 0.00059,
  RUB: 0.058,
  AED: 0.0024,
  KZT: 0.33,
  UZS: 8.5,
  updatedAt: "fallback",
};

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: CurrencyRates;
  rate: number;
  convertFromKrw: (priceKrw: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const locale = useLocale() as Locale;
  const defaultCurrency = LANG_DEFAULT_CURRENCY[locale] ?? "USD";

  const [currency, setCurrencyState] = useState<CurrencyCode>(defaultCurrency);
  const [rates, setRates] = useState<CurrencyRates>(FALLBACK_RATES);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (stored && ["USD", "EUR", "RUB", "AED", "KZT", "UZS"].includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data) => {
        if (data.USD) setRates(data);
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
    window.dispatchEvent(new CustomEvent("currency-change", { detail: c }));
  }, []);

  const rate = rates[currency] ?? 1;
  const convertFromKrw = useCallback(
    (priceKrw: number) => convertPrice(priceKrw, rate),
    [rate]
  );

  return (
    <CurrencyContext value={{ currency, setCurrency, rates, rate, convertFromKrw }}>
      {children}
    </CurrencyContext>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
