"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ShoppingCart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { MobileNav } from "./MobileNav";
import { useCart } from "@/providers/CartProvider";

const NAV_KEYS = [
  { key: "catalog", href: "/catalog" },
  { key: "about", href: "/about" },
  { key: "howItWorks", href: "/how-it-works" },
  { key: "faq", href: "/faq" },
  { key: "contact", href: "/contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { totalItems } = useCart();

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
          {NAV_KEYS.map(({ key, href }) => (
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

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>

          <Link
            href="/cart"
            className="relative p-2 text-text-secondary hover:text-text transition-colors"
            aria-label={t("cart")}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta text-[10px] font-bold text-base-darker px-1">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
