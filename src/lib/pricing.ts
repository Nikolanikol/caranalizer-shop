export const PRICE_MARKUP = 1.23;

const formatters: Record<string, Intl.NumberFormat> = {};

function getFormatter(currency: string): Intl.NumberFormat {
  if (!formatters[currency]) {
    const locale =
      currency === "RUB"
        ? "ru-RU"
        : currency === "KRW"
          ? "ko-KR"
          : currency === "AED"
            ? "ar-AE"
            : currency === "KZT"
              ? "kk-KZ"
              : currency === "UZS"
                ? "uz-UZ"
                : "en-US";

    formatters[currency] = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  }
  return formatters[currency];
}

export function convertPrice(
  priceKrw: number,
  rate: number,
  markup = PRICE_MARKUP
): number {
  return Math.ceil(priceKrw * rate * markup);
}

export function formatPrice(amount: number, currency: string): string {
  return getFormatter(currency || "RUB").format(amount);
}

export function formatKrw(priceKrw: number): string {
  return getFormatter("KRW").format(priceKrw);
}
