/**
 * ============================================================================
 *  АНАЛИЗ скрейпа: сравнение JSONL с текущей БД parts_products
 * ============================================================================
 *
 *  Что делает:
 *    1. Читает все JSONL файлы из data/scraped/
 *    2. Дедуплицирует по source_id
 *    3. Подключается к Supabase, тянет все part_number из parts_products
 *    4. Сравнивает и классифицирует:
 *       - new:      нет в БД (новый товар)
 *       - match:    есть в БД, цена совпадает
 *       - conflict: есть в БД, цена или данные отличаются
 *    5. Выводит отчёт + сохраняет результат в data/scraped/analysis.json
 *
 *  Запуск:
 *    node scripts/analyze-scraped.mjs
 *
 * ============================================================================
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ── Load .env manually (no dotenv dependency) ─────────────────────────────

function loadEnv() {
  const envPath = join(import.meta.dirname, "..", ".env");
  if (!existsSync(envPath)) {
    console.error("❌ .env file not found");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Read all JSONL files ───────────────────────────────────────────────────

const DATA_DIR = join(import.meta.dirname, "..", "data", "scraped");

function readAllProducts() {
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith(".jsonl"));
  const bySourceId = new Map();
  let totalLines = 0;
  let dupes = 0;

  for (const file of files) {
    const lines = readFileSync(join(DATA_DIR, file), "utf-8")
      .split("\n")
      .filter(l => l.trim());
    totalLines += lines.length;

    for (const line of lines) {
      try {
        const p = JSON.parse(line);
        if (bySourceId.has(p.source_id)) {
          dupes++;
          continue;
        }
        bySourceId.set(p.source_id, p);
      } catch {}
    }
  }

  console.log(`📂 Файлов: ${files.length}`);
  console.log(`📄 Строк в JSONL: ${totalLines}`);
  console.log(`🔑 Уникальных source_id: ${bySourceId.size}`);
  if (dupes > 0) console.log(`♻️  Дубликатов source_id: ${dupes}`);
  console.log("");

  return [...bySourceId.values()];
}

// ── Fetch existing products from Supabase ──────────────────────────────────

async function fetchExistingProducts() {
  console.log("🔗 Подключение к Supabase...");

  const allProducts = [];
  const PAGE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("parts_products")
      .select("id, part_number, price_krw, name_ko, name_ru, name_en, manufacturer")
      .range(offset, offset + PAGE - 1)
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Supabase error:", error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allProducts.push(...data);
    offset += PAGE;

    if (data.length < PAGE) break;
  }

  console.log(`📦 Товаров в parts_products: ${allProducts.length}`);

  // Index by part_number
  const index = new Map();
  for (const p of allProducts) {
    index.set(p.part_number, p);
  }
  console.log(`🔑 Уникальных part_number в БД: ${index.size}`);
  console.log("");

  return index;
}

// ── Compare ────────────────────────────────────────────────────────────────

function compareProducts(scraped, dbIndex) {
  const results = {
    new: [],
    match: [],
    conflict: [],
  };

  const byCategory = {};

  for (const item of scraped) {
    const cat = item.source_category || "unknown";
    if (!byCategory[cat]) byCategory[cat] = { new: 0, match: 0, conflict: 0 };

    const existing = dbIndex.get(item.part_number);

    if (!existing) {
      results.new.push(item);
      byCategory[cat].new++;
      continue;
    }

    const conflicts = [];
    if (existing.price_krw !== item.price_krw) {
      conflicts.push({
        field: "price_krw",
        db: existing.price_krw,
        scraped: item.price_krw,
      });
    }
    if (item.name_ko && existing.name_ko && existing.name_ko !== item.name_ko) {
      conflicts.push({
        field: "name_ko",
        db: existing.name_ko,
        scraped: item.name_ko,
      });
    }

    if (conflicts.length > 0) {
      results.conflict.push({
        ...item,
        db_id: existing.id,
        db_price: existing.price_krw,
        conflicts,
      });
      byCategory[cat].conflict++;
    } else {
      results.match.push({
        part_number: item.part_number,
        db_id: existing.id,
      });
      byCategory[cat].match++;
    }
  }

  return { results, byCategory };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  Анализ скрейпа vs parts_products            ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  const scraped = readAllProducts();
  const dbIndex = await fetchExistingProducts();
  const { results, byCategory } = compareProducts(scraped, dbIndex);

  // ── Report ──

  console.log("═══════════════════════════════════════════════");
  console.log("  РЕЗУЛЬТАТ");
  console.log("═══════════════════════════════════════════════");
  console.log(`  🆕 Новых (нет в БД):         ${results.new.length}`);
  console.log(`  ✅ Совпадений (всё ок):       ${results.match.length}`);
  console.log(`  ⚠️  Конфликтов (цена/данные):  ${results.conflict.length}`);
  console.log("");

  console.log("  По категориям:");
  for (const [cat, counts] of Object.entries(byCategory)) {
    const total = counts.new + counts.match + counts.conflict;
    console.log(`    ${cat}: ${total} всего | 🆕 ${counts.new} | ✅ ${counts.match} | ⚠️ ${counts.conflict}`);
  }
  console.log("");

  // Price conflict stats
  if (results.conflict.length > 0) {
    const priceConflicts = results.conflict.filter(c =>
      c.conflicts.some(x => x.field === "price_krw")
    );
    if (priceConflicts.length > 0) {
      const diffs = priceConflicts.map(c => {
        const pc = c.conflicts.find(x => x.field === "price_krw");
        return { pn: c.part_number, db: pc.db, scraped: pc.scraped, diff: pc.scraped - pc.db };
      });
      const avgDiff = diffs.reduce((s, d) => s + d.diff, 0) / diffs.length;
      console.log(`  Ценовые конфликты: ${priceConflicts.length}`);
      console.log(`  Средняя разница: ${avgDiff > 0 ? "+" : ""}${Math.round(avgDiff)} KRW`);
      console.log("");
      console.log("  Примеры (первые 10):");
      diffs.slice(0, 10).forEach(d => {
        const arrow = d.diff > 0 ? "↑" : "↓";
        console.log(`    ${d.pn}: ${d.db} → ${d.scraped} KRW (${arrow}${Math.abs(d.diff)})`);
      });
      console.log("");
    }
  }

  // ── Save analysis ──

  const outputPath = join(DATA_DIR, "analysis.json");
  const output = {
    analyzed_at: new Date().toISOString(),
    summary: {
      total_scraped: scraped.length,
      total_in_db: dbIndex.size,
      new: results.new.length,
      match: results.match.length,
      conflict: results.conflict.length,
    },
    by_category: byCategory,
    new_part_numbers: results.new.map(p => p.part_number),
    conflicts: results.conflict.map(c => ({
      part_number: c.part_number,
      db_id: c.db_id,
      source_category: c.source_category,
      conflicts: c.conflicts,
    })),
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`💾 Отчёт сохранён: ${outputPath}`);
  console.log(`   (${results.new.length} новых part_number + ${results.conflict.length} конфликтов)`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
