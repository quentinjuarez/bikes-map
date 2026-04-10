<template>
  <div class="w-full relative" style="height: 100vh">
    <l-map
      v-if="ready"
      :zoom="INIT_ZOOM"
      :center="initCenter"
      :min-zoom="16"
      :max-zoom="18"
      :use-global-leaflet="false"
      style="width: 100%; height: 100%"
      @ready="onMapReady"
    >
      <l-tile-layer
        :key="tileUrl"
        :url="tileUrl"
        :attribution="tileAttribution"
        layer-type="base"
      />

      <!-- User position: single vue-leaflet marker, no perf impact -->
      <l-marker
        v-if="props.userLat != null && props.userLng != null"
        :lat-lng="[props.userLat, props.userLng]"
        :icon="userMarkerIcon"
      >
        <l-tooltip
          :options="{ permanent: false, sticky: true, interactive: false }"
        >
          {{ t('bikeMap.me') }}
        </l-tooltip>
      </l-marker>
    </l-map>

    <div
      class="absolute bottom-4 left-4 text-accent-600 dark:text-accent-400 text-xs px-3 py-2 rounded-xl z-1000 space-y-1 bg-accent-500/5 dark:bg-black/10 backdrop-blur-sm shadow-sm"
    >
      <div class="flex items-center gap-2">
        <span
          class="w-3 h-3 rounded-full bg-accent-500 dark:bg-accent-400 inline-block"
        ></span>
        {{ t('bikeMap.me') }}
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full inline-block bg-lime-brand"></span>
        Lime
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full inline-block bg-voi-brand"></span>
        Voi
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full inline-block bg-dott-brand"></span>
        Dott
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full inline-block bg-velib-brand"></span>
        Vélib
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import L from 'leaflet';
import { LMap, LTileLayer, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  Bike,
  VelibStation,
  MapEntity,
  Provider,
} from '../composables/useBikes';
import { useTheme } from '../composables/useTheme';

const props = defineProps<{
  bikes: MapEntity[];
  userLat?: number;
  userLng?: number;
}>();

const { theme } = useTheme();
const { t } = useI18n();

// ── Tile config ─────────────────────────────────────────────────────

const TILE_DARK =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LIGHT =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
const tileUrl = computed(() =>
  theme.value === 'light' ? TILE_LIGHT : TILE_DARK,
);
const tileAttribution = computed(() =>
  theme.value === 'light'
    ? 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    : '&copy; OpenStreetMap &copy; CARTO',
);

// ── Map initialisation ───────────────────────────────────────────────

const PARIS_LAT = 48.8566;
const PARIS_LNG = 2.3522;
const INIT_ZOOM = 16;
const initCenter: [number, number] = [PARIS_LAT, PARIS_LNG];

const ready = ref(false);

// Plain (non-reactive) Leaflet references — never wrap Leaflet objects in Vue reactive
let leafletMap: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;
let boundsTimer: ReturnType<typeof setTimeout> | null = null;

// Reactive bounds: plain serialisable data, safe to be reactive
const mapBounds = ref<{ n: number; s: number; e: number; w: number } | null>(
  null,
);

// Diff tracking — plain Map, not reactive
const activeMarkers = new Map<
  string,
  { marker: L.Marker; entity: MapEntity }
>();

onMounted(() => {
  nextTick(() => {
    ready.value = true;
  });
});

onUnmounted(() => {
  if (boundsTimer) clearTimeout(boundsTimer);
  activeMarkers.clear();
  markersLayer?.clearLayers();
});

function refreshBounds(map: L.Map) {
  const b = map.getBounds().pad(0.05);
  mapBounds.value = {
    n: b.getNorth(),
    s: b.getSouth(),
    e: b.getEast(),
    w: b.getWest(),
  };
}

function onMapReady(map: L.Map) {
  leafletMap = map;
  markersLayer = L.layerGroup().addTo(map);

  refreshBounds(map);

  map.on('zoomend', () => refreshBounds(map));

  map.on('moveend', () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      refreshBounds(map);
      boundsTimer = null;
    }, 120);
  });
}

