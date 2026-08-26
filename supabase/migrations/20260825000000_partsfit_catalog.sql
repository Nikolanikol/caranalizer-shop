-- Каталог partsfit: схема под Supabase.
--
-- Префикс partsfit_ у всех таблиц — донор не единственный, и вторая площадка
-- (kmotors) может приехать в ту же базу. Без префикса «products» столкнётся первым.
--
-- Заливка: файлы из data/partsfit/tables/ ложатся в одноимённые таблицы, поля совпадают
-- с колонками. Порядок важен: словари -> products -> offers -> offer_images.

create table if not exists partsfit_brands (
  slug        text primary key,
  name        text not null,
  name_ru     text not null default '',
  name_ko     text not null default '',
  aliases     text[] not null default '{}'
);

create table if not exists partsfit_models (
  id          text primary key,          -- 'bmw/5-series'
  brand_slug  text not null references partsfit_brands (slug) on delete cascade,
  slug        text not null,
  name        text not null,
  names_ru    text[] not null default '{}',
  name_ko     text not null default '',
  unique (brand_slug, slug)
);

create table if not exists partsfit_part_types (
  slug        text primary key,          -- 'perednie-fary'
  name_ru     text not null,
  plural_ru   text not null,
  -- Род нужен для согласования: «фара передняя левая», но «фонарь задний левый».
  gender      text not null check (gender in ('m', 'f', 'n')),
  name_ko     text not null default '',
  keywords    text[] not null default '{}'
);

-- Деталь = страница каталога. Одна на сочетание тип + марка + модель + сторона +
-- позиция + артикул. Физические экземпляры лежат в partsfit_offers.
--
-- Разделено потому, что донор торгует разбором: у левой фары Genesis G80 шестьдесят три
-- экземпляра с разных машин — своя цена, своё состояние, свои фотографии, свой VIN.
-- В одной таблице это дало бы 7 272 адреса вместо 3 161, из них 4 111 почти одинаковых.
create table if not exists partsfit_products (
  id              text primary key,      -- 'perednie-fary/genesis/g80/levyy-92101t1100'
  group_key       text not null,         -- 'headlights', 'control-units', …
  part_type       text not null references partsfit_part_types (slug),
  brand_slug      text not null references partsfit_brands (slug),
  model_id        text references partsfit_models (id),
  slug            text not null,

  title_ru        text not null,
  side            text not null default '',
  position        text not null default '',

  oem_number      text not null,
  cross_numbers   text[] not null default '{}',

  -- Годы — диапазон: одна и та же деталь стоит на нескольких модельных годах,
  -- и экземпляры на странице приходят с разных машин.
  year_from       smallint,
  year_to         smallint,

  -- Сводка по экземплярам. Денормализация намеренная: витрине она нужна на каждой
  -- карточке списка, а считать её агрегатом по offers на каждый показ — лишний джойн.
  -- Пересобирается тем же build-tables.mjs, руками не правится.
  offers_count    smallint not null default 0,
  in_stock        smallint not null default 0,
  price_krw_min   integer,
  price_krw_max   integer,
  best_grade      text not null default ''
);

-- Экземпляр = физическая деталь у донора. Первичный ключ — product_no донора:
-- он им и оперирует, по нему собирается sourceUrl, и повторный прогон скрапера
-- обязан обновлять строку, а не плодить дубли.
create table if not exists partsfit_offers (
  id              text primary key,
  product_id      text not null references partsfit_products (id) on delete cascade,
  barcode         text not null default '',
  title_ko        text not null,
  year            smallint,
  -- Номер лота донора: им он разводит одинаковые детали с одной разборки.
  -- Это НЕ остаток на складе — проверено, у позиций с «2» и «4» остаток единица.
  lot             text not null default '',

  -- VIN машины, с которой снят именно этот экземпляр. Есть у 43% позиций и связывает
  -- карточку с проверкой по VIN — это наш же второй продукт.
  donor_vin       text not null default '',

  -- Цена только в вонах. Рубли и доллары считает lib/shop/pricing.ts по курсу ЦБ:
  -- наценка живёт в валюте закупки, и в данных рублёвой цены быть не должно.
  price_krw       integer not null,

  condition_grade text not null default '',   -- '', 'A+', 'A', 'B', 'C'
  condition_ru    text not null default '',
  condition_notes text[] not null default '{}',
  condition_ko    text not null default '',

  lamp_type       text not null default '',
  lamp_type_ru    text not null default '',
  completeness    text not null default '',
  completeness_ru text not null default '',
  features        text[] not null default '{}',
  features_ru     text[] not null default '{}',
  pins            smallint,
  -- Раскладка колодки как её пишет донор: «3+2+2». По pins фильтруют,
  -- по раскладке сверяют разъём с машиной — это разные вопросы.
  pins_layout     text not null default '',

  -- Цвет кузова у зеркал и кузовщины: «4SS» / «SILKY SILVER». Не тот цвет — деталь
  -- едет в покраску, и вся выгода б/у исчезает, поэтому это признак первого ряда.
  color_code      text not null default '',
  color_name      text not null default '',

  used            boolean not null default true,
  aftermarket     boolean not null default false,
  sold_out        boolean not null default false,

  listed_at       date,
  first_seen      date,
  last_seen       date,
  scraped_at      date,
  source_url      text not null default ''
);

