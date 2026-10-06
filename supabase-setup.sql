-- 1) Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  category text not null default 'Crochet',
  description text,
  price numeric not null default 0,
  image text,
  stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists images text[] not null default '{}';

-- 2) Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text,
  notes text,
  total numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- 3) Order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_name text not null,
  quantity integer not null default 1,
  price numeric not null default 0,
  created_at timestamptz not null default now()
);

-- 4) Enable RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 5) Policies (dashboard admin only)
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  using (true);

drop policy if exists "Authenticated users can manage products" on public.products;
create policy "Authenticated users can manage products"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read orders" on public.orders;
create policy "Authenticated users can read orders"
  on public.orders for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert orders" on public.orders;
create policy "Authenticated users can insert orders"
  on public.orders for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update orders" on public.orders;
create policy "Authenticated users can update orders"
  on public.orders for update
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage order items" on public.order_items;
create policy "Authenticated users can manage order items"
  on public.order_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Store order line items with the order so the storefront and dashboard share one record.
alter table public.orders
  add column if not exists items jsonb not null default '[]'::jsonb;

drop policy if exists "Public can submit orders" on public.orders;
create policy "Public can submit orders"
  on public.orders for insert
  to anon
  with check (
    char_length(trim(customer_name)) > 0
    and total >= 0
    and jsonb_typeof(items) = 'array'
  );
drop policy if exists "Authenticated users can delete orders" on public.orders;
create policy "Authenticated users can delete orders"
  on public.orders for delete
  to authenticated
  using (auth.role() = 'authenticated');
grant insert on public.orders to anon;
grant select, update, delete on public.orders to authenticated;

create table if not exists public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  category text,
  size text,
  colors text,
  deadline text,
  details text,
  reference_image text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'shipped', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.custom_orders enable row level security;
drop policy if exists "Public can submit custom orders" on public.custom_orders;
create policy "Public can submit custom orders"
  on public.custom_orders for insert
  to anon
  with check (char_length(trim(name)) > 0 and char_length(trim(phone)) > 0 and status = 'pending');
drop policy if exists "Authenticated users can manage custom orders" on public.custom_orders;
create policy "Authenticated users can manage custom orders"
  on public.custom_orders for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
grant insert on public.custom_orders to anon;
grant select, update, delete on public.custom_orders to authenticated;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating smallint not null check (rating between 1 and 5),
  text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
drop policy if exists "Public can submit reviews" on public.reviews;
create policy "Public can submit reviews"
  on public.reviews for insert
  to anon
  with check (char_length(trim(name)) > 0 and char_length(trim(text)) > 0 and rating between 1 and 5 and status = 'pending');
drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
  on public.reviews for select
  to anon
  using (status = 'approved');
drop policy if exists "Authenticated users can manage reviews" on public.reviews;
create policy "Authenticated users can manage reviews"
  on public.reviews for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
grant insert, select on public.reviews to anon;
grant select, update, delete on public.reviews to authenticated;

create or replace function public.get_customer_order(p_order_id uuid, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  matched_order public.orders%rowtype;
begin
  select * into matched_order
  from public.orders
  where id = p_order_id
    and char_length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) >= 8
    and regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', matched_order.id,
    'customer_name', matched_order.customer_name,
    'items', matched_order.items,
    'total', matched_order.total,
    'status', matched_order.status,
    'created_at', matched_order.created_at,
    'notes', matched_order.notes
  );
end;
$$;

create or replace function public.cancel_customer_order(p_order_id uuid, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_status text;
begin
  if char_length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) < 8 then
    return null;
  end if;

  update public.orders
  set status = 'cancelled'
  where id = p_order_id
    and status = 'pending'
    and regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
  returning status into matched_status;

  if found then
    return jsonb_build_object('cancelled', true, 'status', matched_status);
  end if;

  select status into matched_status
  from public.orders
  where id = p_order_id
    and regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');

  if not found then
    return null;
  end if;

  return jsonb_build_object('cancelled', false, 'status', matched_status);
end;
$$;

revoke all on function public.get_customer_order(uuid, text) from public;
revoke all on function public.cancel_customer_order(uuid, text) from public;
grant execute on function public.get_customer_order(uuid, text) to anon, authenticated;
grant execute on function public.cancel_customer_order(uuid, text) to anon, authenticated;

-- Optional: example product seed
insert into public.products (name, name_ar, category, description, price, image, stock)
values
  ('Crochet Flower Bag', 'حقيبة كروشيه بزهرة', 'Crochet', 'Soft and unique handmade crochet bag.', 650, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 8),
  ('Beaded Lolly Bag', 'شنطة خرز لولي', 'Beadwork', 'Colorful handcrafted beadwork bag.', 180, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80', 12),
  ('Crochet Medallion', 'ميدالية كروشيه', 'Keychains', 'Handmade keychain with a cozy crochet finish.', 150, 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', 25)
on conflict do nothing;

notify pgrst, 'reload schema';
