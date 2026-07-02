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
              {t("payment")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center h-10 rounded-md bg-white/5 border border-border-subtle px-3" title="PayPal">
                <svg viewBox="0 0 101 32" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.166 4.2h7.885c3.596 0 6.276 1.192 5.71 5.26-.754 5.408-4.018 8.086-8.58 8.086H14.79c-.592 0-1.014.424-1.172 1.594l-1.04 6.636c-.058.37-.264.584-.564.612H7.6c-.46 0-.636-.372-.518-1.158L10.484 5.36c.16-1.014.688-1.16 1.682-1.16z" fill="#009cde"/>
                  <path d="M39.07 4.004c3.898 0 6.83 2.372 6.266 6.932-.696 5.62-4.266 8.754-9.32 8.754H33.24c-.656 0-.93.494-1.088 1.594l-.802 5.088c-.098.622-.396.946-.87.946h-3.878c-.474 0-.66-.35-.544-1.08l3.392-21.236c.16-.998.602-1.138 1.308-1h7.312zM34.16 15.14h2.414c2.454 0 4.182-1.834 4.476-4.176.192-1.526-.684-2.734-2.87-2.734h-2.148c-.338 0-.52.202-.59.634L34.16 15.14z" fill="#012169"/>
                  <path d="M55.924 7.842c2.934 0 4.812 1.912 4.38 5.04-.528 3.82-3.222 6.218-6.68 6.218h-2.796c-.466 0-.69.39-.81 1.26l-.566 3.588c-.086.546-.332.746-.72.746h-2.71c-.432 0-.606-.318-.496-.988l2.504-15.59c.12-.752.45-.862.968-.862h6.926zm-4.404 7.3h1.73c1.664 0 2.916-1.26 3.132-2.96.138-1.076-.482-1.964-1.992-1.964h-1.56c-.248 0-.38.15-.43.462l-.88 4.462z" fill="#012169"/>
                  <path d="M68.34 7.254c1.286 0 2.21.364 2.706.91.508.558.668 1.362.496 2.464l-1.726 10.964c-.08.498-.296.708-.682.708h-2.516c-.328 0-.482-.166-.46-.522l.044-.69c-.968 1.01-2.292 1.488-3.86 1.488-2.296 0-3.804-1.524-3.554-3.808.302-2.762 2.66-4.42 6.276-4.42h2.018l.14-.862c.12-.76-.27-1.2-1.298-1.2-1 0-1.644.298-1.88.986-.098.284-.29.402-.58.402h-2.522c-.372 0-.542-.218-.466-.656.384-2.22 2.432-3.764 6.064-3.764zm-.682 8.642c.1-.646-.396-.996-1.37-.996-1.32 0-2.17.594-2.302 1.498-.1.646.396.996 1.318.996 1.37 0 2.232-.574 2.354-1.498z" fill="#012169"/>
                  <path d="M74.88 4.21h2.736c.39 0 .57.212.494.694l-3.098 19.392c-.086.538-.326.728-.7.728h-2.546c-.432 0-.612-.316-.5-.988l3.03-19.13c.088-.548.306-.696.584-.696z" fill="#012169"/>
                </svg>
              </div>
              <div className="flex items-center justify-center h-10 rounded-md bg-white/5 border border-border-subtle px-3" title="Visa">
                <svg viewBox="0 0 48 16" className="h-4 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.616 0.4l-5.05 15.2h-4.1L14.516.4h5.1zm14.47 9.82l2.16-5.96 1.244 5.96h-3.404zm4.58 5.38h3.794L39.1.4h-3.502a1.86 1.86 0 00-1.74 1.16L27.376 15.6h3.94l.782-2.166h4.814l.454 2.166zM30.08 10.4c.016-3.988-5.514-4.208-5.476-5.99.012-.542.528-1.12 1.658-1.266a7.37 7.37 0 013.862.678l.688-3.214A10.53 10.53 0 0027.268 0c-3.71 0-6.32 1.972-6.342 4.798-.024 2.09 1.866 3.256 3.29 3.95 1.464.71 1.956 1.164 1.95 1.798-.01.972-1.168 1.4-2.248 1.418-1.89.03-2.986-.51-3.86-.918l-.682 3.186c.878.404 2.5.756 4.182.772 3.942 0 6.518-1.948 6.532-4.968L30.08 10.4zM15.374.4L9.192 15.6H5.218L2.182 3.248c-.184-.722-.344-1.088-.904-1.278C.476 1.676-.002 1.426-.002.4h6.376c.812 0 1.542.54 1.728 1.478l1.578 8.382L13.452.4h3.922z" fill="#1a1f71"/>
                </svg>
              </div>
              <div className="flex items-center justify-center h-10 rounded-md bg-white/5 border border-border-subtle px-3" title="Mastercard">
                <svg viewBox="0 0 38 24" className="h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="12" r="10" fill="#eb001b"/>
                  <circle cx="23" cy="12" r="10" fill="#f79e1b"/>
                  <path d="M19 4.06A9.97 9.97 0 0 0 15 12a9.97 9.97 0 0 0 4 7.94A9.97 9.97 0 0 0 23 12a9.97 9.97 0 0 0-4-7.94z" fill="#ff5f00"/>
                </svg>
              </div>
              <div className="flex items-center justify-center h-10 rounded-md bg-white/5 border border-border-subtle px-3" title="Debit Cards">
                <svg viewBox="0 0 24 24" className="h-5 w-auto text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                  <line x1="5" y1="15" x2="11" y2="15" />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-dim leading-relaxed">
              {t("paymentNote")}
            </p>
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
