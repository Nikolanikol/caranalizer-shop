"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  { q: "q1", a: "a1" },
  { q: "q2", a: "a2" },
  { q: "q3", a: "a3" },
  { q: "q4", a: "a4" },
  { q: "q5", a: "a5" },
  { q: "q6", a: "a6" },
] as const;

export default function FaqPage() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-8">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-8">
          {t("title")}
        </h1>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            let question: string;
            let answer: string;
            try {
              question = t(item.q);
              answer = t(item.a);
            } catch {
              return null;
            }

            return (
              <div
                key={i}
                className="rounded-xl border border-border-subtle bg-elevated overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-start cursor-pointer"
                >
                  <span className="text-sm font-medium text-text pe-4">
                    {question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-text-dim transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-text-muted leading-relaxed">
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
