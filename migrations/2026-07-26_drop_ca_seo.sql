-- Демонтаж ca_* SEO-пайплайна caranalizer: сайт перестал быть магазином,
-- товарные страницы отдают 301 на kmotors.shop, генерация описаний не нужна.
-- Таблицы принадлежали только caranalizer (kmotors использует свои
-- seo_page_stats / seo_suggestions / parts_products.seo_* — их НЕ трогаем).
-- Перед выполнением на VPS: systemctl disable --now seo-cron.timer

DROP TABLE IF EXISTS ca_seo_suggestions;
DROP TABLE IF EXISTS ca_seo_page_stats;
DROP TABLE IF EXISTS ca_parts_seo;
