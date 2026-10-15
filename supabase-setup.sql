-- À coller UNE FOIS dans Supabase : SQL Editor > New query > Run

create table if not exists public.produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prix numeric(8,2),                 -- vide = "prix sur demande"
  description text not null default '',
  image_url text not null default '',
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.produits enable row level security;

create policy "Lecture publique" on public.produits for select using (true);
create policy "Ajout connecte" on public.produits for insert to authenticated with check (true);
create policy "Modification connecte" on public.produits for update to authenticated using (true) with check (true);
create policy "Suppression connecte" on public.produits for delete to authenticated using (true);

-- Dossier de photos (public en lecture)
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;

create policy "Photos ajout connecte" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "Photos modif connecte" on storage.objects for update to authenticated using (bucket_id = 'photos');
create policy "Photos suppression connecte" on storage.objects for delete to authenticated using (bucket_id = 'photos');

-- Produits de départ
insert into public.produits (nom, prix, description, ordre) values
 ('Léon l''ourson', 14, 'Petit ourson au crochet, tout doux, fait main avec amour.', 1),
 ('Suspensions d''Halloween', 8, 'Suspensions décoratives au crochet pour une déco d''Halloween originale.', 2),
 ('Cadeau de naissance', null, 'Un cadeau unique et personnalisé pour accueillir bébé. Prix sur demande.', 3);

-- ===== Ajout : catégories (à exécuter une fois, pour les sites déjà installés) =====
alter table public.produits add column if not exists categorie text not null default '';

-- ===== Ajout : poids en grammes (calcul de la livraison) =====
alter table public.produits add column if not exists poids int not null default 0;

-- ===== Ajout : photos et textes des 6 univers de l'accueil =====
create table if not exists public.univers (
  id text primary key,
  texte text not null default '',
  image_url text not null default ''
);
alter table public.univers enable row level security;
create policy "Univers lecture publique" on public.univers for select using (true);
create policy "Univers ajout connecte" on public.univers for insert to authenticated with check (true);
create policy "Univers modif connecte" on public.univers for update to authenticated using (true) with check (true);
insert into public.univers (id) values ('bebes'),('enfants'),('adultes'),('maison'),('fleurs'),('deco') on conflict (id) do nothing;

-- ===== Ajout : titres modifiables des 6 catégories =====
alter table public.univers add column if not exists titre text not null default '';

-- ===== Ajout : variantes (couleurs) d'un produit =====
alter table public.produits add column if not exists variantes jsonb not null default '[]'::jsonb;
