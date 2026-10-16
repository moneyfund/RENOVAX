import { lazy, Suspense, useState } from "react";
import { m } from "motion/react";
import { Wordmark } from "@/components/Wordmark";
import {
  ArrowUpRight,
  ArrowRight,
  Radio,
  Plus,
  LockKeyhole,
  Cpu,
  CircleDot,
  ShieldCheck,
  Network,
  BookOpen,
  Layers2,
} from "lucide-react";
import type { ModuleId, PageId } from "@/types";
import type { Sensors } from "@/hooks/useSensors";
import type { Workspace } from "@/hooks/useWorkspace";
import { MODULES } from "@/data";
import { MapWorkspace } from "@/components/MapWorkspace";
import { SensorReadout } from "@/components/SensorReadout";
import { SignalPlot } from "@/components/SignalPlot";
import { ObservationList } from "@/components/ObservationList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
const CameraPanel = lazy(() => import("@/components/CameraPanel"));
export function Overview({
  workspace,
  sensors,
  navigate,
  onNew,
}: {
  workspace: Workspace;
  sensors: Sensors;
  navigate: (p: PageId) => void;
  onNew: () => void;
}) {
  const activeSensors =
    Number(sensors.gpsStatus === "active") +
    Number(sensors.motionStatus === "active");
  return (
    <>
      <m.section
        className="overview-heading hero-brand"
        aria-label="RENOVAX · Una nueva vida para la tecnología"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 210, damping: 28 }}
      >
        <div className="hero-brand-content">
          <div className="hero-brand-image">
            <Wordmark className="hero-wordmark" />
          </div>
          <p>Una nueva vida para la tecnología.</p>
        </div>
      </m.section>
      <section className="system-metrics" aria-label="Resumen de operaciones">
        <div>
          <span className="metric-label">
            <Layers2 />Módulos operativos
          </span>
          <strong>04<small>listos para explorar</small></strong>
        </div>
        <div>
          <span className="metric-label">
            <Network />Nodos transmitiendo
          </span>
          <strong>
            {String(workspace.liveDevices.length).padStart(2, "0")}
            <small>
              {workspace.user ? "en tu cuenta" : "conecta tu cuenta"}
            </small>
          </strong>
        </div>
        <div>
          <span className="metric-label">
            <BookOpen />Observaciones
          </span>
          <strong>
            {String(workspace.observations.length).padStart(2, "0")}
            <small>registros de campo</small>
          </strong>
        </div>
        <div>
          <span className="metric-label">
            <ShieldCheck />Espacio de trabajo
          </span>
          <strong className="metric-word">
            <i
              className={
                workspace.user && !workspace.syncError ? "status-dot" : ""
              }
            />
            {workspace.user
              ? workspace.syncError
                ? "REVISAR"
                : "CONECTADO"
              : "LOCAL"}
            <small>
              {workspace.online
                ? "Conexión de red disponible"
                : "Trabajando sin conexión"}
            </small>
          </strong>
        </div>
      </section>
      <div className="operations-heading">
        <div>
          <span className="section-index">01</span>
          <h2>Vista de operaciones</h2>
        </div>
        <span className="session-label">
          <span className="status-dot" />
          {workspace.online ? "Red disponible" : "Sin conexión"}
        </span>
      </div>
      <div className="operations-layout overview-operations">
        <MapWorkspace workspace={workspace} sensors={sensors} />
        <aside className="instrument-dock">
          <div className="dock-heading">
            <span className="micro">ESTACIÓN LOCAL</span>
            <span className="station-tag">RVX / 01</span>
          </div>
          <div className="station-ident">
            <div className="station-symbol">
              <Cpu size={26} strokeWidth={1.3} />
            </div>
            <div>
              <h2>Este dispositivo</h2>
              <span className="micro">
                RVX / {workspace.deviceId.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="dock-status">
            <CircleDot size={12} />
            {activeSensors
              ? `${activeSensors} ${activeSensors === 1 ? "sensor activo" : "sensores activos"}`
              : "Sensores en espera"}
          </div>
          <SensorReadout sensors={sensors} compact />
          <p className="dock-hint">Activa un sensor para comenzar una lectura local.</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("dispositivos")}
          >
            Abrir laboratorio
            <ArrowUpRight />
          </Button>
          <div className="station-privacy">
            <LockKeyhole size={12} />Permisos bajo tu control
          </div>
        </aside>
      </div>
      <section className="modules-section" aria-label="Módulos operativos">
        <div className="operations-heading">
          <div>
            <span className="section-index">02</span>
            <h2>Elige tu próxima misión</h2>
          </div>
          <span className="micro">CUATRO FORMAS DE TRANSFORMAR</span>
        </div>
        <div className="module-launchers">
          {MODULES.map((module, i) => (
            <m.button
              key={module.id}
              onClick={() => navigate(module.id)}
              aria-label={`Abrir ${module.title}`}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
            >
              <span className="launcher-top">
                <span className="launcher-icon">
                  <module.icon size={21} strokeWidth={1.5} />
                </span>
                <span className="micro">0{i + 1} / {module.code}</span>
              </span>
              <span className="launcher-copy">
                <strong>{module.title}</strong>
                <span>{module.capability}</span>
              </span>
              <ArrowUpRight className="launcher-arrow" size={17} />
            </m.button>
          ))}
        </div>
      </section>
      <ObservationList
        records={workspace.observations}
        onMore={() => navigate("bitacora")}
        onNew={onNew}
      />
    </>
  );
}
const notes: Record<ModuleId, { title: string; text: string; foot: string }> = {
  ambiental: {
    title: "Observa. Compara. Registra.",
    text: "Documenta cambios en ríos y laderas con observaciones y capturas locales.",
    foot: "Las mediciones de nivel o desplazamiento requieren sensores y referencias calibradas.",
  },
  sismico: {
    title: "Una lectura, tres ejes.",
    text: "Coloca el dispositivo en una superficie estable y activa el acelerómetro para explorar su señal.",
    foot: "La disponibilidad del sensor depende del equipo y del navegador.",
  },
  transporte: {
    title: "Tu posición, por decisión.",
    text: "Activa el GPS para ver tu ubicación. Autoriza la transmisión para compartirla con tu cuenta privada.",
    foot: "La transmisión se detiene al salir de primer plano o perder una lectura reciente.",
  },
  seguridad: {
    title: "La privacidad es el punto de partida.",
    text: "La imagen permanece en este dispositivo. Captura y descarga únicamente cuando lo necesites.",
    foot: "La cámara se detiene al abandonar esta vista o pasar la aplicación a segundo plano.",
  },
};
export function ModuleWorkspace({
  id,
  workspace,
  sensors,
  onNew,
}: {
  id: ModuleId;
  workspace: Workspace;
  sensors: Sensors;
  onNew: () => void;
}) {
  const module = MODULES.find((m) => m.id === id)!;
  const [view, setView] = useState("mapa");
  const note = notes[id];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="micro purple">
            MÓDULO {String(MODULES.indexOf(module) + 1).padStart(2, "0")} /{" "}
            {module.code}
          </span>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
        <Button onClick={onNew}>
          <Plus />
          Registrar observación
        </Button>
      </div>
      <div className="module-viewbar">
        <Tabs value={view} onValueChange={setView}>
          <TabsList aria-label="Vista del módulo">
            <TabsTrigger value="mapa">Territorio</TabsTrigger>
            <TabsTrigger value="instrumento">
              {id === "transporte"
                ? "Ubicación"
                : id === "sismico"
                  ? "Señal en vivo"
                  : "Cámara local"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="micro">
          <span className="status-dot" />
          ENTORNO EXPERIMENTAL
        </span>
      </div>
      <div className="operations-layout">
        <div className="primary-instrument">
          {view === "mapa" ? (
            <MapWorkspace module={id} workspace={workspace} sensors={sensors} />
          ) : id === "sismico" ? (
            <SignalPlot reading={sensors.motion} />
          ) : id === "transporte" ? (
            <div className="location-panel">
              <span className="micro purple">POSICIÓN DE ESTE DISPOSITIVO</span>
              <h2>
                {sensors.location
                  ? "Aquí estás."
                  : "Encuentra tu punto de partida."}
              </h2>
              <div className="location-coordinates">
                <div>
                  <span>LATITUD</span>
                  <strong>
                    {sensors.location?.lat.toFixed(6) ?? "—"}
                    <small>°</small>
                  </strong>
                </div>
                <div>
                  <span>LONGITUD</span>
                  <strong>
                    {sensors.location?.lng.toFixed(6) ?? "—"}
                    <small>°</small>
                  </strong>
                </div>
              </div>
              <div className="location-meta">
                <span>
                  Precisión{" "}
                  <b>
                    {sensors.location
                      ? `± ${Math.round(sensors.location.accuracy)} m`
                      : "—"}
                  </b>
                </span>
                <span>
                  Velocidad{" "}
                  <b>
                    {sensors.location?.speed != null
                      ? `${(sensors.location.speed * 3.6).toFixed(1)} km/h`
                      : "—"}
                  </b>
                </span>
              </div>
              <p>
                Esta lectura permanece local hasta que autorices su transmisión.
              </p>
              <Button variant="outline" onClick={() => setView("mapa")}>
                Ver territorio
                <ArrowRight />
              </Button>
            </div>
          ) : (
            <Suspense
              fallback={<div className="map-loading">Preparando cámara…</div>}
            >
              <CameraPanel />
            </Suspense>
          )}
        </div>
        <aside className="instrument-dock">
          <div className="dock-heading">
            <span className="micro">CONTROL DE MISIÓN</span>
            <module.icon size={18} />
          </div>
          <h2 className="dock-title">{note.title}</h2>
          <p className="dock-hint">{note.text}</p>
          <SensorReadout sensors={sensors} compact />
          {id === "transporte" && (
            <div className="transmission">
              <span className="micro">
                <Radio size={13} />
                {workspace.sharing ? "TRANSMITIENDO" : "ENLACE PRIVADO"}
              </span>
              <p>
                {workspace.sharing
                  ? "Tu posición se actualiza cada 15 segundos."
                  : "Solo tu cuenta puede acceder a la posición compartida."}
              </p>
              <Button
                variant={workspace.sharing ? "outline" : "default"}
                className="w-full"
                onClick={workspace.toggleSharing}
              >
                <Radio />
                {workspace.sharing
                  ? "Detener transmisión"
                  : "Autorizar transmisión"}
              </Button>
            </div>
          )}
          <div className="dock-foot">
            <LockKeyhole size={14} />
            <p>{note.foot}</p>
          </div>
        </aside>
      </div>
      <ObservationList
        records={workspace.observations.filter((o) => o.type === id)}
        full
        onNew={onNew}
      />
    </>
  );
}
