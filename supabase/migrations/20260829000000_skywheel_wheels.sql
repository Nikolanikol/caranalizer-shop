-- Колёсные диски со skywheel.kr: схема под Supabase.
--
-- Второй донор, и таблицы у него свои. Смешивать с partsfit_* нельзя: там модель
-- держится на партномере (страница артикула, таблица совместимости), а у диска
-- партномера нет вовсе — донор его не публикует. Подбирают диск маркой, моделью
-- авто и диаметром, и схема построена под это.
--
-- Префикс skywheel_ обязателен у КАЖДОГО объекта, а не только у таблиц: боевая база
-- общая с kmotors, в ней 42 чужие таблицы, а индексы и ограничения в Postgres делят
-- пространство имён с таблицами. Безымянный индекс `wheels_brand_idx` столкнулся бы
-- с чужим так же, как таблица.
--
-- Заливка: файлы из data/skywheel/tables/ ложатся в одноимённые таблицы, поля совпадают
-- с колонками. Порядок важен: brands -> wheels -> wheel_images.

create table if not exists skywheel_brands (
  slug        text primary key,
  name        text not null,
  name_ko     text not null default ''
);

-- Товар = объявление у донора. Разделения «товар/экземпляр», как в partsfit_products
-- и partsfit_offers, здесь нет намеренно: там донор торгует разбором и у одной детали
-- до 64 экземпляров со своей ценой и фотографиями. Здесь объявление и есть товар —
-- один комплект, одна цена, свои фотографии.
create table if not exists skywheel_wheels (
  id              text primary key,          -- wr_id объявления у донора
  slug            text not null unique,      -- 'genesis-g80-19-168'
  brand_slug      text not null references skywheel_brands (slug) on delete restrict,

  -- Модель авто строкой, а не ссылкой на справочник: моделей сорок на сто двадцать
  -- товаров, и отдельная таблица дала бы джойн ради справочника, который меняется
  -- каждым скрапом. Понадобятся посадочные страницы моделей — заводить тогда.
  model           text not null default '',
  diameter        smallint not null check (diameter between 12 and 26),

  -- Корейский заголовок и описание донора — исходник для закупщика, не для витрины.
  -- Описание представляет собой объявление чужой розницы: реклама точек продавца,
  -- скидка за упоминание доски, цена за наличные против карты с НДС, цена trade-in.
  -- Публикуемое описание собирается из полей ниже на границе показа, как и заголовок:
  -- так оно выходит двуязычным сразу и не тащит на сайт чужих условий.
  title_ko        text not null,
  description_ko  text not null default '',

  condition       text not null check (condition in ('new', 'used')),
  -- Пустой грейд подписывать «состояние не указано», а не «хорошее»:
  -- молчание донора — повод предупредить, а не успокоить.
  grade           text not null default '' check (grade in ('', 'good', 'fair', 'repair')),
  wheel_kind      text not null default ''
                  check (wheel_kind in ('', 'forged', 'restored', 'oem', 'diamond-cut')),
  -- «1짝» — одно колесо, «1세트» — комплект из четырёх, цена отличается вчетверо.
  -- Донор пишет это у 14 объявлений из 120, поэтому пусто — штатное значение,
  -- и витрина обязана в этом случае молчать, а не обещать комплект.
  quantity        text not null default '' check (quantity in ('', 'set', 'single')),
  with_tyres      boolean not null default false,

  -- ЦЕНА ПРОДАЖИ и только она — в вонах. Рубли и доллары считает lib/shop/pricing.ts
  -- по курсу ЦБ: наценка живёт в валюте закупки, и второго места для неё быть не должно.
  --
  -- Поле донора `판매가격` ценой продажи является не всегда: у кованых SW-xx он ставит
  -- в шапку цену со сдачей своих дисков в зачёт (`대품시`), а обычную покупку называет
  -- строкой `일반 구매` в описании — на 300–400 тысяч вон дороже. Скрапер разбирает
  -- именно её, иначе наценка считалась бы от суммы, за которую товар никто не продаёт.
  --
  -- NULL — штатное значение: цену продажи назвать нечем, витрина пишет «по запросу».
  -- Придумывать её нельзя, по ней выставляется счёт. Поэтому и `not null` здесь нет:
  -- отсутствие цены обязано доезжать до витрины, а не подменяться нулём.
  price_krw       integer check (price_krw is null or price_krw > 0),

  -- Продавец назвал НДС отдельно от цены («VAT별도» или «картой +10%»), и эти 10%
  -- уже вошли в price_krw. Флаг нужен закупщику: без него непонятно, почему наша
  -- цена выше той, что стоит в объявлении. «НДС включён» не пишет ни один продавец,
  -- поэтому обратного случая нет.
  vat_included    boolean not null default false,

  -- Параметры подбора: ширина обода, разболтовка, вылет, посадочное отверстие.
  -- Для диска это то же, чем для детали партномер, — но донор их почти не заполняет
  -- (PCD у 8 объявлений из 120, вылет у 15), они лежат прозой в описании.
  -- Поэтому массивы пустые по умолчанию, и фильтр подбора на них строить нельзя.
  width_j         numeric(3, 1)[] not null default '{}',
  pcd             numeric(4, 1)[] not null default '{}',
  offset_et       smallint[] not null default '{}',
  bore_cb         numeric(4, 2),
  tyre            text not null default '',

  certified       boolean not null default false,  -- метка донора «[인증]»
  -- Проданное с доски не исчезает: продавец дописывает «[판매완료]» в заголовок,
  -- и объявление висит дальше. Без этого признака товар уехал бы на витрину
  -- как имеющийся в наличии.
  sold            boolean not null default false,

  region          text not null default '',
  -- Продавец обозначен ссылкой («seller-1»), а не именем и телефоном. Это чужие
  -- персональные данные с чужой доски: закупщику они нужны, базе сайта — нет.
  seller_ref      text not null default '',
  hits            integer not null default 0,
  posted          text not null default '',

  -- Адрес объявления у донора. Товар с доски исчезает без следа, и проверить наличие
  -- можно только по источнику — ссылка обязательна, а не справочная.
  source_url      text not null,
  scraped_at      date
);

