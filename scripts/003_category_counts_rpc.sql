-- ============================================================================
--  RPC: get_category_counts
--  Возвращает количество товаров по category_id за один запрос
--  вместо N отдельных COUNT(*) запросов
--
--  Запустить в Supabase SQL Editor
-- ============================================================================

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
