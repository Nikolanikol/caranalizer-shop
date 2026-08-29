-- Зарегистрированные покупатели раздела запчастей.
--
-- Регистрация идёт через GoTrue боевой базы — тот же, что у kmotors: сайты партнёрские,
-- владелец один, и пул аккаунтов у них общий сознательно (решение владельца 29.08.2026).
-- Это значит, что клиент kmotors войдёт к нам своим аккаунтом и наоборот.
--
-- Зачем тогда своя таблица, если `auth.users` и так общая, а у kmotors есть `profiles`:
--
--   1. Почта и телефон нужны НАМ и списком. Из `auth.users` их достаёт только
--      service_role, а `profiles` — таблица kmotors: писать в чужую значит смешать
--      два потока клиентов в их админке и разъехаться с ними при первой же правке
--      схемы. `partsfit_customers` — наши данные под нашим префиксом, как и весь каталог.
--   2. Согласие на рассылку хранить негде: ни в `auth.users`, ни в `profiles` такого
--      поля нет, а без него письмо о поступлениях отправлять нельзя.
--
-- Строку заводит сервер (`/api/auth/sync`) ключом service_role после того, как проверил
-- токен: почта берётся из подтверждённого токена, а не из тела запроса. Поэтому политики
-- на insert для `authenticated` здесь нет намеренно — иначе браузер мог бы завести
-- строку с чужой почтой.
--
-- Префикс `partsfit_` обязателен у каждого объекта, включая индексы и ограничения:
-- база общая, и пространство имён у них с таблицами одно.

create table if not exists partsfit_customers (
  -- Тот же uuid, что в auth.users. Каскад: удалили аккаунт — исчезла и наша строка,
  -- иначе почта осталась бы у нас после того, как человек попросил себя удалить.
  id            uuid primary key references auth.users (id) on delete cascade,

  -- Почта из подтверждённого токена. У аккаунта GoTrue она всегда есть: и Google,
  -- и регистрация по паролю дают её обязательно.
  email         text not null,

  name          text not null default '',

  -- Телефон в E.164, как во всех формах сайта. Пусто — штатно: у входа через Google
  -- телефона нет вовсе, его спрашиваем потом, в кабинете.
  phone         text not null default '',

  locale        text not null default 'ru' check (locale in ('ru', 'en', 'ar')),

  -- 'google' или 'email' — каким способом человек вошёл в последний раз.
  provider      text not null default 'email',

  -- Площадка, на которой мы увидели клиента впервые. Пул аккаунтов общий с kmotors,
  -- и без этой пометки нельзя отличить своего регистранта от их клиента, зашедшего
  -- к нам старым аккаунтом. Тот же приём, что колонка `site` в общей таблице `leads`.
  site          text not null default 'caranalizer',

  -- Согласие на письма о поступлениях. Отдельно от согласия на обработку данных:
  -- второе нужно, чтобы завести аккаунт, а первое — чтобы потом написать. Умолчание
  -- false, галочка на форме не проставлена заранее.
  marketing_ok  boolean not null default false,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Обновляется при каждом входе: по нему видно живые аккаунты.
  last_seen_at  timestamptz not null default now()
);

create index if not exists partsfit_customers_email_idx   on partsfit_customers (email);
create index if not exists partsfit_customers_created_idx on partsfit_customers (created_at desc);

-- Права выдаём явно. Таблица, созданная миграцией, получает `anon`/`authenticated`
-- только TRUNCATE, REFERENCES и TRIGGER — ни чтения, ни записи, и `grant` проверяется
-- раньше RLS: без этих строк политика ниже не открывает ничего.
--
-- `anon` не назван вовсе: список покупателей не публичный, а витрина ходит анонимным
-- ключом. Читать свою строку может только вошедший, и только свою.
grant select, update on partsfit_customers to authenticated;
grant all    on partsfit_customers to service_role;

alter table partsfit_customers enable row level security;

drop policy if exists partsfit_customers_select_own on partsfit_customers;
create policy partsfit_customers_select_own on partsfit_customers
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists partsfit_customers_update_own on partsfit_customers;
create policy partsfit_customers_update_own on partsfit_customers
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- PostgREST держит схему в кэше: без перезагрузки таблица есть, а REST по ней 404.
notify pgrst, 'reload schema';
