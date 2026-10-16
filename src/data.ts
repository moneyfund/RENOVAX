import {
  Activity,
  Waves,
  Navigation,
  ScanEye,
  PanelsTopLeft,
  Cpu,
  SlidersHorizontal,
  BookOpen,
  Network,
  BellRing,
  ShieldCheck,
} from "lucide-react";
import type { ModuleId, MapPoint, PageId } from "@/types";
export const MODULES = [
  {
    id: "ambiental",
    title: "Ríos y laderas",
    short: "Ambiental",
    code: "ENV",
    icon: Waves,
    description: "Observación del entorno y registro de cambios en campo.",
    capability: "Observación visual",
  },
  {
    id: "sismico",
    title: "Actividad sísmica",
    short: "Sísmico",
    code: "SEI",
    icon: Activity,
    description: "Explora el movimiento de tu dispositivo en tres ejes.",
    capability: "Acelerómetro local",
  },
  {
    id: "transporte",
    title: "Transporte y GPS",
    short: "Movilidad",
    code: "GPS",
    icon: Navigation,
    description:
      "Ubicación precisa, seguimiento consciente y control de tu posición.",
    capability: "Geolocalización",
  },
  {
    id: "seguridad",
    title: "Seguridad",
    short: "Seguridad",
    code: "SEC",
    icon: ScanEye,
    description: "Un punto de observación local, siempre bajo tu control.",
    capability: "Cámara local",
  },
] as const;
export const TITLES: Record<PageId, string> = {
  resumen: "Centro de control",
  ambiental: "Ríos y laderas",
  sismico: "Actividad sísmica",
  transporte: "Transporte y GPS",
  seguridad: "Seguridad y observación",
  dispositivos: "Sensores y dispositivos",
  bitacora: "Bitácora de operaciones",
  configuracion: "Configuración del sistema",
  red: "Red de dispositivos",
  alertas: "Centro de alertas",
  admin: "Administración RENOVAX",
};
export const NAV = [
  { id: "resumen", title: "Centro de control", icon: PanelsTopLeft },
  ...MODULES,
  { id: "dispositivos", title: "Dispositivos", icon: Cpu },
  { id: "red", title: "Mi red", icon: Network },
  { id: "alertas", title: "Alertas", icon: BellRing },
  { id: "admin", title: "Admin RENOVAX", icon: ShieldCheck },
  { id: "bitacora", title: "Bitácora", icon: BookOpen },
  { id: "configuracion", title: "Configuración", icon: SlidersHorizontal },
] as const;
export function isModule(id: string): id is ModuleId {
  return MODULES.some((m) => m.id === id);
}
export function getPage(): PageId {
  const id = window.location.hash.slice(1);
  return NAV.some((n) => n.id === id) ? (id as PageId) : "resumen";
}
export const SAMPLE_POINTS: MapPoint[] = [
  {
    id: "env-01",
    type: "ambiental",
    name: "Cuenca Río Grande",
    subtitle: "Matagalpa · estación conceptual",
    lat: 12.9271,
    lng: -85.9165,
    value: "Observación visual",
    demo: true,
  },
  {
    id: "env-02",
    type: "ambiental",
    name: "Ladera El Tuma",
    subtitle: "Matagalpa · estación conceptual",
    lat: 13.034,
    lng: -85.7477,
    value: "Inclinación / terreno",
    demo: true,
  },
  {
    id: "sei-01",
    type: "sismico",
    name: "Nodo de vibración",
    subtitle: "Estelí · ubicación ilustrativa",
    lat: 13.0919,
    lng: -86.3538,
    value: "Acelerómetro",
    demo: true,
  },
  {
    id: "gps-01",
    type: "transporte",
    name: "Ruta urbana 01",
    subtitle: "Managua · ubicación ilustrativa",
    lat: 12.1355,
    lng: -86.2512,
    value: "Posición de muestra",
    demo: true,
  },
  {
    id: "gps-02",
    type: "transporte",
    name: "Ruta urbana 02",
    subtitle: "León · ubicación ilustrativa",
    lat: 12.4379,
    lng: -86.878,
    value: "Posición de muestra",
    demo: true,
  },
  {
    id: "sec-01",
    type: "seguridad",
    name: "Punto de observación",
    subtitle: "Granada · estación conceptual",
    lat: 11.9309,
    lng: -85.956,
    value: "Cámara local",
    demo: true,
  },
];
