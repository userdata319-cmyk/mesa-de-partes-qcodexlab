-- ============================================================
-- NUEVAS TABLAS: ejecuta esto en Supabase SQL Editor
-- ============================================================

-- Tabla de clientes (ciudadanos)
create table if not exists clientes (
  id            uuid default gen_random_uuid() primary key,
  tipo_persona  text not null check (tipo_persona in ('natural','juridica')),
  tipo_doc      text not null,
  documento     text not null unique,
  nombres       text not null,
  celular       text not null,
  direccion     text,
  correo        text,
  password_hash text not null,
  created_at    timestamptz default now()
);

alter table clientes enable row level security;
create policy "clientes_insert" on clientes for insert with check (true);
create policy "clientes_select" on clientes for select using (true);
create policy "clientes_update" on clientes for update using (true);

-- Tabla de admins
create table if not exists admins (
  id            uuid default gen_random_uuid() primary key,
  dni           text not null,
  nombres       text not null,
  username      text not null unique,
  password_hash text not null,
  rol           text default 'admin' check (rol in ('master','admin')),
  activo        boolean default true,
  created_at    timestamptz default now()
);

alter table admins enable row level security;
create policy "admins_insert" on admins for insert with check (true);
create policy "admins_select" on admins for select using (true);
create policy "admins_update" on admins for update using (true);

-- Insertar admin MASTER por defecto
-- username: admin | password: admin123
insert into admins (dni, nombres, username, password_hash, rol, activo)
values (
  '00000000',
  'Administrador Master',
  'admin',
  'YWRtaW4xMjM=',   -- base64 de "admin123"
  'master',
  true
) on conflict (username) do nothing;

-- Agregar columnas a mesa_partes (si ya existe la tabla)
alter table mesa_partes
  add column if not exists cliente_id uuid references clientes(id),
  add column if not exists feedback   text;

-- Índice para buscar expedientes por cliente
create index if not exists idx_mesa_partes_cliente on mesa_partes(cliente_id);
