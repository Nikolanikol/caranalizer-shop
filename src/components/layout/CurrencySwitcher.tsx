"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";

const CURRENCIES = ["USD", "EUR", "RUB", "AED", "KZT", "UZS"] as const;
export type Currency = (typeof CURRENCIES)[number];

const LOCALE_DEFAULTS: Record<Locale, Currency> = {
  ru: "RUB",
  en: "USD",
  ar: "AED",
};

const STORAGE_KEY = "ca-currency";

export function CurrencySwitcher() {
  const locale = useLocale() as Locale;
  const [currency, setCurrency] = useState<Currency>(
    LOCALE_DEFAULTS[locale]
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (stored && CURRENCIES.includes(stored)) {
      setCurrency(stored);
    }
    setMounted(true);
  }, []);

  function onChange(next: Currency) {
    setCurrency(next);
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("currency-change", { detail: next }));
  }

  if (!mounted) return <div className="w-16 h-8" />;

  return (
    <select
      value={currency}
      onChange={(e) => onChange(e.target.value as Currency)}
      className="h-8 rounded-md border border-border bg-elevated px-2 pe-7 text-xs font-medium text-text-secondary focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22m4.427%206.427%203.396%203.396a.25.25%200%200%200%20.354%200l3.396-3.396A.25.25%200%200%200%2011.396%206H4.604a.25.25%200%200%200-.177.427z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[position:calc(100%-6px)_center] bg-no-repeat [html[dir='rtl']_&]:bg-[position:6px_center]"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