create table if not exists skywheel_wheel_images (
  wheel_id    text not null references skywheel_wheels (id) on delete cascade,
  position    smallint not null,
  url         text not null,
  primary key (wheel_id, position)
);

-- Листинг и фильтр: марка, диаметр, состояние. Партномера нет, подбирают этим.
create index if not exists skywheel_wheels_brand_idx on skywheel_wheels (brand_slug);
create index if not exists skywheel_wheels_landing_idx on skywheel_wheels (brand_slug, diameter);
create index if not exists skywheel_wheels_price_idx on skywheel_wheels (diameter, price_krw);
-- Проданное с витрины убирается, и запрос за наличием идёт на каждой странице списка.
create index if not exists skywheel_wheels_stock_idx on skywheel_wheels (sold) where sold = false;
create index if not exists skywheel_wheel_images_wheel_idx on skywheel_wheel_images (wheel_id);

-- Права выдаются явно. Таблицы, созданные миграцией, получают anon/service_role только
-- TRUNCATE, REFERENCES и TRIGGER — ни чтения, ни записи, а GRANT проверяется раньше RLS,
-- поэтому политики ниже сами по себе не открывают ничего.
grant usage on schema public to anon, authenticated, service_role;

grant select on
  skywheel_brands, skywheel_wheels, skywheel_wheel_images
  to anon, authenticated;

grant select, insert, update, delete on
  skywheel_brands, skywheel_wheels, skywheel_wheel_images
  to service_role;

alter table skywheel_brands       enable row level security;
alter table skywheel_wheels       enable row level security;
alter table skywheel_wheel_images enable row level security;

-- Файл рассчитан на повторный прогон целиком, поэтому политика сначала снимается:
-- у `create policy` нет `if not exists`, и без drop второй запуск падает на первой же
-- таблице, оставив схему наполовину применённой.
do $$
declare t text;
begin
  foreach t in array array['skywheel_brands', 'skywheel_wheels', 'skywheel_wheel_images'] loop
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_read', t
    );
  end loop;
end $$;

-- PostgREST держит схему в кэше и сам о новых таблицах не узнаёт. Без перезагрузки
-- таблица есть, а REST на неё отвечает 404, и заливка падает с «таблицы нет».
notify pgrst, 'reload schema';
