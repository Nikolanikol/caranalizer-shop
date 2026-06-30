-- ============================================================================
--  Добавляет category_id в parts_staging + индекс + обновляет view
--  Это исправляет таймауты при фильтрации по категории
--
--  Запустить в Supabase SQL Editor (одним блоком)
-- ============================================================================

-- 1. Добавить столбец category_id
ALTER TABLE parts_staging ADD COLUMN IF NOT EXISTS category_id integer;

-- 2. Заполнить из source_category
UPDATE parts_staging SET category_id = CASE source_category
  WHEN '엔진'     THEN 177
  WHEN '미션'     THEN 178
  WHEN '샤시'     THEN 179
  WHEN '바디'     THEN 180
  WHEN '트림'     THEN 181
  WHEN '전기장치' THEN 177
  WHEN '기타'     THEN 19001
  ELSE NULL
END
WHERE category_id IS NULL;

-- 3. Индекс для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_staging_category ON parts_staging(category_id);
CREATE INDEX IF NOT EXISTS idx_staging_status_instock ON parts_staging(status, in_stock);

-- 4. Обновить view — теперь читает category_id напрямую
DROP VIEW IF EXISTS v_catalog_combined;

CREATE VIEW v_catalog_combined AS
SELECT
  id, part_number, name_ru, name_en, name_ko, price_krw,
  brand_id, category_id, subcategory_id,
  image_url, is_new, weight_kg, manufacturer,
  'products' AS _source
FROM parts_products

UNION ALL

SELECT
  id + 1000000 AS id,
  part_number,
  NULL AS name_ru,
  NULL AS name_en,
  name_ko,
  price_krw,
  NULL::integer AS brand_id,
  category_id,
  NULL::integer AS subcategory_id,
  image_url,
  true AS is_new,
  NULL::numeric AS weight_kg,
  manufacturer,
  'staging' AS _source
FROM parts_staging
WHERE status = 'new' AND in_stock = true;

GRANT SELECT ON v_catalog_combined TO anon;
GRANT SELECT ON v_catalog_combined TO authenticated;

-- 5. Обновить RPC (пересоздать на случай если view изменился)
CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE(category_id integer, cnt bigint)
LANGUAGE sql STABLE
AS $$
  SELECT category_id, count(*) AS cnt
  FROM v_catalog_combined
  WHERE category_id IS NOT NULL
  GROUP BY category_id;
$$;

GRANT EXECUTE ON FUNCTION get_category_counts() TO anon;
GRANT EXECUTE ON FUNCTION get_category_counts() TO authenticated;