-- Фотографии принадлежат экземпляру, а не детали: покупатель смотрит на скол именно
-- той фары, которая ему приедет.
create table if not exists partsfit_offer_images (
  offer_id    text not null references partsfit_offers (id) on delete cascade,
  position    smallint not null,
  url         text not null,
  -- 'photo' — галерея, 'description' — картинка из тела описания донора.
  -- Разделены намеренно: что на второй, до просмотра неизвестно.
  kind        text not null default 'photo' check (kind in ('photo', 'description')),
  primary key (offer_id, kind, position)
);

-- Поиск по артикулу — основной сценарий: на /parts/<номер> приходит 87% трафика.
create index if not exists partsfit_products_oem_idx on partsfit_products (oem_number);
create index if not exists partsfit_products_cross_idx on partsfit_products using gin (cross_numbers);

-- Посадочные страницы и листинги.
create unique index if not exists partsfit_products_path_idx
  on partsfit_products (part_type, brand_slug, coalesce(model_id, ''), slug);
create index if not exists partsfit_products_landing_idx on partsfit_products (part_type, brand_slug, model_id);
create index if not exists partsfit_products_price_idx on partsfit_products (part_type, price_krw_min);
create index if not exists partsfit_models_brand_idx on partsfit_models (brand_slug);

-- Экземпляры на странице детали и «последние поступления».
create index if not exists partsfit_offers_product_idx on partsfit_offers (product_id);
create index if not exists partsfit_offers_fresh_idx on partsfit_offers (listed_at desc nulls last);
create index if not exists partsfit_offers_vin_idx on partsfit_offers (donor_vin) where donor_vin <> '';

-- Права выдаются явно, а не через «права по умолчанию».
--
-- Проверено на локальном Supabase 15.8: таблицы, созданные миграцией, получают
-- anon/authenticated/service_role только TRUNCATE, REFERENCES и TRIGGER — ни чтения,
-- ни записи. GRANT проверяется раньше RLS, поэтому политики ниже сами по себе
-- ничего не открывают: витрина не смогла бы прочитать каталог, а заливщик — записать
-- даже ключом service_role.
--
-- Полагаться на ALTER DEFAULT PRIVILEGES нельзя ещё и потому, что у хостинга Supabase
-- и у self-hosted они настроены по-разному, а у нас как раз self-hosted на VPS.
grant usage on schema public to anon, authenticated, service_role;

grant select on
  partsfit_brands, partsfit_models, partsfit_part_types,
  partsfit_products, partsfit_offers, partsfit_offer_images
  to anon, authenticated;

-- Пишет только сервис: скрапер заливает каталог ключом service_role.
grant select, insert, update, delete on
  partsfit_brands, partsfit_models, partsfit_part_types,
  partsfit_products, partsfit_offers, partsfit_offer_images
  to service_role;

-- Каталог публичный, и читать его должен анонимный посетитель. Пишет только сервис:
-- ключ service_role политики обходит, поэтому отдельной политики на запись нет —
-- пусть попытка записи анонимным ключом падает, а не «почти работает».
alter table partsfit_brands          enable row level security;
alter table partsfit_models          enable row level security;
alter table partsfit_part_types      enable row level security;
alter table partsfit_products        enable row level security;
alter table partsfit_offers          enable row level security;
alter table partsfit_offer_images    enable row level security;

-- Файл рассчитан на повторный прогон целиком, поэтому политика сначала снимается:
-- у `create policy` нет `if not exists`, и без drop второй запуск падает на первой же
-- таблице, оставив схему наполовину применённой.
do $$
declare t text;
begin
  foreach t in array array[
    'partsfit_brands', 'partsfit_models', 'partsfit_part_types',
    'partsfit_products', 'partsfit_offers', 'partsfit_offer_images'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_read', t
    );
  end loop;
end $$;

-- PostgREST держит схему в кэше и сам о новых таблицах не узнаёт. На хостинге Supabase
-- это делает событийный триггер, на self-hosted его может не быть — и тогда таблица
-- есть, а REST на неё отвечает 404, из-за чего заливка падает с «таблицы нет».
-- Строка безвредна, если триггер и так стоит.
notify pgrst, 'reload schema';
