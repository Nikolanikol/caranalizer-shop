-- ============================================================================
--  VIEW: v_catalog_combined
--  Объединяет parts_products и parts_staging (status='new') в один каталог
--
--  Запустить в Supabase SQL Editor
-- ============================================================================

-- Drop old view if exists
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
  NULL AS name_ru,                               -- no translation yet
  NULL AS name_en,                               -- no translation yet
  name_ko,
  price_krw,
  NULL::integer AS brand_id,                     -- not mapped yet
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
