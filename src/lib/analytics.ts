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

/** Успешно отправленная форма (бесплатная проверка, контакты). */
export function trackLead(source: "check" | "contact") {
  track("generate_lead", { lead_source: source });
}

/** Клик по внешней ссылке на K-Axis (kmotors.shop). */
export function trackKmotorsClick(placement: string) {
  track("kmotors_click", { placement });
}
