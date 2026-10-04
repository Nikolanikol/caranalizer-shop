import { SITE_URL } from "@/lib/site";
import { allSitemapFiles } from "@/lib/sitemap";
import { indexXml } from "@/lib/sitemap-xml";

/**
 * Индекс карты сайта — на прежнем адресе `/sitemap.xml`, который отправлен
 * в Search Console и Вебмастер и прописан в `robots.ts`. Части лежат
 * на `/sitemaps/<имя>.xml`; почему не штатный `generateSitemaps` — в `lib/sitemap-xml.ts`.
 *
 * Сутки кэша: каталог меняется раз в скрап, а сборка индекса читает базу целиком.
 */
export const revalidate = 86400;

export async function GET() {
  const files = await allSitemapFiles();
  return new Response(indexXml(files.map((name) => `${SITE_URL}/sitemaps/${name}.xml`)), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
