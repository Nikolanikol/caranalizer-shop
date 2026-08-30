"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  Copy,
  Gauge,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Ship,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-context";
import { getAuthClient } from "@/lib/auth/client";
import { trackVinDecode } from "@/lib/analytics";
import { copyText } from "@/lib/clipboard";
import {
  decodeVin,
  sanitizeVinInput,
  vinProblem,
  VIN_LENGTH,
  type VinInfo,
} from "@/lib/vin/decode";
import { countryName } from "@/lib/vin/countries";
import { colorTerm, fuelTerm } from "@/lib/vin/registry-terms";
import { vinAuthLink } from "@/lib/vin/auth-link";
import {
  clearVinHistory,
  getHistorySnapshot,
  getHistoryServerSnapshot,
  rememberVin,
  subscribeHistory,
} from "@/lib/vin/history";
import { VIN_PATHS, type VinLocale } from "@/lib/seo";

/**
 * Проверка машины по VIN на одноимённой странице.
 *
 * Это не «расшифровка номера»: расшифровка — только первый слой, и она бесплатна ровно
 * потому, что дёшева. Ценность в корейском реестре — снята ли машина с учёта на экспорт
 * и с каким пробегом. Отсюда и подача: обещаем реестр, а разбор номера показываем
 * по дороге к нему.
 *
 * Разбор двухслойный, и слои различаются не только объёмом:
 *
 * **Базовый** — марка, страна завода, год — считается прямо в браузере тем же модулем,
 * что и на сервере (`lib/vin/decode.ts`). Никакой сети: появляется по мере ввода
 * семнадцатого знака. Человек видит, что мы про его машину что-то знаем, ещё не оставив
 * ни одного контакта.
 *
 * **Расширенный** — реестр экспорта и NHTSA — только для вошедших, решение владельца
 * 30.08.2026. Гейт держит API-роут, а не эта разметка: сессия живёт в localStorage,
 * и «спрятать» блок версткой значило бы отдать данные всем, кто откроет вкладку сети.
 * Анонимному посетителю запрос не отправляется вовсе.
 */

type Car365Facts = {
  name: string | null;
  colorCode: string | null;
  colorName: string | null;
  fuelCode: string | null;
  fuelName: string | null;
  mileageKm: number | null;
  displacementCc: number | null;
  seats: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  firstRegistered: string | null;
  exportDeclared: string | null;
};

type Car365Result =
  | { status: "found"; facts: Car365Facts }
  | { status: "not-found" }
  | { status: "unavailable"; reason: string };

type VinQuota = { used: number; limit: number; resetsAt: string | null };

type VinResponse = {
  vin: string;
  basic: VinInfo | null;
  locked: boolean;
  nhtsa?: Record<string, unknown> | null;
  car365?: Car365Result;
  quota?: VinQuota;
};

/**
 * Поля реестра в порядке показа.
 *
 * Показываются **все** и всегда, даже когда реестр их не заполнил: пропущенная строка
 * читается как «мы не смотрели», а прочерк — как «смотрели, там пусто». Для отчёта,
 * по которому принимают решение о покупке, разница существенная.
 *
 * `lead` — пробег: то самое число, ради которого проверку и заказывают.
 * `note` — подпись под прочерком, когда молчание реестра надо объяснить.
 */
const CAR365_ROWS = [
  { key: "name", label: "fName" },
  { key: "mileageKm", label: "fMileage", lead: true },
  { key: "color", label: "fColor" },
  { key: "fuel", label: "fFuel" },
  { key: "displacementCc", label: "fEngine" },
  { key: "seats", label: "fSeats" },
  { key: "size", label: "fSize" },
  { key: "firstRegistered", label: "fFirstReg" },
  { key: "export", label: "fExport", note: "exportPending" },
] as const;

