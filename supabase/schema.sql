-- Recipe Compiler schema
-- Run this in the Supabase SQL Editor to set up the database.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('main', 'dessert')),
  image text not null default '',
  source_type text not null check (source_type in ('link', 'photo', 'social')),
  source_value text not null default '',
  servings integer not null default 4,
  prep_time integer not null default 0,
  cook_time integer not null default 0,
  health_rating integer not null default 3 check (health_rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  name text not null,
  quantity numeric not null default 0,
  unit text not null default 'piece',
  cost numeric not null default 0,
  position integer not null default 0
);

create table if not exists public.instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  step_number integer not null default 0,
  text text not null
);

create index if not exists ingredients_recipe_id_idx on public.ingredients (recipe_id);
create index if not exists instructions_recipe_id_idx on public.instructions (recipe_id);

-- ============================================================
-- Row Level Security (permissive — personal/family app, no auth)
-- ============================================================

alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.instructions enable row level security;

drop policy if exists "recipes_select" on public.recipes;
drop policy if exists "recipes_insert" on public.recipes;
drop policy if exists "recipes_update" on public.recipes;
drop policy if exists "recipes_delete" on public.recipes;
create policy "recipes_select" on public.recipes for select using (true);
create policy "recipes_insert" on public.recipes for insert with check (true);
create policy "recipes_update" on public.recipes for update using (true);
create policy "recipes_delete" on public.recipes for delete using (true);

drop policy if exists "ingredients_select" on public.ingredients;
drop policy if exists "ingredients_insert" on public.ingredients;
drop policy if exists "ingredients_update" on public.ingredients;
drop policy if exists "ingredients_delete" on public.ingredients;
create policy "ingredients_select" on public.ingredients for select using (true);
create policy "ingredients_insert" on public.ingredients for insert with check (true);
create policy "ingredients_update" on public.ingredients for update using (true);
create policy "ingredients_delete" on public.ingredients for delete using (true);

drop policy if exists "instructions_select" on public.instructions;
drop policy if exists "instructions_insert" on public.instructions;
drop policy if exists "instructions_update" on public.instructions;
drop policy if exists "instructions_delete" on public.instructions;
create policy "instructions_select" on public.instructions for select using (true);
create policy "instructions_insert" on public.instructions for insert with check (true);
create policy "instructions_update" on public.instructions for update using (true);
create policy "instructions_delete" on public.instructions for delete using (true);

-- ============================================================
-- Seed data (the 4 original sample recipes)
-- ============================================================

insert into public.recipes (id, title, category, image, source_type, source_value, servings, prep_time, cook_time, health_rating)
values
  ('00000000-0000-0000-0000-000000000001', 'Chocolate Chip Cookies', 'dessert', '/next.svg', 'link', 'https://example.com/chocolate-chip-cookies', 24, 15, 12, 3),
  ('00000000-0000-0000-0000-000000000002', 'Banana Bread', 'dessert', '/file.svg', 'photo', 'Imported photo', 10, 15, 60, 4),
  ('00000000-0000-0000-0000-000000000003', 'Spaghetti Bolognese', 'main', '/globe.svg', 'link', 'https://example.com/spaghetti-bolognese', 4, 10, 30, 3),
  ('00000000-0000-0000-0000-000000000004', 'Grilled Chicken Salad', 'main', '/window.svg', 'photo', 'Imported photo', 2, 15, 10, 5)
on conflict (id) do nothing;

