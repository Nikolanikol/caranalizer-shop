import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldCheck } from "lucide-react";

export function VinCheckCTA() {
  const t = useTranslations("home");

  return (
    <section className="py-16 bg-elevated/50">
      <Container>
        <div className="flex flex-col md:flex-row items-center gap-8 rounded-2xl bg-gradient-to-br from-primary/10 to-cta/5 border border-primary/20 p-8 md:p-12">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 shrink-0">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>

          <div className="flex-1 text-center md:text-start">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-2">
              {t("checkVin")}
            </h2>
            <p className="text-text-muted">
              {t("checkVinDesc")}
            </p>
          </div>

          <a
            href="https://t.me/caranalizer_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="cta" size="lg" className="gap-2 whitespace-nowrap">
              Telegram Bot
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </Container>
    </section>
  );
}
