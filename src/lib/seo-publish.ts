// Фаза 3 SEO-автоматики caranalizer: публикация черновиков на карточку.
//
// Автопубликация (гейта апрува нет): берёт черновики из ca_seo_suggestions →
// пишет в ca_parts_seo (боевую, ключ part_number) → сбрасывает кэш страниц →
// помечает suggestion как applied.
//
// IndexNow отложен (добавим позже). Google подхватит через sitemap + revalidate.
// ca_parts_seo ИЗОЛИРОВАНА от общих parts_products.seo_* (те принадлежат KMotors).

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const LANGS = ["ru", "en"]; // ar не генерим (нет name_ar, исключён из parts)

export async function publishDrafts(
  supabase: SupabaseClient,
  filter: { batch_id?: string; id?: number }
): Promise<{ published: number; urls: number }> {
  let q = supabase
    .from("ca_seo_suggestions")
    .select(
      "id, product_id, part_number, content_hash, proposed_title_ru, proposed_title_en, proposed_desc_ru, proposed_desc_en, proposed_body_ru, proposed_body_en, proposed_cross_refs"
    )
    .in("status", ["draft", "approved"]); // автопубликация — draft сразу публикуем
  if (filter.batch_id) q = q.eq("batch_id", filter.batch_id);
  if (filter.id) q = q.eq("id", filter.id);

  const { data: rows } = await q;
  if (!rows?.length) return { published: 0, urls: 0 };

  const now = new Date().toISOString();
  const urls: string[] = [];
  let published = 0;

  for (const s of rows) {
    if (!s.part_number) continue; // ca_parts_seo ключ — part_number

    const { error } = await supabase.from("ca_parts_seo").upsert(
      {
        part_number: s.part_number,
        product_id: s.product_id,
        seo_title_ru: s.proposed_title_ru,
        seo_title_en: s.proposed_title_en,
        seo_desc_ru: s.proposed_desc_ru,
        seo_desc_en: s.proposed_desc_en,
        seo_body_ru: s.proposed_body_ru,
        seo_body_en: s.proposed_body_en,
        cross_refs: s.proposed_cross_refs,
        content_hash: s.content_hash,
        updated_at: now,
      },
      { onConflict: "part_number" }
    );
    if (error) {
      console.error("[ca-seo-publish]", s.part_number, error.message);
      continue;
    }

    await supabase
      .from("ca_seo_suggestions")
      .update({ status: "applied", decided_at: now })
      .eq("id", s.id);

    for (const lang of LANGS) {
      const path = `/${lang}/parts/${s.part_number}`;
      urls.push(path);
      try {
        revalidatePath(path);
      } catch {
        /* вне request-контекста — не критично */
      }
    }
    published++;
  }

  return { published, urls: urls.length };
}
