import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { PROJECTS, TYPE_COLOR, type ProjectGeo, type ProjectRealStatus } from "./projectsData";

interface ProjectFilter {
  types?: ProjectGeo["type"][];
  statuses?: ProjectRealStatus[];
  ids?: string[];
}

interface Props {
  className?: string;
  children?: ReactNode;
  state?: "loading" | "empty" | "error" | "ready";
  selectedYear?: number;
  filter?: ProjectFilter;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  highlightIds?: string[];
  projects?: ProjectGeo[];
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const LABEL_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";
const RU_BOUNDS: [[number, number], [number, number]] = [
  [42, 25],
  [62, 64],
];
const MOSCOW_LATLNG: [number, number] = [55.7558, 37.6173];

let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[data-leaflet]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.setAttribute("data-leaflet", "1");
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-leaflet]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).L));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.async = true;
    s.setAttribute("data-leaflet", "1");
    s.onload = () => resolve((window as any).L);
    s.onerror = () => reject(new Error("leaflet load failed"));
    document.head.appendChild(s);
  });
  return leafletPromise;
}

function geomToLatLngs(geom: [number, number][]): [number, number][] {
  return geom.map(([lon, lat]) => [lat, lon]);
}

interface RouteLayer {
  id: string;
  type: ProjectGeo["type"];
  future: boolean;
  hit: any; // wide invisible polyline for click target
  line: any; // visible polyline
  endpoints: any[];
  label: any | null;
}