/** Поля NHTSA в порядке показа. Пустые не выводятся — их там большинство. */
const NHTSA_FIELDS = [
  ["model", "fModel"],
  ["series", "fSeries"],
  ["bodyClass", "fBody"],
  ["fuel", "fFuel"],
  ["displacementL", "fEngineL"],
  ["cylinders", "fCylinders"],
  ["driveType", "fDrive"],
  ["transmission", "fTransmission"],
  ["doors", "fDoors"],
  ["plantCity", "fPlant"],
] as const;

/**
 * Значение поля реестра к показу. `null` — реестр промолчал, рисуем прочерк.
 *
 * Цвет и топливо берём по коду (`colorCd`, `useFuelCd`): портал публикует полные
 * таблицы, и они закрытые. Корейское название идёт запасным путём.
 *
 * Разряды числа расставляем по локали: реестр отдаёт `143,351`, а русский читатель
 * видит в запятой десятичный разделитель и читает «сто сорок три километра».
 */
function car365Value(
  key: (typeof CAR365_ROWS)[number]["key"],
  facts: Car365Facts,
  locale: string
): string | null {
  if (!facts) return null;
  const n = (value: number | null) => (value == null ? null : value.toLocaleString(locale));
  switch (key) {
    case "name":
      return facts.name;
    case "mileageKm":
      return n(facts.mileageKm);
    case "color":
      return colorTerm(facts.colorCode, facts.colorName, locale);
    case "fuel":
      return fuelTerm(facts.fuelCode, facts.fuelName, locale);
    case "displacementCc":
      return n(facts.displacementCc);
    case "seats":
      return n(facts.seats);
    case "size":
      // Габариты имеют смысл только целиком: одна длина ни о чём не говорит.
      return facts.lengthMm && facts.widthMm && facts.heightMm
        ? `${facts.lengthMm} × ${facts.widthMm} × ${facts.heightMm}`
        : null;
    case "firstRegistered":
      return facts.firstRegistered;
    case "export":
      return facts.exportDeclared;
  }
}