// Fly to user position whenever it is set or updated
// Also pre-seed mapBounds immediately so displayEntities shows bikes
// around the new position before the flyTo animation completes.
const Z16_PAD_LAT = 0.018; // ~2 km — covers any z16 viewport
const Z16_PAD_LNG = 0.022;

watch(
  () => [props.userLat, props.userLng] as const,
  ([lat, lng], [prevLat, prevLng]) => {
    if (lat == null || lng == null) return;
    if (lat === prevLat && lng === prevLng) return;
    // Pre-set bounds so displayEntities includes bikes near new position
    mapBounds.value = {
      n: lat + Z16_PAD_LAT,
      s: lat - Z16_PAD_LAT,
      e: lng + Z16_PAD_LNG,
      w: lng - Z16_PAD_LNG,
    };
    if (leafletMap) {
      leafletMap.flyTo([lat, lng], 16, { duration: 1.2 });
    }
  },
);

// ── Bounds-filtered entities ─────────────────────────────────────────

function entityKey(e: MapEntity): string {
  return e.kind === 'bike'
    ? `b-${e.provider}-${e.bike_id}`
    : `s-${e.station_id}`;
}

function entitiesEqual(a: MapEntity, b: MapEntity): boolean {
  if (a.lat !== b.lat || a.lon !== b.lon) return false;
  if (a.kind === 'bike' && b.kind === 'bike')
    return a.battery_percent === b.battery_percent;
  if (a.kind === 'station' && b.kind === 'station')
    return (
      a.num_bikes_available === b.num_bikes_available &&
      a.ebike === b.ebike &&
      a.mechanical === b.mechanical
    );
  return true;
}

const displayEntities = computed<MapEntity[]>(() => {
  if (!mapBounds.value) return [];
  const { n, s, e, w } = mapBounds.value;
  return props.bikes.filter(
    (b) => b.lat >= s && b.lat <= n && b.lon >= w && b.lon <= e,
  );
});

// ── Icons ────────────────────────────────────────────────────────────

const PROVIDER_HEX: Record<Provider, string> = {
  lime: 'var(--color-lime-brand)',
  voi: 'var(--color-voi-brand)',
  dott: 'var(--color-dott-brand)',
  velib: 'var(--color-velib-brand)',
};

