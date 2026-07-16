-- ============================================================================
--  SEO-автоматика caranalizer — ИЗОЛИРОВАННЫЕ таблицы (ca_*)
--
--  ВАЖНО: caranalizer и kmotors.shop делят ОДНУ базу (api.kmotors.shop).
--  Общие parts_products.seo_* / seo_page_stats / seo_suggestions принадлежат
--  KMotors. Если caranalizer будет читать их — получится дубликат контента
--  на двух доменах. Поэтому у caranalizer СВОЁ хранилище с префиксом ca_:
--
--    ca_seo_page_stats  — GSC-снапшоты caranalizer.com (свои, не мешаются с KMotors)
--    ca_seo_suggestions — очередь черновиков LLM (свой промпт, buyer-угол)
--    ca_parts_seo       — боевой SEO-контент карточки (карточка читает отсюда)
--
--  Ключ ca_parts_seo — part_number (карточка ищет товар по нему; в URL он же).
--  Запустить в Supabase Dashboard → SQL Editor.
-- ============================================================================

-- ── 1. GSC-снапшоты caranalizer ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_seo_page_stats (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url          TEXT        NOT NULL,
  page_path    TEXT,                       -- /en/parts/58101P0A10
  lang         TEXT,                       -- ru | en | ar
  section      TEXT,                       -- parts | catalog | vehicles | check | ...
  product_id   BIGINT,                     -- parts_products.id, если это карточка запчасти
  part_number  TEXT,
  clicks       INTEGER     NOT NULL DEFAULT 0,
  impressions  INTEGER     NOT NULL DEFAULT 0,
  ctr          REAL        NOT NULL DEFAULT 0,
  position     REAL        NOT NULL DEFAULT 0,
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (url, period_end)
);

CREATE INDEX IF NOT EXISTS idx_ca_seo_page_stats_product ON ca_seo_page_stats (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ca_seo_page_stats_period  ON ca_seo_page_stats (period_end);
CREATE INDEX IF NOT EXISTS idx_ca_seo_page_stats_section ON ca_seo_page_stats (section);
CREATE INDEX IF NOT EXISTS idx_ca_seo_page_stats_weak    ON ca_seo_page_stats (period_end, impressions DESC, position);

-- ── 2. Боевой SEO-контент карточки caranalizer (карточка читает отсюда) ──────
CREATE TABLE IF NOT EXISTS ca_parts_seo (
  part_number      TEXT PRIMARY KEY,        -- карточка джойнит по нему
  product_id       BIGINT,                  -- справочно (parts_products.id)
  seo_title_ru     TEXT,
  seo_title_en     TEXT,
  seo_desc_ru      TEXT,
  seo_desc_en      TEXT,
  seo_body_ru      TEXT,
  seo_body_en      TEXT,
  cross_refs       JSONB,
  content_hash     TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON ca_parts_seo TO anon;
GRANT SELECT ON ca_parts_seo TO authenticated;

-- ── 3. Очередь черновиков (draft → approved/rejected/applied) ────────────────
CREATE TABLE IF NOT EXISTS ca_seo_suggestions (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id           UUID        NOT NULL,
  product_id         BIGINT,
  part_number        TEXT,
  url                TEXT,                               -- /ru/parts/{slug}
  type               TEXT        NOT NULL,               -- 'content'
  source             TEXT        NOT NULL,               -- 'proactive_parts' | ...

  snap_impressions   INTEGER,
  snap_ctr           REAL,
  snap_position      REAL,

  proposed_title_ru  TEXT,
  proposed_title_en  TEXT,
  proposed_desc_ru   TEXT,
  proposed_desc_en   TEXT,
  proposed_body_ru   TEXT,
  proposed_body_en   TEXT,
  proposed_cross_refs JSONB,

  content_hash       TEXT,
  status             TEXT        NOT NULL DEFAULT 'draft', -- draft|approved|rejected|applied
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ca_seo_suggestions_batch   ON ca_seo_suggestions (batch_id);
CREATE INDEX IF NOT EXISTS idx_ca_seo_suggestions_status  ON ca_seo_suggestions (status);
CREATE INDEX IF NOT EXISTS idx_ca_seo_suggestions_product ON ca_seo_suggestions (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ca_seo_suggestions_recent  ON ca_seo_suggestions (product_id, created_at DESC);
