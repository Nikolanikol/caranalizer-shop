"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MessengerSelector } from "@/components/ui/MessengerSelector";
import { trackLead, trackReportStep, type ReportPayStage } from "@/lib/analytics";
import { KmotorsBanner } from "@/components/KmotorsBanner";
import { CheckCircle, AlertTriangle } from "lucide-react";
import type { Value } from "react-phone-number-input";

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
const LISTING_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(encar\.com|kbchachacha\.com|kcar\.com)\//i;

/**
 * Заявка на полный отчёт по VIN.
 *
 * С 03.09.2026 заказ платный: одна цена за один VIN, оплата PayPal перед отправкой
 * заявки — решение владельца. Раньше кнопка сама отправляла заявку менеджеру,
 * который называл стоимость и сроки в переписке; теперь эту роль берёт на себя
 * PayPal-виджет, а заявка в Telegram уходит только после подтверждённого платежа —
 * `/api/paypal/capture-order` перепроверяет сумму и статус у самого PayPal, тело
 * запроса от клиента для этого не годится.
 *
 * Валидация полей идёт в `onClick` виджета: PayPal даёt перехватить клик и отменить
 * его через `actions.reject()` — тем самым форма не открывает окно оплаты, пока
 * имя, телефон и VIN/ссылка не заполнены.
 */
