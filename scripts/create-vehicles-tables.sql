-- Таблицы совместимости запчастей с авто
-- Выполнить в Supabase Dashboard → SQL Editor

create table if not exists vehicles (
  id bigint generated always as identity primary key,
  key text unique not null,              -- канонический ключ из парсера
  brand text not null,                   -- hyundai / kia / genesis / ssangyong / audi
  model_ko text,                         -- корейское имя модели (базовое)
  name_en text not null,                 -- "Sonata DN8", "The New Grandeur IG Hybrid"
  gen_code text,                         -- DN8, CN7, JX1...
  year_from text,                        -- "2019.3"
  year_to text,                          -- "2023.4" (null если open_ended)
  open_ended boolean default false,      -- true = "по настоящее время"
  parts_count int default 0,             -- денормализованный счётчик деталей
  slug text unique                       -- "hyundai-sonata-dn8-2019-2023"
);

create table if not exists part_vehicles (
  part_id bigint not null references parts_products(id) on delete cascade,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  primary key (part_id, vehicle_id)
);

create index if not exists idx_part_vehicles_vehicle on part_vehicles (vehicle_id);
create index if not exists idx_vehicles_brand on vehicles (brand);
create index if not exists idx_vehicles_slug on vehicles (slug);

-- RLS: публичное чтение, запись только сервисным ключом
alter table vehicles enable row level security;
alter table part_vehicles enable row level security;

create policy "public read vehicles" on vehicles for select using (true);
create policy "public read part_vehicles" on part_vehicles for select using (true);
