-- Add Arabic names to parts categories.
-- Run in Supabase Dashboard → SQL Editor.
-- Subcategories (170 rows) intentionally left NULL for now — the app falls
-- back to name_en. Translate them when subcategory pages ship (phase 2).

ALTER TABLE parts_categories ADD COLUMN IF NOT EXISTS name_ar text;

UPDATE parts_categories SET name_ar = 'المحرك'              WHERE slug = 'engine';
UPDATE parts_categories SET name_ar = 'ناقل الحركة'          WHERE slug = 'transmission';
UPDATE parts_categories SET name_ar = 'الشاسيه'              WHERE slug = 'chassis';
UPDATE parts_categories SET name_ar = 'هيكل السيارة'         WHERE slug = 'body';
UPDATE parts_categories SET name_ar = 'المقصورة الداخلية'    WHERE slug = 'interior';
UPDATE parts_categories SET name_ar = 'المثبتات والتجهيزات'  WHERE slug = 'fasteners-hardware';

-- Verify:
SELECT slug, name_en, name_ar FROM parts_categories WHERE parent_id IS NULL ORDER BY id;
