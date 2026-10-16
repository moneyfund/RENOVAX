import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowUpRight, Layers2, X, MapPin, CircleDot } from "lucide-react";
import { SAMPLE_POINTS, MODULES } from "@/data";
import { observationMapPoints } from "@/lib/geo";
import { isFreshLocation } from "@/lib/telemetry";
import type { MapPoint, ModuleId } from "@/types";
import type { Sensors } from "@/hooks/useSensors";
import type { Workspace } from "@/hooks/useWorkspace";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Select } from "./ui/select";
const GeoMap = lazy(() => import("./GeoMap"));
export function MapWorkspace({
  module,
  sensors,
  workspace,
}: {
  module?: ModuleId;
  sensors: Sensors;
  workspace: Workspace;
}) {
  const [source, setSource] = useState("real"),
    [filter, setFilter] = useState("todos"),
    [basemap, setBasemap] = useState<"street" | "satellite">("street"),
    [selected, setSelected] = useState<MapPoint | null>(null);
  const effectiveFilter = module ?? filter;
  const points = useMemo(() => {
    if (source === "demo")
      return SAMPLE_POINTS.filter(
        (p) => effectiveFilter === "todos" || p.type === effectiveFilter,
      );
    // Registros de campo con geolocalización voluntaria, públicos solo para su propietario.
    const observations = observationMapPoints(
      workspace.observations,
      effectiveFilter === "todos" ? undefined : effectiveFilter,
    );
    // Los dispositivos en movimiento pertenecen únicamente al módulo GPS.
    if (effectiveFilter !== "todos" && effectiveFilter !== "transporte")
      return observations;
    const devices: MapPoint[] = workspace.liveDevices
      .filter((d) => d.deviceId !== workspace.deviceId)
      .map((d) => ({
        id: d.id,
        type: "actual",
        name: d.name,
        lat: d.lat,
        lng: d.lng,
        subtitle: "Dispositivo de tu cuenta privada",
        value: `Precisión ± ${Math.round(d.accuracy)} m`,
        demo: false,
        kind: "device",
      }));
    if (sensors.gpsStatus === "active" && isFreshLocation(sensors.location))
      devices.push({
        id: "local",
        type: "actual",
        name: "Este dispositivo",
        lat: sensors.location.lat,
        lng: sensors.location.lng,
        subtitle: "GPS local · no se transmite sin consentimiento",
        value: `Precisión ± ${Math.round(sensors.location.accuracy)} m`,
        demo: false,
        kind: "local",
      });
    return [...observations, ...devices];
  }, [
    source,
    effectiveFilter,
    workspace.observations,
    workspace.liveDevices,
    workspace.deviceId,
    sensors.location,
    sensors.gpsStatus,
  ]);
  const selectedPoint = selected
    ? points.find((p) => p.id === selected.id)
    : null;
  return (
    <section className="map-workspace" aria-label="Espacio geoespacial">
      <div className="workspace-toolbar">
        <div className="workspace-title">
          <Layers2 size={16} />
          <h2>Territorio de operaciones</h2>
          <span className="micro">NICARAGUA</span>
        </div>
        <Tabs
          value={source}
          onValueChange={(value) => {
            setSource(value);
            setSelected(null);
          }}
        >
          <TabsList aria-label="Origen de las posiciones">
            <TabsTrigger value="demo">Muestras</TabsTrigger>
            <TabsTrigger value="real">Mis datos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="map-filter-row">
        <span className="micro">
          <CircleDot size={11} />
          {source === "demo" ? "EXPLORACIÓN DEMO" : "DATOS AUTORIZADOS"}
          <b>{points.length.toString().padStart(2, "0")} PUNTOS</b>
        </span>
        {!module && (
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v);
              setSelected(null);
            }}
            label="Filtrar módulo del mapa"
            options={[
              { value: "todos", label: "Todos los módulos" },
              ...MODULES.map((m) => ({ value: m.id, label: m.short })),
            ]}
          />
        )}
        <div className="map-layer-selection">
          <Select label="Tipo de cartografía" value={basemap} onValueChange={(v) => setBasemap(v as "street" | "satellite")}
            options={[{value:"street",label:"Calles"},{value:"satellite",label:"Satélite"}]} />
        </div>
      </div>
      <div className="map-stage">
        <Suspense
          fallback={
            <div className="map-loading">
              <span className="loader" />
              Preparando cartografía…
            </div>
          }
        >
          <GeoMap
            points={points}
            selected={selectedPoint?.id ?? null}
            onSelect={setSelected}
            online={workspace.online}
            basemap={basemap}
          />
        </Suspense>
        {source === "real" && !points.length && (
          <div className="map-empty">
            <MapPin size={22} />
            <strong>Tu próxima conexión empieza aquí.</strong>
            <p>
              {module && module !== "transporte"
                ? "Registra una observación y autoriza adjuntar el GPS para situarla en este mapa."
                : "Activa el GPS para ubicar este equipo, o comparte datos desde otro dispositivo de tu cuenta."}
            </p>
            {(!module || module === "transporte") && (
              <Button size="sm" variant="outline" onClick={sensors.startGPS}>
                Activar ubicación
                <ArrowUpRight />
              </Button>
            )}
          </div>
        )}
        {selectedPoint && (
          <div className="point-detail">
            <span className="micro">
              {selectedPoint.demo
                ? "REFERENCIA DEMO"
                : selectedPoint.kind === "observation"
                  ? "OBSERVACIÓN GEOLOCALIZADA"
                  : selectedPoint.kind === "local"
                    ? "GPS DE ESTE EQUIPO"
                    : "DISPOSITIVO AUTORIZADO"}
            </span>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Cerrar detalle del punto"
              onClick={() => setSelected(null)}
            >
              <X />
            </Button>
            <h3>{selectedPoint.name}</h3>
            <p>{selectedPoint.subtitle}</p>
            <span>{selectedPoint.value}</span>
            <small className="micro">
              {selectedPoint.lat.toFixed(4)} / {selectedPoint.lng.toFixed(4)}
            </small>
          </div>
        )}
      </div>
      <div className="workspace-caption">
        <span>
          <i />
          {source === "demo"
            ? "Ubicaciones ilustrativas · no son mediciones"
            : "Observaciones autorizadas y GPS reciente · privado"}
        </span>
        <span className="micro">GEO / 01</span>
      </div>
    </section>
  );
}
