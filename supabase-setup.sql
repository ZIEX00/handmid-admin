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
create policy "Public can read products"
  on public.products for select
  using (true);

create policy "Authenticated users can manage products"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can read orders"
  on public.orders for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert orders"
  on public.orders for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update orders"
  on public.orders for update
  using (auth.role() = 'authenticated');

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

-- Optional: example product seed
insert into public.products (name, name_ar, category, description, price, image, stock)
values
  ('Crochet Flower Bag', 'حقيبة كروشيه بزهرة', 'Crochet', 'Soft and unique handmade crochet bag.', 650, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 8),
  ('Beaded Lolly Bag', 'شنطة خرز لولي', 'Beadwork', 'Colorful handcrafted beadwork bag.', 180, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80', 12),
  ('Crochet Medallion', 'ميدالية كروشيه', 'Keychains', 'Handmade keychain with a cozy crochet finish.', 150, 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', 25)
on conflict do nothing;
