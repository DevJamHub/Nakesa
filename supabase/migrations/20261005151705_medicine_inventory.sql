-- NAKESA medicine inventory: practice roles, medicine categories, suppliers,
-- medicines with batches, a stock movement ledger, prescriptions that take stock
-- automatically, and an audit log.
--
-- Access model
--   practice_members gives every user a role inside a practice:
--     admin  – owner of the practice: everything, incl. approving medicines for use
--     nakes  – bidan / other health worker: medicines, stock and prescriptions
--     staf   – non-clinical staff: may look at medicines and stock, change nothing
--   Patients (the public booking page) have no access to any of this.
--   The owner of every practice becomes its admin automatically.
--
-- Stock
--   Stock is never typed in directly. Every change is a row in stock_movements
--   (append-only); a trigger keeps medicine_stock (quantity per batch) up to date
--   and refuses to let it go below zero.
--
-- Clinical data (indications, contraindications, dosing) is entered by the
-- practice and must follow regulations, the facility's SOP and the practitioner's
-- authority. The example medicines below leave those fields empty on purpose.

-- ---------------------------------------------------------------------------
-- Settings on the practice
-- ---------------------------------------------------------------------------
alter table public.practices
  add column expiry_warning_days smallint not null default 90
    check (expiry_warning_days between 1 and 365);

comment on column public.practices.expiry_warning_days is
  'Medicines expiring within this many days are shown as "akan kedaluwarsa".';

grant update (expiry_warning_days) on public.practices to authenticated;

-- ---------------------------------------------------------------------------
-- Practice members and roles
-- ---------------------------------------------------------------------------
create table public.practice_members (
  practice_id uuid not null references public.practices (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('admin', 'nakes', 'staf')),
  created_at  timestamptz not null default now(),
  primary key (practice_id, user_id)
);

create index practice_members_user_idx on public.practice_members (user_id);

comment on table public.practice_members is
  'Who works in a practice and with which role (admin, nakes, staf). The owner is admin.';

-- Helpers for policies. They only ever look at the calling user's own memberships.
-- SECURITY DEFINER so they can read practice_members without going through its RLS.
create function private.my_practices()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select practice_id from public.practice_members where user_id = (select auth.uid());
$$;

create function private.my_clinical_practices()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select practice_id from public.practice_members
  where user_id = (select auth.uid()) and role in ('admin', 'nakes');
$$;

create function private.my_admin_practices()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select practice_id from public.practice_members
  where user_id = (select auth.uid()) and role = 'admin';
$$;

-- Default practice_id for new rows: the practice the user belongs to.
create function private.current_practice_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select practice_id from public.practice_members
  where user_id = (select auth.uid())
  order by created_at
  limit 1;
$$;

-- Policies and column defaults run as the signed-in user, so it needs to reach these.
-- The private schema is not exposed through the Data API.
grant usage on schema private to authenticated;
revoke all on function private.my_practices(), private.my_clinical_practices(),
  private.my_admin_practices(), private.current_practice_id() from public, anon;
grant execute on function private.my_practices(), private.my_clinical_practices(),
  private.my_admin_practices(), private.current_practice_id() to authenticated;

-- The owner of a practice is its admin.
create function private.add_owner_as_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.practice_members (practice_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict (practice_id, user_id) do update set role = 'admin';
  return new;
end;
$$;

create trigger practices_add_owner_as_admin
  after insert on public.practices
  for each row execute function private.add_owner_as_admin();

insert into public.practice_members (practice_id, user_id, role)
select id, owner_id, 'admin' from public.practices
on conflict (practice_id, user_id) do nothing;

alter table public.practice_members enable row level security;

create policy "Members see the members of their practice" on public.practice_members
  for select to authenticated
  using (practice_id in (select private.my_practices()));

-- Adding members (invitations) comes later; until then only the owner is a member.
revoke all on public.practice_members from anon, authenticated;
grant select on public.practice_members to authenticated;

-- Members (not only the owner) can read the practice they work in.
create policy "Members can view their practice" on public.practices
  for select to authenticated
  using (id in (select private.my_practices()));

-- ---------------------------------------------------------------------------
-- Medicine categories: shared defaults (practice_id null) + a practice's own
-- ---------------------------------------------------------------------------
create table public.medicine_categories (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  sort_order  smallint not null default 100,
  created_at  timestamptz not null default now(),
  unique nulls not distinct (practice_id, name)
);

comment on table public.medicine_categories is
  'Medicine categories. Rows without practice_id are the defaults every practice sees.';

insert into public.medicine_categories (name, sort_order) values
  ('Kehamilan', 10),
  ('Persalinan', 20),
  ('Nifas', 30),
  ('Menyusui', 40),
  ('Kontrasepsi', 50),
  ('Bayi Baru Lahir', 60),
  ('Vitamin & Mineral', 70),
  ('Analgesik/Antipiretik', 80),
  ('Antibiotik', 90),
  ('Obat Simptomatik', 100),
  ('Obat Kegawatdaruratan', 110),
  ('Cairan/Infus', 120),
  ('Obat Lainnya', 130);

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
create table public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null default private.current_practice_id()
              references public.practices (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  phone       text check (char_length(phone) <= 30),
  address     text check (char_length(address) <= 300),
  notes       text check (char_length(notes) <= 500),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, practice_id),
  unique (practice_id, name)
);

