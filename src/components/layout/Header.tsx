"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { SHOP_BASE, SHOP_LOCALE } from "@/lib/shop/urls";
import { MobileNav } from "./MobileNav";

// «Проверка авто» намеренно не в списке — на неё ведёт жёлтая CTA-кнопка,
// дублировать пунктом меню нельзя. «О нас» живёт в футере.
const NAV_KEYS = [
  { key: "guides", href: "/guides" },
  { key: "howItWorks", href: "/how-it-works" },
  { key: "faq", href: "/faq" },
  { key: "contact", href: "/contact" },
] as const;

// Каталог запчастей есть только на русском, поэтому и пункт меню — только там:
// на /en и /ar ссылка вела бы на 404. Ключ `parts` живёт лишь в ru.json.
const PARTS_ITEM = { key: "parts", href: SHOP_BASE } as const;

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const navItems = locale === SHOP_LOCALE ? [PARTS_ITEM, ...NAV_KEYS] : NAV_KEYS;

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-base/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold font-[family-name:var(--font-heading)] text-text shrink-0"
        >
          <span className="text-primary">Car</span>
          <span>analizer</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-primary"
                  : "text-text-secondary hover:text-text hover:bg-elevated"
              }`}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/*
          Переключателя языков здесь больше нет. Сайт одноязычный, и многоязычна
          ровно одна страница — проверка по VIN; свой большой переключатель стоит
          на ней. В шапке он предлагал языки для страниц, которых на них не существует.
        */}
        <div className="flex items-center gap-3">
          <Link
            href="/proverka-avto-po-vin"
            className="hidden sm:inline-flex items-center rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-base-darker hover:opacity-90 transition-opacity"
          >
            {t("freeCheck")}
          </Link>

          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
