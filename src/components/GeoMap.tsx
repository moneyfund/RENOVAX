import { memo, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Minus, Plus, MapPinned } from "lucide-react";
import type { MapPoint } from "@/types";
import { Button } from "./ui/button";
const symbols: Record<MapPoint["type"], string> = {
  ambiental: "E",
  sismico: "S",
  transporte: "G",
  seguridad: "V",
  actual: "•",
};
function GeoMap({
  points,
  selected,
  onSelect,
  online,
}: {
  points: MapPoint[];
  selected: string | null;
  onSelect: (p: MapPoint) => void;
  online: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    markers = useRef<L.LayerGroup | null>(null);
  const [ready, setReady] = useState(false),
    [tileError, setTileError] = useState(false),
    [center, setCenter] = useState("12.65° N / 85.62° O");
  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 4,
      maxZoom: 18,
      scrollWheelZoom: false,
    }).setView([12.65, -85.62], 7);
    map.current = instance;
    markers.current = L.layerGroup().addTo(instance);
    const layer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(instance);
    layer.on("tileerror", () => setTileError(true));
    layer.on("tileload", () => setTileError(false));
    instance.on("moveend", () => {
      const c = instance.getCenter();
      setCenter(
        `${Math.abs(c.lat).toFixed(2)}° ${c.lat >= 0 ? "N" : "S"} / ${Math.abs(c.lng).toFixed(2)}° ${c.lng >= 0 ? "E" : "O"}`,
      );
    });
    const observer = new ResizeObserver(() =>
      instance.invalidateSize({ pan: false }),
    );
    observer.observe(host.current);
    setReady(true);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      markers.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !markers.current) return;
    markers.current.clearLayers();
    points.forEach((p) => {
      const icon = L.divIcon({
        className: "rvx-marker",
        html: `<span class="map-node ${p.demo ? "" : "real"} ${selected === p.id ? "selected" : ""}">${symbols[p.type]}</span>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker([p.lat, p.lng], {
        icon,
        title: `${p.name} · ${p.demo ? "muestra" : "ubicación real"}`,
        keyboard: true,
      }).addTo(markers.current!);
      const label = document.createElement("span");
      label.textContent = `${p.name} · ${p.demo ? "DEMO" : "REAL"}`;
      marker.bindTooltip(label, {
        direction: "top",
        className: "map-tooltip",
        offset: [0, -20],
      });
      marker.on("click", () => onSelect(p));
    });
  }, [points, onSelect, ready, selected]);
  useEffect(() => {
    if (!selected || !map.current) return;
    const point = points.find((p) => p.id === selected);
    if (point)
      map.current.setView([point.lat, point.lng], 10, {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    // Only a deliberate selection should move the viewport.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  function focus() {
    if (!map.current) return;
    if (points.length)
      map.current.fitBounds(
        L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
        { padding: [65, 65], maxZoom: 11, animate: false },
      );
    else map.current.setView([12.65, -85.62], 7);
  }
  return (
    <div className="geo-map">
      <div
        ref={host}
        className="map-host"
        aria-label="Mapa geográfico interactivo de operaciones"
      />
      <div className="map-coordinate micro">
        {center}
        <span>WGS 84</span>
      </div>
      <div className="map-north" aria-hidden="true">
        N<span>↑</span>
      </div>
      <div className="map-tools">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Centrar todos los puntos"
          onClick={focus}
        >
          <Crosshair />
        </Button>
        <span />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Acercar mapa"
          onClick={() => map.current?.zoomIn()}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Alejar mapa"
          onClick={() => map.current?.zoomOut()}
        >
          <Minus />
        </Button>
      </div>
      {(!online || tileError) && (
        <div className="map-network">
          <MapPinned size={16} />
          Cartografía sin conexión. Las posiciones disponibles siguen visibles.
        </div>
      )}
    </div>
  );
}
export default memo(GeoMap);
