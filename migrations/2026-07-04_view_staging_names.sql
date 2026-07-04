-- ============================================================================
--  v_catalog_combined: пробросить переводы staging-товаров
--
--  Вью создавалась, когда parts_staging ещё не имела переводов, и жёстко
--  отдавала NULL AS name_ru / name_en. Translation pipeline с тех пор
--  заполнил name_ru и name_en у всех 91 607 staging-строк — из-за NULL
--  в вью каталог показывал их с корейскими названиями или голым артикулом.
--
--  Запустить в Supabase Dashboard → SQL Editor.
--
--  Последствия для SEO (обрабатываются кодом, деплой от 2026-07-04):
--  слаг staging-карточек меняется с "PN" на "PN--translit-name"; старые URL
--  получают 301 на канонический через permanentRedirect в page.tsx.
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
  name_ru,                                       -- заполнено translation pipeline
  name_en,                                       -- заполнено translation pipeline
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

-- Verify: обе выборки должны вернуть названия, а не NULL
SELECT _source, part_number, name_ru, name_en
FROM v_catalog_combined
WHERE _source = 'staging'
LIMIT 3;
