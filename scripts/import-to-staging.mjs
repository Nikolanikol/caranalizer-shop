/**
 * ============================================================================
 *  ИМПОРТ скрейпа → parts_staging в Supabase
 * ============================================================================
 *
 *  1. Создаёт таблицу parts_staging (если нет)
 *  2. Читает JSONL файлы из data/scraped/
 *  3. Фильтрует только НОВЫЕ товары (нет в parts_products)
 *  4. Заливает батчами в parts_staging (ON CONFLICT — пропускает дубли)
 *
 *  Запуск:
 *    node scripts/import-to-staging.mjs
 *    node scripts/import-to-staging.mjs --dry-run     (только показать статистику)
 *
 * ============================================================================
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ── Load .env ──────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(import.meta.dirname, "..", ".env");
  if (!existsSync(envPath)) {
    console.error("❌ .env не найден");
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
  console.error("❌ SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы в .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const dryRun = process.argv.includes("--dry-run");

const DATA_DIR = join(import.meta.dirname, "..", "data", "scraped");
const BATCH_SIZE = 500;

// ── Step 1: Create staging table ───────────────────────────────────────────

async function createStagingTable() {
  console.log("📋 Создаю таблицу parts_staging...");

  const sql = readFileSync(join(import.meta.dirname, "001_create_staging.sql"), "utf-8");
  const { error } = await supabase.rpc("exec_sql", { query: sql }).maybeSingle();

  if (error) {
    // rpc exec_sql may not exist — try raw SQL via REST
    // Fallback: just check if table exists
    const { error: checkErr } = await supabase
      .from("parts_staging")
      .select("id", { count: "exact", head: true });

    if (checkErr && checkErr.code === "42P01") {
      console.error("❌ Таблица parts_staging не существует.");
      console.error("   Выполни SQL из scripts/001_create_staging.sql в Supabase SQL Editor.");
      process.exit(1);
    }

    if (checkErr) {
      console.error("❌ Ошибка подключения:", checkErr.message);
      process.exit(1);
    }

    console.log("✅ Таблица parts_staging уже существует");
    return;
  }

  console.log("✅ Таблица создана");
}

// ── Step 2: Load existing part_numbers from parts_products ─────────────────

async function loadExistingPartNumbers() {
  console.log("📦 Загружаю part_numbers из parts_products...");

  const existing = new Set();
  const PAGE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("parts_products")
      .select("part_number")
      .range(offset, offset + PAGE - 1)
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Ошибка:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const p of data) existing.add(p.part_number);
    offset += PAGE;
    if (data.length < PAGE) break;
  }

  console.log(`   ${existing.size} уникальных part_number в БД`);
  return existing;
}

// ── Step 3: Read & filter JSONL ────────────────────────────────────────────

function readAndFilterProducts(existingPartNumbers) {
  console.log("📂 Читаю JSONL файлы...");

  const files = readdirSync(DATA_DIR).filter(f => f.endsWith(".jsonl"));
  const bySourceId = new Map();
  let totalLines = 0;
  let skippedConflicts = 0;
  let skippedDupes = 0;

  for (const file of files) {
    const lines = readFileSync(join(DATA_DIR, file), "utf-8")
      .split("\n")
      .filter(l => l.trim());

    totalLines += lines.length;

    for (const line of lines) {
      try {
        const p = JSON.parse(line);

        if (bySourceId.has(p.source_id)) {
          skippedDupes++;
          continue;
        }

        if (existingPartNumbers.has(p.part_number)) {
          skippedConflicts++;
          continue;
        }

        bySourceId.set(p.source_id, p);
      } catch {}
    }
  }

  const products = [...bySourceId.values()];

  console.log(`   ${files.length} файлов, ${totalLines} строк`);
  console.log(`   ${skippedDupes} дубликатов source_id пропущено`);
  console.log(`   ${skippedConflicts} конфликтов (есть в parts_products) пропущено`);
  console.log(`   ✅ ${products.length} новых товаров для импорта`);

  return products;
}

// ── Step 4: Import to staging ──────────────────────────────────────────────

async function importToStaging(products) {
  if (dryRun) {
    console.log("\n🏁 DRY RUN — импорт не выполнен");
    return;
  }

  console.log(`\n📤 Импорт ${products.length} товаров в parts_staging (батчи по ${BATCH_SIZE})...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const totalBatches = Math.ceil(products.length / BATCH_SIZE);

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const rows = batch.map(p => ({
      part_number: p.part_number,
      name_ko: p.name_ko || null,
      price_krw: p.price_krw || null,
      original_price_krw: p.original_price_krw || null,
      source_category: p.source_category || null,
      manufacturer: p.manufacturer || null,
      image_url: p.image_url || null,
      in_stock: p.in_stock ?? true,
      source: p.source || "hyunkistore",
      source_url: p.source_url || null,
      source_id: p.source_id || null,
      status: "new",
      scraped_at: p.scraped_at || new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from("parts_staging")
      .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true })
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error(`   ❌ Батч ${batchNum}: ${error.message}`);
      errors += batch.length;
    } else {
      imported += batch.length;
    }

    if (batchNum % 20 === 0 || batchNum === totalBatches) {
      const pct = ((batchNum / totalBatches) * 100).toFixed(1);
      console.log(`   [${batchNum}/${totalBatches}] ${pct}% | ${imported} импортировано | ${errors} ошибок`);
    }
  }

  console.log(`\n✅ Импорт завершён: ${imported} добавлено, ${errors} ошибок`);
}

// ── Step 5: Verify ─────────────────────────────────────────────────────────

async function verify() {
  const { count } = await supabase
    .from("parts_staging")
    .select("*", { count: "exact", head: true });

  const { count: newCount } = await supabase
    .from("parts_staging")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  console.log(`\n📊 parts_staging: ${count} всего, ${newCount} со статусом 'new'`);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log(`║  Импорт → parts_staging ${dryRun ? "(DRY RUN)" : ""}              ║`);
  console.log("╚══════════════════════════════════════════════╝\n");

  await createStagingTable();
  const existingParts = await loadExistingPartNumbers();
  const newProducts = readAndFilterProducts(existingParts);

  if (newProducts.length === 0) {
    console.log("\n✅ Нечего импортировать — все товары уже в БД");
    return;
  }

  await importToStaging(newProducts);

  if (!dryRun) {
    await verify();
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
