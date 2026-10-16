import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowUpRight, Layers2, X, MapPin, CircleDot } from "lucide-react";
import { SAMPLE_POINTS, MODULES } from "@/data";
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
  const [source, setSource] = useState("demo"),
    [filter, setFilter] = useState("todos"),
    [selected, setSelected] = useState<MapPoint | null>(null);
  const effectiveFilter = module ?? filter;
  const points = useMemo(() => {
    if (source === "demo")
      return SAMPLE_POINTS.filter(
        (p) => effectiveFilter === "todos" || p.type === effectiveFilter,
      );
    if (effectiveFilter !== "todos" && effectiveFilter !== "transporte")
      return [];
    const cloud: MapPoint[] = workspace.liveDevices
      .filter((d) => d.deviceId !== workspace.deviceId)
      .map((d) => ({
        id: d.id,
        type: "actual",
        name: d.name,
        lat: d.lat,
        lng: d.lng,
        subtitle: "Nodo de tu cuenta privada",
        value: `Precisión ± ${Math.round(d.accuracy)} m`,
        demo: false,
      }));
    if (sensors.location && sensors.gpsStatus === "active")
      cloud.push({
        id: "local",
        type: "actual",
        name: "Este dispositivo",
        lat: sensors.location.lat,
        lng: sensors.location.lng,
        subtitle: "Ubicación local autorizada",
        value: `Precisión ± ${Math.round(sensors.location.accuracy)} m`,
        demo: false,
      });
    return cloud;
  }, [
    source,
    effectiveFilter,
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
            <TabsTrigger value="real">Mis nodos</TabsTrigger>
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
          />
        </Suspense>
        {source === "real" && !points.length && (
          <div className="map-empty">
            <MapPin size={22} />
            <strong>Tu próxima conexión empieza aquí.</strong>
            <p>
              {module && module !== "transporte"
                ? "Este módulo utiliza observaciones locales. Los nodos GPS están en Movilidad."
                : "Activa el GPS para localizar este dispositivo o transmite desde otro equipo con tu cuenta."}
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
            : "Posiciones recientes · acceso privado"}
        </span>
        <span className="micro">GEO / 01</span>
      </div>
    </section>
  );
}
