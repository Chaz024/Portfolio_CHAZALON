# Portfolio « La monographie » — Hugo Chazalon

Site statique Astro : portfolio scientifique (mécanique des fluides numérique, ENSEEIHT MF2E).
Design « monographie suisse » : papier `#FAFAF7`, encre `#0A0A0A`, accent orange international `#FF4F00`,
typographie Archivo / Source Serif 4 / JetBrains Mono. Zéro template, zéro Tailwind.

## Commandes

```sh
npm install        # une fois (Node ≥ 22.12)
npm run dev        # http://localhost:4321
npm run build      # sortie statique dans dist/
npm test           # tests vitest (math de la tuyère)
```

## Où éditer quoi

| Quoi | Où |
|---|---|
| Email / LinkedIn / CV | `src/data/contact.ts` (mettre l'URL LinkedIn et `cvPath: '/cv-hugo-chazalon.pdf'` + déposer le PDF dans `public/`) |
| Texte des études | `src/content/etudes/*.mdx` — remplir les sections `{/* À rédiger */}` (l'étude 01 `aeroacoustique-lbm.mdx` sert de modèle) |
| Figures (« planches ») | frontmatter `plates:` de chaque étude — **uniquement là** (jamais de `<Plate>` en ligne dans le texte, sinon doublons), numéros uniques par page |
| Profil / parcours | `src/pages/profil.astro` |
| Tokens design | `src/styles/global.css` (`:root`) |

## Produire des planches depuis un rapport PDF

```sh
# 1. Rendre les pages en PNG pour choisir les figures
python scripts/extract_pages.py public/pdf/<slug>.pdf <slug>
#    → regarder _staging/<slug>/page-NN.png

# 2. Déclarer les recadrages dans scripts/plates-manifest.json
#    {slug, pdf, page (1-based), rect [x0,y0,x1,y1] en points PDF ou null, out, caption, alt}

# 3. Générer les WebP
python scripts/make_plates.py <slug>
#    → public/plates/<slug>/*.webp, puis les déclarer dans le frontmatter plates: de l'étude
```

(Dépendances : `python -m pip install --user pymupdf pillow`.)

## Ajouter une étude

Copier un `.mdx` existant dans `src/content/etudes/`, incrémenter `num` (et adapter le `max` du schéma
dans `src/content.config.ts` ainsi que les « /14 » de `src/pages/etudes/[slug].astro` et l'accueil).

## Déployer sur GitHub Pages (gratuit)

1. Créer un repo GitHub public, pousser ce dossier (`git remote add origin … && git push -u origin main`).
2. Dans le repo GitHub : **Settings → Pages → Source : GitHub Actions**.
3. **Settings → Secrets and variables → Actions → Variables** : créer
   `SITE_URL = https://<user>.github.io` et `BASE_PATH = /<nom-du-repo>`.
4. Le workflow `.github/workflows/deploy.yml` construit et publie à chaque push sur `main`.
5. Mettre à jour `public/robots.txt` avec l'URL réelle du sitemap.

> **Note Windows/Git Bash** : pour tester un build avec base path en local, Git Bash convertit
> `/portfolio` en chemin Windows (`C:/Program Files/Git/portfolio`) et casse le build. Préfixer :
> `MSYS2_ENV_CONV_EXCL="BASE_PATH" SITE_URL=… BASE_PATH=/portfolio npm run build`.
> Sur GitHub Actions (Linux), aucun souci.
