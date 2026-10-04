import { isSection, sectionPages } from "@/lib/sitemap";
import { chunkPages, parseChunkName, urlsetXml } from "@/lib/sitemap-xml";

/**
 * Часть карты сайта: `/sitemaps/parts-ru-1.xml` и подобные. Список частей —
 * в индексе на `/sitemap.xml`. Middleware адреса с точкой не трогает, поэтому
 * языковой префикс сюда не подставляется.
 *
 * Рендерится по первому запросу и живёт сутки — как индекс. Заранее не собирается:
 * имена частей зависят от числа строк в базе, а сборке хватает и без этого.
 */
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const chunk = file.endsWith(".xml") ? parseChunkName(file.slice(0, -4)) : null;
  if (!chunk || !isSection(chunk.section)) return new Response("Not found", { status: 404 });

  const pages = chunkPages(await sectionPages(chunk.section), chunk.locale, chunk.index);
  if (!pages.length) return new Response("Not found", { status: 404 });

  return new Response(urlsetXml(pages, chunk.locale), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
