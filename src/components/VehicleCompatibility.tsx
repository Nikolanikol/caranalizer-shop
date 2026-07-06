"use client";

import { useState } from "react";

/**
 * Переиспользуемый блок совместимости с авто.
 * Без зависимостей от проекта: данные и тексты приходят пропсами,
 * ссылки опциональны (нет href — рендерится просто бейдж).
 */
export interface CompatVehicle {
  /** "Sonata DN8", "The New Grandeur IG Hybrid" */
  name: string;
  /** "hyundai" | "kia" | ... — для группировки (опционально) */
  brand?: string;
  /** "2019.3" */
  yearFrom?: string | null;
  /** "2023.4"; null + openEnded=true → "по н.в." */
  yearTo?: string | null;
  openEnded?: boolean;
  /** ссылка на страницу авто (опционально) */
  href?: string;
}

export interface VehicleCompatibilityLabels {
  /** заголовок блока, напр. "Подходит для" */
  title: string;
  /** шаблон кнопки, {n} = сколько скрыто, напр. "Показать все {n}" */
  showAll: string;
  /** свернуть */
  showLess: string;
  /** метка открытого диапазона, напр. "н.в." / "now" */
  present: string;
}

const BRAND_LABELS: Record<string, string> = {
  hyundai: "Hyundai",
  kia: "Kia",
  genesis: "Genesis",
  ssangyong: "SsangYong",
  audi: "Audi",
};

function formatYears(v: CompatVehicle, present: string): string {
  const from = v.yearFrom ? String(v.yearFrom).split(".")[0] : "";
  const to = v.yearTo ? String(v.yearTo).split(".")[0] : v.openEnded ? present : "";
  if (!from && !to) return "";
  if (from && to) return `${from}–${to}`;
  return from || to;
}

export function VehicleCompatibility({
  vehicles,
  labels,
  maxVisible = 8,
  className = "",
}: {
  vehicles: CompatVehicle[];
  labels: VehicleCompatibilityLabels;
  maxVisible?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!vehicles.length) return null;

  // группировка по брендам, внутри — новые сначала
  const sorted = [...vehicles].sort((a, b) => {
    const ba = a.brand || "", bb = b.brand || "";
    if (ba !== bb) return ba.localeCompare(bb);
    return (b.yearFrom || "0").localeCompare(a.yearFrom || "0");
  });

  const hiddenCount = sorted.length - maxVisible;
  const collapsible = hiddenCount > 0;

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold mb-3">{labels.title}</h3>
      <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
        {sorted.map((v, i) => {
          const years = formatYears(v, labels.present);
          const brandLabel = v.brand ? BRAND_LABELS[v.brand] ?? v.brand : "";
          const text = `${brandLabel ? brandLabel + " " : ""}${v.name}${years ? ` (${years})` : ""}`;
          // все ссылки всегда в DOM (SEO); лишние прячем через CSS
          const hidden = collapsible && !expanded && i >= maxVisible;
          const chipCls =
            "inline-block rounded-full border px-3 py-1 text-xs transition-colors " +
            (v.href
              ? "border-current/25 hover:border-current/60 no-underline"
              : "border-current/25");
          return (
            <li key={i} className={hidden ? "hidden" : ""}>
              {v.href ? (
                <a href={v.href} className={chipCls}>{text}</a>
              ) : (
                <span className={chipCls}>{text}</span>
              )}
            </li>
          );
        })}
      </ul>
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs underline underline-offset-2 opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-0 p-0"
        >
          {expanded ? labels.showLess : labels.showAll.replace("{n}", String(sorted.length))}
        </button>
      )}
    </div>
  );
}