function createCircularIcon(options: {
  color: string;
  isDark: boolean;
  size: number;
  radius: number;
  strokeWidth: number;
  percent: number | null;
  text?: string;
  innerCircleRadius?: number;
  opacity?: number;
  animate?: boolean;
}): L.Icon {
  const {
    color,
    isDark,
    size,
    radius: R,
    strokeWidth: SW,
    percent,
    text,
    innerCircleRadius,
    opacity = 1,
    animate = false,
  } = options;

  const CX = size / 2;
  const C = 2 * Math.PI * R;

  const bgFill = isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
  const trackStroke = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)';

  let arcSvg = '';
  if (percent != null) {
    const dash = percent * C;
    arcSvg = `
      <circle cx="${CX}" cy="${CX}" r="${R}" fill="none"
        stroke="${trackStroke}" stroke-width="${SW}"/>
      <circle cx="${CX}" cy="${CX}" r="${R}" fill="none"
        stroke="${color}" stroke-width="${SW}"
        stroke-dasharray="${dash} ${C}"
        stroke-linecap="round"
        transform="rotate(-90 ${CX} ${CX})"/>`;
  } else {
    arcSvg = `<circle cx="${CX}" cy="${CX}" r="${R}" fill="none"
      stroke="${color}" stroke-width="${SW}" opacity="0.5"/>`;
  }

  let centerElement = '';
  if (innerCircleRadius !== undefined) {
    centerElement += `<circle cx="${CX}" cy="${CX}" r="${innerCircleRadius}" fill="${color}"/>`;
  }
  if (text !== undefined) {
    const fontSize = text.length > 2 ? 10 : 12;
    const yOffset = CX + fontSize * 0.35;
    centerElement += `<text x="${CX}" y="${yOffset}" text-anchor="middle"
      font-size="${fontSize}" font-weight="700" fill="#ffffff"
      font-family="system-ui, sans-serif">${text}</text>`;
  }

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" opacity="${opacity}">
    <circle cx="${CX}" cy="${CX}" r="${R + SW / 2}" fill="${bgFill}"/>
    ${arcSvg}
    ${centerElement}
  </svg>`;

  return L.divIcon({
    html: svg,
    className: animate ? 'mk-in' : '',
    iconSize: [size, size],
    iconAnchor: [CX, CX],
  }) as unknown as L.Icon;
}

function bikeIcon(bike: Bike, isDark: boolean, animate = false): L.Icon {
  return createCircularIcon({
    color: PROVIDER_HEX[bike.provider],
    isDark,
    size: 26,
    radius: 10,
    strokeWidth: 3,
    percent: bike.battery_percent != null ? bike.battery_percent / 100 : null,
    innerCircleRadius: 5.5,
    animate,
  });
}

function stationIcon(
  station: VelibStation,
  isDark: boolean,
  animate = false,
): L.Icon {
  const count = station.num_bikes_available;
  const eBikes = station.ebike || 0;
  const mechBikes = station.mechanical || 0;
  const total = eBikes + mechBikes;
  const percent = total > 0 ? eBikes / total : 0;
  const opacity = station.is_renting === 0 || count === 0 ? 0.45 : 1;

  return createCircularIcon({
    color: PROVIDER_HEX.velib,
    isDark,
    size: 34,
    radius: 14,
    strokeWidth: 3.5,
    percent,
    text: count.toString(),
    innerCircleRadius: 9.5,
    opacity,
    animate,
  });
}

const userMarkerIcon = computed(() =>
  createCircularIcon({
    color: 'var(--color-accent)',
    isDark: theme.value === 'dark',
    size: 26,
    radius: 10,
    strokeWidth: 3,
    percent: 100,
    innerCircleRadius: 5.5,
  }),
);

// ── Tooltip HTML ─────────────────────────────────────────────────────

function formatDistance(m?: number) {
  if (m == null) return '-';
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(2)}km`;
}

function tooltipHtml(entity: MapEntity): string {
  if (entity.kind === 'bike') {
    const batt =
      entity.battery_percent != null ? `<br>${entity.battery_percent}%` : '';
    return `<strong class="uppercase">${entity.provider}</strong><br>${formatDistance(entity.distance)}${batt}`;
  }
  return [
    '<strong>Vélib</strong>',
    t('bikeMap.num_bikes_available', entity.num_bikes_available),
    t('bikeMap.mechanical', entity.mechanical),
    t('bikeMap.ebike', entity.ebike),
    formatDistance(entity.distance),
  ].join('<br>');
}

// ── Diff-based marker rendering ──────────────────────────────────────
// Only adds/removes/updates markers that actually changed.
// Stable markers never get destroyed → no flicker during pan/zoom.

watch(displayEntities, (entities) => {
  if (!markersLayer) return;
  const isDark = theme.value === 'dark';

  // Build the desired set
  const nextMap = new Map<string, MapEntity>();
  for (const e of entities) nextMap.set(entityKey(e), e);

  // Remove markers that left the viewport
  for (const [key, { marker }] of activeMarkers) {
    if (!nextMap.has(key)) {
      markersLayer.removeLayer(marker);
      activeMarkers.delete(key);
    }
  }

  // Add new / update changed markers
  for (const [key, entity] of nextMap) {
    const existing = activeMarkers.get(key);

    if (!existing) {
      // New marker in viewport — fade in via className animation
      const icon =
        entity.kind === 'bike'
          ? bikeIcon(entity, isDark, true)
          : stationIcon(entity, isDark, true);
      const marker = L.marker([entity.lat, entity.lon], { icon }).bindTooltip(
        tooltipHtml(entity),
        { sticky: true, interactive: false },
      );
      markersLayer.addLayer(marker);
      activeMarkers.set(key, { marker, entity });
    } else if (!entitiesEqual(existing.entity, entity)) {
      // Data changed — update in place without destroying the marker
      if (
        existing.entity.lat !== entity.lat ||
        existing.entity.lon !== entity.lon
      ) {
        existing.marker.setLatLng([entity.lat, entity.lon]);
      }
      existing.marker.setIcon(
        entity.kind === 'bike'
          ? bikeIcon(entity, isDark)
          : stationIcon(entity, isDark),
      );
      existing.marker.setTooltipContent(tooltipHtml(entity));
      activeMarkers.set(key, { marker: existing.marker, entity });
    }
  }
});

