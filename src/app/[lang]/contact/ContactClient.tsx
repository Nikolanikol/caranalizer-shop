"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { CheckCircle } from "lucide-react";
import { trackLead } from "@/lib/analytics";
import type { Value } from "react-phone-number-input";

export function ContactClient() {
  const t = useTranslations("contact");

  const [name, setName] = useState("");
  // E.164 из PhoneInput — из него на сервере строятся ссылки wa.me / t.me
  const [phone, setPhone] = useState<Value>();
  /*
   * «Как вам ответить» — тот же выбор, что в корзине и в форме проверки. Без него
   * менеджер гадал, куда писать: номер есть, а мессенджер за ним может быть любой,
   * и у покупателя из-за рубежа это чаще WhatsApp.
   */
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, messenger, tgUsername, message }),
      });
      if (res.ok) {
        // Вызов был забыт: тип `trackLead` принимал "contact" с самого начала,
        // а событие отсюда не уходило — в GA форма контактов не существовала.
        trackLead("contact");
        setSuccess(true);
        setName("");
        setPhone(undefined);
        setMessenger("whatsapp");
        setTgUsername("");
        setMessage("");
      }
    } catch {} finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-8">
      <Container className="max-w-lg">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-8">
          {t("title")}
        </h1>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle className="h-12 w-12 text-success" />
            <p className="text-lg font-semibold">{t("success")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">
                {t("name")}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">
                {t("phone")}
              </label>
              <PhoneInput value={phone} onChange={setPhone} required />
            </div>
            <MessengerSelector
              messenger={messenger}
              onMessengerChange={setMessenger}
              tgUsername={tgUsername}
              onTgUsernameChange={setTgUsername}
              label={t("messengerLabel")}
            />
            <div>
              <label className="block text-sm text-text-muted mb-1.5">
                {t("message")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                rows={4}
                className="w-full rounded-lg border border-border bg-elevated px-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
              />
            </div>
            <Button
              type="submit"
              variant="cta"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? t("sending") : t("send")}
            </Button>
          </form>
        )}
      </Container>
    </section>
  );
}
