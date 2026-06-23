import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Search, ShoppingCart, MessageCircle, Truck } from "lucide-react";

const STEP_ICONS = [Search, ShoppingCart, MessageCircle, Truck];

export default function HowItWorksPage() {
  const t = useTranslations("howItWorks");

  const steps = [1, 2, 3, 4].map((n) => ({
    title: t(`step${n}Title`),
    desc: t(`step${n}Desc`),
    Icon: STEP_ICONS[n - 1],
  }));

  return (
    <section className="py-8">
      <Container className="max-w-4xl">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-12">
          {t("title")}
        </h1>
        <div className="grid gap-8 sm:grid-cols-2">
          {steps.map(({ title, desc, Icon }, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-border-subtle bg-elevated p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text mb-1">{title}</h3>
                <p className="text-sm text-text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
