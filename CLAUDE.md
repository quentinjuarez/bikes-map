## Security rules

- NEVER read or process .env files or any file containing credentials
- STOP immediately if you encounter API keys, passwords, or secrets
- Do not access any file excluded by .claudeignore
- If unsure whether a file contains credentials, do not open it — ask

## This repo

Single Nuxt 4 app (SSR disabled, client-only SPA) deployed on Vercel for a bike tracking app. Front is `app/` (Vue 3 + TS + Tailwind v4 + Pinia + vue-i18n + Leaflet, PWA); backend is Nitro server routes under `server/` that proxy and cache the GBFS feeds (Lime, Voi, Dott) and Vélib Métropole open data. Same-origin, so no CORS layer; Nitro cache replaces Redis. Features: real-time bike/scooter map, geolocation, filters, fr/en i18n, light/dark theme, embed view.

## Workflow rules

- Never merge generated code without human review
- Do not make architecture decisions autonomously — present options
- For complex tasks, break into steps and confirm before executing each one
- Do not touch files outside the scope of the task unless explicitly asked
