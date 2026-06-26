import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Send } from "lucide-react";

const NAV_LINKS = [
  { key: "catalog", href: "/catalog" },
  { key: "about", href: "/about" },
  { key: "howItWorks", href: "/how-it-works" },
  { key: "faq", href: "/faq" },
  { key: "contact", href: "/contact" },
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-base-darker mt-auto">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              {NAV_LINKS.map(({ key, href }) => (
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
                  href="https://t.me/caranalizer_bot"
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
                  href="https://t.me/kmotors_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>KMotors Manager</span>
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
