# Bijdragen aan Korfbal.live

Dit document legt uit hoe je de website lokaal kunt aanpassen en hoe wijzigingen live gaan.

## Vereisten

- **Node.js** (versie uit `.nvmrc`; aan te raden: `nvm use` als je nvm gebruikt)
- **npm** (komt met Node.js)

## Lokaal ontwikkelen

1. **Repository clonen** (als je dat nog niet hebt gedaan):
   ```bash
   git clone <repository-url>
   cd korfbal.live
   ```

2. **Afhankelijkheden installeren**:
   ```bash
   npm install
   ```

3. **Lokale dev-server starten**:
   ```bash
   npm run dev
   ```
   De site draait dan op `http://localhost:4321`. Wijzigingen in bestanden worden automatisch herladen.

4. **Build lokaal testen** (optioneel):
   ```bash
   npm run build
   npm run preview
   ```
   Zo controleer je of de productie-build goed werkt.

## Belangrijke bestanden en mappen

| Pad | Doel |
|-----|------|
| `src/pages/index.astro` | Hoofdpagina (tekst, logo, beta-note) |
| `src/styles/global.css` | Algemene stijlen |
| `public/images/` | Logo’s en afbeeldingen |
| `astro.config.mjs` | Astro-configuratie (o.a. site URL) |

## Website updaten

- **Tekst of layout aanpassen**: bewerk `src/pages/index.astro` en/of `src/styles/global.css`.
- **Afbeeldingen wijzigen**: vervang of voeg bestanden toe in `public/images/`.
- **Meta/SEO**: titel en beschrijving staan in de `<head>` van `src/pages/index.astro`.

Na je wijzigingen lokaal testen met `npm run dev` en eventueel `npm run build` en `npm run preview`.

## Wijzigingen live zetten (deploy)

De site wordt automatisch gedeployed via **GitHub Actions** wanneer je naar de `main`-branch pusht.

1. **Wijzigingen committen** (volg [Conventional Commits](.cursor/rules/conventional-commits.mdc)):
   ```bash
   git add .
   git commit -m "feat(ui): korte beschrijving van je wijziging"
   ```

2. **Pushen naar `main`**:
   ```bash
   git push origin main
   ```

3. **Deploy volgen**: onder **Actions** in de GitHub-repository zie je de workflow "Deploy Astro site to Pages". Na een geslaagde run staat de nieuwe versie op [www.korfbal.live](https://www.korfbal.live).

Er is geen handmatige deploy of FTP: push naar `main` is voldoende.

## Vragen of problemen?

Neem contact op via [info@korfbal.live](mailto:info@korfbal.live).
