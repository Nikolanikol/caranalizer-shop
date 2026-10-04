// GA4-события лид-воронки. gtag загружается в root layout (afterInteractive);
// до его инициализации события копятся в dataLayer — та же очередь, что и у
// официального сниппета.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function track(event: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  window.gtag("event", event, params);
}

/**
 * Успешно отправленная форма. Значения те же, что у `LeadSource` в `lib/leads.ts`,
 * — по ним заявки уже разложены в базе, и сходиться они должны с точностью до штуки.
 */
export function trackLead(source: "check" | "report" | "contact" | "shop-checkout") {
  track("generate_lead", { lead_source: source });
}

/*
 * Воронка раздела запчастей: посмотрел → положил в корзину → открыл форму → отправил.
 *
 * Имена событий стандартные для GA4, поэтому воронка собирается там сама, без настройки.
 * **Цену и валюту не передаём намеренно** — решение владельца: в отчётах нужны штуки,
 * а суммы и так лежат в заявках. Отчёты GA4 по выручке останутся пустыми, и это ожидаемо,
 * а не недоделка. Понадобятся деньги — добавлять `value` и `currency: 'USD'` во все
 * четыре события разом, иначе воронка посчитает выручку по части шагов.
 *
 * Электронная коммерция Яндекс.Метрики при этом не заполняется: она ждёт свой формат
 * в `dataLayer` (`{ ecommerce: { add: { products: [...] } } }`), а мы шлём события gtag.
 * Без цены её ценность невелика, поэтому второй формат не заводим.
 */

/** Открыта страница детали. */
export function trackViewItem(params: { id: string; oem: string; category: string }) {
  track("view_item", { item_id: params.id, item_oem: params.oem, item_category: params.category });
}

/** Экземпляр положен в корзину. `id` — `product_no` донора, он же ключ корзины. */
export function trackAddToCart(params: { id: string; oem: string; category: string }) {
  track("add_to_cart", { item_id: params.id, item_oem: params.oem, item_category: params.category });
}

/**
 * Корзина открыта. Стоит между `add_to_cart` и `begin_checkout`: без него не отличить
 * «положил и не вернулся» от «открыл корзину, посмотрел на сумму и ушёл».
 */
export function trackViewCart(items: number) {
  track("view_cart", { items });
}

/** Покупатель перешёл от корзины к форме заявки. */
export function trackBeginCheckout(items: number) {
  track("begin_checkout", { items });
}

/**
 * Заявка из корзины не ушла — сервер отказал или сеть оборвалась. До 04.10.2026 такие
 * отказы видел только сам покупатель: в отчётах человек выглядел как бросивший форму.
 */
export function trackCheckoutError(reason: "server" | "network") {
  track("shop_checkout_error", { reason });
}

/*
 * Воронка платного отчёта по VIN (с 04.10.2026).
 *
 * Повод: оплата больше месяца отвечала ошибкой, а мы не видели ни попыток, ни отказов —
 * из всей формы в аналитику уходил только успех (`generate_lead` с `report`).
 * Шаги по порядку:
 *
 *   report_form_view   форма показалась на экране
 *   report_form_start  начал заполнять (первый фокус в поле)
 *   report_form_ready  телефон и VIN заполнены — кнопка оплаты стала активной
 *   report_pay_click   нажал PayPal или «карта» (`funding_source`)
 *   generate_lead      оплачено, заявка ушла (`lead_source: report`)
 *
 * И две ветки в сторону: `report_pay_cancel` — закрыл окно PayPal, `report_pay_error` —
 * сбой, `pay_stage` говорит где: `create_order` (наш сервер не открыл заказ), `capture`
 * (окно пройдено, платёж не подтвердился), `sdk` (ошибка внутри виджета), `sdk_load`
 * (скрипт PayPal не загрузился — кнопки нет вовсе), `no_client_id` (сборка без ключа).
 *
 * Имена свои, а не стандартные `begin_checkout`/`add_payment_info`: стандартные уже
 * заняты корзиной, и общий отчёт GA4 смешал бы запчасти с отчётами.
 *
 * `report_entry` различает, откуда пришли к форме: `decoder` — VIN подставлен из проверки
 * выше, `direct` — форма сама по себе (главная, гайд).
 */
export type ReportStep = "form_view" | "form_start" | "form_ready" | "pay_click" | "pay_cancel" | "pay_error";
export type ReportPayStage = "create_order" | "capture" | "sdk" | "sdk_load" | "no_client_id";

export function trackReportStep(
  step: ReportStep,
  params: { entry: "decoder" | "direct"; fundingSource?: string; stage?: ReportPayStage }
) {
  track(`report_${step}`, {
    report_entry: params.entry,
    ...(params.fundingSource ? { funding_source: params.fundingSource } : {}),
    ...(params.stage ? { pay_stage: params.stage } : {}),
  });
}

/** Клик по внешней ссылке на K-Axis (kmotors.shop). */
export function trackKmotorsClick(placement: string) {
  track("kmotors_click", { placement });
}

/**
 * Регистрация и вход. Имена стандартные для GA4 — отчёт по ним собирается сам.
 * `method` различает Google и почту: у них разная доля брошенных форм, и без него
 * не видно, какой способ работает.
 */
export function trackSignUp(method: "google" | "email") {
  track("sign_up", { method });
}

export function trackLogin(method: "google" | "email") {
  track("login", { method });
}

/**
 * Разбор VIN на странице проверки.
 *
 * `stage` различает два слоя: `full` — расширенная проверка по реестрам (вошедший),
 * `locked` — упёрся в гейт. Второе значение и есть смысл события: по нему видно,
 * сколько людей доходит до VIN и не регистрируется, а это единственный способ понять,
 * окупается гейт или отпугивает. Базовый разбор не считается вовсе — он происходит
 * в браузере без запроса, и события на каждый набранный номер были бы шумом.
 */
export function trackVinDecode(stage: "full" | "locked") {
  track("vin_decode", { vin_stage: stage });
}
