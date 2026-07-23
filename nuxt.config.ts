import tailwindcss from '@tailwindcss/vite';

const SITE_URL = 'https://bikes.quentinjuarez.dev';
const TITLE = 'Bikes Map, tous les vélos de Paris';
const DESCRIPTION =
  'Lime, Voi, Dott et Vélib réunis sur une seule carte en temps réel. Trouvez le vélo le plus proche en quelques secondes, où que vous soyez à Paris.';
const OG_TITLE = 'Bikes Map, tous les vélos de Paris sur une seule carte';
const OG_DESCRIPTION =
  'Lime, Voi, Dott et Vélib réunis en temps réel. Trouvez le vélo le plus proche en quelques secondes, où que vous soyez à Paris.';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['WebApplication', 'MobileApplication'],
      '@id': `${SITE_URL}/#app`,
      name: 'Bikes Map',
      alternateName: 'Bikes Map Paris',
      url: SITE_URL,
      description: DESCRIPTION,
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Transportation',
      operatingSystem: 'Any',
      inLanguage: ['fr', 'en'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      featureList: [
        'Carte en temps réel des vélos Lime, Voi et Dott disponibles',
        'Stations Vélib avec disponibilité des vélos mécaniques et électriques',
        'Filtrage par distance à pied, niveau de batterie et opérateur',
        'Géolocalisation automatique ou saisie manuelle',
        'Application installable sur mobile (PWA)',
      ],
      keywords:
        'vélo Paris, trottinette Paris, Lime Paris, Voi Paris, Dott Paris, Vélib Paris, mobilité douce Paris, GBFS, carte vélos Paris',
      areaServed: {
        '@type': 'City',
        name: 'Paris',
        sameAs: 'https://www.wikidata.org/wiki/Q90',
        containedInPlace: {
          '@type': 'Country',
          name: 'France',
          sameAs: 'https://www.wikidata.org/wiki/Q142',
        },
      },
      spatialCoverage: {
        '@type': 'Place',
        name: 'Paris et sa proche banlieue',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 48.8566,
          longitude: 2.3522,
        },
      },
      author: {
        '@type': 'Person',
        name: 'Quentin Juarez',
        url: 'https://www.quentinjuarez.dev',
      },
    },
  ],
};

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  // Map + geolocation + localStorage + persisted Pinia are all client-only.
  ssr: false,

  // port -> 13000
  devServer: { port: 13000 },

  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],

  // Client-only SPA: persist to localStorage (not the module's default cookies,
  // which ship state to the server every request and dodge the DATA_VERSION wipe).
  piniaPluginPersistedstate: {
    storage: 'localStorage',
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: TITLE,
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
        },
        {
          name: 'google-site-verification',
          content: 'vjm5PjpEsRTIUhFhXebi7HphAzYUoXmllgSwihe46qY',
        },
        { name: 'description', content: DESCRIPTION },
        {
          name: 'keywords',
          content:
            'vélo Paris, trottinette Paris, Lime Paris, Voi Paris, Dott Paris, Vélib Paris, mobilité douce Paris, vélo en libre-service, trottinette électrique Paris, carte vélos Paris',
        },
        { name: 'theme-color', content: '#2563eb' },
        { name: 'author', content: 'Quentin Juarez' },
        // Geo targeting
        { name: 'geo.region', content: 'FR-75' },
        { name: 'geo.placename', content: 'Paris, Île-de-France, France' },
        { name: 'geo.position', content: '48.8566;2.3522' },
        { name: 'ICBM', content: '48.8566, 2.3522' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Bikes Map' },
        { property: 'og:title', content: OG_TITLE },
        { property: 'og:description', content: OG_DESCRIPTION },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:locale:alternate', content: 'en_GB' },
        { property: 'og:image', content: `${SITE_URL}/og.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: OG_TITLE },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:creator', content: '@quentinjuarez' },
        { name: 'twitter:title', content: OG_TITLE },
        { name: 'twitter:description', content: OG_DESCRIPTION },
        { name: 'twitter:image', content: `${SITE_URL}/og.png` },
        // iOS PWA
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
        { name: 'apple-mobile-web-app-title', content: 'Bikes Map' },
      ],
      link: [
        { rel: 'canonical', href: SITE_URL },
        { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
        { rel: 'me', href: 'https://www.quentinjuarez.dev' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
      script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd) }],
    },
  },

  // Same-origin now, so no CORS. Keep the two safe hardening headers the old
  // proxy set; X-Frame-Options is intentionally omitted so /embed can be framed.
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    },
    // Let the CDN serve repeat API hits from the edge (cuts function invocations
    // and upstream load); each route still has its own Nitro cache TTL.
    '/api/**': {
      headers: {
        'cache-control': 's-maxage=30, stale-while-revalidate=60',
      },
    },
  },

  nitro: {
    preset: 'vercel',
  },

  devtools: { enabled: true },

  compatibilityDate: '2026-04-13',
});
