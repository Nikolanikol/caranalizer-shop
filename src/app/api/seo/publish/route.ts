// POST /api/seo/publish  — Фаза 3: публикация черновиков на карточки.
//
// Автопубликация: промоутит draft-предложения из ca_seo_suggestions в ca_parts_seo,
// ревалидирует страницы, помечает applied. Без гейта апрува (выбрана автопубликация).
// Можно ограничить одним батчем (?batch_id=) или одним предложением (?id=).
//
//   curl -X POST -H "x-seo-secret: $SEO_CRON_SECRET" https://caranalizer.com/api/seo/publish

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { publishDrafts } from "@/lib/seo-publish";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = process.env.SEO_CRON_SECRET;
  if (!secret || req.headers.get("x-seo-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch_id = req.nextUrl.searchParams.get("batch_id") || undefined;
  const idParam = Number(req.nextUrl.searchParams.get("id"));
  const id = Number.isFinite(idParam) && idParam > 0 ? idParam : undefined;

  const supabase = createServerClient();

  try {
    const result = await publishDrafts(supabase, { batch_id, id });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Publish failed", detail: String(e) }, { status: 500 });
  }
}
