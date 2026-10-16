import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ModuleId,
  Notify,
  Observation,
  SessionUser,
  DeviceRecord,
} from "@/types";
import type { Sensors } from "./useSensors";
import {
  getInstallationId,
  readObservations,
  storeObservations,
} from "@/lib/storage";
import { isFreshLocation, isLiveDevice } from "@/lib/telemetry";
import { isValidPosition } from "@/lib/geo";
import { firebaseReady } from "@/lib/firebase";
import {
  login,
  logout,
  markDeviceOffline,
  observeDevices,
  observeObservations,
  observeUser,
  publishDevice,
  publishObservation,
} from "@/lib/firebase";

export function useWorkspace(sensors: Sensors, notify: Notify) {
  const [deviceId] = useState(getInstallationId);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(!firebaseReady);
  const lastUser = useRef<string | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>([]),
    [cloud, setCloud] = useState<Observation[]>([]);
  const [local, setLocal] = useState(readObservations),
    [sharing, setSharing] = useState(false),
    [authBusy, setAuthBusy] = useState(false);
  const [syncError, setSyncError] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [now, setNow] = useState(Date.now());
  const latest = useRef(sensors);
  latest.current = sensors;
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(
    () =>
      observeUser(
        (u) => {
          const uid = u?.uid ?? null;
          if (uid !== lastUser.current) {
            lastUser.current = uid;
            setSharing(false);
          }
          setUser(u ? {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL ?? null,
          } : null);
          setAuthReady(true);
        },
        () => {
          setAuthReady(true);
          notify("No se pudo recuperar la sesión de Google.");
        },
      ),
    [notify],
  );
  useEffect(() => {
    setDevices([]);
    setCloud([]);
    setSyncError(false);
    if (!user?.uid) return;
    const failed = () => {
      setSyncError(true);
      notify(
        "Sincronización interrumpida. Tus registros locales siguen disponibles.",
      );
    };
    const uid = user.uid;
    const a = observeDevices(uid, (records) =>
      setDevices(records.filter((d) => d.ownerUid === uid)), failed),
      b = observeObservations(uid, (records) =>
        setCloud(records.filter((o) => o.ownerUid === uid)), failed);
    return () => {
      a();
      b();
    };
  }, [user?.uid, notify]);
  useEffect(() => {
    const network = () => setOnline(navigator.onLine);
    const timer = setInterval(() => setNow(Date.now()), 10000);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
    };
  }, []);
  useEffect(() => {
    if (!sharing || !user) return;
    let cancelled = false;
    const uid = user.uid;
    const send = () => {
      const { location, motion, gpsStatus } = latest.current;
      if (cancelled) return;
      if (
        !navigator.onLine ||
        document.hidden ||
        gpsStatus !== "active" ||
        !isFreshLocation(location)
      ) {
        setSharing(false);
        notify(
          "Transmisión detenida: se requiere GPS reciente y conexión activa.",
        );
        return;
      }
      writes.current = writes.current
        .catch(() => {})
        .then(async () => {
          if (cancelled) return;
          await publishDevice(uid, deviceId, {
            name: "Dispositivo RENOVAX",
            module: "transporte",
            status: "online",
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            motion: motion?.magnitude ?? null,
          });
        })
        .catch(() => {
          if (!cancelled) {
            setSharing(false);
            notify(
              "No se pudo transmitir. Revisa tu conexión y los permisos de datos.",
            );
          }
        });
    };
    send();
    const timer = setInterval(send, 15000);
    const hidden = () => {
      if (document.hidden) setSharing(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hidden);
      writes.current = writes.current
        .catch(() => {})
        .then(() => markDeviceOffline(uid, deviceId))
        .catch(() => {});
    };
  }, [sharing, user?.uid, deviceId, notify]);
  useEffect(() => {
    if (sharing && (sensors.gpsStatus !== "active" || !online))
      setSharing(false);
  }, [sensors.gpsStatus, online, sharing]);
  const toggleSharing = () => {
    if (sharing) {
      setSharing(false);
      notify("Transmisión detenida.");
      return;
    }
    if (!user || !authReady) {
      notify("Conecta tu cuenta en Configuración para compartir ubicación.");
      return;
    }
    if (
      !online ||
      sensors.gpsStatus !== "active" ||
      !isFreshLocation(sensors.location)
    ) {
      notify(
        "Activa el GPS y espera una posición reciente antes de transmitir.",
      );
      return;
    }
    setSharing(true);
  };
  const signIn = async () => {
    setAuthBusy(true);
    try {
      const credential = await login();
      if (credential) notify("Perfil de Google conectado.");
      else notify("Completa el inicio de sesión para continuar.");
    } catch (error) {
      const code = (error as { code?: string }).code;
      notify(
        code === "auth/unauthorized-domain"
          ? "El dominio debe autorizarse en Firebase Authentication."
          : code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
            ? "Inicio de sesión cancelado."
            : code === "auth/network-request-failed"
              ? "Revisa la conexión a Internet para continuar con Google."
              : "No se pudo conectar la cuenta. Revisa la configuración de Firebase.",
      );
    } finally {
      setAuthBusy(false);
    }
  };
  const signOut = async () => {
    setSharing(false);
    setAuthBusy(true);
    try {
      if (user) {
        await Promise.race([
          writes.current
            .catch(() => {})
            .then(() => markDeviceOffline(user.uid, deviceId))
            .catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
      }
      await logout();
      setDevices([]);
      setCloud([]);
      notify("Sesión cerrada.");
    } catch {
      notify("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setAuthBusy(false);
    }
  };
  const save = useCallback(
    async (type: ModuleId, level: Observation["level"], note: string, position?: Observation["position"]) => {
      const trimmed = note.trim();
      if (!trimmed || trimmed.length > 500)
        throw new Error("Escribe entre 1 y 500 caracteres.");
      if (position && !isValidPosition(position))
        throw new Error("La ubicación GPS no es válida.");
      const record: Observation = {
        id: crypto.randomUUID(),
        type,
        level,
        note: trimmed,
        localTime: new Date().toISOString(),
        source: "manual",
        deviceId,
        ...(user ? { ownerUid: user.uid } : {}),
        ...(position ? { position } : {}),
      };
      let saved = false;
      if (user && navigator.onLine) {
        try {
          await Promise.race([
            publishObservation(user.uid, record),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 8000),
            ),
          ]);
          saved = true;
        } catch {
          /* An idempotent local copy survives an interrupted write. */
        }
      }
      if (saved) {
        notify("Observación guardada en tu cuenta.");
        return;
      }
      const next = [record, ...readObservations()].slice(0, 100);
      try {
        storeObservations(next);
        setLocal(next);
        notify("Observación guardada en este dispositivo.");
      } catch {
        throw new Error(
          "El almacenamiento local no está disponible. Exporta tus registros o libera espacio.",
        );
      }
    },
    [deviceId, user, notify],
  );
  const observations = useMemo(() => {
    const merged = new Map<string, Observation>();
    // Anonymous records are visible only when signed out, never to a
    // different Google account sharing the same browser installation.
    local
      .filter((o) => user?.uid ? o.ownerUid === user.uid : !o.ownerUid)
      .forEach((o) => merged.set(o.id, o));
    cloud.filter((o) => user?.uid && o.ownerUid === user.uid)
      .forEach((o) => merged.set(o.id, o));
    return [...merged.values()].sort(
      (a, b) => Date.parse(b.localTime) - Date.parse(a.localTime),
    );
  }, [local, cloud, user]);
  const liveDevices = useMemo(
    () => devices.filter((d) => user?.uid && d.ownerUid === user.uid && isLiveDevice(d, now)),
    [devices, now, user?.uid],
  );
  return {
    deviceId,
    user,
    authReady,
    devices,
    liveDevices,
    observations,
    sharing,
    online,
    syncError,
    authBusy,
    signIn,
    signOut,
    toggleSharing,
    save,
  };
}
export type Workspace = ReturnType<typeof useWorkspace>;
