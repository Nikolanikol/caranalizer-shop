import { createServerClient } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";
const PRODUCTS_PER_CHUNK = 1000;

export async function GET() {
  const supabase = createServerClient();
  const { count } = await supabase
    .from("parts_products")
    .select("*", { count: "exact", head: true });

  const totalProducts = count ?? 0;
  const productChunks = Math.ceil(totalProducts / PRODUCTS_PER_CHUNK);

  const sitemaps = [`${BASE}/sitemap.xml`];
  for (let i = 0; i < productChunks; i++) {
    sitemaps.push(`${BASE}/api/sitemaps/parts/${i}`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((url) => `  <sitemap>\n    <loc>${url}</loc>\n  </sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