-- ---------------------------------------------------------------------------
-- Medicines (the existing table grows into the full medicine record)
-- ---------------------------------------------------------------------------
alter table public.medicines rename column name to generic_name;
alter table public.medicines rename column price to sell_price;

alter table public.medicines
  add column practice_id uuid references public.practices (id) on delete cascade,
  add column category_id uuid references public.medicine_categories (id) deferrable initially deferred,
  add column brand_name text check (char_length(brand_name) <= 120),
  add column dosage_form text check (char_length(dosage_form) <= 60),
  add column strength text check (char_length(strength) <= 60),
  add column route text check (char_length(route) <= 60),
  add column indications text check (char_length(indications) <= 1000),
  add column contraindications text check (char_length(contraindications) <= 1000),
  add column usage_instructions text check (char_length(usage_instructions) <= 1000),
  add column buy_price bigint check (buy_price >= 0),
  add column drug_class text check (drug_class in
    ('bebas', 'bebas_terbatas', 'keras', 'narkotika_psikotropika', 'alkes')),
  add column use_in_service boolean not null default false,
  add column is_active boolean not null default true,
  add column notes text check (char_length(notes) <= 1000),
  add column created_by uuid default auth.uid() references auth.users (id) on delete set null;

comment on column public.medicines.generic_name is 'Nama generik.';
comment on column public.medicines.drug_class is
  'Golongan obat (bebas, bebas terbatas, keras, narkotika/psikotropika) or alkes (alat kesehatan).';
comment on column public.medicines.use_in_service is
  'Approved by the admin for prescriptions/services, in line with authority and SOP.';

update public.medicines m set practice_id = p.id
from public.practices p
where p.owner_id = m.owner_id;
delete from public.medicines where practice_id is null; -- users without a practice cannot have used the app

alter table public.medicines
  alter column practice_id set not null,
  alter column practice_id set default private.current_practice_id(),
  add constraint medicines_id_practice_key unique (id, practice_id);

create index medicines_practice_name_idx on public.medicines (practice_id, generic_name);
create index medicines_category_idx on public.medicines (category_id);
create index medicines_created_by_idx on public.medicines (created_by);

-- ---------------------------------------------------------------------------
-- Batches and stock per batch
-- ---------------------------------------------------------------------------
create table public.medicine_batches (
  id           uuid primary key default gen_random_uuid(),
  practice_id  uuid not null default private.current_practice_id()
               references public.practices (id) on delete cascade,
  medicine_id  uuid not null,
  batch_number text check (char_length(batch_number) <= 60),
  expires_on   date,
  supplier_id  uuid,
  buy_price    bigint check (buy_price >= 0),
  received_on  date not null default ((now() at time zone 'Asia/Jakarta')::date),
  created_at   timestamptz not null default now(),
  -- No cascade from medicines: a medicine with stock history cannot be deleted, only switched off.
  -- Checked at the end of the transaction, so deleting a whole practice (which cascades
  -- along several paths at once) still works.
  foreign key (medicine_id, practice_id) references public.medicines (id, practice_id)
    deferrable initially deferred,
  foreign key (supplier_id, practice_id) references public.suppliers (id, practice_id)
    deferrable initially deferred,
  unique nulls not distinct (medicine_id, batch_number, expires_on)
);

create index medicine_batches_medicine_idx on public.medicine_batches (medicine_id, practice_id);
create index medicine_batches_supplier_idx on public.medicine_batches (supplier_id, practice_id);
create index medicine_batches_practice_expiry_idx on public.medicine_batches (practice_id, expires_on);

