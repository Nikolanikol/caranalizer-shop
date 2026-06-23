"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/routing";

type ContactMethod = "phone" | "telegram" | "none";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const { items, totalKrw, clearCart } = useCart();
  const { currency, rate } = useCurrency();

  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");
  const [contactValue, setContactValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (contactMethod !== "none" && !contactValue.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            partNumber: i.partNumber,
            nameRu: i.nameRu,
            nameEn: i.nameEn,
            priceKrw: i.priceKrw,
            quantity: i.quantity,
          })),
          contactMethod,
          contactValue: contactMethod !== "none" ? contactValue : undefined,
          lang: locale,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
      clearCart();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="py-8">
        <Container className="max-w-lg">
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <CheckCircle className="h-16 w-16 text-success" />
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
              {t("successTitle")}
            </h1>
            <p className="text-text-muted">{t("successDesc")}</p>
            <Link href="/catalog">
              <Button variant="primary" className="mt-4 gap-2">
                {t("orderSummary")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-8">
        <Container className="max-w-lg text-center py-20">
          <p className="text-text-muted">Cart is empty</p>
          <Link href="/catalog">
            <Button variant="primary" className="mt-4">
              Go to catalog
            </Button>
          </Link>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-8">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-8">
          {t("title")}
        </h1>

        <div className="rounded-xl border border-border-subtle bg-elevated p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t("orderSummary")}</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-text-muted">
                  {item.partNumber} × {item.quantity}
                </span>
                <PriceDisplay
                  priceKrw={item.priceKrw * item.quantity}
                  currency={currency}
                  rate={rate}
                  size="sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between">
            <span className="font-semibold">{t("orderSummary")}</span>
            <PriceDisplay
              priceKrw={totalKrw}
              currency={currency}
              rate={rate}
              size="md"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">{t("contactMethod")}</h2>
            <div className="space-y-3">
              {(["phone", "telegram", "none"] as const).map((method) => (
                <label
                  key={method}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    contactMethod === method
                      ? "border-primary bg-primary/5"
                      : "border-border-subtle hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="contactMethod"
                    value={method}
                    checked={contactMethod === method}
                    onChange={() => setContactMethod(method)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-text">
                      {t(method === "none" ? "noContact" : method)}
                    </span>
                    {method === "none" && (
                      <p className="text-xs text-text-dim mt-0.5">
                        {t("noContactDesc")}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {contactMethod === "phone" && (
            <Input
              type="tel"
              placeholder={t("phonePlaceholder")}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              required
            />
          )}
          {contactMethod === "telegram" && (
            <Input
              placeholder={t("telegramPlaceholder")}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              required
            />
          )}
          {contactMethod === "none" && (
            <div className="rounded-lg bg-cta/10 border border-cta/20 p-4 text-sm">
              <p className="font-medium text-cta mb-2">{t("ourContacts")}</p>
              <a
                href="https://t.me/kmotors_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @kmotors_bot — Telegram
              </a>
            </div>
          )}

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Container>
    </section>
  );
}
