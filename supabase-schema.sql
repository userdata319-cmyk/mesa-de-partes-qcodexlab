-- Ejecuta esto en Supabase SQL Editor

create table if not exists mesa_partes (
  id                uuid default gen_random_uuid() primary key,
  numero_expediente text unique not null,
  fecha_ingreso     timestamptz,
  estado            text default 'pendiente' check (estado in ('pendiente','en_revision','atendido','rechazado')),

  dem_tipo_persona  text,
  dem_tipo_doc      text,
  dem_num_doc       text,
  dem_nombres       text,
  dem_celular       text,
  dem_domicilio     text,
  dem_correo        text,

  ddo_tipo_persona  text,
  ddo_tipo_doc      text,
  ddo_num_doc       text,
  ddo_nombres       text,
  ddo_celular       text,
  ddo_domicilio     text,
  ddo_correo        text,

  archivos          text[] default '{}',
  urls_externos     text[] default '{}',

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Índices para búsqueda rápida
create index on mesa_partes (estado);
create index on mesa_partes (created_at desc);
create index on mesa_partes using gin(to_tsvector('spanish', coalesce(dem_nombres,'') || ' ' || coalesce(ddo_nombres,'') || ' ' || coalesce(numero_expediente,'')));

-- Row Level Security: solo anon puede insertar, admin puede todo
alter table mesa_partes enable row level security;

create policy "Insertar solicitudes" on mesa_partes
  for insert with check (true);

create policy "Ver solicitudes (autenticado)" on mesa_partes
  for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Actualizar estado (autenticado)" on mesa_partes
  for update using (auth.role() = 'authenticated');

-- Bucket para archivos (ejecutar en Storage → New Bucket)
-- Nombre: anexos
-- Public: false
-- Tamaño máx: 20MB
