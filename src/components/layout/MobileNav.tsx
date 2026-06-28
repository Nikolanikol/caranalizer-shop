"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { X, Menu } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CurrencySwitcher } from "./CurrencySwitcher";

const NAV_KEYS = [
  { key: "home", href: "/" },
  { key: "catalog", href: "/catalog" },
  { key: "about", href: "/about" },
  { key: "howItWorks", href: "/how-it-works" },
  { key: "faq", href: "/faq" },
  { key: "contact", href: "/contact" },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-text-secondary hover:text-text transition-colors cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <nav className="absolute inset-y-0 end-0 w-72 bg-base border-s border-border flex flex-col animate-[slideIn_200ms_ease-out]">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-lg font-bold font-[family-name:var(--font-heading)]">
                  Menu
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-text-secondary hover:text-text cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                {NAV_KEYS.map(({ key, href }) => (
                  <Link
                    key={key}
                    href={href}
                    className={`block px-6 py-3 text-base transition-colors ${
                      pathname === href
                        ? "text-primary bg-primary/5"
                        : "text-text-secondary hover:text-text hover:bg-elevated"
                    }`}
                  >
                    {t(key)}
                  </Link>
                ))}
              </div>

              <div className="border-t border-border p-4 flex items-center justify-between">
                <LanguageSwitcher />
                <CurrencySwitcher />
              </div>
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}