export function VinDecoder() {
  const t = useTranslations("vinDecoder");
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();

  const [vin, setVin] = useState("");
  const [result, setResult] = useState<VinResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  /** Расход лимита. Приезжает с сервера — в браузере честной цифры взять неоткуда. */
  const [quota, setQuota] = useState<VinQuota | null>(null);

  /** Номер последнего запроса: ответы старее него игнорируются. */
  const requestSeq = useRef(0);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * История — внешнее хранилище, а не стейт с эффектом: чтение localStorage эффектом
   * со `setState` даёт каскадный рендер, и правила React такое запрещают.
   * Серверный снимок пустой, поэтому первый рендер совпадает с серверным.
   */
  const history = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );

  /*
   * Проверка номера — та же функция, что и на сервере. Пока номер не добран до конца,
   * молчим: счётчик знаков и так виден, а красная строка на третьем символе — это
   * придирка к человеку, который ещё печатает.
   */
  const problem = useMemo(
    () => (vin.length === VIN_LENGTH ? vinProblem(vin) : null),
    [vin]
  );
  const ready = vin.length === VIN_LENGTH && !problem;

  /** Базовый разбор считается на лету — сети здесь нет вовсе. */
  const basic = useMemo(() => (ready ? decodeVin(vin) : null), [ready, vin]);

  const spent = quota ? quota.used >= quota.limit : false;

  // Ловушка с `/ar/auth` разобрана в `lib/vin/auth-link.ts` — там же она и покрыта тестом.
  const { href: authHref } = vinAuthLink(locale, VIN_PATHS[locale as VinLocale] ?? VIN_PATHS.ru);

  function pickFromHistory(value: string) {
    requestSeq.current++;
    setVin(value);
    setResult(null);
    setError("");
    setPending(false);
  }

  const runFullCheck = useCallback(
    async (target: string) => {
      /*
       * Номер запроса против гонки ответов.
       *
       * Без него так: посетитель проверяет номер A, не дожидается, правит поле
       * на номер B — и ответ по A приезжает и ложится под заголовком B. Данные чужой
       * машины под своим VIN — худшая из возможных ошибок на этой странице, потому что
       * выглядит она совершенно нормально. Ответ, устаревший к моменту прихода,
       * отбрасывается целиком.
       */
      const seq = ++requestSeq.current;
      setPending(true);
      setError("");
      try {
        // Токен спрашиваем у клиента, а не берём из контекста: там он на момент вызова
        // может отставать на рендер, а здесь всегда свежий и обновляется сам.
        const { data } = await getAuthClient().auth.getSession();
        const token = data.session?.access_token;

        const response = await fetch("/api/vin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ vin: target }),
        });

        // Читаем текстом и разбираем сами: при 502 от прокси в теле лежит HTML,
        // и `response.json()` бросил бы разбором, а не сказал бы, что случилось.
        const raw = await response.text();
        let payload: (VinResponse & { error?: string }) | null = null;
        try {
          payload = raw ? (JSON.parse(raw) as VinResponse & { error?: string }) : null;
        } catch {
          payload = null;
        }
        if (!response.ok || !payload) {
          if (payload?.quota && seq === requestSeq.current) setQuota(payload.quota);
          throw new Error(payload?.error || t("error"));
        }

        if (seq !== requestSeq.current) return;
        // Лимит забираем и из отказа: при 429 сервер присылает его вместе с ошибкой.
        if (payload.quota) setQuota(payload.quota);
        setResult(payload);
        rememberVin(target);
        trackVinDecode(payload.locked ? "locked" : "full");
      } catch (err) {
        if (seq !== requestSeq.current) return;
        // Бросить можно не только `Error`: у `null` нет `.message`, и обращение
        // к нему уронило бы сам обработчик ошибки.
        setError(err instanceof Error && err.message ? err.message : t("error"));
      } finally {
        if (seq === requestSeq.current) setPending(false);
      }
    },
    [t]
  );

  const car365 = result?.car365;
  const nhtsa = result?.nhtsa as Record<string, string | number | null> | null | undefined;
  const nhtsaRows = NHTSA_FIELDS.map(([key, label]) => [label, nhtsa?.[key]] as const).filter(
    ([, value]) => value != null && value !== ""
  );

  /** Отчёт текстом — его пересылают менеджеру и себе в заметки. */
  async function copyReport() {
    if (!basic) return;
    const lines = [
      `VIN: ${vin}`,
      `${t("fMake")}: ${basic.make ?? t("unknownMake")}`,
      basic.country && `${t("fCountry")}: ${countryName(basic.country, locale)}`,
      basic.year && `${t("fYear")}: ${basic.year}`,
    ];
    if (car365?.status === "found") {
      lines.push("", `${t("registryTitle")}: ${t("badgeFound")}`);
      for (const row of CAR365_ROWS) {
        // В текст отчёта прочерк тоже идёт: «не заполнено» — это тоже результат.
        lines.push(`${t(row.label)}: ${car365Value(row.key, car365.facts, locale) ?? "—"}`);
      }
    } else if (car365?.status === "not-found") {
      lines.push("", `${t("registryTitle")}: ${t("badgeNotFound")}`);
    }

    // Через общий модуль: прямой вызов clipboard роняет обработчик там, где объекта
    // нет (незащищённый контекст, встроенные браузеры мессенджеров), а без результата
    // кнопка отрапортовала бы «скопировано», ничего не скопировав.
    if (!(await copyText(lines.filter(Boolean).join("\n")))) {
      setError(t("copyFailed"));
      return;
    }
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-3xl border-2 border-primary/30 bg-elevated p-6 sm:p-9 shadow-2xl shadow-primary/5">
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold uppercase tracking-wide text-primary-light">
        <Ship className="h-3.5 w-3.5" />
        {t("eyebrow")}
      </span>

      <h2 className="mt-4 text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] leading-tight">
        {t("title")}
      </h2>
      <p className="mt-3 text-sm sm:text-lg text-text-secondary">{t("hint")}</p>

      {/* Что именно достаём — иначе «проверка по VIN» звучит как любая другая. */}
      <ul className="mt-5 flex flex-wrap gap-2">
        {(
          [
            [Ship, "feat1"],
            [Gauge, "feat2"],
            [ShieldCheck, "feat3"],
          ] as const
        ).map(([Icon, key]) => (
          <li
            key={key}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-base/50 px-3 py-1.5 text-xs text-text-secondary"
          >
            <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
            {t(key)}
          </li>
        ))}
      </ul>

      <form
        className="mt-6 flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && user && !pending) void runFullCheck(vin);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-4 h-5 w-5 text-text-muted pointer-events-none" />
          <input
            value={vin}
            onChange={(e) => {
              // I, O и Q в VIN не встречаются: кто переписывает номер с таблички,
              // почти наверняка видел там 1 и 0. Подмена живёт в модуле, не здесь.
              setVin(sanitizeVinInput(e.target.value));
              // Правка номера отменяет запрос в полёте: его ответ уже не про то,
              // что набрано сейчас.
              requestSeq.current++;
              setResult(null);
              setError("");
              setPending(false);
            }}
            placeholder={t("placeholder")}
            aria-label={t("title")}
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            /*
              Кегль и отступы на телефоне меньше: при 18px номер из 17 знаков требует
              192px, а в поле на экране 375px помещается 175 — часть номера уезжала
              за край, и человек не видел, что набрал. Замер, а не глазомер.
            */
            className="h-14 w-full rounded-xl border-2 border-border bg-base ps-11 pe-14 sm:ps-12 sm:pe-16 font-mono text-[15px] sm:text-lg sm:tracking-wide uppercase text-text placeholder:text-text-dim placeholder:normal-case focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-colors"
          />
          <span
            className={`absolute top-1/2 -translate-y-1/2 end-4 text-xs tabular-nums ${
              ready ? "text-success" : "text-text-dim"
            }`}
          >
            {vin.length}/{VIN_LENGTH}
          </span>
        </div>
        {user && (
          <Button
            type="submit"
            variant="cta"
            size="lg"
            disabled={!ready || pending || spent}
            className="h-14 px-8 shrink-0"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {pending ? t("checking") : t("searchCta")}
          </Button>
        )}
      </form>

      {/* Что не так с номером. Показывается только на добранном до конца. */}
      {problem && (
        <p className="mt-3 flex items-start gap-2 text-sm text-error">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
          {t(`vin_${problem}`)}
        </p>
      )}

      {/* Остаток лимита. Цифра с сервера: в браузере честной взять неоткуда. */}
      {quota && (
        <p className={`mt-3 text-xs ${spent ? "text-error" : "text-text-muted"}`}>
          {spent
            ? t("quotaOut", { limit: quota.limit })
            : t("quotaLeft", { left: Math.max(0, quota.limit - quota.used) })}
        </p>
      )}

      {/* История. Своя, в браузере — на сервер не уходит. */}
      {history.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted me-1">{t("historyLabel")}</span>
          {history.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => pickFromHistory(item)}
              className="rounded-md bg-base/70 border border-border px-2.5 py-1 font-mono text-xs text-text-secondary hover:border-primary hover:text-text transition-colors cursor-pointer"
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={clearVinHistory}
            title={t("historyClear")}
            aria-label={t("historyClear")}
            className="p-1 text-text-dim hover:text-error transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Базовый разбор: появляется сам, как только номер набран целиком. */}
      {basic && (
        <div className="mt-5 rounded-2xl border border-border bg-base/40 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-semibold">{basic.make ?? t("unknownMake")}</span>
                {basic.country && (
                  <span className="text-text-secondary">{countryName(basic.country, locale)}</span>
                )}
                {basic.year && (
                  <span className="text-text-secondary">{t("year", { year: basic.year })}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {t("wmi")}: <span className="font-mono">{basic.wmi}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyReport()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary hover:text-text transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          {!basic.make && <p className="mt-3 text-xs text-text-muted">{t("unknownWmiNote")}</p>}
        </div>
      )}

      {/*
        Замок для невошедшего. Показываем только на полном номере: до него обещать
        нечего. Условие по `result` — чтобы после ответа тут не оставался пустой div
        с отступом сверху.
      */}
      {basic && (!result || result.locked) && (
        <div className="mt-4">
          {authLoading ? (
            <div className="h-24 rounded-2xl border border-border-subtle bg-base/30 animate-pulse" />
          ) : !user ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <p className="flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4 text-primary" />
                {t("lockedTitle")}
              </p>
              <p className="mt-1.5 mb-4 text-sm text-text-secondary">{t("lockedText")}</p>
              <a
                href={authHref}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-cta text-base-darker text-sm font-semibold hover:bg-cta-hover transition-colors"
              >
                {t("lockedCta")}
              </a>
            </div>
          ) : null}
        </div>
      )}

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm text-error">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Корейский реестр снятых с учёта на экспорт. */}
      {car365 && (
        <div className="mt-4 rounded-2xl border border-border bg-base/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold font-[family-name:var(--font-heading)]">
              {t("registryTitle")}
            </h3>
            {/*
             * Главный факт всей проверки — снята машина с учёта на экспорт или нет.
             * Он и есть ответ, ради которого сюда идут, поэтому стоит плашкой,
             * а не строкой в общем списке полей.
             */}
            {car365.status !== "unavailable" && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  car365.status === "found"
                    ? "bg-success/10 text-success border-success/30"
                    : "bg-elevated text-text-secondary border-border"
                }`}
              >
                {car365.status === "found" ? t("badgeFound") : t("badgeNotFound")}
              </span>
            )}
          </div>
          {car365.status === "found" ? (
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {CAR365_ROWS.map((row) => {
                const value = car365Value(row.key, car365.facts, locale);
                const lead = "lead" in row && row.lead && value;
                return (
                  <div key={row.key} className={lead ? "sm:col-span-2" : undefined}>
                    <dt className="text-xs text-text-muted">{t(row.label)}</dt>
                    <dd
                      className={
                        value
                          ? lead
                            ? "text-xl font-semibold"
                            : "text-sm font-medium"
                          : "text-sm font-medium text-text-dim"
                      }
                    >
                      {value ?? "—"}
                      {lead && <span className="ms-1 text-sm text-text-secondary">{t("km")}</span>}
                    </dd>
                    {/* Прочерк без объяснения выглядит как поломка, а не как факт. */}
                    {!value && "note" in row && row.note && (
                      <p className="mt-1 text-xs text-text-muted">{t(row.note)}</p>
                    )}
                  </div>
                );
              })}
            </dl>
          ) : (
            /*
             * «Записи нет» и «реестр не ответил» — разные вещи, и путать их нельзя:
             * первое факт о машине, второе о нас. Покупатель, прочитавший «не снята
             * с учёта» вместо «реестр молчит», сделает вывод, которого мы не давали.
             */
            <p className="text-sm text-text-secondary">
              {car365.status === "not-found" ? t("registryNotFound") : t("registryUnavailable")}
            </p>
          )}
        </div>
      )}

      {/* NHTSA. По корейским и европейским номерам она чаще всего пуста — не обещаем. */}
      {result && !result.locked && (
        <div className="mt-4 rounded-2xl border border-border bg-base/40 p-5">
          <h3 className="font-semibold font-[family-name:var(--font-heading)] mb-4">
            {t("nhtsaTitle")}
          </h3>
          {nhtsaRows.length ? (
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {nhtsaRows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-text-muted">{t(label)}</dt>
                  <dd className="text-sm font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-text-secondary">{t("nhtsaEmpty")}</p>
          )}
        </div>
      )}
    </div>
  );
}
