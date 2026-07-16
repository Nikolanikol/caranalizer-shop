// POST /api/seo/collect  — Фаза 1 SEO-автоматики: сбор данных из Search Console.
//
// Тянет performance за последние 28 дней (разрез по странице),
// парсит URL → язык/раздел/товар и апсертит в ca_seo_page_stats.
// Дёргается по расписанию (systemd/cron на VPS) с секретом в заголовке:
//   curl -X POST -H "x-seo-secret: $SEO_CRON_SECRET" https://caranalizer.com/api/seo/collect
//
// Данные в GSC отстают на ~2–3 дня, поэтому окно заканчиваем 3 дня назад.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { fetchPageStats, daysAgo } from "@/lib/gsc";
import { parsePartSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // сбор может быть долгим на больших сайтах

const LANGS = new Set(["ru", "en", "ar"]);
const UPSERT_CHUNK = 1_000;
const LOOKUP_CHUNK = 500;
const RETENTION_DAYS = 45; // сколько дней снапшотов держим в ca_seo_page_stats

type StatRow = {
  url: string;
  page_path: string | null;
  lang: string | null;
  section: string | null;
  product_id: number | null;
  part_number: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  period_start: string;
  period_end: string;
};

/** Разбирает URL страницы на язык / раздел / (для запчастей) артикул или id. */
function parseUrl(rawUrl: string): {
  page_path: string | null;
  lang: string | null;
  section: string | null;
  part_number: string | null;
  product_id: number | null;
} {
  let path: string;
  try {
    path = new URL(rawUrl).pathname;
  } catch {
    return { page_path: null, lang: null, section: null, part_number: null, product_id: null };
  }

  const seg = path.split("/").filter(Boolean); // ["en","parts","58101P0A10"]
  const lang = seg[0] && LANGS.has(seg[0]) ? seg[0] : null;
  const rest = lang ? seg.slice(1) : seg;
  const section = rest[0] ?? "(home)";

  let part_number: string | null = null;
  let product_id: number | null = null;

  if (section === "parts" && rest[1]) {
    const parsed = parsePartSlug(rest.slice(1).join("/"));
    part_number = parsed.partNumber;
    product_id = parsed.productId;
  }

  return { page_path: path, lang, section, part_number, product_id };
}

export async function POST(req: NextRequest) {
  const secret = process.env.SEO_CRON_SECRET;
  if (!secret || req.headers.get("x-seo-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period_end = daysAgo(3);   // GSC-данные отстают ~2–3 дня
  const period_start = daysAgo(31); // окно 28 дней

  let gscRows;
  try {
    gscRows = await fetchPageStats(period_start, period_end);
  } catch (e) {
    return NextResponse.json(
      { error: "GSC fetch failed", detail: String(e) },
      { status: 502 }
    );
  }

  const supabase = createServerClient();

  // Первичный разбор + сбор артикулов, которым нужен product_id
  const rows: StatRow[] = gscRows.map((r) => {
    const p = parseUrl(r.page);
    return {
      url: r.page,
      page_path: p.page_path,
      lang: p.lang,
      section: p.section,
      product_id: p.product_id,
      part_number: p.part_number,
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: r.ctr,
      position: r.position,
      period_start,
      period_end,
    };
  });

  // Батч-резолв product_id по part_number (там, где в URL был артикул, а не id-N)
  const needLookup = [
    ...new Set(
      rows.filter((r) => !r.product_id && r.part_number).map((r) => r.part_number as string)
    ),
  ];
  const idByPart = new Map<string, number>();
  for (let i = 0; i < needLookup.length; i += LOOKUP_CHUNK) {
    const chunk = needLookup.slice(i, i + LOOKUP_CHUNK);
    const { data } = await supabase
      .from("parts_products")
      .select("id, part_number")
      .in("part_number", chunk);
    for (const row of data ?? []) {
      if (row.part_number && !idByPart.has(row.part_number)) {
        idByPart.set(row.part_number, row.id);
      }
    }
  }
  for (const r of rows) {
    if (!r.product_id && r.part_number) {
      r.product_id = idByPart.get(r.part_number) ?? null;
    }
  }

  // Апсерт пачками (idempotent по url + period_end).
  // ca_seo_page_stats — ИЗОЛИРОВАННАЯ таблица caranalizer (не общая с KMotors).
  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase
      .from("ca_seo_page_stats")
      .upsert(chunk, { onConflict: "url,period_end" });
    if (error) {
      return NextResponse.json(
        { error: "Upsert failed", detail: error.message, upserted },
        { status: 500 }
      );
    }
    upserted += chunk.length;
  }

  // Retention: держим только скользящее окно снапшотов (детектору хватает свежих).
  // Долгую историю «до/после» хранит ca_seo_suggestions, а не эта таблица.
  const pruneBefore = daysAgo(RETENTION_DAYS);
  const { count: pruned } = await supabase
    .from("ca_seo_page_stats")
    .delete({ count: "exact" })
    .lt("period_end", pruneBefore);

  const partsRows = rows.filter((r) => r.section === "parts").length;
  return NextResponse.json({
    ok: true,
    period: { start: period_start, end: period_end },
    fetched: gscRows.length,
    upserted,
    partsPages: partsRows,
    partsResolved: rows.filter((r) => r.section === "parts" && r.product_id).length,
    pruned: pruned ?? 0,
  });
}
