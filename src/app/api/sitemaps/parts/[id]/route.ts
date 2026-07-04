import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generatePartSlug } from "@/lib/slug";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const LOCALES = ["ru", "en", "ar"] as const;
const PRODUCTS_PER_CHUNK = 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id) || id < 0) {
    return new Response("Invalid sitemap id", { status: 400 });
  }

  const supabase = createServerClient();
  const offset = id * PRODUCTS_PER_CHUNK;

  const { data: products } = await supabase
    .from("parts_products")
    .select("id, part_number")
    .range(offset, offset + PRODUCTS_PER_CHUNK - 1)
    .order("id", { ascending: true });

  if (!products?.length) {
    return new Response("Sitemap not found", { status: 404 });
  }

  // part_number дублируется в таблице (2-3 источника) — без дедупа
  // в sitemap попадают одинаковые <loc>
  const seen = new Set<string>();
  const unique = products.filter((p) => {
    const key = p.part_number || `id-${p.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const urls = unique.flatMap((p) => {
    const slug = generatePartSlug(p.part_number, p.id);
    return LOCALES.map(
      (locale) =>
        `  <url>
    <loc>${BASE}/${locale}/parts/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
${LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE}/${l}/parts/${slug}"/>`).join("\n")}
  </url>`
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
