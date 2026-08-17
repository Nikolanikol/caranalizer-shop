import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { SHOP_BASE, SHOP_LOCALE } from "@/lib/shop/urls";
import { partsDestination } from "@/lib/parts-destination";
import { kmotorsUrl } from "@/lib/kmotors";
import { Send, ExternalLink, Wrench } from "lucide-react";

const NAV_LINKS = [
  { key: "check", href: "/check" },
  { key: "report", href: "/report" },
  { key: "guides", href: "/guides" },
  { key: "howItWorks", href: "/how-it-works" },
  { key: "faq", href: "/faq" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

// Каталог запчастей есть только на русском — на других языках ссылка вела бы на 404.
const PARTS_ITEM = { key: "parts", href: SHOP_BASE } as const;

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const year = new Date().getFullYear();
  const navLinks = locale === SHOP_LOCALE ? [...NAV_LINKS, PARTS_ITEM] : NAV_LINKS;

  // По-русски ссылка ведёт в свой раздел б/у, на остальных языках — на kmotors.
  const parts = partsDestination(locale, "footer");
  const calcHref = kmotorsUrl(locale, "calculator", "footer");

  return (
    <footer className="border-t border-border-subtle bg-base-darker mt-auto">
      <Container className="py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-bold font-[family-name:var(--font-heading)]">
              <span className="text-primary">Car</span>analizer
            </span>
            <p className="mt-3 text-sm text-text-muted leading-relaxed max-w-xs">
              {t("description")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text mb-4">
              {t("navigation")}
            </h3>
            <ul className="space-y-2">
              {navLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    {tn(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text mb-4">
              {t("contacts")}
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://t.me/koreancarss_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>VIN Check Bot</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/axiskorea"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>Caranalizer Manager</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text mb-4">
              {t("kmotorsTitle")}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed mb-3">
              {t("kmotorsText")}
            </p>
            <ul className="space-y-2">
              <li>
                {parts.external ? (
                  <a
                    href={parts.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{t("kmotorsParts")}</span>
                  </a>
                ) : (
                  <Link
                    href={parts.href}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Wrench className="h-4 w-4" />
                    <span>{t("kmotorsParts")}</span>
                  </Link>
                )}
              </li>
              <li>
                <a
                  href={calcHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{t("kmotorsCalc")}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-text-dim">
          <span>© {year} Caranalizer. {t("rights")}</span>
          <span className="hidden sm:block">·</span>
          <Link href="/privacy" className="hover:text-text transition-colors">
            {t("privacy")}
          </Link>
          <span className="hidden sm:block">·</span>
          <Link href="/terms" className="hover:text-text transition-colors">
            {t("terms")}
          </Link>
        </div>
      </Container>
    </footer>
  );
}
