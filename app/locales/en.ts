export default {
  main: {
    list: 'List',
    settings: 'Settings',
    gettingLocation: 'Getting your location',
    nextRefresh: 'Next refresh in {n}s',
    locateMe: 'Locate me',
    locating: 'Locating',
  },
  providerChips: {
    show: 'Show {name}',
    hide: 'Hide {name}',
  },
  install: {
    title: 'Install the app',
    subtitle: 'Instant access from your home screen',
    install: 'Install',
    later: 'Later',
    iosHint: 'Tap the Share button then "Add to Home Screen"',
    androidHint: 'Tap \u22ee then "Add to Home Screen"',
  },
  onboardingModal: {
    title: 'Welcome to Bikes Map',
    subtitle: 'All Paris bike operators on one live map.',
    tip1: 'The map shows all available Lime, Voi, Dott and Vélib vehicles updated in real time.',
    tip2: 'Tap the \u201cLocate me\u201d button to centre the map on your current position and get distances.',
    tip3: 'Tap any marker to see battery %, distance, and vehicle details.',
    tip4: 'Use Settings to filter by operator, battery level, or walking distance.',
    cta: 'Got it!',
    close: 'Close',
  },
  onboarding: {
    title: 'Bikes Map',
    subtitle: 'Every Paris bike operator on one map: Lime, Voi, Dott and Vélib in real time.',
    useGps: 'Use my GPS location',
    or: 'or enter manually',
    supportedFormats: 'Supported formats',
  },
  bikeList: {
    title: 'Vehicles',
    provider: 'Provider',
    vehicle: 'Vehicle',
    battery: 'Batt./Nb bikes',
    distance: 'Dist.',
    noVehicles: 'No vehicles nearby',
  },
  bikeMap: {
    me: 'Me',
    num_bikes_available: '{n} bike available | {n} bikes available',
    mechanical: '{n} mechanical | {n} mechanicals',
    ebike: '{n} electric | {n} electrics',
    routeSummary: '{min} min walk ({dist})',
    routeError: 'Could not find a route',
    locateFirst: 'Set your location to see the route',
  },
  footer: {
    legal: 'Legal Notice & ToS',
    privacy: 'Privacy Policy',
  },
  legal: {
    back: 'Back',
  },
  legalNotice: {
    title: 'Legal Notice & Terms of Use',
    updatedAt: 'Last updated: {date}',
    s1: {
      title: '1. Publisher',
      publishedBy: 'This application is published by:',
      nameLabel: 'Name:',
      emailLabel: 'Email:',
    },
    s2: {
      title: '2. Hosting',
      hostedBy: 'The application is hosted by:',
    },
    s3: {
      title: '3. Purpose of the Service',
      content:
        'Bikes Map is a free, non-commercial web application that provides real-time visibility of available micro-mobility vehicles (bikes, electric scooters) and docking stations, sourced from public GBFS data feeds.',
    },
    s4: {
      title: '4. Service Provided \u201cAs Is\u201d',
      intro:
        'The application is provided {asIs}, without warranty of any kind, express or implied, including but not limited to warranties of continuous availability, uninterrupted access, accuracy of displayed data, or fitness for a particular purpose.',
      asIs: '\u201cas is\u201d',
      bullets: '',
      closing:
        'The publisher reserves the right to suspend, modify, or permanently discontinue the service at any time and without notice, without giving rise to any compensation.',
    },
    s5: {
      title: '5. Disclaimer on Third-Party Data',
      intro:
        'Vehicle and station availability data (number of bikes, scooters, docks, battery levels, etc.) is retrieved in real time from {thirdParty} via public GBFS (General Bikeshare Feed Specification) feeds provided by operators such as Lime, Voi, Dott and V\u00e9lib M\u00e9tropole.',
      thirdParty: 'third-party sources',
      content:
        'This data is the exclusive property of its respective providers. The publisher of Bikes Map has no control over its accuracy, completeness, freshness, or availability. Accordingly, the publisher shall not be liable for any direct or indirect loss arising from the use of, or inability to use, this data, or any decision made based on it (e.g. a wasted journey).',
    },
    s6: {
      title: '6. Non-Commercial and Informational Use',
      intro:
        'Bikes Map is intended for {strictlyPersonal}. Any commercial exploitation, redistribution, or integration into a commercial product or service is prohibited without prior written consent from the publisher.',
      strictlyPersonal: 'strictly personal, non-commercial and informational use only',
      content:
        'The names and trademarks of operators mentioned (Lime, Voi, Dott, V\u00e9lib, etc.) are the exclusive property of their respective owners. Their mention in the application is purely informational and does not constitute a partnership, affiliation, or endorsement by those operators.',
    },
    s7: {
      title: '7. Intellectual Property',
      content:
        "The application's source code is the property of the publisher. Map tiles are provided by third-party services (OpenStreetMap / CARTO, Esri) under their respective licenses.",
    },
    s8: {
      title: '8. Governing Law and Jurisdiction',
      content:
        'These legal notices are governed by French law. In the event of a dispute, and failing an amicable settlement, the competent French courts shall have sole jurisdiction.',
    },
  },
  privacy: {
    title: 'Privacy Policy',
    updatedAt: 'Last updated: {date}',
    s1: {
      title: '1. General Principle',
      content:
        'Bikes Map is designed with user privacy in mind. The application does not collect any personally identifiable data. No user account is required to use the service.',
    },
    s2: {
      title: '2. Geolocation',
      intro:
        "The application may request access to your device's location, only if you explicitly grant permission. This data is used {solelyToCentre}.",
      solelyToCentre: 'solely to centre the map on your position',
      p2: 'Your geographic location is processed {locally}, directly in your browser. Your GPS coordinates are {neverSent}, stored remotely, or shared, except when you request a walking route (see section 5).',
      locally: '100% locally',
      neverSent: 'not sent to a server',
    },
    s3: {
      title: '3. Locally Stored Data',
      intro:
        "Some preferences (display language, search filters, manually entered position, light/dark theme) may be saved in your browser's {localStorage} to improve your experience.",
      localStorage: 'local storage',
      content:
        "This data stays exclusively on your device. You can delete it at any time by clearing your browser's site data.",
    },
    s4: {
      title: '4. Cookies and Trackers',
      intro:
        'The application {noCookies} (Google Analytics, Matomo, Facebook Pixel, etc.). No audience measurement tool is integrated into Bikes Map.',
      noCookies: 'does not use any advertising or tracking cookies',
    },
    s5: {
      title: '5. Third-Party Services and APIs',
      gbfsLabel: 'Mobility data (GBFS):',
      gbfsContent:
        'your browser never contacts operator APIs (Lime, Voi, Dott, V\u00e9lib) directly. Requests are routed through a dedicated server-side proxy. This proxy does not transmit any personal data to operators.',
      mapLabel: 'Map tiles:',
      mapContent:
        'the map uses tiles provided by third-party services (OpenStreetMap / CARTO, Esri). When loading the map, your browser connects to their CDN servers. These services may log technical metadata (IP address, timestamp) in accordance with their own privacy policies. Bikes Map has no control over these processes.',
      routeLabel: 'Walking routes:',
      routeContent:
        'when you tap a vehicle to display the walking route, your position and the vehicle location are sent through the proxy to a routing service to compute the path. Nothing else is shared, and routes are cached without identifying you.',
    },
    s6: {
      title: '6. Security',
      content:
        "No private API keys are exposed client-side. Communications between your browser and the application's proxy server are secured.",
    },
    s7: {
      title: '7. Your Rights (GDPR)',
      content:
        'Because the application does not collect any personal data, no data about you is processed within the meaning of the GDPR. However, for any privacy-related question, you may contact the publisher at: {email}',
    },
  },
  geo: {
    searchPlaceholder: 'Search an address or place',
    noResults: 'No results',
    enterManually: 'Set location manually',
    cancel: 'Cancel',
    placeholder: '48.8566, 2.3522 or Google Maps link',
    cannotParse: 'Could not recognise this location',
    confirm: 'Set',
    helperText: 'Paste coordinates (48.8566, 2.3522), a decimal pair or a Google Maps link.',
  },
  settings: {
    title: 'Settings',
    providers: 'Providers',
    filters: 'Filters',
    maxDistance: 'Max distance',
    noLimit: 'No limit',
    walkMin: '{n} min walk',
    minBattery: 'Min battery',
    anyBattery: 'Any',
    resetDefaults: 'Reset to defaults',
    copyLink: 'Copy settings as link',
    linkCopied: 'Link copied',
    lightMode: 'Switch to light mode',
    darkMode: 'Switch to dark mode',
    language: 'Language',
    location: 'Location',
    noLocation: 'No location set',
    done: 'Done',
  },
} as const;
