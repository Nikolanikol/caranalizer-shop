-- Совместимость: артикул -> машина.
--
-- Таблица целиком выводится из partsfit_products при каждой сборке каталога
-- (`npm run partsfit:tables`) и заливается вместе с остальными. Своей жизни у неё нет,
-- руками не правится: любая правка исчезнет на следующей сборке.
--
-- ЧТО ЗДЕСЬ НАПИСАНО, А ЧТО НЕТ. Строка означает «донор продавал этот номер под этой
-- машиной», а не «завод подтверждает применимость». На витрине подписывать
-- «встречается на этих машинах», а не «подходит к»: за вторую формулировку отвечаем мы,
-- и первый же возврат будет по нашей вине.
--
-- В таблицу идут только артикулы, за которые можно ручаться. Сборщик отсеивает:
--   * номер, отнесённый донором к двум и более типам деталей (у него «12659379» —
--     это и блок комфорта, и блок АКПП, и электронный блок; какой верный, неизвестно);
--   * номер, стоящий одновременно слева и справа — для фары и зеркала это физически
--     невозможно, значит в данных опечатка;
--   * позиции с неизвестной моделью — строка «подходит к прочему» бесполезна.

create table if not exists partsfit_fitment (
  oem_number  text not null,
  part_type   text not null references partsfit_part_types (slug),
  brand_slug  text not null references partsfit_brands (slug),
  -- Модель обязательна: в этом весь смысл таблицы. Заодно снимает вопрос
  -- с NULL в первичном ключе.
  model_id    text not null references partsfit_models (id) on delete cascade,
  side        text not null default '',

  year_from   smallint,
  year_to     smallint,

  -- Сколько наших страниц и экземпляров стоит за этой строкой. Чем больше,
  -- тем меньше шанс, что это единичная опечатка донора.
  products    smallint not null default 0,
  offers      smallint not null default 0,

  primary key (oem_number, part_type, model_id, side)
);

-- Главный сценарий: пришли на /zapchasti/oem/<номер> — показать все машины.
create index if not exists partsfit_fitment_oem_idx on partsfit_fitment (oem_number);
-- Обратный: что из наличия встречается на этой машине.
create index if not exists partsfit_fitment_model_idx on partsfit_fitment (model_id, part_type);

grant select on partsfit_fitment to anon, authenticated;
grant select, insert, update, delete on partsfit_fitment to service_role;

alter table partsfit_fitment enable row level security;

drop policy if exists partsfit_fitment_read on partsfit_fitment;
create policy partsfit_fitment_read on partsfit_fitment
  for select to anon, authenticated using (true);

-- PostgREST держит схему в кэше и сам о новых таблицах не узнаёт. На хостинге Supabase
-- это делает событийный триггер, на self-hosted его может не быть — и тогда таблица
-- есть, а REST на неё отвечает 404, из-за чего заливка падает с «таблицы нет».
-- Строка безвредна, если триггер и так стоит.
notify pgrst, 'reload schema';
