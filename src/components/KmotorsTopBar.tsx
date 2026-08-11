"use client";

// Полоса над шапкой: перегон трафика на витрину авто K-Axis (kmotors.shop).
// Цвет — акцентный --color-cta, тот же, что у CTA «Бесплатная проверка».
import { useLocale, useTranslations } from "next-intl";
import { trackKmotorsClick } from "@/lib/analytics";
import { Container } from "@/components/ui/container";
import { ArrowRight, Car } from "lucide-react";

// Языки, которые есть на kmotors.shop (проверено: /ru, /en, /ar отдают 200
// и свой lang). Незнакомую локаль уводим на английскую версию.
const KMOTORS_LOCALES = ["ru", "en", "ar"];

export function KmotorsTopBar() {
  const t = useTranslations("kmTopBar");
  const locale = useLocale();
  const target = KMOTORS_LOCALES.includes(locale) ? locale : "en";
  const url = `https://www.kmotors.shop/${target}?utm_source=caranalizer&utm_medium=topbar&utm_campaign=global`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackKmotorsClick("topbar")}
      className="group block bg-cta text-base-darker hover:bg-cta-hover transition-colors"
    >
      <Container className="flex min-h-10 items-center justify-center gap-2 py-2 text-center text-xs sm:text-sm font-semibold">
        <Car className="h-4 w-4 shrink-0" />
        <span>
          {t("text")}
          {/* на узких экранах полоса должна остаться в одну строку */}
          <span className="hidden sm:inline"> {t("brand")}</span>
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap underline underline-offset-2">
          {t("cta")}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </span>
      </Container>
    </a>
  );
}
