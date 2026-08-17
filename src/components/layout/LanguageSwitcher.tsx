"use client";

/**
 * Выбор языка — крупный, и живёт на странице, а не в шапке.
 *
 * Многоязычна на сайте ровно одна страница: проверка авто по VIN. Пока переключатель
 * стоял в шапке, он предлагал три языка на всех страницах, включая те, которых на
 * en/ar не существует, — а в разделе запчастей нажатие EN и вовсе давало 404.
 *
 * Поэтому он здесь и в единственном месте, где ему есть что переключать. Крупный —
 * потому что это единственная точка входа для иноязычного посетителя, и прятать её
 * в углу шапки, где её никто не найдёт, смысла нет.
 *
 * Адрес каждой версии собираем из `VIN_PATHS`: у локалей разные слаги, и переход
 * делается обычной навигацией, а не через `router` из next-intl — тот увёл бы
 * на русский путь, откуда middleware сделал бы лишний 301.
 */

import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@/i18n/routing";
import { VIN_PATHS } from "@/lib/seo";
import { Globe } from "lucide-react";

/** Язык называем на нём самом: «Русский» понятнее носителю, чем «Russian». */
const LANGUAGES: { locale: Locale; native: string; code: string }[] = [
  { locale: "ru", native: "Русский", code: "RU" },
  { locale: "en", native: "English", code: "EN" },
  { locale: "ar", native: "العربية", code: "AR" },
];

export function LanguageSwitcher() {
  const t = useTranslations("check");
  const current = useLocale() as Locale;

  return (
    <div className="rounded-2xl border border-border-subtle bg-elevated/60 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-text">{t("langTitle")}</span>
      </div>

      <div
        role="group"
        aria-label={t("langTitle")}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {LANGUAGES.map(({ locale, native, code }) => {
          const active = locale === current;
          return (
            <button
              key={locale}
              type="button"
              lang={locale}
              dir={locale === "ar" ? "rtl" : "ltr"}
              aria-current={active ? "true" : undefined}
              onClick={() => {
                // Адрес собираем сами: у локалей разные слаги, и `router.replace`
                // увёл бы на русский путь, откуда middleware сделал бы лишний 301.
                if (!active) window.location.href = `/${locale}${VIN_PATHS[locale]}`;
              }}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-start transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-text cursor-default"
                  : "border-border bg-base/40 text-text-secondary hover:border-primary/50 hover:text-text cursor-pointer"
              }`}
            >
              <span className="text-base font-semibold">{native}</span>
              <span
                className={`text-[11px] font-bold tracking-wider tabular-nums ${
                  active ? "text-primary" : "text-text-dim"
                }`}
              >
                {code}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