export function MapCanvas({
  className,
  children,
  state = "ready",
  selectedYear,
  filter,
  selectedId,
  onSelect,
  highlightIds,
  projects: projectsOverride,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<Map<string, RouteLayer>>(new Map());
  const moscowMarkerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletError, setLeafletError] = useState(false);

  const projects = useMemo(() => {
    let list = projectsOverride ?? PROJECTS;
    if (filter?.ids) list = list.filter((p) => filter.ids!.includes(p.id));
    if (filter?.types?.length)
      list = list.filter((p) => filter.types!.includes(p.type));
    if (filter?.statuses?.length)
      list = list.filter((p) => filter.statuses!.includes(p.realStatus));
    return list;
  }, [filter]);

  const highlightSet = useMemo(
    () => new Set(highlightIds ?? []),
    [highlightIds],
  );
  const hasFocus = selectedId != null || highlightSet.size > 0;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(
      () => {
        if (!cancelled) setLeafletReady(true);
      },
      () => {
        if (!cancelled) setLeafletError(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize map once Leaflet is ready and container is mounted.
  useEffect(() => {
    if (!leafletReady || state !== "ready") return;
    if (mapRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const L = (window as any).L;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      worldCopyJump: false,
      minZoom: 3,
      maxZoom: 9,
    });
    map.fitBounds(RU_BOUNDS, { padding: [16, 16] });
    L.tileLayer(TILE_URL, {
      attribution: "",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Background click clears selection.
    map.on("click", () => {
      onSelectRef.current?.(null);
    });

    // Moscow anchor
    moscowMarkerRef.current = L.circleMarker(MOSCOW_LATLNG, {
      radius: 5,
      color: "#0f1729",
      weight: 2,
      fillColor: "#0f1729",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);
    L.marker(MOSCOW_LATLNG, {
      interactive: false,
      icon: L.divIcon({
        className: "tsvsm-city-label",
        html: '<span style="font:600 11px ui-monospace,Menlo,monospace;color:#0f1729;background:rgba(255,255,255,0.85);padding:1px 4px;border-radius:2px;white-space:nowrap;">Москва</span>',
        iconSize: [0, 0],
        iconAnchor: [-8, -2],
      }),
    }).addTo(map);

    mapRef.current = map;

    requestAnimationFrame(() => map.invalidateSize());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, state]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current.clear();
      }
    };
  }, []);

  // Sync route layers whenever projects / year change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const L = (window as any).L;
    const live = layersRef.current;
    const wantedIds = new Set(projects.map((p) => p.id));

    // Remove stale.
    live.forEach((rec, id) => {
      if (!wantedIds.has(id)) {
        rec.hit && map.removeLayer(rec.hit);
        rec.line && map.removeLayer(rec.line);
        rec.endpoints.forEach((m) => map.removeLayer(m));
        rec.label && map.removeLayer(rec.label);
        live.delete(id);
      }
    });

    // Upsert.
    projects.forEach((p) => {
      const future =
        selectedYear !== undefined && p.commissionYear > selectedYear;
      const latlngs = geomToLatLngs(p.geometry);
      const color = TYPE_COLOR[p.type];

      let rec = live.get(p.id);
      if (rec) {
        // Remove and recreate if future state changed (different style needed).
        if (rec.future !== future) {
          map.removeLayer(rec.hit);
          map.removeLayer(rec.line);
          rec.endpoints.forEach((m) => map.removeLayer(m));
          rec.label && map.removeLayer(rec.label);
          live.delete(p.id);
          rec = undefined;
        } else {
          rec.line.setLatLngs(latlngs);
          rec.hit.setLatLngs(latlngs);
          rec.endpoints[0].setLatLng(latlngs[0]);
          rec.endpoints[1].setLatLng(latlngs[latlngs.length - 1]);
          rec.label && rec.label.setLatLng(latlngs[latlngs.length - 1]);
        }
      }
      if (!rec) {
        const baseStyle: any = {
          color,
          weight: 4,
          opacity: future ? 0.55 : 0.95,
          lineCap: "round",
          lineJoin: "round",
          interactive: true,
        };
        if (future) baseStyle.dashArray = "6 6";
        baseStyle.bubblingMouseEvents = false;
        const line = L.polyline(latlngs, baseStyle).addTo(map);

        // Wide invisible hit-area polyline so clicks are easy.
        const hit = L.polyline(latlngs, {
          color,
          weight: 18,
          opacity: 0,
          interactive: true,
          bubblingMouseEvents: false,
        }).addTo(map);
        const onClick = (e: any) => {
          if (e?.originalEvent) {
            e.originalEvent.stopPropagation();
            if (typeof L.DomEvent?.stopPropagation === "function") {
              L.DomEvent.stopPropagation(e);
            }
          }
          onSelectRef.current?.(p.id);
        };
        hit.on("click", onClick);
        line.on("click", onClick);
        hit.on("mouseover", () => {
          (hit.getElement() as HTMLElement | null) &&
            ((hit.getElement() as HTMLElement).style.cursor = "pointer");
        });

        const endA = L.circleMarker(latlngs[0], {
          radius: 4,
          color,
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
          interactive: false,
        }).addTo(map);
        const endB = L.circleMarker(latlngs[latlngs.length - 1], {
          radius: 4,
          color,
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
          interactive: false,
        }).addTo(map);

        const label = L.marker(latlngs[latlngs.length - 1], {
          interactive: false,
          icon: L.divIcon({
            className: "tsvsm-route-label",
            html: `<span style="font:500 10px ui-monospace,Menlo,monospace;color:#0f1729;background:rgba(255,255,255,0.78);padding:1px 4px;border-radius:2px;white-space:nowrap;">${escapeHtml(p.to)}</span>`,
            iconSize: [0, 0],
            iconAnchor: [-8, -2],
          }),
        }).addTo(map);

        rec = {
          id: p.id,
          type: p.type,
          future,
          hit,
          line,
          endpoints: [endA, endB],
          label,
        };
        live.set(p.id, rec);
      }
    });
  }, [projects, selectedYear]);

  // Sync per-route emphasis (selected / highlighted / dimmed).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const live = layersRef.current;
    live.forEach((rec) => {
      const isFocused =
        rec.id === selectedId || highlightSet.has(rec.id);
      const dimmed = hasFocus && !isFocused;
      const baseOpacity = rec.future ? 0.55 : 0.95;
      const opacity = dimmed ? baseOpacity * 0.3 : baseOpacity;
      const weight = isFocused ? 6 : 4;
      const style: any = { weight, opacity };
      rec.line.setStyle(style);
      if (isFocused) {
        rec.line.bringToFront();
        rec.endpoints.forEach((m) => {
          m.setStyle({ weight: 3, radius: 5 });
          m.bringToFront();
        });
      } else {
        rec.endpoints.forEach((m) => {
          m.setStyle({ weight: 2, radius: 4 });
        });
      }
      const labelEl = rec.label?.getElement?.() as HTMLElement | null;
      if (labelEl) {
        labelEl.style.opacity = dimmed ? "0.35" : "1";
        const span = labelEl.querySelector("span") as HTMLElement | null;
        if (span) {
          span.style.fontWeight = isFocused ? "700" : "500";
        }
      }
    });
  }, [selectedId, highlightSet, hasFocus]);

  // Keep map sized correctly inside flex layout when sibling panel opens/closes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [selectedId, highlightIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [leafletReady]);

  const showOverlay =
    state !== "ready" || !leafletReady || leafletError;

  return (
    <div
      className={cn(
        "relative w-full h-full bg-[#f4f5f7] border border-[var(--border-soft)] rounded-md overflow-hidden",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f4f5f7]/80 pointer-events-none">
          {leafletError ? (
            <div className="text-xs text-[var(--status-error)]">
              Не удалось загрузить Leaflet.
            </div>
          ) : state === "loading" || !leafletReady ? (
            <div className="text-xs uppercase tracking-[0.12em] font-mono text-muted-foreground">
              Загрузка карты…
            </div>
          ) : state === "empty" ? (
            <div className="text-xs text-muted-foreground">
              В сценарии нет активных проектов.
            </div>
          ) : state === "error" ? (
            <div className="text-xs text-[var(--status-error)]">
              Карта не загрузилась.
            </div>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}