export default {
  main: {
    list: 'Liste',
    settings: 'Paramètres',
    gettingLocation: 'Récupération de la position…',
    nextRefresh: '↻ {n}s',
    locateMe: 'Me localiser',
    locating: 'Localisation…',
  },
  install: {
    title: 'Installer l’app',
    subtitle: 'Accès instantané depuis votre écran d’accueil',
    install: 'Installer',
    later: 'Plus tard',
    androidHint: 'Appuyez sur ⋮ puis « Ajouter à l’écran d’accueil »',
    iosHint:
      'Sur iOS, utilisez le bouton de partage de votre navigateur puis « Ajouter à l’écran d’accueil »',
  },
  onboardingModal: {
    title: 'Bienvenue sur Bike Tracker',
    subtitle: 'Tous les opérateurs parisiens sur une seule carte en temps réel.',
    tip1: 'La carte affiche tous les véhicules Lime, Voi, Dott et Vélib disponibles, mis à jour en temps réel.',
    tip2: 'Appuyez sur \u00ab\u00a0Me localiser\u00a0\u00bb pour centrer la carte sur votre position et afficher les distances.',
    tip3: 'Appuyez sur un marqueur pour voir la batterie, la distance et les détails du véhicule.',
    tip4: 'Utilisez Paramètres pour filtrer par opérateur, niveau de batterie ou distance à pied.',
    cta: 'C\u2019est parti !',
    close: 'Fermer',
  },
  onboarding: {
    title: 'Bike Tracker',
    subtitle:
      'Tous les opérateurs parisiens sur une seule carte — Lime, Voi, Dott et Vélib en temps réel.',
    useGps: 'Utiliser ma position GPS',
    or: 'ou entrer manuellement',
    supportedFormats: 'Formats supportés',
  },
  bikeList: {
    title: 'Véhicules',
    provider: 'Opérateur',
    vehicle: 'Véhicule',
    battery: 'Batt./Nb vélos',
    distance: 'Dist.',
    noVehicles: 'Aucun véhicule à proximité',
  },
  bikeMap: {
    me: 'Moi',
    num_bikes_available: '{n} vélo disponible | {n} vélos disponibles',
    mechanical: '{n} mécanique | {n} mécaniques',
    ebike: '{n} électrique | {n} électriques',
  },
  footer: {
    legal: 'Mentions légales & CGU',
    privacy: 'Politique de confidentialité',
  },
  legal: {
    back: 'Retour',
  },
  legalNotice: {
    title: 'Mentions Légales & CGU',
    updatedAt: 'Dernière mise à jour : {date}',
    s1: {
      title: "1. Éditeur de l'application",
      publishedBy: 'La présente application est éditée par :',
      nameLabel: 'Prénom / Nom :',
      emailLabel: 'E-mail :',
    },
    s2: {
      title: '2. Hébergement',
      hostedBy: "L'application est hébergée par :",
    },
    s3: {
      title: '3. Objet et nature du service',
      content:
        'Bike Tracker est une application web gratuite et non commerciale permettant de visualiser, en temps réel, la disponibilité de véhicules de mobilité douce (vélos, trottinettes électriques) et de stations de vélos en libre-service, à partir de flux de données publics au format GBFS.',
    },
    s4: {
      title: "4. Service fourni \u00ab en l'état \u00bb (As Is)",
      intro:
        "L'application est mise à disposition {asIs}, sans garantie d'aucune sorte, expresse ou implicite, notamment sans garantie de :",
      asIs: "\u00ab en l'état \u00bb",
      bullets:
        "\u2014 disponibilité continue ou d'absence d'interruption du service ;\n\u2014 exactitude, complétude ou mise à jour des informations affichées ;\n\u2014 adéquation à un usage particulier.",
      closing:
        "L'éditeur se réserve le droit de suspendre, modifier ou interrompre définitivement le service, à tout moment et sans préavis, sans que cela ne puisse donner lieu à une quelconque indemnisation.",
    },
    s5: {
      title: '5. Décharge de responsabilité sur les données tierces',
      intro:
        'Les données de disponibilité des véhicules et des stations (nombre de vélos, de trottinettes, de places libres, niveaux de batterie\u2026) sont récupérées en temps réel auprès de {thirdParty} via des flux GBFS (General Bikeshare Feed Specification) publics, notamment ceux mis à disposition par les opérateurs Lime, Voi, Dott et Vélib Métropole.',
      thirdParty: 'sources tierces',
      content:
        "Ces données sont la propriété exclusive de leurs émetteurs respectifs. L'éditeur de Bike Tracker n'exerce aucun contrôle sur leur exactitude, leur exhaustivité, leur fraîcheur ni leur disponibilité. En conséquence, l'éditeur ne saurait être tenu responsable de tout préjudice, direct ou indirect, résultant de l'utilisation ou de l'impossibilité d'utiliser ces données, ou de toute décision prise sur leur fondement (ex. : trajet inutile).",
    },
    s6: {
      title: '6. Utilisation non commerciale et informative',
      intro:
        "Bike Tracker est destiné à un usage {strictlyPersonal}. Toute exploitation commerciale, redistribution ou intégration dans un produit ou service commercial est interdite sans accord écrit préalable de l'éditeur.",
      strictlyPersonal: 'strictement personnel, non commercial et informatif',
      content:
        "Les noms et marques des opérateurs mentionnés (Lime, Voi, Dott, Vélib, etc.) sont la propriété exclusive de leurs détenteurs respectifs. Leur mention dans l'application est purement informative et ne constitue en aucun cas un partenariat, une affiliation ou une approbation de la part desdits opérateurs.",
    },
    s7: {
      title: '7. Propriété intellectuelle',
      content:
        "Le code source de l'application est la propriété de l'éditeur. Les tuiles cartographiques utilisées sont fournies par des services tiers (OpenStreetMap / CARTO, Esri) sous leurs licences respectives.",
    },
    s8: {
      title: '8. Droit applicable et juridiction',
      content:
        'Les présentes mentions légales sont régies par le droit français. En cas de litige, et à défaut de règlement amiable, les tribunaux français compétents seront seuls habilités à connaître du différend.',
    },
  },
  privacy: {
    title: 'Politique de Confidentialité',
    updatedAt: 'Dernière mise à jour : {date}',
    s1: {
      title: '1. Principe général',
      content:
        "Bike Tracker est conçu dans le respect de la vie privée de ses utilisateurs. L'application ne collecte aucune donnée personnelle identifiable. Aucun compte utilisateur n'est requis pour utiliser le service.",
    },
    s2: {
      title: '2. Géolocalisation',
      intro:
        "L'application peut demander l'accès à la géolocalisation de votre appareil, uniquement si vous l'autorisez explicitement. Cette donnée sert {solelyToCentre}.",
      solelyToCentre: 'exclusivement à centrer la carte sur votre position',
      p2: "Le traitement de votre position géographique s'effectue à {locally}, directement dans votre navigateur. Vos coordonnées GPS ne sont {neverSent}, ni stockées à distance, ni transmises à un tiers.",
      locally: '100\u00a0% en local',
      neverSent: 'jamais envoyées à un serveur',
    },
    s3: {
      title: '3. Données stockées localement',
      intro:
        "Certaines préférences (langue d'affichage, filtres de recherche, position saisie manuellement, thème clair/sombre) peuvent être sauvegardées dans le {localStorage} (localStorage) de votre navigateur afin d'améliorer votre expérience.",
      localStorage: 'stockage local',
      content:
        'Ces données restent exclusivement sur votre appareil. Vous pouvez les supprimer à tout moment en vidant les données de site de votre navigateur.',
    },
    s4: {
      title: '4. Cookies et traceurs',
      intro:
        "L'application {noCookies} (Google Analytics, Matomo, Facebook Pixel, etc.). Aucun outil de mesure d'audience n'est intégré dans Bike Tracker.",
      noCookies: "n'utilise aucun cookie publicitaire ou de suivi",
    },
    s5: {
      title: '5. Services et API tiers',
      gbfsLabel: 'Données de mobilité (GBFS) :',
      gbfsContent:
        "votre navigateur ne contacte jamais directement les API des opérateurs (Lime, Voi, Dott, Vélib). Les requêtes transitent par un serveur proxy dédié à l'application. Ce serveur ne transmet aucune donnée personnelle aux opérateurs.",
      mapLabel: 'Tuiles cartographiques :',
      mapContent:
        "la carte utilise des tuiles fournies par des services tiers (OpenStreetMap / CARTO, Esri). Lors du chargement de la carte, votre navigateur se connecte à leurs serveurs CDN. Ces services peuvent enregistrer des métadonnées techniques (adresse IP, horodatage) conformément à leurs propres politiques de confidentialité. Bike Tracker n'a aucun contrôle sur ces traitements.",
    },
    s6: {
      title: '6. Sécurité',
      content:
        "Aucune clé d'API privée n'est exposée côté client. Les communications entre votre navigateur et le serveur proxy de l'application sont sécurisées.",
    },
    s7: {
      title: '7. Vos droits (RGPD)',
      content:
        "Du fait de l'absence de collecte de données personnelles, l'application ne traite aucune donnée vous concernant au sens du RGPD. Toutefois, pour toute question relative à la vie privée, vous pouvez contacter l'éditeur à l'adresse\u00a0: {email}",
    },
  },
  geo: {
    enterManually: 'Définir manuellement',
    cancel: 'Annuler',
    placeholder: '48.8566, 2.3522 ou lien Google Maps…',
    cannotParse: 'Impossible de lire cette position',
    confirm: 'Valider',
    helperText: 'Collez des coordonnées (48.8566, 2.3522) ou un lien Google Maps.',
  },
  settings: {
    title: 'Paramètres',
    providers: 'Opérateurs',
    filters: 'Filtres',
    maxDistance: 'Distance max',
    noLimit: 'Sans limite',
    walkMin: '{n} min à pied',
    minBattery: 'Batterie min',
    anyBattery: 'Peu importe',
    resetDefaults: 'Réinitialiser',
    copyLink: 'Copier le lien',
    linkCopied: '✓ Lien copié !',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    language: 'Langue',
    location: 'Localisation',
  },
} as const;
