import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <section className="py-8">
      <Container className="max-w-4xl">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-8">
          {t("title")}
        </h1>
        <p className="text-text-secondary text-lg">{t("description")}</p>
      </Container>
    </section>
  );
}