insert into public.ingredients (recipe_id, name, quantity, unit, cost, position) values
  -- Chocolate Chip Cookies
  ('00000000-0000-0000-0000-000000000001', 'All-purpose flour', 280, 'g', 0.6, 0),
  ('00000000-0000-0000-0000-000000000001', 'Butter', 226, 'g', 2.5, 1),
  ('00000000-0000-0000-0000-000000000001', 'Brown sugar', 200, 'g', 0.8, 2),
  ('00000000-0000-0000-0000-000000000001', 'Granulated sugar', 100, 'g', 0.4, 3),
  ('00000000-0000-0000-0000-000000000001', 'Eggs', 2, 'piece', 0.5, 4),
  ('00000000-0000-0000-0000-000000000001', 'Vanilla extract', 1, 'tsp', 0.3, 5),
  ('00000000-0000-0000-0000-000000000001', 'Baking soda', 1, 'tsp', 0.1, 6),
  ('00000000-0000-0000-0000-000000000001', 'Salt', 0.5, 'tsp', 0.05, 7),
  ('00000000-0000-0000-0000-000000000001', 'Chocolate chips', 340, 'g', 3.0, 8),
  -- Banana Bread
  ('00000000-0000-0000-0000-000000000002', 'Ripe bananas', 3, 'piece', 1.2, 0),
  ('00000000-0000-0000-0000-000000000002', 'All-purpose flour', 250, 'g', 0.5, 1),
  ('00000000-0000-0000-0000-000000000002', 'Butter', 113, 'g', 1.3, 2),
  ('00000000-0000-0000-0000-000000000002', 'Sugar', 150, 'g', 0.5, 3),
  ('00000000-0000-0000-0000-000000000002', 'Eggs', 2, 'piece', 0.5, 4),
  ('00000000-0000-0000-0000-000000000002', 'Baking soda', 1, 'tsp', 0.1, 5),
  ('00000000-0000-0000-0000-000000000002', 'Salt', 0.5, 'tsp', 0.05, 6),
  -- Spaghetti Bolognese
  ('00000000-0000-0000-0000-000000000003', 'Spaghetti', 400, 'g', 1.5, 0),
  ('00000000-0000-0000-0000-000000000003', 'Ground beef', 500, 'g', 6.0, 1),
  ('00000000-0000-0000-0000-000000000003', 'Onion', 1, 'piece', 0.4, 2),
  ('00000000-0000-0000-0000-000000000003', 'Garlic', 2, 'clove', 0.2, 3),
  ('00000000-0000-0000-0000-000000000003', 'Canned tomatoes', 400, 'g', 1.2, 4),
  ('00000000-0000-0000-0000-000000000003', 'Tomato paste', 2, 'tbsp', 0.3, 5),
  ('00000000-0000-0000-0000-000000000003', 'Olive oil', 2, 'tbsp', 0.4, 6),
  ('00000000-0000-0000-0000-000000000003', 'Dried oregano', 1, 'tsp', 0.1, 7),
  ('00000000-0000-0000-0000-000000000003', 'Salt', 1, 'tsp', 0.05, 8),
  ('00000000-0000-0000-0000-000000000003', 'Black pepper', 0.5, 'tsp', 0.05, 9),
  -- Grilled Chicken Salad
  ('00000000-0000-0000-0000-000000000004', 'Chicken breast', 300, 'g', 3.5, 0),
  ('00000000-0000-0000-0000-000000000004', 'Mixed greens', 150, 'g', 2.0, 1),
  ('00000000-0000-0000-0000-000000000004', 'Cherry tomatoes', 150, 'g', 1.5, 2),
  ('00000000-0000-0000-0000-000000000004', 'Cucumber', 1, 'piece', 0.8, 3),
  ('00000000-0000-0000-0000-000000000004', 'Olive oil', 2, 'tbsp', 0.4, 4),
  ('00000000-0000-0000-0000-000000000004', 'Lemon juice', 1, 'tbsp', 0.3, 5),
  ('00000000-0000-0000-0000-000000000004', 'Salt', 0.5, 'tsp', 0.05, 6),
  ('00000000-0000-0000-0000-000000000004', 'Black pepper', 0.25, 'tsp', 0.03, 7);

insert into public.instructions (recipe_id, step_number, text) values
  -- Chocolate Chip Cookies
  ('00000000-0000-0000-0000-000000000001', 1, 'Preheat oven to 180°C (350°F).'),
  ('00000000-0000-0000-0000-000000000001', 2, 'Cream butter and sugars until light and fluffy.'),
  ('00000000-0000-0000-0000-000000000001', 3, 'Add eggs and vanilla, mix well.'),
  ('00000000-0000-0000-0000-000000000001', 4, 'Whisk flour, baking soda, and salt; fold into wet mixture.'),
  ('00000000-0000-0000-0000-000000000001', 5, 'Stir in chocolate chips.'),
  ('00000000-0000-0000-0000-000000000001', 6, 'Scoop onto baking sheets and bake 10-12 minutes.'),
  -- Banana Bread
  ('00000000-0000-0000-0000-000000000002', 1, 'Preheat oven to 175°C (350°F).'),
  ('00000000-0000-0000-0000-000000000002', 2, 'Mash bananas; mix with melted butter.'),
  ('00000000-0000-0000-0000-000000000002', 3, 'Stir in sugar, egg, and vanilla.'),
  ('00000000-0000-0000-0000-000000000002', 4, 'Fold in flour, baking soda, and salt.'),
  ('00000000-0000-0000-0000-000000000002', 5, 'Pour into a loaf pan and bake 50-60 minutes.'),
  -- Spaghetti Bolognese
  ('00000000-0000-0000-0000-000000000003', 1, 'Cook spaghetti according to package directions.'),
  ('00000000-0000-0000-0000-000000000003', 2, 'Sauté onion and garlic in olive oil.'),
  ('00000000-0000-0000-0000-000000000003', 3, 'Add ground beef and brown.'),
  ('00000000-0000-0000-0000-000000000003', 4, 'Stir in tomatoes, paste, and oregano; simmer 20 minutes.'),
  ('00000000-0000-0000-0000-000000000003', 5, 'Season and serve over spaghetti.'),
  -- Grilled Chicken Salad
  ('00000000-0000-0000-0000-000000000004', 1, 'Season chicken and grill until cooked through.'),
  ('00000000-0000-0000-0000-000000000004', 2, 'Slice chicken and set aside.'),
  ('00000000-0000-0000-0000-000000000004', 3, 'Toss greens, tomatoes, and cucumber in a bowl.'),
  ('00000000-0000-0000-0000-000000000004', 4, 'Whisk olive oil, lemon juice, salt, and pepper for dressing.'),
  ('00000000-0000-0000-0000-000000000004', 5, 'Top salad with chicken and drizzle with dressing.');