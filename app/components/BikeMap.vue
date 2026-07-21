<template>
  <div class="relative w-full" style="height: 100vh">
    <l-map
      v-if="ready"
      :zoom="INIT_ZOOM"
      :center="initCenter"
      :min-zoom="13"
      :max-zoom="19"
      :use-global-leaflet="true"
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
        <l-tooltip :options="{ permanent: false, sticky: true, interactive: false }">
          {{ t('bikeMap.me') }}
        </l-tooltip>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup lang="ts">
import { LMap, LTileLayer, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';

// Share one Leaflet instance: vue-leaflet reads window.L (use-global-leaflet),
// and our markers + the markercluster plugin use the same L. Without this Vite
// loads Leaflet twice and cross-instance Bounds/Point objects throw.
if (import.meta.client) {
  (window as unknown as { L: typeof L }).L = L;
}
import type { Bike, VelibStation, MapEntity, Provider } from '../composables/useBikes';
import { following } from '../composables/useGeolocation';
import { theme } from '../composables/useTheme';

const props = defineProps<{
  bikes: MapEntity[];
  userLat?: number;
  userLng?: number;
}>();

const { t } = useI18n();

// ── Tile config ─────────────────────────────────────────────────────

const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const tileUrl = computed(() => (theme.value === 'light' ? TILE_LIGHT : TILE_DARK));
const tileAttribution = '&copy; OpenStreetMap &copy; CARTO';

// ── Map initialisation ───────────────────────────────────────────────

const PARIS_LAT = 48.8566;
const PARIS_LNG = 2.3522;
const INIT_ZOOM = 16;
// Must be a ref (not a plain const) so Vue's compiler sees :center as dynamic
// and doesn't hoist the <l-map> vnode — hoisted vnodes can't carry internal refs
// (vue-leaflet uses refs internally on child nodes, causing the "hoisted vnode" warning).
const initCenter = ref<[number, number]>([PARIS_LAT, PARIS_LNG]);

const ready = ref(false);

// Plain (non-reactive) Leaflet references — never wrap Leaflet objects in Vue reactive
let leafletMap: L.Map | null = null;
let markersLayer: L.MarkerClusterGroup | null = null;
let boundsTimer: ReturnType<typeof setTimeout> | null = null;

// Reactive bounds: plain serialisable data, safe to be reactive
const mapBounds = ref<{ n: number; s: number; e: number; w: number } | null>(null);

// Diff tracking — plain Map, not reactive
const activeMarkers = new Map<string, { marker: L.Marker; entity: MapEntity }>();

// Cluster group: groups nearby vehicles so the dense z16 view stays readable and
// light. Options favor render performance (chunked adds, off-screen culling).
function createMarkerGroup(): L.MarkerClusterGroup {
  return L.markerClusterGroup({
    // Fewer, cleaner clusters when zoomed out (large radius groups more into
    // each bubble); every individual bike shows once zoomed in to 17+.
    maxClusterRadius: 60,
    disableClusteringAtZoom: 17,
    showCoverageOnHover: false,
    // displayEntities already limits markers to the viewport, so let
    // markercluster skip its own zoom animation and off-screen culling. Those
    // race with our moveend-driven diff (throwing in _recursively) and add work
    // we do not need. Disabling them is both robust and faster.
    animate: false,
    removeOutsideVisibleBounds: false,
    iconCreateFunction: (cluster) => {
      const n = cluster.getChildCount();
      const size = n < 10 ? 24 : n < 50 ? 28 : 32;
      return L.divIcon({
        html: `<div class="bike-cluster">${n}</div>`,
        className: 'bike-cluster-wrap',
        iconSize: L.point(size, size),
      });
    },
  });
}

onMounted(() => {
  nextTick(() => {
    ready.value = true;
  });
});

onUnmounted(() => {
  if (boundsTimer) clearTimeout(boundsTimer);
  activeMarkers.clear();
  if (markersLayer && leafletMap) {
    try {
      leafletMap.removeLayer(markersLayer);
    } catch {
      /* already detached */
    }
  }
  markersLayer = null;
  leafletMap = null;
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
  // Move zoom control out from under the provider chips (top-left).
  map.zoomControl?.setPosition('bottomleft');
  // Pause live-follow when the user pans the map themselves (resumed on locate).
  map.on('dragstart', () => {
    following.value = false;
  });
  markersLayer = createMarkerGroup().addTo(map);

  // If position is already known (persisted session), center immediately
  // The watch won't fire in this case since the props didn't change after setup
  if (props.userLat != null && props.userLng != null) {
    map.setView([props.userLat, props.userLng], INIT_ZOOM);
    mapBounds.value = {
      n: props.userLat + Z16_PAD_LAT,
      s: props.userLat - Z16_PAD_LAT,
      e: props.userLng + Z16_PAD_LNG,
      w: props.userLng - Z16_PAD_LNG,
    };
  }

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
    // First fix flies in; subsequent moves gently follow, unless the user
    // has panned away (following = false).
    const isFirst = prevLat == null || prevLng == null;
    if (leafletMap && (isFirst || following.value)) {
      if (isFirst) leafletMap.flyTo([lat, lng], 16, { duration: 1.2 });
      else leafletMap.panTo([lat, lng], { animate: true, duration: 0.5 });
    }
  },
);

// ── Bounds-filtered entities ─────────────────────────────────────────

function entityKey(e: MapEntity): string {
  return e.kind === 'bike' ? `b-${e.provider}-${e.bike_id}` : `s-${e.station_id}`;
}

function entitiesEqual(a: MapEntity, b: MapEntity): boolean {
  if (a.lat !== b.lat || a.lon !== b.lon) return false;
  if (a.kind === 'bike' && b.kind === 'bike') return a.battery_percent === b.battery_percent;
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
  return props.bikes.filter((b) => b.lat >= s && b.lat <= n && b.lon >= w && b.lon <= e);
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

function stationIcon(station: VelibStation, isDark: boolean, animate = false): L.Icon {
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
    const batt = entity.battery_percent != null ? `<br>${entity.battery_percent}%` : '';
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

function buildMarker(entity: MapEntity, isDark: boolean, animate = false): L.Marker {
  const icon =
    entity.kind === 'bike'
      ? bikeIcon(entity, isDark, animate)
      : stationIcon(entity, isDark, animate);
  const marker = L.marker([entity.lat, entity.lon], { icon }).bindTooltip(tooltipHtml(entity), {
    sticky: true,
    interactive: false,
  });
  activeMarkers.set(entityKey(entity), { marker, entity });
  return marker;
}

function rebuildMarkers(entities: MapEntity[], isDark: boolean) {
  if (!leafletMap) return;
  activeMarkers.clear();
  // Abandon the broken group entirely; map.removeLayer(group) removes the
  // container as a unit without iterating children, so it never triggers the
  // _leaflet_events crash that clearLayers() causes with dual instances.
  if (markersLayer) {
    try {
      leafletMap.removeLayer(markersLayer);
    } catch {
      /* ignore detached group */
    }
  }
  markersLayer = createMarkerGroup().addTo(leafletMap);
  // Bulk add so the cluster group indexes everything in one pass.
  markersLayer.addLayers(entities.map((e) => buildMarker(e, isDark, false)));
}

watch(displayEntities, (entities) => {
  if (!markersLayer) return;
  const isDark = theme.value === 'dark';

  // Build the desired set
  const nextMap = new Map<string, MapEntity>();
  for (const e of entities) nextMap.set(entityKey(e), e);

  // Batch removals into a single cluster recompute. If Leaflet throws
  // (dual-instance _leaflet_events bug), nuke the group and rebuild.
  const toRemove: L.Marker[] = [];
  for (const [key, { marker }] of activeMarkers) {
    if (!nextMap.has(key)) {
      toRemove.push(marker);
      activeMarkers.delete(key);
    }
  }
  if (toRemove.length) {
    try {
      markersLayer.removeLayers(toRemove);
    } catch {
      rebuildMarkers(entities, isDark);
      return;
    }
  }

  // Build new markers, update changed ones in place, then bulk-add the new ones.
  const toAdd: L.Marker[] = [];
  for (const [key, entity] of nextMap) {
    const existing = activeMarkers.get(key);

    if (!existing) {
      toAdd.push(buildMarker(entity, isDark, true));
    } else if (!entitiesEqual(existing.entity, entity)) {
      if (existing.entity.lat !== entity.lat || existing.entity.lon !== entity.lon) {
        existing.marker.setLatLng([entity.lat, entity.lon]);
      }
      existing.marker.setIcon(
        entity.kind === 'bike' ? bikeIcon(entity, isDark) : stationIcon(entity, isDark),
      );
      existing.marker.setTooltipContent(tooltipHtml(entity));
      activeMarkers.set(key, { marker: existing.marker, entity });
    }
  }
  if (toAdd.length) markersLayer.addLayers(toAdd);
});

// Theme change: re-render icons in place (no add/remove)
watch(
  () => theme.value,
  () => {
    const isDark = theme.value === 'dark';
    for (const [, { marker, entity }] of activeMarkers) {
      marker.setIcon(
        entity.kind === 'bike' ? bikeIcon(entity, isDark) : stationIcon(entity, isDark),
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

/* Marker clusters */
:deep(.bike-cluster-wrap) {
  background: transparent;
}
:deep(.bike-cluster) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background: var(--color-accent-600);
  color: #fff;
  font:
    700 11px/1 system-ui,
    sans-serif;
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-pop);
}

/* Leaflet zoom controls */
:deep(.leaflet-control-zoom) {
  border: 1px solid var(--leaflet-ctrl-border) !important;
  border-radius: 12px !important;
  overflow: hidden;
  background: transparent !important;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.16) !important;
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