// Theme change: re-render icons in place (no add/remove)
watch(
  () => theme.value,
  () => {
    const isDark = theme.value === 'dark';
    for (const [, { marker, entity }] of activeMarkers) {
      marker.setIcon(
        entity.kind === 'bike'
          ? bikeIcon(entity, isDark)
          : stationIcon(entity, isDark),
      );
    }
  },
);
</script>

<style scoped>
/* Marker enter animation on the Leaflet-managed container.
   Opacity only — no transform to avoid conflicting with Leaflet positioning. */
:deep(.leaflet-marker-icon.mk-in) {
  animation: mkIn 0.18s ease-out forwards;
}
@keyframes mkIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Leaflet zoom controls */
:deep(.leaflet-control-zoom) {
  border: 1px solid var(--leaflet-ctrl-border) !important;
  border-radius: 10px !important;
  overflow: hidden;
  background: transparent !important;
}

:deep(.leaflet-control-zoom a) {
  background: var(--leaflet-ctrl-bg) !important;
  color: var(--leaflet-ctrl-color) !important;
  border-color: var(--leaflet-ctrl-border) !important;
  font-family: system-ui, sans-serif !important;
  font-size: 16px !important;
  width: 32px !important;
  height: 32px !important;
  line-height: 32px !important;
  backdrop-filter: blur(8px);
  transition:
    background 0.15s,
    color 0.15s;
}

:deep(.leaflet-control-zoom a:hover) {
  background: var(--leaflet-ctrl-hover) !important;
  color: var(--color-accent) !important;
}

:deep(.leaflet-control-zoom a.leaflet-disabled) {
  color: var(--leaflet-ctrl-disabled) !important;
  opacity: 0.6;
}

/* Attribution */
:deep(.leaflet-control-attribution) {
  background: var(--leaflet-attr-bg) !important;
  color: var(--leaflet-attr-color) !important;
  font-family: system-ui, sans-serif !important;
  font-size: 9px !important;
  padding: 2px 8px !important;
  border-radius: 4px 0 0 0 !important;
  backdrop-filter: blur(8px);
}

:deep(.leaflet-control-attribution a),
:deep(.leaflet-control-attribution span) {
  display: none !important;
}

/* Tooltip */
:deep(.leaflet-tooltip) {
  background: var(--leaflet-tip-bg) !important;
  border: 1px solid var(--leaflet-tip-border) !important;
  color: var(--leaflet-tip-color) !important;
  font-family: system-ui, sans-serif !important;
  font-size: 11px !important;
  border-radius: 8px !important;
  padding: 6px 10px !important;
  box-shadow: 0 4px 16px var(--leaflet-tip-shadow) !important;
}

:deep(.leaflet-tooltip-top::before) {
  border-top-color: var(--leaflet-tip-arrow) !important;
}
:deep(.leaflet-tooltip-bottom::before) {
  border-bottom-color: var(--leaflet-tip-arrow) !important;
}
:deep(.leaflet-tooltip-left::before) {
  border-left-color: var(--leaflet-tip-arrow) !important;
}
:deep(.leaflet-tooltip-right::before) {
  border-right-color: var(--leaflet-tip-arrow) !important;
}
</style>
