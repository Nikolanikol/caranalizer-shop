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

/** Покупатель перешёл от корзины к форме заявки. */
export function trackBeginCheckout(items: number) {
  track("begin_checkout", { items });
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
