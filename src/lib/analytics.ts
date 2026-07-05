// GA4 ecommerce-события воронки: view_item → add_to_cart → begin_checkout →
// purchase. gtag загружается в root layout (afterInteractive); до его
// инициализации события молча теряются — допустимо, это первые миллисекунды.
// Цены передаём в KRW: GA конвертирует в валюту ресурса сама.

export interface GaItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function track(event: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // React-гидрация может опередить afterInteractive-скрипт gtag —
  // создаём ту же очередь, что и официальный сниппет: gtag.js при
  // загрузке разберёт всё, что накопилось в dataLayer
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  window.gtag("event", event, params);
}

export function trackViewItem(item: GaItem) {
  track("view_item", {
    currency: "KRW",
    value: item.price,
    items: [item],
  });
}

export function trackAddToCart(item: GaItem) {
  track("add_to_cart", {
    currency: "KRW",
    value: item.price * (item.quantity ?? 1),
    items: [item],
  });
}

export function trackBeginCheckout(items: GaItem[], valueKrw: number) {
  track("begin_checkout", {
    currency: "KRW",
    value: valueKrw,
    items,
  });
}

export function trackPurchase(items: GaItem[], valueKrw: number, transactionId: string) {
  track("purchase", {
    transaction_id: transactionId,
    currency: "KRW",
    value: valueKrw,
    items,
  });
}
