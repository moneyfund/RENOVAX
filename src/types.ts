export type ModuleId = "ambiental" | "sismico" | "transporte" | "seguridad";
export type PageId =
  "resumen" | ModuleId | "dispositivos" | "bitacora" | "configuracion";
export type SensorStatus =
  | "inactive"
  | "requesting"
  | "active"
  | "denied"
  | "unavailable"
  | "unsupported";
export interface LocationReading {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}
export interface MotionReading {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  includesGravity: boolean;
  timestamp: number;
}
export interface MapPoint {
  id: string;
  type: ModuleId | "actual";
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  value: string;
  demo: boolean;
  kind?: "device" | "observation" | "local";
}
export interface DeviceRecord {
  id: string;
  ownerUid: string;
  deviceId: string;
  name: string;
  module: "transporte";
  status: "online" | "offline";
  lat: number;
  lng: number;
  accuracy: number;
  motion: number | null;
  updatedAt: number;
}
export interface Observation {
  id: string;
  type: ModuleId;
  level: "observación" | "revisión" | "prueba";
  note: string;
  localTime: string;
  source: "manual";
  deviceId: string;
  cloud?: boolean;
  ownerUid?: string;
  position?: { lat: number; lng: number; accuracy: number };
}
export interface SessionUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}
export interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export type Notify = (message: string) => void;
