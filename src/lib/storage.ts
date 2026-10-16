import type { Observation } from "@/types";
import { isValidPosition } from "./geo";

export function getInstallationId(): string {
  try {
    const old = localStorage.getItem("renovax-install-id");
    if (old && /^[a-zA-Z0-9-]{1,80}$/.test(old)) return old;
    const id = crypto.randomUUID();
    localStorage.setItem("renovax-install-id", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
export function isObservation(value: unknown): value is Observation {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    ["ambiental", "sismico", "transporte", "seguridad"].includes(
      String(o.type),
    ) &&
    ["observación", "revisión", "prueba"].includes(String(o.level)) &&
    typeof o.note === "string" &&
    o.note.trim().length > 0 &&
    o.note.length <= 500 &&
    typeof o.localTime === "string" &&
    Number.isFinite(Date.parse(o.localTime)) &&
    typeof o.deviceId === "string" &&
    o.source === "manual" &&
    (o.position === undefined || isValidPosition(o.position))
  );
}
export function readObservations(): Observation[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem("renovax-observations") || "[]",
    );
    return Array.isArray(data) ? data.filter(isObservation).slice(0, 100) : [];
  } catch {
    return [];
  }
}
export function storeObservations(records: Observation[]) {
  localStorage.setItem(
    "renovax-observations",
    JSON.stringify(records.slice(0, 100)),
  );
}
export function downloadRecords(records: Observation[]) {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            product: "RENOVAX OS",
            version: "0.2",
            exportedAt: new Date().toISOString(),
            observations: records,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `renovax-bitacora-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
