"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { type Value } from "react-phone-number-input";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/routing";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const { items, totalKrw, clearCart } = useCart();
  const { currency, rate } = useCurrency();

  const [phone, setPhone] = useState<Value | undefined>();
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const errors = {
    phone: attempted && !phone,
    tgUsername: attempted && messenger === "telegram" && !tgUsername.trim(),
  };

  const isValid = !!phone && (messenger !== "telegram" || !!tgUsername.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (items.length === 0 || !isValid) return;

    setSubmitting(true);

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
          phone: phone ?? "",
          messenger,
          tgUsername: messenger === "telegram" ? tgUsername : undefined,
          lang: locale,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
      clearCart();
      toast.success(t("successTitle"));
    } catch {
      toast.error(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  const errorHint = (show: boolean) =>
    show ? (
      <p className="flex items-center gap-1 text-xs text-error mt-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {t("contactRequired")}
      </p>
    ) : null;

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
                {t("backToCatalog")}
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
          <p className="text-text-muted">{t("emptyCart")}</p>
          <Link href="/catalog">
            <Button variant="primary" className="mt-4">
              {t("goToCatalog")}
            </Button>
          </Link>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-8">
      <Container className="max-w-2xl">
        <Link
          href="/cart"
          className="inline-block text-sm text-text-secondary hover:text-text transition-colors mb-4"
        >
          {t("backToCart")}
        </Link>

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
            <span className="font-semibold">{t("orderTotal")}</span>
            <PriceDisplay
              priceKrw={totalKrw}
              currency={currency}
              rate={rate}
              size="md"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              {t("phoneLabel")} <span className="text-cta">*</span>
            </label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder={t("phonePlaceholder")}
              error={errors.phone}
            />
            {errorHint(errors.phone)}
          </div>

          <MessengerSelector
            messenger={messenger}
            onMessengerChange={setMessenger}
            tgUsername={tgUsername}
            onTgUsernameChange={setTgUsername}
            label={t("messengerLabel")}
            usernamePlaceholder={t("telegramPlaceholder")}
            error={errors.tgUsername}
          />
          {errorHint(errors.tgUsername)}

          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      </Container>
    </section>
  );
}
