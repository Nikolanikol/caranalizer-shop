const LOCALES = ["ru", "en", "ar"];
const COOKIE_NAME = "NEXT_LOCALE";

const RU_COUNTRIES = new Set([
  "RU", "BY", "KZ", "UZ", "TJ", "TM", "KG", "AZ", "AM", "GE", "MD", "UA",
]);

const AR_COUNTRIES = new Set([
  "SA", "AE", "EG", "IQ", "KW", "QA", "BH", "OM", "YE", "LB", "SY", "JO",
  "LY", "TN", "MA", "DZ", "SD", "MR", "SO", "DJ", "KM",
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Пропускаем без редиректа: локализованные пути, API, статику
    const firstSegment = pathname.split("/")[1];
    if (
      LOCALES.includes(firstSegment) ||
      firstSegment === "api" ||
      firstSegment === "_next" ||
      pathname.includes(".")
    ) {
      return fetch(request);
    }

    // Проверяем cookie — юзер уже выбирал язык?
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (cookieMatch && LOCALES.includes(cookieMatch[1])) {
      return Response.redirect(`${url.origin}/${cookieMatch[1]}${pathname === "/" ? "" : pathname}`, 302);
    }

    // Определяем язык по геолокации Cloudflare
    const country = request.cf?.country || "";
    let locale = "en";
    if (RU_COUNTRIES.has(country)) locale = "ru";
    else if (AR_COUNTRIES.has(country)) locale = "ar";

    return Response.redirect(`${url.origin}/${locale}${pathname === "/" ? "" : pathname}`, 302);
  },
};