-- Quantity on hand per batch. Written only by the stock movement trigger.
create table public.medicine_stock (
  batch_id    uuid primary key references public.medicine_batches (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete cascade,
  practice_id uuid not null references public.practices (id) on delete cascade,
  quantity    integer not null default 0 check (quantity >= 0),
  updated_at  timestamptz not null default now()
);

create index medicine_stock_medicine_idx on public.medicine_stock (medicine_id);
create index medicine_stock_practice_idx on public.medicine_stock (practice_id);

-- ---------------------------------------------------------------------------
-- Prescriptions
-- ---------------------------------------------------------------------------
create table public.prescriptions (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null default private.current_practice_id()
                references public.practices (id) on delete cascade,
  patient_id    uuid references public.patients (id) on delete set null,
  patient_name  text not null check (char_length(patient_name) between 1 and 120),
  booking_id    uuid references public.bookings (id) on delete set null,
  status        text not null default 'draft' check (status in ('draft', 'selesai', 'batal')),
  notes         text check (char_length(notes) <= 1000),
  prescribed_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz,
  unique (id, practice_id)
);

create index prescriptions_practice_date_idx on public.prescriptions (practice_id, created_at desc);
create index prescriptions_patient_idx on public.prescriptions (patient_id);
create index prescriptions_booking_idx on public.prescriptions (booking_id);
create index prescriptions_prescribed_by_idx on public.prescriptions (prescribed_by);

create table public.prescription_items (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null,
  practice_id     uuid not null default private.current_practice_id(),
  medicine_id     uuid not null,
  dose            text not null check (char_length(dose) between 1 and 60),
  frequency       text not null check (char_length(frequency) between 1 and 60),
  duration        text check (char_length(duration) <= 60),
  quantity        integer not null check (quantity > 0),
  route           text check (char_length(route) <= 60),
  instructions    text check (char_length(instructions) <= 300),
  created_at      timestamptz not null default now(),
  foreign key (prescription_id, practice_id) references public.prescriptions (id, practice_id) on delete cascade,
  foreign key (medicine_id, practice_id) references public.medicines (id, practice_id)
    deferrable initially deferred
);

create index prescription_items_prescription_idx on public.prescription_items (prescription_id, practice_id);
create index prescription_items_medicine_idx on public.prescription_items (medicine_id, practice_id);

-- ---------------------------------------------------------------------------
-- Stock movements: the history of every change in stock (append-only)
-- ---------------------------------------------------------------------------
create table public.stock_movements (
  id                   uuid primary key default gen_random_uuid(),
  practice_id          uuid not null references public.practices (id) on delete cascade,
  medicine_id          uuid not null references public.medicines (id) deferrable initially deferred,
  batch_id             uuid not null references public.medicine_batches (id) deferrable initially deferred,
  movement_type        text not null check (movement_type in
                         ('masuk', 'keluar', 'koreksi', 'resep', 'kedaluwarsa', 'rusak')),
  quantity             integer not null check (quantity <> 0),
  stock_after          integer not null,
  note                 text check (char_length(note) <= 300),
  prescription_item_id uuid references public.prescription_items (id) deferrable initially deferred,
  created_by           uuid default auth.uid() references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  -- In is positive, out is negative, a correction can go either way.
  check ((movement_type = 'masuk' and quantity > 0)
      or (movement_type in ('keluar', 'resep', 'kedaluwarsa', 'rusak') and quantity < 0)
      or movement_type = 'koreksi'),
  check ((movement_type = 'resep') = (prescription_item_id is not null))
);

comment on table public.stock_movements is
  'Every change in stock. Never updated or deleted; mistakes are fixed with a "koreksi" row.';

create index stock_movements_medicine_date_idx on public.stock_movements (medicine_id, created_at desc);
create index stock_movements_practice_date_idx on public.stock_movements (practice_id, created_at desc);
create index stock_movements_batch_idx on public.stock_movements (batch_id);
create index stock_movements_item_idx on public.stock_movements (prescription_item_id);
create index stock_movements_created_by_idx on public.stock_movements (created_by);

-- Apply a movement to the batch stock. The medicine and practice always come from
-- the batch, and stock can never go below zero.
create function private.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_medicine uuid;
  v_practice uuid;
  v_current  integer;
begin
  select medicine_id, practice_id into v_medicine, v_practice
  from public.medicine_batches where id = new.batch_id;
  if v_medicine is null then
    raise exception 'Batch obat tidak ditemukan.';
  end if;
  new.medicine_id := v_medicine;
  new.practice_id := v_practice;

  insert into public.medicine_stock (batch_id, medicine_id, practice_id, quantity)
  values (new.batch_id, v_medicine, v_practice, 0)
  on conflict (batch_id) do nothing;

  select quantity into v_current from public.medicine_stock
  where batch_id = new.batch_id
  for update;

  if v_current + new.quantity < 0 then
    raise exception 'Stok tidak cukup. Sisa stok di batch ini: %.', v_current;
  end if;

  update public.medicine_stock
  set quantity = v_current + new.quantity, updated_at = now()
  where batch_id = new.batch_id;

  new.stock_after := v_current + new.quantity;
  return new;
end;
$$;

create trigger stock_movements_apply
  before insert on public.stock_movements
  for each row execute function private.apply_stock_movement();

-- ---------------------------------------------------------------------------
-- Guards on clinical decisions
-- ---------------------------------------------------------------------------

-- Only the admin may approve (or withdraw) a medicine for prescriptions/services.
create function private.check_medicine_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' and new.use_in_service)
     or (tg_op = 'UPDATE' and new.use_in_service is distinct from old.use_in_service) then
    if (select auth.uid()) is not null
       and new.practice_id not in (select private.my_admin_practices()) then
      raise exception 'Hanya admin praktik yang boleh mengizinkan obat dipakai di layanan.';
    end if;
  end if;
  return new;
end;
$$;

create trigger medicines_check_approval
  before insert or update on public.medicines
  for each row execute function private.check_medicine_approval();

-- A prescription may only point to a patient and booking of the same practice.
create function private.check_prescription_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.practices where id = new.practice_id;
  if new.patient_id is not null and not exists (
    select 1 from public.patients where id = new.patient_id and owner_id = v_owner
  ) then
    raise exception 'Pasien tidak ditemukan di praktik ini.';
  end if;
  if new.booking_id is not null and not exists (
    select 1 from public.bookings where id = new.booking_id and owner_id = v_owner
  ) then
    raise exception 'Booking tidak ditemukan di praktik ini.';
  end if;
  return new;
end;
$$;

create trigger prescriptions_check_links
  before insert or update of patient_id, booking_id, practice_id on public.prescriptions
  for each row execute function private.check_prescription_links();

create trigger suppliers_set_updated_at before update on public.suppliers
  for each row execute function private.set_updated_at();
create trigger prescriptions_set_updated_at before update on public.prescriptions
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Existing stock → one batch per medicine, recorded as an opening movement
-- ---------------------------------------------------------------------------
insert into public.medicine_batches (practice_id, medicine_id, batch_number, expires_on)
select practice_id, id, null, expires_on
from public.medicines
where stock > 0;

insert into public.stock_movements (batch_id, movement_type, quantity, note)
select b.id, 'masuk', m.stock, 'Stok awal dari data sebelumnya'
from public.medicines m
join public.medicine_batches b on b.medicine_id = m.id
where m.stock > 0;

-- Run the deferred foreign key checks of the rows above now, before tables are altered below.
set constraints all immediate;

drop policy "Owners manage their medicines" on public.medicines;
alter table public.medicines
  drop column owner_id,
  drop column stock,
  drop column expires_on;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.medicine_categories enable row level security;
alter table public.suppliers           enable row level security;
alter table public.medicine_batches    enable row level security;
alter table public.medicine_stock      enable row level security;
alter table public.stock_movements     enable row level security;
alter table public.prescriptions       enable row level security;
alter table public.prescription_items  enable row level security;

-- Categories: everyone signed in sees the defaults; members see their own.
create policy "Members read categories" on public.medicine_categories
  for select to authenticated
  using (practice_id is null or practice_id in (select private.my_practices()));
create policy "Health workers add categories" on public.medicine_categories
  for insert to authenticated
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Health workers edit categories" on public.medicine_categories
  for update to authenticated
  using (practice_id in (select private.my_clinical_practices()))
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Admins delete categories" on public.medicine_categories
  for delete to authenticated
  using (practice_id in (select private.my_admin_practices()));

-- Suppliers
create policy "Members read suppliers" on public.suppliers
  for select to authenticated
  using (practice_id in (select private.my_practices()));
create policy "Health workers add suppliers" on public.suppliers
  for insert to authenticated
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Health workers edit suppliers" on public.suppliers
  for update to authenticated
  using (practice_id in (select private.my_clinical_practices()))
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Admins delete suppliers" on public.suppliers
  for delete to authenticated
  using (practice_id in (select private.my_admin_practices()));

-- Medicines: staff read; health workers add and edit; admins delete (only unused ones,
-- the foreign keys refuse the rest — those are switched off with is_active instead).
create policy "Members read medicines" on public.medicines
  for select to authenticated
  using (practice_id in (select private.my_practices()));
create policy "Health workers add medicines" on public.medicines
  for insert to authenticated
  with check (
    practice_id in (select private.my_clinical_practices())
    and (category_id is null or exists (
      select 1 from public.medicine_categories c
      where c.id = category_id and (c.practice_id is null or c.practice_id = medicines.practice_id)))
  );
create policy "Health workers edit medicines" on public.medicines
  for update to authenticated
  using (practice_id in (select private.my_clinical_practices()))
  with check (
    practice_id in (select private.my_clinical_practices())
    and (category_id is null or exists (
      select 1 from public.medicine_categories c
      where c.id = category_id and (c.practice_id is null or c.practice_id = medicines.practice_id)))
  );
create policy "Admins delete medicines" on public.medicines
  for delete to authenticated
  using (practice_id in (select private.my_admin_practices()));

-- Batches
create policy "Members read batches" on public.medicine_batches
  for select to authenticated
  using (practice_id in (select private.my_practices()));
create policy "Health workers add batches" on public.medicine_batches
  for insert to authenticated
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Health workers edit batches" on public.medicine_batches
  for update to authenticated
  using (practice_id in (select private.my_clinical_practices()))
  with check (practice_id in (select private.my_clinical_practices()));

-- Stock and movements: read by members; movements added by health workers.
-- Prescription movements ("resep") are only made by complete_prescription().
create policy "Members read stock" on public.medicine_stock
  for select to authenticated
  using (practice_id in (select private.my_practices()));
create policy "Members read stock movements" on public.stock_movements
  for select to authenticated
  using (practice_id in (select private.my_practices()));
create policy "Health workers record stock movements" on public.stock_movements
  for insert to authenticated
  with check (practice_id in (select private.my_clinical_practices()) and movement_type <> 'resep');

-- Prescriptions are clinical data: admin and health workers only (not staff).
-- They can be changed while still a draft; completing goes through complete_prescription().
create policy "Health workers read prescriptions" on public.prescriptions
  for select to authenticated
  using (practice_id in (select private.my_clinical_practices()));
create policy "Health workers write prescriptions" on public.prescriptions
  for insert to authenticated
  with check (practice_id in (select private.my_clinical_practices()) and status = 'draft');
create policy "Health workers edit draft prescriptions" on public.prescriptions
  for update to authenticated
  using (practice_id in (select private.my_clinical_practices()) and status = 'draft')
  with check (practice_id in (select private.my_clinical_practices()) and status in ('draft', 'batal'));
create policy "Health workers delete draft prescriptions" on public.prescriptions
  for delete to authenticated
  using (practice_id in (select private.my_clinical_practices()) and status = 'draft');

create policy "Health workers read prescription items" on public.prescription_items
  for select to authenticated
  using (practice_id in (select private.my_clinical_practices()));
create policy "Health workers add items to drafts" on public.prescription_items
  for insert to authenticated
  with check (
    practice_id in (select private.my_clinical_practices())
    and exists (select 1 from public.prescriptions p where p.id = prescription_id and p.status = 'draft'));
create policy "Health workers edit items of drafts" on public.prescription_items
  for update to authenticated
  using (practice_id in (select private.my_clinical_practices())
    and exists (select 1 from public.prescriptions p where p.id = prescription_id and p.status = 'draft'))
  with check (practice_id in (select private.my_clinical_practices()));
create policy "Health workers remove items from drafts" on public.prescription_items
  for delete to authenticated
  using (practice_id in (select private.my_clinical_practices())
    and exists (select 1 from public.prescriptions p where p.id = prescription_id and p.status = 'draft'));

-- ---------------------------------------------------------------------------
-- Data API privileges (anon gets nothing)
-- ---------------------------------------------------------------------------
revoke all on public.medicine_categories, public.suppliers, public.medicines, public.medicine_batches,
              public.medicine_stock, public.stock_movements, public.prescriptions,
              public.prescription_items
  from anon, authenticated;

grant select, delete on public.medicine_categories to authenticated;
grant insert (practice_id, name, sort_order), update (name, sort_order)
  on public.medicine_categories to authenticated;

grant select, delete on public.suppliers to authenticated;
grant insert (practice_id, name, phone, address, notes, is_active),
      update (name, phone, address, notes, is_active)
  on public.suppliers to authenticated;

grant select, delete on public.medicines to authenticated;
grant insert (practice_id, category_id, generic_name, brand_name, dosage_form, strength, unit, route,
              indications, contraindications, usage_instructions, min_stock, buy_price, sell_price,
              drug_class, use_in_service, is_active, notes),
      update (category_id, generic_name, brand_name, dosage_form, strength, unit, route,
              indications, contraindications, usage_instructions, min_stock, buy_price, sell_price,
              drug_class, use_in_service, is_active, notes)
  on public.medicines to authenticated;

grant select on public.medicine_batches to authenticated;
grant insert (practice_id, medicine_id, batch_number, expires_on, supplier_id, buy_price, received_on),
      update (batch_number, expires_on, supplier_id, buy_price, received_on)
  on public.medicine_batches to authenticated;

grant select on public.medicine_stock to authenticated;

grant select on public.stock_movements to authenticated;
grant insert (batch_id, movement_type, quantity, note) on public.stock_movements to authenticated;

grant select, delete on public.prescriptions to authenticated;
grant insert (practice_id, patient_id, patient_name, booking_id, notes),
      update (patient_id, patient_name, booking_id, notes, status)
  on public.prescriptions to authenticated;

grant select, delete on public.prescription_items to authenticated;
grant insert (prescription_id, practice_id, medicine_id, dose, frequency, duration, quantity, route, instructions),
      update (dose, frequency, duration, quantity, route, instructions)
  on public.prescription_items to authenticated;

-- ---------------------------------------------------------------------------
-- Inventory view: stock, nearest expiry and warning status per medicine
-- ---------------------------------------------------------------------------
create view public.medicine_inventory
with (security_invoker = true)
as
select
  m.id,
  m.practice_id,
  m.generic_name,
  m.brand_name,
  m.category_id,
  c.name as category_name,
  m.dosage_form,
  m.strength,
  m.unit,
  m.route,
  m.min_stock,
  m.buy_price,
  m.sell_price,
  m.drug_class,
  m.use_in_service,
  m.is_active,
  coalesce(s.usable, 0)::integer  as stock,          -- not expired, can be used
  coalesce(s.expired, 0)::integer as expired_stock,  -- expired, must be taken out
  coalesce(s.batches, 0)::integer as batch_count,
  s.nearest_expiry,
  case
    when coalesce(s.usable, 0) = 0 then 'habis'
    when s.usable <= m.min_stock then 'menipis'
    else 'aman'
  end as stock_status,
  case
    when coalesce(s.expired, 0) > 0 then 'kedaluwarsa'
    when s.nearest_expiry <= (now() at time zone 'Asia/Jakarta')::date + p.expiry_warning_days
      then 'akan_kedaluwarsa'
    else 'aman'
  end as expiry_status
from public.medicines m
join public.practices p on p.id = m.practice_id
left join public.medicine_categories c on c.id = m.category_id
left join lateral (
  select
    sum(st.quantity) filter (where b.expires_on is null
                               or b.expires_on >= (now() at time zone 'Asia/Jakarta')::date) as usable,
    sum(st.quantity) filter (where b.expires_on < (now() at time zone 'Asia/Jakarta')::date) as expired,
    count(*) filter (where st.quantity > 0) as batches,
    min(b.expires_on) filter (where st.quantity > 0
                                and b.expires_on >= (now() at time zone 'Asia/Jakarta')::date) as nearest_expiry
  from public.medicine_stock st
  join public.medicine_batches b on b.id = st.batch_id
  where st.medicine_id = m.id
) s on true;

revoke all on public.medicine_inventory from anon, authenticated;
grant select on public.medicine_inventory to authenticated;

-- ---------------------------------------------------------------------------
-- Stock functions (run as the signed-in user, so RLS applies)
-- ---------------------------------------------------------------------------

-- Stock in: finds or creates the batch (same number + expiry date) and records the movement.
create function public.receive_stock(
  p_medicine_id  uuid,
  p_quantity     integer,
  p_expires_on   date default null,
  p_batch_number text default null,
  p_supplier_id  uuid default null,
  p_buy_price    bigint default null,
  p_note         text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_practice uuid;
  v_batch    uuid;
  v_number   text := nullif(trim(p_batch_number), '');
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Jumlah stok masuk harus lebih dari 0.';
  end if;
  select practice_id into v_practice from public.medicines where id = p_medicine_id;
  if v_practice is null then
    raise exception 'Obat tidak ditemukan.';
  end if;

  select id into v_batch from public.medicine_batches
  where medicine_id = p_medicine_id
    and batch_number is not distinct from v_number
    and expires_on is not distinct from p_expires_on;

  if v_batch is null then
    insert into public.medicine_batches (practice_id, medicine_id, batch_number, expires_on, supplier_id, buy_price)
    values (v_practice, p_medicine_id, v_number, p_expires_on, p_supplier_id, p_buy_price)
    returning id into v_batch;
  end if;

  insert into public.stock_movements (batch_id, movement_type, quantity, note)
  values (v_batch, 'masuk', p_quantity, nullif(trim(p_note), ''));
  return v_batch;
end;
$$;

-- Stock out without a prescription: keluar, rusak or kedaluwarsa.
create function public.record_stock_out(
  p_batch_id uuid,
  p_type     text,
  p_quantity integer,
  p_note     text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_type not in ('keluar', 'rusak', 'kedaluwarsa') then
    raise exception 'Jenis pengeluaran tidak dikenal.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Jumlah harus lebih dari 0.';
  end if;
  insert into public.stock_movements (batch_id, movement_type, quantity, note)
  values (p_batch_id, p_type, -p_quantity, nullif(trim(p_note), ''));
end;
$$;

-- Stock count (stok opname): the real count is entered, the difference is recorded.
create function public.correct_stock(
  p_batch_id uuid,
  p_counted  integer,
  p_note     text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current integer;
begin
  if p_counted is null or p_counted < 0 then
    raise exception 'Isi jumlah stok yang sebenarnya.';
  end if;
  if coalesce(trim(p_note), '') = '' then
    raise exception 'Tulis alasan koreksi stok.';
  end if;
  select coalesce(quantity, 0) into v_current from public.medicine_stock where batch_id = p_batch_id;
  v_current := coalesce(v_current, 0);
  if p_counted = v_current then
    raise exception 'Stok sudah sesuai, tidak ada yang dikoreksi.';
  end if;
  insert into public.stock_movements (batch_id, movement_type, quantity, note)
  values (p_batch_id, 'koreksi', p_counted - v_current, trim(p_note));
  return p_counted - v_current;
end;
$$;

-- Complete a prescription: checks every medicine and takes the stock in one go,
-- earliest expiry first (FEFO) and never from expired batches. If anything is
-- missing nothing is taken and the prescription stays a draft.
-- SECURITY DEFINER because "resep" movements may only be made here; access is
-- checked at the start.
create function public.complete_prescription(p_prescription_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rx    public.prescriptions;
  v_item  record;
  v_batch record;
  v_left  integer;
  v_take  integer;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  select * into v_rx from public.prescriptions where id = p_prescription_id for update;
  if not found or v_rx.practice_id not in (select private.my_clinical_practices()) then
    raise exception 'Resep tidak ditemukan.';
  end if;
  if v_rx.status <> 'draft' then
    raise exception 'Resep ini sudah berstatus %.', v_rx.status;
  end if;
  if not exists (select 1 from public.prescription_items where prescription_id = v_rx.id) then
    raise exception 'Tambahkan minimal satu obat ke resep.';
  end if;

  for v_item in
    select i.id, i.medicine_id, i.quantity, m.generic_name, m.unit, m.is_active, m.use_in_service
    from public.prescription_items i
    join public.medicines m on m.id = i.medicine_id
    where i.prescription_id = v_rx.id
    order by i.created_at
  loop
    if not v_item.is_active then
      raise exception '% sudah dinonaktifkan.', v_item.generic_name;
    end if;
    if not v_item.use_in_service then
      raise exception '% belum diizinkan dipakai di layanan. Admin perlu meninjaunya sesuai kewenangan dan SOP.',
        v_item.generic_name;
    end if;

    v_left := v_item.quantity;
    for v_batch in
      select st.batch_id, st.quantity
      from public.medicine_stock st
      join public.medicine_batches b on b.id = st.batch_id
      where st.medicine_id = v_item.medicine_id
        and st.quantity > 0
        and (b.expires_on is null or b.expires_on >= v_today)
      order by b.expires_on nulls last, b.received_on, b.created_at
      for update of st
    loop
      exit when v_left = 0;
      v_take := least(v_left, v_batch.quantity);
      insert into public.stock_movements (batch_id, movement_type, quantity, prescription_item_id, note, created_by)
      values (v_batch.batch_id, 'resep', -v_take, v_item.id, 'Resep: ' || v_rx.patient_name, (select auth.uid()));
      v_left := v_left - v_take;
    end loop;

    if v_left > 0 then
      raise exception 'Stok % tidak cukup: kurang % %.', v_item.generic_name, v_left, v_item.unit;
    end if;
  end loop;

  update public.prescriptions
  set status = 'selesai', completed_at = now()
  where id = v_rx.id;
end;
$$;

revoke all on function public.receive_stock(uuid, integer, date, text, uuid, bigint, text),
  public.record_stock_out(uuid, text, integer, text),
  public.correct_stock(uuid, integer, text),
  public.complete_prescription(uuid)
  from public, anon;
grant execute on function public.receive_stock(uuid, integer, date, text, uuid, bigint, text),
  public.record_stock_out(uuid, text, integer, text),
  public.correct_stock(uuid, integer, text),
  public.complete_prescription(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Example medicines for a midwifery practice (added on request from the app)
-- Stock 0 and not approved for use: the admin checks each one first. Clinical
-- fields are left empty: they must be filled from official references / SOP.
-- ---------------------------------------------------------------------------
create function public.add_example_medicines()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_practice uuid := private.current_practice_id();
  v_added    integer;
begin
  if v_practice is null or v_practice not in (select private.my_clinical_practices()) then
    raise exception 'Hanya admin atau tenaga kesehatan yang boleh menambah obat.';
  end if;

  insert into public.medicines (practice_id, generic_name, category_id, dosage_form, strength, unit, route,
                                drug_class, min_stock, notes)
  select v_practice, e.generic_name, c.id, e.dosage_form, e.strength, e.unit, e.route, e.drug_class,
         e.min_stock,
         'Contoh data. Sesuaikan dengan produk yang tersedia. Indikasi, kontraindikasi, dan aturan pakai '
         || 'perlu divalidasi berdasarkan regulasi/SOP/tenaga kesehatan.'
  from (values
    ('Paracetamol',                          'Analgesik/Antipiretik', 'Tablet',                '500 mg',                         'tablet', 'Oral',            'bebas', 20),
    ('Tablet tambah darah (Fe + asam folat)', 'Kehamilan',             'Tablet salut',          null,                             'tablet', 'Oral',            null,    30),
    ('Asam folat',                           'Kehamilan',             'Tablet',                null,                             'tablet', 'Oral',            null,    30),
    ('Kalsium laktat',                       'Kehamilan',             'Tablet',                null,                             'tablet', 'Oral',            null,    30),
    ('Vitamin A (kapsul merah)',             'Nifas',                 'Kapsul lunak',          '200.000 IU',                     'kapsul', 'Oral',            null,    10),
    ('Oralit',                               'Obat Simptomatik',      'Serbuk (sachet)',       'Untuk 200 mL larutan',           'sachet', 'Oral',            'bebas', 10),
    ('Antasida (Al(OH)3 + Mg(OH)2)',         'Obat Simptomatik',      'Tablet kunyah',         null,                             'tablet', 'Oral',            null,    10),
    ('Amoxicillin',                          'Antibiotik',            'Kapsul',                '500 mg',                         'kapsul', 'Oral',            'keras', 20),
    ('Ampicillin',                           'Antibiotik',            'Serbuk injeksi (vial)', '1 g',                            'vial',   'IM/IV',           'keras', 5),
    ('Metronidazole',                        'Antibiotik',            'Tablet',                '500 mg',                         'tablet', 'Oral',            'keras', 20),
    ('Oxytocin',                             'Persalinan',            'Injeksi (ampul)',       '10 IU/mL',                       'ampul',  'IM/IV',           'keras', 10),
    ('Lidokain',                             'Persalinan',            'Injeksi (ampul)',       '2%',                             'ampul',  'Infiltrasi lokal', 'keras', 5),
    ('Magnesium sulfat',                     'Obat Kegawatdaruratan', 'Injeksi (vial)',        '40%',                            'vial',   'IV/IM',           'keras', 4),
    ('Vitamin K1 (fitomenadion)',            'Bayi Baru Lahir',       'Injeksi (ampul)',       null,                             'ampul',  'IM',              'keras', 5),
    ('Salep mata antibiotik',                'Bayi Baru Lahir',       'Salep mata',            null,                             'tube',   'Mata',            'keras', 3),
    ('Pil KB kombinasi',                     'Kontrasepsi',           'Tablet',                null,                             'strip',  'Oral',            'keras', 10),
    ('Suntik KB 3 bulan (DMPA)',             'Kontrasepsi',           'Injeksi suspensi',      '150 mg/mL',                      'vial',   'IM',              'keras', 10),
    ('Suntik KB 1 bulan',                    'Kontrasepsi',           'Injeksi',               null,                             'vial',   'IM',              'keras', 10),
    ('Kondom',                               'Kontrasepsi',           'Alat',                  null,                             'pcs',    null,              'alkes', 20),
    ('Ringer laktat',                        'Cairan/Infus',          'Cairan infus',          '500 mL',                         'botol',  'IV',              'keras', 5),
    ('NaCl 0,9%',                            'Cairan/Infus',          'Cairan infus',          '500 mL',                         'botol',  'IV',              'keras', 5),
    ('Vitamin B kompleks',                   'Vitamin & Mineral',     'Tablet',                null,                             'tablet', 'Oral',            null,    20)
  ) as e (generic_name, category, dosage_form, strength, unit, route, drug_class, min_stock)
  join public.medicine_categories c on c.practice_id is null and c.name = e.category
  where not exists (
    select 1 from public.medicines m
    where m.practice_id = v_practice and lower(m.generic_name) = lower(e.generic_name)
  );

  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

revoke all on function public.add_example_medicines() from public, anon;
grant execute on function public.add_example_medicines() to authenticated;

-- ---------------------------------------------------------------------------
-- Audit log for important changes
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  practice_id uuid, -- no foreign key: the log outlives deleted rows
  table_name  text not null,
  record_id   uuid,
  action      text not null check (action in ('insert', 'update', 'delete')),
  changed_by  uuid,
  changed_at  timestamptz not null default now(),
  old_data    jsonb,
  new_data    jsonb
);

create index audit_log_practice_date_idx on public.audit_log (practice_id, changed_at desc);

alter table public.audit_log enable row level security;

create policy "Admins read the audit log" on public.audit_log
  for select to authenticated
  using (practice_id in (select private.my_admin_practices()));

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
begin
  -- Skip updates that only touched updated_at.
  if tg_op = 'UPDATE' and (v_old - 'updated_at') = (v_new - 'updated_at') then
    return null;
  end if;
  insert into public.audit_log (practice_id, table_name, record_id, action, changed_by, old_data, new_data)
  values ((v_row ->> 'practice_id')::uuid, tg_table_name,
          coalesce(v_row ->> 'id', v_row ->> 'user_id')::uuid,
          lower(tg_op), (select auth.uid()), v_old, v_new);
  return null;
end;
$$;

create trigger medicines_audit after insert or update or delete on public.medicines
  for each row execute function private.write_audit_log();
create trigger medicine_batches_audit after insert or update or delete on public.medicine_batches
  for each row execute function private.write_audit_log();
create trigger suppliers_audit after insert or update or delete on public.suppliers
  for each row execute function private.write_audit_log();
create trigger prescriptions_audit after insert or update or delete on public.prescriptions
  for each row execute function private.write_audit_log();
create trigger practice_members_audit after insert or update or delete on public.practice_members
  for each row execute function private.write_audit_log();
