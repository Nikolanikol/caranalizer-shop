"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { trackLead } from "@/lib/analytics";
import { KmotorsBanner } from "@/components/KmotorsBanner";
import { CheckCircle } from "lucide-react";
import type { Value } from "react-phone-number-input";

type LeadSource = "check" | "report";

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
const LISTING_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(encar\.com|kbchachacha\.com|kcar\.com)\//i;

export function CheckLeadForm({
  defaultSource = "check",
}: {
  /** С какого варианта открывать форму. Дальше выбор делает посетитель. */
  defaultSource?: LeadSource;
} = {}) {
  const t = useTranslations("check");
  const tr = useTranslations("report");

  /**
   * Страницы бесплатной проверки и полного отчёта склеены в одну, но воронка
   * осталась раздельной: `source` уходит в заявку, и по нему видно, за чем пришли.
   * Склеить его в одно значение значило бы потерять единственный признак, по
   * которому эти два потока отличаются.
   */
  const [source, setSource] = useState<LeadSource>(defaultSource);

  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<Value>();
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [comment, setComment] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = link.trim();
    const valid = VIN_RE.test(trimmed) || LISTING_RE.test(trimmed);
    setLinkError(!valid);
    if (!valid || !name.trim() || !phone) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/check-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          link: trimmed,
          messenger,
          tgUsername,
          comment,
          source,
        }),
      });
      if (res.ok) {
        trackLead(source);
        setSuccess(true);
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    // Самый горячий момент воронки: контакт оставлен, человек ждёт отчёт —
    // показываем витрину K-Axis
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-12 text-center bg-elevated border border-border-subtle rounded-2xl">
          <CheckCircle className="h-12 w-12 text-success" />
          <p className="text-lg font-semibold">{t("successTitle")}</p>
          <p className="text-sm text-text-secondary max-w-sm">{t("successText")}</p>
        </div>
        <KmotorsBanner variant="cars" placement="check-success" />
        <KmotorsBanner variant="calc" placement="check-success" compact />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-elevated border border-border-subtle rounded-2xl p-6 sm:p-8 space-y-4"
    >
      {/* Что заказываем. Названия берём из таблицы сравнения — они там уже выверены. */}
      <div role="radiogroup" aria-label={tr("compareTitle")} className="grid grid-cols-2 gap-2">
        {([
          ["check", tr("colFree")],
          ["report", tr("colFull")],
        ] as const).map(([value, label]) => {
          const active = source === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSource(value)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-text"
                  : "border-border bg-base/40 text-text-secondary hover:border-primary/50 hover:text-text cursor-pointer"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm text-text-muted mb-1.5">{t("fieldLink")}</label>
        <Input
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            if (linkError) setLinkError(false);
          }}
          placeholder={t("fieldLinkPh")}
          className={linkError ? "border-error focus:ring-error/20" : undefined}
          required
        />
        {linkError && <p className="mt-1.5 text-xs text-error">{t("fieldLinkErr")}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-text-muted mb-1.5">{t("fieldName")}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("fieldNamePh")}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1.5">{t("fieldPhone")}</label>
          <PhoneInput value={phone} onChange={setPhone} required />
        </div>
      </div>
      <MessengerSelector
        messenger={messenger}
        onMessengerChange={setMessenger}
        tgUsername={tgUsername}
        onTgUsernameChange={setTgUsername}
        label={t("messengerLabel")}
      />
      <div>
        <label className="block text-sm text-text-muted mb-1.5">{t("fieldComment")}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("fieldCommentPh")}
          rows={3}
          className="w-full rounded-lg border border-border bg-base px-4 py-3 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
        />
      </div>
      <Button type="submit" variant="cta" size="lg" className="w-full" disabled={submitting}>
        {submitting ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
