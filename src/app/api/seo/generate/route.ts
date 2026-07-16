// POST /api/seo/generate  — Фаза 2: генерация SEO-черновиков для карточек запчастей.
//
// Берёт N кандидатов (карточки caranalizer с показами, ещё не улучшенные),
// гонит через LLM, складывает draft в ca_seo_suggestions. На сайт НИЧЕГО не пишет —
// публикация (draft → ca_parts_seo) идёт отдельной фазой /api/seo/publish.
// Гейта апрува нет (выбрана автопубликация) — поэтому Telegram-дайджест не шлём.
//
//   curl -X POST -H "x-seo-secret: $SEO_CRON_SECRET" \
//        "https://caranalizer.com/api/seo/generate?limit=25"

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generatePartSuggestions } from "@/lib/seo-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200; // предохранитель против случайного прогона на весь каталог

export async function POST(req: NextRequest) {
  const secret = process.env.SEO_CRON_SECRET;
  if (!secret || req.headers.get("x-seo-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Math.min(
    MAX_LIMIT,
    Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT
  );

  const supabase = createServerClient();

  try {
    const result = await generatePartSuggestions(supabase, limit);
    return NextResponse.json({ ok: true, limit, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Generation failed", detail: String(e) }, { status: 500 });
  }
}
