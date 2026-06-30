-- Staging table for scraped parts from external Korean stores
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS parts_staging (
  id                bigserial PRIMARY KEY,

  -- Product identity
  part_number       text NOT NULL,
  name_ko           text,
  name_ru           text,
  name_en           text,

  -- Pricing
  price_krw         integer,
  original_price_krw integer,

  -- Classification
  source_category   text,          -- raw category from source: 엔진, 트림, etc.
  manufacturer      text,          -- Hyundai Mobis, etc.

  -- Media
  image_url         text,

  -- Availability
  in_stock          boolean DEFAULT true,

  -- Source tracking
  source            text NOT NULL,  -- store name: hyunkistore
  source_url        text,           -- full product URL
  source_id         text,           -- product ID in source store

  -- Merge logic
  status            text NOT NULL DEFAULT 'new',
    -- new:       freshly scraped, not yet processed
    -- duplicate: exact match found in parts_products (same part_number, similar price)
    -- conflict:  part_number exists but data differs (price, name)
    -- merged:    successfully added/updated in parts_products
    -- rejected:  manually or automatically skipped
  matched_product_id integer,       -- FK to parts_products.id if match found
  conflict_type     text,           -- price / name / category / multiple

  -- Timestamps
  scraped_at        timestamptz NOT NULL DEFAULT now(),
  processed_at      timestamptz
);

-- Indexes for fast lookups during merge
CREATE INDEX IF NOT EXISTS idx_staging_part_number ON parts_staging (part_number);
CREATE INDEX IF NOT EXISTS idx_staging_status ON parts_staging (status);
CREATE INDEX IF NOT EXISTS idx_staging_source ON parts_staging (source);

-- Unique constraint to avoid re-scraping same product from same source
CREATE UNIQUE INDEX IF NOT EXISTS idx_staging_source_unique
  ON parts_staging (source, source_id);
