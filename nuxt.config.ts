import tailwindcss from '@tailwindcss/vite';

const SITE_URL = 'https://bikes.quentinjuarez.dev';
const TITLE = 'Bike Tracker – Tous les vélos de Paris';
const DESCRIPTION =
  'Lime, Voi, Dott et Vélib réunis sur une seule carte en temps réel. Trouvez le vélo le plus proche en quelques secondes, où que vous soyez à Paris.';
const OG_TITLE = 'Bike Tracker – Tous les vélos de Paris sur une seule carte';
const OG_DESCRIPTION =
  'Lime, Voi, Dott et Vélib réunis en temps réel. Plus besoin de jongler entre 4 applis — trouvez le vélo le plus proche en quelques secondes.';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['WebApplication', 'MobileApplication'],
      '@id': `${SITE_URL}/#app`,
      name: 'Bike Tracker',
      alternateName: 'Bike Tracker Paris',
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
        geo: { '@type': 'GeoCoordinates', latitude: 48.8566, longitude: 2.3522 },
      },
      author: { '@type': 'Person', name: 'Quentin Juarez', url: 'https://www.quentinjuarez.dev' },
    },
  ],
};

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  // Map + geolocation + localStorage + persisted Pinia are all client-only.
  ssr: false,

  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],

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
        { name: 'theme-color', content: '#a78bfa' },
        { name: 'author', content: 'Quentin Juarez' },
        // Geo targeting
        { name: 'geo.region', content: 'FR-75' },
        { name: 'geo.placename', content: 'Paris, Île-de-France, France' },
        { name: 'geo.position', content: '48.8566;2.3522' },
        { name: 'ICBM', content: '48.8566, 2.3522' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Bike Tracker' },
        { property: 'og:title', content: OG_TITLE },
        { property: 'og:description', content: OG_DESCRIPTION },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:locale:alternate', content: 'en_GB' },
        // Twitter
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:creator', content: '@quentinjuarez' },
        { name: 'twitter:title', content: OG_TITLE },
        { name: 'twitter:description', content: OG_DESCRIPTION },
        // iOS PWA
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Bike Tracker' },
        { name: 'msapplication-square70x70logo', content: 'bike-70.png' },
      ],
      link: [
        { rel: 'canonical', href: SITE_URL },
        { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
        { rel: 'me', href: 'https://www.quentinjuarez.dev' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/bike-16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/bike-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '72x72', href: '/bike-72.png' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/bike-96.png' },
        { rel: 'apple-touch-icon', type: 'image/png', sizes: '57x57', href: '/bike-57.png' },
        { rel: 'apple-touch-icon', type: 'image/png', sizes: '60x60', href: '/bike-60.png' },
        { rel: 'apple-touch-icon', type: 'image/png', sizes: '72x72', href: '/bike-72.png' },
        { rel: 'apple-touch-icon', type: 'image/png', sizes: '76x76', href: '/bike-76.png' },
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
  },

  nitro: {
    preset: 'vercel',
  },

  devtools: { enabled: true },

  compatibilityDate: '2026-04-13',
});
