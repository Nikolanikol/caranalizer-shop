/**
 * XML карты сайта — индекс и части. Чистые функции без зависимостей: их проверяет
 * `npm run sitemap:test` настоящим модулем, а не копией.
 *
 * Свой XML, а не `MetadataRoute.Sitemap`, потому что карта разбита на части,
 * а штатный `generateSitemaps` в Next 16 отдаёт куски по `/sitemap/<id>.xml`
 * и при этом **оставляет `/sitemap.xml` без ответа (404)** — проверено экспериментом
 * ещё при 47 тысячах адресов. Этот адрес отправлен в Search Console, в Вебмастер
 * и прописан в `robots.ts`; терять его нельзя. Поэтому индекс живёт на `/sitemap.xml`
 * своим маршрутом, а части — на `/sitemaps/<имя>.xml`.
 */

/** Одна страница во всех своих языковых версиях. */
export interface SitemapPage {
  /** Адрес по языку: `{ ru: 'https://…/ru/…', en: 'https://…/en/…' }`. */
  languages: Record<string, string>;
  /** Адрес для `x-default`. */
  xDefault: string;
}

/**
 * Потолок адресов в одном файле. Google принимает до 50 000 и до 50 МБ; у нас
 * на адрес с полным hreflang приходится ~500 байт, то есть 50 тысяч — это ~25 МБ.
 * Берём 20 тысяч: файлы остаются по ~10 МБ, а рост каталога не упрётся в предел
 * внезапно, как это почти случилось с единой картой (47 461 из 50 000).
 */
export const MAX_URLS_PER_FILE = 20_000;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Имена файлов одной части: `parts-ru-1`, `parts-ru-2`… По файлу на язык — чтобы
 * в Search Console было видно отдельно, сколько взято русских и сколько английских.
 */
export function chunkNames(section: string, locale: string, count: number): string[] {
  const files = Math.max(1, Math.ceil(count / MAX_URLS_PER_FILE));
  return Array.from({ length: files }, (_, i) => `${section}-${locale}-${i + 1}`);
}

/** Разбор имени файла обратно: `parts-ru-2` → `{ section: 'parts', locale: 'ru', index: 1 }`. */
export function parseChunkName(name: string): { section: string; locale: string; index: number } | null {
  const match = /^([a-z]+)-([a-z]{2})-([1-9][0-9]*)$/.exec(name);
  if (!match) return null;
  return { section: match[1], locale: match[2], index: Number(match[3]) - 1 };
}

/**
 * Адреса одного языка, срез под файл с номером `index`. Страница без версии
 * на этом языке в файл не попадает.
 */
export function chunkPages(pages: SitemapPage[], locale: string, index: number): SitemapPage[] {
  const own = pages.filter((page) => page.languages[locale]);
  return own.slice(index * MAX_URLS_PER_FILE, (index + 1) * MAX_URLS_PER_FILE);
}

export function urlsetXml(pages: SitemapPage[], locale: string): string {
  const rows = pages.map((page) => {
    const links = [
      ...Object.entries(page.languages).map(
        ([lang, href]) => `<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}"/>`,
      ),
      `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(page.xDefault)}"/>`,
    ];
    return `<url><loc>${escapeXml(page.languages[locale])}</loc>${links.join('')}</url>`;
  });

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    rows.join('\n') +
    '\n</urlset>\n'
  );
}

export function indexXml(fileUrls: string[]): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    fileUrls.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join('\n') +
    '\n</sitemapindex>\n'
  );
}
