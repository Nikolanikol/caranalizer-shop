// Фаза 3 SEO-автоматики caranalizer: генерация SEO-контента карточек запчастей.
//
// ИЗОЛЯЦИЯ ОТ KMOTORS: caranalizer делит БД с kmotors.shop, поэтому пишем в СВОИ
// таблицы (ca_seo_page_stats, ca_seo_suggestions, ca_parts_seo) и генерим СВОИМ
// промптом — иначе на одинаковых артикулах вышел бы дубль контента на двух доменах.
//
// Источник кандидатов: карточки, которые УЖЕ показываются в поиске caranalizer
// (ca_seo_page_stats, section=parts, impressions>=1) и ещё не улучшались.
// Результат — draft в ca_seo_suggestions (на публикацию идёт отдельной фазой).

import { createHash, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLlm, QuotaError, type LlmClient } from "@/lib/llm";

const RECENT_DAYS = 30;      // не предлагать повторно то, что предлагали недавно
// Пауза между вызовами LLM. Gemini flash с биллингом держит высокий RPM,
// но троттл щадит лимиты и стоимость; при free tier — растягивает под квоту.
const THROTTLE_MS = Number(process.env.SEO_THROTTLE_MS) || 4500;

export type Candidate = {
  product_id: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type Generated = {
  title_ru: string;
  title_en: string;
  desc_ru: string;
  desc_en: string;
  body_ru: string;
  body_en: string;
  cross_refs: string[];
};

// ── Выбор кандидатов ────────────────────────────────────────────────────────
export async function selectPartCandidates(
  supabase: SupabaseClient,
  limit: number
): Promise<Candidate[]> {
  // Свежие снапшоты карточек запчастей с показами (данные caranalizer)
  const { data: stats } = await supabase
    .from("ca_seo_page_stats")
    .select("product_id, impressions, ctr, position")
    .eq("section", "parts")
    .not("product_id", "is", null)
    .gte("impressions", 1);

  // Агрегируем по товару (суммарные показы, взвешенная позиция)
  const byProduct = new Map<number, { impr: number; clicksPos: number; ctrSum: number; n: number }>();
  for (const r of stats ?? []) {
    const cur = byProduct.get(r.product_id) ?? { impr: 0, clicksPos: 0, ctrSum: 0, n: 0 };
    cur.impr += r.impressions;
    cur.clicksPos += (r.position ?? 0) * r.impressions;
    cur.ctrSum += r.ctr ?? 0;
    cur.n += 1;
    byProduct.set(r.product_id, cur);
  }

  // Исключаем товары со свежим предложением (draft/approved/applied за RECENT_DAYS)
  const since = new Date(Date.now() - RECENT_DAYS * 864e5).toISOString();
  const { data: recent } = await supabase
    .from("ca_seo_suggestions")
    .select("product_id")
    .gte("created_at", since)
    .neq("status", "rejected")
    .not("product_id", "is", null);
  const skip = new Set((recent ?? []).map((r) => r.product_id));

  const candidates: Candidate[] = [];
  for (const [product_id, v] of byProduct) {
    if (skip.has(product_id)) continue;
    candidates.push({
      product_id,
      impressions: v.impr,
      ctr: v.ctrSum / v.n,
      position: v.impr ? v.clicksPos / v.impr : 0,
    });
  }

  // Приоритет: больше показов — раньше в очереди
  candidates.sort((a, b) => b.impressions - a.impressions);
  return candidates.slice(0, limit);
}

// ── Контекст товара для промпта ─────────────────────────────────────────────
async function fetchContext(supabase: SupabaseClient, productId: number) {
  const { data: p } = await supabase
    .from("parts_products")
    .select("id, part_number, name_ru, name_en, manufacturer, category_id, subcategory_id")
    .eq("id", productId)
    .limit(1)
    .maybeSingle();
  if (!p) return null;

  const { data: pv } = await supabase
    .from("part_vehicles")
    .select("vehicles(name_en, brand, year_from, year_to)")
    .eq("part_id", productId)
    .limit(30);
  const vehicles = (pv ?? [])
    .map((r) => r.vehicles as unknown as { name_en: string; brand: string; year_from: string | null; year_to: string | null } | null)
    .filter((v): v is NonNullable<typeof v> => !!v);

  const catIds = [p.category_id, p.subcategory_id].filter((x): x is number => !!x);
  let cats: { name_ru: string | null; name_en: string | null }[] = [];
  if (catIds.length) {
    const { data } = await supabase.from("parts_categories").select("name_ru, name_en").in("id", catIds);
    cats = data ?? [];
  }

  return { p, vehicles, cats };
}

// ── Промпт (buyer + логистика — намеренно ОТЛИЧАЕТСЯ от kmotors) ─────────────
function buildPrompt(ctx: NonNullable<Awaited<ReturnType<typeof fetchContext>>>): string {
  const { p, vehicles, cats } = ctx;
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const compat = vehicles
    .map((v) => {
      // У части авто (Genesis) бренд уже входит в name_en — не префиксуем повторно
      const label = v.name_en?.toLowerCase().startsWith((v.brand ?? "").toLowerCase())
        ? v.name_en
        : `${cap(v.brand)} ${v.name_en}`;
      return `${label}${v.year_from ? ` (${v.year_from}${v.year_to ? `–${v.year_to}` : "+"})` : ""}`;
    })
    .join("; ");
  const category = cats.map((c) => c.name_ru || c.name_en).filter(Boolean).join(" / ");

  return `Ты — консультант по подбору оригинальных корейских автозапчастей для интернет-магазина caranalizer.com (Hyundai, Kia, Genesis; оригинал OEM из Кореи).
Составь SEO-контент для карточки запчасти. Отвечай СТРОГО валидным JSON без markdown.

ДАННЫЕ О ДЕТАЛИ (используй только их, ничего не выдумывай про характеристики/симптомы/размеры/вес/сроки):
- Название (RU): ${p.name_ru || "—"}
- Название (EN): ${p.name_en || "—"}
- Каталожный номер (OEM): ${p.part_number || "—"}
- Производитель: ${p.manufacturer || "—"}
- Категория: ${category || "—"}
- Совместимость (модели/годы): ${compat || "нет данных"}

ГЛАВНОЕ ПРАВИЛО РУССКОГО ТЕКСТА (title_ru, desc_ru, body_ru):
- Название детали ВСЕГДА переводи на правильный русский автотермин. НИКОГДА не оставляй английские слова в русском тексте и НЕ транслитерируй их («бучи», «Болт-Хаб» — недопустимо).
- Эталоны перевода: brake disc = тормозной диск (НЕ барабан); brake drum = тормозной барабан; bushing = сайлентблок; O-ring = уплотнительное кольцо; wiring harness = жгут проводов; timing chain = цепь ГРМ; tensioner = натяжитель; connector = разъём; bracket = кронштейн; nut = гайка; bolt = болт; hub = ступица; canister = адсорбер; boot = пыльник; strip = молдинг; rack = держатель.
- Если точного термина не знаешь — опиши деталь по-русски своими словами, БЕЗ единого английского слова.
- Бренды и модели (Hyundai, Kia, Genesis, Sonata, Tucson…) — латиницей, с заглавной буквы.

СТИЛЬ И СТРУКТУРА (наш формат — сначала применимость, потом деталь):
- title_ru / title_en: до 60 символов. Формат «Оригинал {название детали} {номер}» / «Genuine {name} {number}». БЕЗ слова «купить»/«buy».
- desc_ru / desc_en: до 155 символов. Акцент: оригинальная OEM-запчасть Hyundai/Kia/Genesis из Кореи + для каких моделей + каталожный номер.
- body_ru / body_en: 3–4 предложения, СНАЧАЛА о применимости, затем о детали:
  1) для каких моделей и годов подходит — строго по данным «Совместимость» (если совместимости нет — начни с самой детали, модели НЕ выдумывай);
  2) что это за деталь (правильный русский термин) и что это ОРИГИНАЛ (OEM, завод/Mobis), а не аналог — точная замена штатной;
  3) соответствие по каталожному номеру ${p.part_number || "—"}, заказ оригинала из Кореи.
  НЕ придумывай размеры, материалы, вес, сроки доставки и симптомы износа — только факты из данных.
- cross_refs: массив кросс-номеров (OEM-аналогов) ТОЛЬКО если уверен, что это реальные общеизвестные аналоги именно этого номера. Не уверен — верни []. НИКОГДА не выдумывай номера.

Формат ответа (JSON):
{"title_ru":"","title_en":"","desc_ru":"","desc_en":"","body_ru":"","body_en":"","cross_refs":[]}`;
}

// ── Генерация одной карточки ────────────────────────────────────────────────
async function generateOne(
  llm: LlmClient,
  ctx: NonNullable<Awaited<ReturnType<typeof fetchContext>>>
): Promise<Generated> {
  const parsed = await llm.generateJSON<Record<string, unknown>>(buildPrompt(ctx));
  if (!parsed.title_ru || !parsed.title_en) throw new Error("Missing title fields");
  return {
    title_ru: String(parsed.title_ru).slice(0, 70),
    title_en: String(parsed.title_en).slice(0, 70),
    desc_ru: String(parsed.desc_ru ?? "").slice(0, 170),
    desc_en: String(parsed.desc_en ?? "").slice(0, 170),
    body_ru: String(parsed.body_ru ?? ""),
    body_en: String(parsed.body_en ?? ""),
    cross_refs: Array.isArray(parsed.cross_refs)
      ? parsed.cross_refs.map((x: unknown) => String(x)).slice(0, 10)
      : [],
  };
}

function hashContent(g: Generated): string {
  return createHash("sha1")
    .update(JSON.stringify([g.title_ru, g.title_en, g.desc_ru, g.desc_en, g.body_ru, g.body_en, g.cross_refs]))
    .digest("hex");
}

// ── Главная: сгенерить батч и сложить черновики в ca_seo_suggestions ─────────
export async function generatePartSuggestions(
  supabase: SupabaseClient,
  limit: number
): Promise<{ batch_id: string; created: number; failed: number; skipped: number; quotaHit: boolean }> {
  const llm = getLlm();

  const candidates = await selectPartCandidates(supabase, limit);
  if (candidates.length === 0) {
    return { batch_id: "", created: 0, failed: 0, skipped: 0, quotaHit: false };
  }

  const batch_id = randomUUID();
  let created = 0,
    failed = 0,
    skipped = 0,
    quotaHit = false;

  for (const c of candidates) {
    const ctx = await fetchContext(supabase, c.product_id);
    if (!ctx) {
      skipped++;
      continue;
    }

    let gen: Generated;
    try {
      gen = await generateOne(llm, ctx);
    } catch (err) {
      if (err instanceof QuotaError) {
        console.warn(`[ca-seo-generate] квота LLM исчерпана, стоп на товаре ${c.product_id}`);
        quotaHit = true;
        break;
      }
      console.error(`[ca-seo-generate] товар ${c.product_id} — ошибка LLM:`, err);
      failed++;
      continue;
    }

    const { error } = await supabase.from("ca_seo_suggestions").insert({
      batch_id,
      product_id: c.product_id,
      part_number: ctx.p.part_number,
      url: ctx.p.part_number ? `/ru/parts/${ctx.p.part_number}` : null,
      type: "content",
      source: "proactive_parts",
      snap_impressions: Math.round(c.impressions),
      snap_ctr: c.ctr,
      snap_position: c.position,
      proposed_title_ru: gen.title_ru,
      proposed_title_en: gen.title_en,
      proposed_desc_ru: gen.desc_ru,
      proposed_desc_en: gen.desc_en,
      proposed_body_ru: gen.body_ru,
      proposed_body_en: gen.body_en,
      proposed_cross_refs: gen.cross_refs,
      content_hash: hashContent(gen),
      status: "draft",
    });
    if (error) {
      console.error(`[ca-seo-generate] insert ${c.product_id}:`, error.message);
      failed++;
      continue;
    }
    created++;
    await new Promise((r) => setTimeout(r, THROTTLE_MS)); // щадим rate limit
  }

  return { batch_id, created, failed, skipped, quotaHit };
}
