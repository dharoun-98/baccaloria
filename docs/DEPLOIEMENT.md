# Déploiement sur Vercel

Guide pas à pas. Environ 10 minutes, aucune ligne de commande.

---

## 1. Importer le dépôt

1. Va sur [vercel.com](https://vercel.com) et connecte-toi **avec GitHub**.
2. **Add New… → Project**.
3. Choisis le dépôt `dharoun-98/baccaloria` → **Import**.

Vercel reconnaît Next.js tout seul. Ne touche pas aux réglages de build.

---

## 2. Variables d'environnement

Avant de cliquer sur **Deploy**, déplie **Environment Variables**.

Le champ accepte un fichier `.env` collé d'un bloc : ouvre ton `.env.local`,
copie tout, et colle-le ici. Vercel découpe les lignes automatiquement.

**⚠️ Change ensuite une seule ligne :**

```
NEXT_PUBLIC_SITE_URL=https://TON-PROJET.vercel.app
```

Sur ta machine cette variable vaut `http://localhost:3000`. En production, elle
doit valoir l'URL réelle du site — c'est elle qui construit les liens envoyés
dans les e-mails de confirmation. Si tu l'oublies, chaque nouvel élève recevra
un lien qui pointe vers `localhost` et ne pourra jamais activer son compte.

Vérifie que ces cinq variables sont présentes :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique, filtrée par les policies RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Contourne toute la sécurité. Serveur uniquement |
| `NEXT_PUBLIC_SITE_URL` | URL de production |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro affiché sur la page d'abonnement |

Puis **Deploy**.

---

## 3. Prévenir Supabase de la nouvelle adresse

**C'est l'étape qu'on oublie, et sans elle la connexion casse en production.**

Supabase refuse de rediriger vers une adresse qu'il ne connaît pas. Tant que
seul `localhost` est déclaré, les liens de confirmation échouent.

Dans le dashboard Supabase → **Authentication → URL Configuration** :

- **Site URL** : `https://TON-PROJET.vercel.app`
- **Redirect URLs** — ajoute ces trois lignes :

```
https://TON-PROJET.vercel.app/**
https://*-dharoun-98s-projects.vercel.app/**
http://localhost:3000/**
```

La deuxième couvre les déploiements de prévisualisation que Vercel crée à
chaque branche. La troisième garde le développement local fonctionnel.

---

## 4. Les e-mails : à régler avant d'ouvrir aux élèves

Par défaut Supabase envoie les e-mails de confirmation via son serveur mutualisé,
**limité à quelques envois par heure** et souvent classé en spam.

C'est suffisant pour tester. Ça ne l'est pas le jour où trente élèves
s'inscrivent le même soir : la plupart ne recevront jamais rien.

Avant l'ouverture, configure un vrai service d'envoi dans
**Authentication → Emails → SMTP Settings** ([Resend](https://resend.com) ou
[Postmark](https://postmarkapp.com) font l'affaire, offre gratuite suffisante au
départ), et traduis les modèles d'e-mails en français — ils sont en anglais par
défaut.

---

## Ensuite : chaque `git push` redéploie

Une fois le dépôt connecté, Vercel redéploie automatiquement à chaque envoi sur
`main`. Les branches obtiennent une URL de prévisualisation séparée.

---

## À faire avant l'ouverture au public

- [ ] Supprimer le compte de test `test.eleve@baccaloria.local`
      (Supabase → Authentication → Users)
- [ ] Vérifier les coefficients (`coefficient_verified = false` partout)
- [ ] Confirmer les dates d'examen publiées par le Ministère
- [ ] Fixer les tarifs réels dans la table `plans`
- [ ] Renseigner les coordonnées bancaires et le numéro WhatsApp
- [ ] Configurer le SMTP et traduire les modèles d'e-mails
- [ ] Rédiger CGU, CGV et politique de confidentialité
- [ ] Déclaration CNDP (loi 09-08) — le public est majoritairement mineur
- [ ] Brancher un nom de domaine propre
