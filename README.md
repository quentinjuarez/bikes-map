# Bikes Map

Carte temps réel des vélos et trottinettes disponibles près de vous.
Supporte **Lime**, **Voi**, **Dott** et les stations **Vélib Métropole** (Paris).

## Fonctionnalités

- 🗺️ Carte interactive avec filtre par opérateur
- 🔋 Niveau de batterie, autonomie estimée, type de véhicule
- 🚶 Distance à pied + temps de marche estimé
- 📍 Géolocalisation GPS ou saisie manuelle (coordonnées, lien Google Maps)
- 🌙 Thème clair / sombre
- 🌐 Interface en français et en anglais
- 📱 Progressive Web App (installable, fonctionne offline)

## Architecture

Application **Nuxt 4** unique (SSR désactivé, SPA client), déployée sur **Vercel**.

```
app/      → front Vue 3 + Tailwind CSS v4 + Pinia + vue-i18n + Leaflet (PWA)
server/   → routes API Nitro – agrègent les flux GBFS et les données Vélib
```

Le front et l'API partagent la même origine : plus de restrictions CORS, et le
cache Nitro (`defineCachedEventHandler`) remplace Redis.
**Aucune donnée utilisateur n'est collectée ni stockée côté serveur.**

## Développement

```
yarn install
yarn dev        # http://localhost:3000
yarn test       # vitest
yarn lint       # oxlint
yarn build      # build Vercel
```

## Sources de données

- [Lime GBFS](https://data.lime.bike/api/partners/v2/gbfs/paris)
- [Voi GBFS](https://api.voiapp.io/gbfs/)
- [Dott GBFS](https://gbfs.api.ridedott.com/public/v2/paris)
- [Vélib Métropole Open Data](https://velib-metropole-opendata.smovengo.cloud/)

## Licence

Usage personnel et non commercial uniquement.
Les marques Lime, Voi, Dott et Vélib sont la propriété de leurs détenteurs respectifs.
