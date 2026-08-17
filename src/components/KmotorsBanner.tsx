"use client";

// Промо-баннер kmotors.shop: авто под ключ и калькулятор растаможки — то, чего
// caranalizer не делает сам. Вариант задаёт услугу, placement уходит в UTM и GA-событие.
//
// Варианта `parts` здесь больше нет: куда ведёт каталог запчастей, зависит от языка
// (по-русски свой раздел б/у, иначе kmotors), и живёт эта развилка в PartsBanner.
import { useLocale, useTranslations } from "next-intl";
import { trackKmotorsClick } from "@/lib/analytics";
import { kmotorsUrl } from "@/lib/kmotors";
import { ExternalLink, Car, Calculator } from "lucide-react";

const VARIANTS = {
  cars: { path: "catalog", icon: Car },
  calc: { path: "calculator", icon: Calculator },
} as const;

export type KmotorsBannerVariant = keyof typeof VARIANTS;

export function KmotorsBanner({
  variant,
  placement,
  compact = false,
}: {
  variant: KmotorsBannerVariant;
  placement: string;
  compact?: boolean;
}) {
  const t = useTranslations("kmBanner");
  const locale = useLocale();
  const { path, icon: Icon } = VARIANTS[variant];
  const url = kmotorsUrl(locale, path, "banner", placement);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center gap-5 rounded-2xl bg-gradient-to-r from-primary/10 to-elevated border border-primary/30 ${
        compact ? "p-5" : "p-7"
      }`}
    >
      <div className="flex items-center justify-center w-12 h-12 min-w-12 rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 text-center sm:text-start">
        <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">
          K-Axis · kmotors.shop
        </div>
        <div className={`font-bold font-[family-name:var(--font-heading)] text-text ${compact ? "text-base" : "text-lg"}`}>
          {t(`${variant}Title`)}
        </div>
        {!compact && (
          <p className="text-sm text-text-secondary mt-1">{t(`${variant}Text`)}</p>
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackKmotorsClick(placement)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap"
      >
        {t(`${variant}Btn`)}
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
