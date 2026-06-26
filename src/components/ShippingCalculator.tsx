"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { Search, Package } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyProvider";
import { PriceDisplay } from "@/components/PriceDisplay";
import {
  getAllShippingCountries,
  calculateShipping,
  getTableRates,
  TABLE_WEIGHTS,
  type ShippingCountry,
} from "@/lib/shipping";

const ALL_COUNTRIES = getAllShippingCountries();

export function ShippingCalculator() {
  const locale = useLocale();
  const { currency, rate } = useCurrency();
  const isRu = locale === "ru";

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ShippingCountry | null>(null);
  const [weight, setWeight] = useState(1);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return ALL_COUNTRIES.slice(0, 50);
    const q = query.toLowerCase();
    return ALL_COUNTRIES.filter(
      (c) => c.ru.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [query]);

  const shippingCost = selected ? calculateShipping(selected, weight) : null;
  const tableRates = selected ? getTableRates(selected) : null;

  const countryLabel = (c: ShippingCountry) => isRu ? c.ru : c.en;

  const labels = {
    title: isRu ? "Калькулятор доставки" : "Shipping Calculator",
    country: isRu ? "Страна назначения" : "Destination country",
    search: isRu ? "Поиск страны..." : "Search country...",
    weight: isRu ? "Вес отправления" : "Package weight",
    result: isRu ? "Стоимость доставки" : "Shipping cost",
    table: isRu ? "Тарифы для" : "Rates for",
    kg: "кг",
    noCountry: isRu ? "Выберите страну для расчёта" : "Select a country to calculate",
    note: isRu
      ? "* Тарифы EMS Korea Post. Итоговая стоимость может включать топливный сбор."
      : "* EMS Korea Post rates. Final cost may include fuel surcharge.",
  };

  return (
    <div className="space-y-8">
      {/* Calculator */}
      <div className="grid md:grid-cols-2 gap-6 p-6 rounded-2xl border border-border-subtle bg-elevated">

        {/* Country selector */}
        <div>
          <label className="block text-sm text-text-muted mb-2">{labels.country}</label>
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-base text-start text-sm hover:border-primary/50 transition-colors"
            >
              <span className={selected ? "text-text" : "text-text-dim"}>
                {selected ? countryLabel(selected) : labels.search}
              </span>
              <Search className="w-4 h-4 text-text-dim shrink-0" />
            </button>

            {open && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-elevated shadow-xl overflow-hidden">
                <div className="p-2 border-b border-border-subtle">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={labels.search}
                    className="w-full px-3 py-2 bg-base rounded-lg text-sm text-text placeholder:text-text-dim outline-none"
                  />
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {filtered.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => {
                          setSelected(c);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`w-full text-start px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors ${
                          selected?.id === c.id ? "text-primary bg-primary/5" : "text-text"
                        }`}
                      >
                        {countryLabel(c)}
                      </button>
                    </li>
                  ))}
                  {filtered.length === 0 && (
                    <li className="px-4 py-3 text-sm text-text-dim">
                      {isRu ? "Ничего не найдено" : "Not found"}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm text-text-muted mb-2">
            {labels.weight}: <span className="text-primary font-semibold">{weight} {labels.kg}</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={30}
            step={0.5}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer mb-3"
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((weight - 0.5) / 29.5) * 100}%, var(--color-elevated) ${((weight - 0.5) / 29.5) * 100}%, var(--color-elevated) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-text-dim">
            <span>0.5 {labels.kg}</span>
            <span>30 {labels.kg}</span>
          </div>
        </div>

        {/* Result */}
        <div className="md:col-span-2">
          <div className={`rounded-xl p-5 border transition-colors ${
            shippingCost
              ? "border-primary/30 bg-primary/5"
              : "border-border-subtle bg-base"
          }`}>
            {shippingCost ? (
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">{labels.result}</p>
                  <PriceDisplay priceKrw={shippingCost} currency={currency} rate={rate} size="lg" />
                </div>
                <div className="text-text-muted text-sm">
                  <Package className="w-4 h-4 inline mr-1" />
                  {weight} кг → {selected ? countryLabel(selected) : ""}
                </div>
              </div>
            ) : (
              <p className="text-text-dim text-sm">{labels.noCountry}</p>
            )}
          </div>
        </div>
      </div>

      {/* Rates table */}
      {selected && tableRates && (
        <div>
          <h3 className="font-[family-name:var(--font-heading)] font-semibold mb-4">
            {labels.table} {countryLabel(selected)}
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-elevated">
                  <th className="text-start px-4 py-3 text-text-muted font-medium">
                    {isRu ? "Вес" : "Weight"}
                  </th>
                  <th className="text-start px-4 py-3 text-text-muted font-medium">KRW</th>
                  <th className="text-start px-4 py-3 text-text-muted font-medium">{currency}</th>
                </tr>
              </thead>
              <tbody>
                {tableRates.map(({ weight: w, krw }, i) => (
                  <tr
                    key={w}
                    className={`border-b border-border-subtle last:border-0 transition-colors ${
                      Math.abs(w - weight) < 0.01
                        ? "bg-primary/10"
                        : i % 2 === 0 ? "bg-base" : "bg-elevated/50"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-text">
                      {w} {labels.kg}
                    </td>
                    <td className="px-4 py-3 text-text-muted font-mono">
                      ₩{krw.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <PriceDisplay priceKrw={krw} currency={currency} rate={rate} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-dim mt-3">{labels.note}</p>
        </div>
      )}
    </div>
  );
}
