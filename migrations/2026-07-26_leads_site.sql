-- Дискриминатор сайта в общей таблице leads: caranalizer и kmotors пишут
-- в одну таблицу, до этой миграции лиды были неразличимы.
-- DEFAULT 'kmotors' корректно помечает и исторические строки: до появления
-- формы бесплатной проверки почти весь поток шёл с kmotors.
-- Выполняется один раз на общей базе (api.kmotors.shop); зеркальная копия
-- файла лежит в KMotors-1/supabase/migrations/20260726_leads_site.sql.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS site text NOT NULL DEFAULT 'kmotors';
CREATE INDEX IF NOT EXISTS idx_leads_site ON leads (site);
