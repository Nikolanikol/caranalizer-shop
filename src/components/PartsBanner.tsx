"use client";

/**
 * Баннер каталога запчастей. Куда он ведёт, решает не страница, а язык —
 * см. `lib/parts-destination.ts`: по-русски свой раздел б/у, иначе kmotors.
 *
 * Отдельный компонент, а не вариант `KmotorsBanner`, именно из-за этой развилки:
 * баннер с названием чужой площадки, который иногда ведёт на свою, читается как
 * ошибка и через месяц кто-то «починит» его обратно.
 *
 * Цвет тоже различает площадки: свой раздел на акцентном `cta` (как иконка
 * в полосе магазина), kmotors — на `primary`, как остальные его баннеры.
 */

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ExternalLink, Wrench } from "lucide-react";
import { trackKmotorsClick } from "@/lib/analytics";
import { hasOwnPartsShop, partsDestination } from "@/lib/parts-destination";

export function PartsBanner({
  placement,
  compact = false,
}: {
  /** Куда ушёл клик — попадает в UTM и в событие аналитики. */
  placement: string;
  compact?: boolean;
}) {
  const locale = useLocale();
  const own = hasOwnPartsShop(locale);
  const { href, external } = partsDestination(locale, "banner", placement);

  // Свой раздел описываем сами; для kmotors берём готовые строки его баннера.
  const tOwn = useTranslations("partsBanner");
  const tKm = useTranslations("kmBanner");
  const title = own ? tOwn("title") : tKm("partsTitle");
  const text = own ? tOwn("text") : tKm("partsText");
  const btn = own ? tOwn("btn") : tKm("partsBtn");

  const tone = own
    ? "from-cta/10 to-elevated border-cta/30"
    : "from-primary/10 to-elevated border-primary/30";
  const iconTone = own ? "bg-cta/10 text-cta" : "bg-primary/10 text-primary";
  const btnTone = own
    ? "bg-cta text-base-darker hover:bg-cta-hover"
    : "bg-primary text-white hover:bg-primary-hover";

  const label = (
    <>
      {btn}
      {external && <ExternalLink className="w-4 h-4" />}
    </>
  );

  return (
    <div
      className={`flex flex-col sm:flex-row items-center gap-5 rounded-2xl bg-gradient-to-r border ${tone} ${
        compact ? "p-5" : "p-7"
      }`}
    >
      <div className={`flex items-center justify-center w-12 h-12 min-w-12 rounded-xl ${iconTone}`}>
        <Wrench className="h-6 w-6" />
      </div>

      <div className="flex-1 text-center sm:text-start">
        <div
          className={`text-xs uppercase tracking-wide font-semibold mb-1 ${
            own ? "text-cta" : "text-primary"
          }`}
        >
          {own ? tOwn("eyebrow") : "K-Axis · kmotors.shop"}
        </div>
        <div
          className={`font-bold font-[family-name:var(--font-heading)] text-text ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {title}
        </div>
        {!compact && <p className="text-sm text-text-secondary mt-1">{text}</p>}
      </div>

      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackKmotorsClick(placement)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${btnTone}`}
        >
          {label}
        </a>
      ) : (
        <Link
          href={href}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${btnTone}`}
        >
          {label}
        </Link>
      )}
    </div>
  );
}
