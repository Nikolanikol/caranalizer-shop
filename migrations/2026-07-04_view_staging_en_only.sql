-- ============================================================================
--  v_catalog_combined: оставить staging-товарам только английские названия
--
--  Русские Bing-переводы оказались мусором («Снять наружное боковое
--  зеркало слева» и т.п.) — решено показывать английские названия на всех
--  локалях (getProductName падает с name_ru на name_en автоматически).
--  Отменяет проброс name_ru из 2026-07-04_view_staging_names.sql;
--  name_ru остаётся в parts_staging на случай будущей нормальной чистки.
--
--  Запустить в Supabase Dashboard → SQL Editor.
-- ============================================================================

DROP VIEW IF EXISTS v_catalog_combined;

CREATE VIEW v_catalog_combined AS

-- 1. Original products (as-is)
SELECT
  id,
  part_number,
  name_ru,
  name_en,
  name_ko,
  price_krw,
  brand_id,
  category_id,
  subcategory_id,
  image_url,
  is_new,
  weight_kg,
  manufacturer,
  'products' AS _source
FROM parts_products

UNION ALL

-- 2. Staging products (mapped to catalog schema)
SELECT
  id + 1000000 AS id,                           -- offset to avoid ID collision
  part_number,
  NULL AS name_ru,                               -- RU-перевод мусорный, скрыт
  name_en,
  name_ko,
  price_krw,
  NULL::integer AS brand_id,                     -- brand у staging не размечен
  CASE source_category
    WHEN '엔진'     THEN 177
    WHEN '미션'     THEN 178
    WHEN '샤시'     THEN 179
    WHEN '바디'     THEN 180
    WHEN '트림'     THEN 181
    WHEN '전기장치' THEN 177                      -- electrical → engine
    WHEN '기타'     THEN 19001                    -- misc → fasteners
    ELSE NULL
  END AS category_id,
  NULL::integer AS subcategory_id,
  image_url,
  true AS is_new,                                -- mark staging items as "new"
  NULL::numeric AS weight_kg,
  manufacturer,
  'staging' AS _source
FROM parts_staging
WHERE status = 'new' AND in_stock = true;

-- Grant access for anon and authenticated roles (Supabase RLS)
GRANT SELECT ON v_catalog_combined TO anon;
GRANT SELECT ON v_catalog_combined TO authenticated;

-- Verify: name_ru должен быть NULL, name_en — заполнен
SELECT _source, part_number, name_ru, name_en
FROM v_catalog_combined
WHERE _source = 'staging'
LIMIT 3;
