"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { Globe } from "lucide-react";

const localeLabels: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  ar: "AR",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function onChange(next: Locale) {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="relative flex items-center gap-1">
      <Globe className="h-4 w-4 text-text-muted" />
      <div className="flex gap-0.5">
        {(Object.keys(localeLabels) as Locale[]).map((loc) => (
          <button
            key={loc}
            onClick={() => onChange(loc)}
            className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              loc === locale
                ? "bg-primary text-white"
                : "text-text-muted hover:text-text hover:bg-elevated"
            }`}
          >
            {localeLabels[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
