-- Счётчики для фильтра и посадочных страниц.
--
-- Без них витрина считала так: вытянуть все 18 655 товаров через PostgREST (девятнадцать
-- запросов по тысяче строк — больше PostgREST за раз не отдаёт) и сгруппировать в Node.
-- Страница марки открывалась 1,7 секунды, и цифра росла бы с каждой новой группой донора.
--
-- Группировка — работа базы. Представление вместо таблицы: счётчики обязаны совпадать
-- с товарами всегда, а не до следующей заливки.
--
-- `security_invoker = true` — чтобы представление считалось с правами того, кто спросил,
-- и уважало RLS нижележащих таблиц. Без него view выполняется от владельца и обходит
-- политики: для публичного каталога это безвредно, но правило «view не должен быть
-- дыркой в RLS» дешевле соблюдать сразу, чем вспоминать о нём на непубличной таблице.

create or replace view partsfit_brand_counts
with (security_invoker = true) as
select
  p.part_type,
  p.brand_slug,
  b.name       as brand_name,
  b.name_ru    as brand_name_ru,
  count(*)     as products
from partsfit_products p
join partsfit_brands b on b.slug = p.brand_slug
group by 1, 2, 3, 4;

create or replace view partsfit_model_counts
with (security_invoker = true) as
select
  p.part_type,
  p.brand_slug,
  b.name       as brand_name,
  m.slug       as model_slug,
  m.name       as model_name,
  count(*)     as products
from partsfit_products p
join partsfit_brands b on b.slug = p.brand_slug
join partsfit_models m on m.id = p.model_id
group by 1, 2, 3, 4, 5;

grant select on partsfit_brand_counts to anon, authenticated, service_role;
grant select on partsfit_model_counts to anon, authenticated, service_role;

-- PostgREST держит схему в кэше и сам о новых таблицах не узнаёт. На хостинге Supabase
-- это делает событийный триггер, на self-hosted его может не быть — и тогда таблица
-- есть, а REST на неё отвечает 404, из-за чего заливка падает с «таблицы нет».
-- Строка безвредна, если триггер и так стоит.
notify pgrst, 'reload schema';