export function CheckLeadForm({ vin }: { vin?: string | null } = {}) {
  const t = useTranslations("check");
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [link, setLink] = useState("");
  const [phone, setPhone] = useState<Value>();
  const [messenger, setMessenger] = useState("whatsapp");
  const [tgUsername, setTgUsername] = useState("");
  const [comment, setComment] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [success, setSuccess] = useState(false);

  /*
   * Воронка в аналитику (см. `trackReportStep`). Каждый шаг отправляется один раз
   * за жизнь формы: повторный фокус или второе заполнение — не новый посетитель.
   * Рефы, а не состояние: отметка «уже отправлено» ничего не рисует.
   */
  const entry = vin ? "decoder" : "direct";
  const rootRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const readyRef = useRef(false);
  /** Чем человек платит — приходит в `onClick` виджета, нужен в `createOrder`. */
  const fundingRef = useRef<string | undefined>(undefined);
  /**
   * Где сломалось. `onError` виджета срабатывает и на брошенное из `createOrder`,
   * и на собственные сбои SDK, — без отметки они были бы неразличимы.
   */
  const failStageRef = useRef<ReportPayStage | null>(null);

  /**
   * Готовность формы считается на каждый рендер и гасит кнопку оплаты.
   *
   * Это не украшение, а единственный способ не показать человеку окно оплаты,
   * которое закрывается само. PayPal открывает окно СИНХРОННО по клику — иначе его
   * съел бы блокировщик поп-апов, — и только потом спрашивает `onClick`. Ответ
   * `actions.reject()` закрывает уже открытое окно, и со стороны это выглядит
   * поломкой, а не отказом из-за пустого поля. Поэтому до заполнения формы кнопка
   * не нажимается вовсе, а рядом написано, чего не хватает.
   *
   * Номер берётся из проверки выше, если она была: человек уже ввёл его один раз,
   * и просить тот же VIN второй раз — лишний шаг ровно там, где он готов платить.
   * Без проверки (например, на главной) поле остаётся и работает как раньше.
   */
  const orderedLink = vin || link.trim();
  const linkOk = VIN_RE.test(orderedLink) || LISTING_RE.test(orderedLink);
  const phoneOk = Boolean(phone);
  const formValid = linkOk && phoneOk;

  const missing = [!linkOk && t("hintLink"), !phoneOk && t("hintPhone")]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        trackReportStep("form_view", { entry });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [entry]);

  useEffect(() => {
    if (formValid && !readyRef.current) {
      readyRef.current = true;
      trackReportStep("form_ready", { entry });
    }
  }, [formValid, entry]);

  useEffect(() => {
    // Сборка без client id не рисует кнопку вовсе — это тоже сломанная оплата.
    if (!clientId) trackReportStep("pay_error", { entry, stage: "no_client_id" });
  }, [clientId, entry]);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackReportStep("form_start", { entry });
  }

  /** Страховка на случай клика по включённой кнопке с негодными данными. */
  function validate(): boolean {
    setLinkError(!linkOk);
    setPhoneError(!phoneOk);
    return formValid;
  }

  if (success) {
    // Самый горячий момент воронки: оплата прошла, человек ждёт отчёт —
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
    <div
      ref={rootRef}
      onFocusCapture={markStarted}
      className="bg-elevated border border-border-subtle rounded-2xl p-6 sm:p-8 space-y-4"
    >
      {vin ? (
        <div className="rounded-lg border border-border-subtle bg-base px-4 py-3">
          <div className="text-xs text-text-muted mb-0.5">{t("orderedFor")}</div>
          <div className="font-mono text-sm text-text tracking-wide">{vin}</div>
        </div>
      ) : (
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
      )}
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <div>
          <label className="block text-sm text-text-muted mb-1.5">{t("fieldPhone")}</label>
          <PhoneInput
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (phoneError) setPhoneError(false);
            }}
            required
          />
        </div>
        <MessengerSelector
          messenger={messenger}
          onMessengerChange={setMessenger}
          tgUsername={tgUsername}
          onTgUsernameChange={setTgUsername}
          label={t("messengerLabel")}
        />
      </div>
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

      {/* Платёжная часть уже полей: кнопка PayPal во всю ширину контейнера выглядит
          баннером, а не кнопкой, и цена рядом с ней теряется. */}
      <div className="lg:max-w-xl lg:mx-auto space-y-4 pt-2">
      <div className="flex items-center justify-between rounded-lg bg-base border border-border-subtle px-4 py-3">
        <span className="text-sm text-text-secondary">{t("priceLabel")}</span>
        <span className="text-lg font-semibold text-text">{t("price")}</span>
      </div>

      {payMessage && (
        <div
          className={
            payMessage.tone === "error"
              ? "flex items-start gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error"
              : "flex items-start gap-2 rounded-lg bg-elevated border border-border-subtle px-4 py-3 text-sm text-text-secondary"
          }
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{payMessage.text}</span>
        </div>
      )}

      {!formValid && (
        <p className="text-xs text-text-muted">
          {t("payHint")} {missing}
        </p>
      )}

      {clientId ? (
        <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture" }}>
          <ScriptLoadError entry={entry} text={t("payError")} />
          <PayPalButtons
            style={{ layout: "vertical", label: "pay" }}
            disabled={paying || !formValid}
            onClick={(data, actions) => {
              setPayMessage(null);
              failStageRef.current = null;
              if (!validate()) return actions.reject();
              fundingRef.current =
                typeof data.fundingSource === "string" ? data.fundingSource : undefined;
              trackReportStep("pay_click", { entry, fundingSource: fundingRef.current });
              return actions.resolve();
            }}
            createOrder={async () => {
              // Контакты едут на сервер уже здесь — ради уведомления менеджеру
              // «начал оплату»: если человек не дойдёт до конца, написать ему есть куда.
              const res = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone,
                  link: orderedLink,
                  messenger,
                  tgUsername,
                  comment,
                  fundingSource: fundingRef.current,
                }),
              });
              if (!res.ok) {
                failStageRef.current = "create_order";
                throw new Error("create-order failed");
              }
              const json = (await res.json()) as { id: string };
              return json.id;
            }}
            onApprove={async (data) => {
              setPaying(true);
              try {
                const res = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: data.orderID,
                    phone,
                    link: orderedLink,
                    messenger,
                    tgUsername,
                    comment,
                  }),
                });
                const json = (await res.json()) as { success: boolean; error?: string };
                if (!res.ok || !json.success) {
                  trackReportStep("pay_error", { entry, stage: "capture" });
                  setPayMessage({ tone: "error", text: json.error || t("payError") });
                  return;
                }
                trackLead("report");
                setSuccess(true);
              } catch {
                trackReportStep("pay_error", { entry, stage: "capture" });
                setPayMessage({ tone: "error", text: t("payError") });
              } finally {
                setPaying(false);
              }
            }}
            onError={(err) => {
              // Настоящую причину знает только PayPal, и без неё отказ неотличим
              // от «окно закрылось само». В консоль — чтобы было что прочитать.
              console.error("[PayPal]", err);
              trackReportStep("pay_error", { entry, stage: failStageRef.current ?? "sdk" });
              failStageRef.current = null;
              setPaying(false);
              setPayMessage({ tone: "error", text: t("payError") });
            }}
            onCancel={() => {
              // Закрытое окно оплаты обязано сказать о себе: молчание здесь
              // читается как поломка сайта, а не как отменённый платёж.
              setPaying(false);
              trackReportStep("pay_cancel", { entry, fundingSource: fundingRef.current });
              setPayMessage({ tone: "info", text: t("payCancelled") });
            }}
          />
        </PayPalScriptProvider>
      ) : (
        <p className="text-sm text-error">{t("payError")}</p>
      )}
      </div>
    </div>
  );
}

/**
 * Скрипт PayPal не загрузился (блокировщик, сеть, неверный client id) — виджет тогда
 * не рисует ничего, и на месте кнопки пусто. Человеку надо сказать, что оплата
 * недоступна, а нам — узнать об этом: такой отказ не доходит до сервера вовсе.
 */
function ScriptLoadError({ entry, text }: { entry: "decoder" | "direct"; text: string }) {
  const [{ isRejected }] = usePayPalScriptReducer();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (isRejected && !trackedRef.current) {
      trackedRef.current = true;
      trackReportStep("pay_error", { entry, stage: "sdk_load" });
    }
  }, [isRejected, entry]);

  return isRejected ? <p className="text-sm text-error">{text}</p> : null;
}
