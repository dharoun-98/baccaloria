-- ============================================================================
-- 0012_tag_catalogue.sql
-- A curated list of tags, grouped by category.
--
-- Free text was the wrong call. Typed by hand across hundreds of lessons and
-- several people, "démonstration" / "demonstration" / "démo" become three
-- different tags, the filter silently splits, and the feature stops being
-- useful exactly when the library is big enough to need it.
--
-- Picking from a list keeps the vocabulary shared. Creating a new tag stays
-- possible but becomes a deliberate act rather than a typo.
--
-- Editorial only: never shown to students. RLS restricts it to staff.
-- ============================================================================

create table public.tag_catalogue (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (public.is_slug(slug)),
  label_fr       text not null,
  category       text not null check (category in (
                   'relecture', 'pedagogie', 'examen', 'adaptation', 'autre'
                 )),
  description_fr text,
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index on public.tag_catalogue (category, sort_order);

alter table public.tag_catalogue enable row level security;

-- Students have no business reading the editorial vocabulary.
create policy "staff read tags" on public.tag_catalogue
  for select using (public.is_staff());

create policy "staff manage tags" on public.tag_catalogue
  for all using (public.is_staff()) with check (public.is_staff());

comment on table public.tag_catalogue is
  'Curated editorial tags for the admin panel. Categories: relecture, pedagogie, examen, adaptation, autre.';

-- ------------------------------------------------------------ starter set --
insert into public.tag_catalogue (slug, label_fr, category, description_fr, sort_order) values
  -- Relecture: where a lesson stands in the review pipeline
  ('a-relire',          'À relire',            'relecture', 'Brouillon en attente de relecture par un enseignant.', 1),
  ('relu',              'Relu',                'relecture', 'Contenu vérifié par un enseignant de la matière.', 2),
  ('a-corriger',        'À corriger',          'relecture', 'Erreur repérée, correction à faire avant publication.', 3),
  ('formules-a-verifier','Formules à vérifier','relecture', 'Les formules ou notations doivent être recontrôlées.', 4),
  ('pret-a-publier',    'Prêt à publier',      'relecture', 'Relu et validé, il ne manque plus que la publication.', 5),

  -- Pédagogie: what kind of content this is
  ('demonstration',     'Démonstration',       'pedagogie', 'Contient une démonstration rigoureuse.', 10),
  ('methode',           'Méthode',             'pedagogie', 'Marche à suivre pour un type d''exercice.', 11),
  ('exercice-type',     'Exercice type',       'pedagogie', 'Modèle d''exercice qui revient régulièrement.', 12),
  ('rappel',            'Rappel',              'pedagogie', 'Reprend une notion des années précédentes.', 13),
  ('approfondissement', 'Approfondissement',   'pedagogie', 'Va au-delà du programme officiel.', 14),
  ('erreurs-frequentes','Erreurs fréquentes',  'pedagogie', 'Insiste sur les fautes qui coûtent des points.', 15),

  -- Examen: how it relates to the national exam
  ('tombe-souvent',     'Tombe souvent',       'examen',    'Apparaît dans la plupart des sessions.', 20),
  ('piege-classique',   'Piège classique',     'examen',    'Contient un piège récurrent du barème.', 21),
  ('gros-coefficient',  'Gros coefficient',    'examen',    'Chapitre lourd dans la note finale.', 22),
  ('rattrapage',        'Session de rattrapage','examen',   'Spécifique à la session de rattrapage.', 23),

  -- Adaptation: how it travels between filières
  ('commun-filieres',   'Commun à toutes les filières', 'adaptation', 'Identique partout — à placer, pas à dupliquer.', 30),
  ('adapte-de-pc',      'Adapté de PC',        'adaptation', 'Réécrit à partir de la version Sciences Physiques.', 31),
  ('specifique-se',     'Spécifique SE',       'adaptation', 'Propre aux Sciences Économiques.', 32),
  ('specifique-sgc',    'Spécifique SGC',      'adaptation', 'Propre aux Sciences de Gestion Comptable.', 33),
  ('hors-programme-se', 'Hors programme SE/SGC','adaptation','N''existe pas au programme d''économie.', 34)
on conflict (slug) do nothing;
