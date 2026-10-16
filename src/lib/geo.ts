import type { MapPoint, Observation } from "@/types";

/** Una coordenada explícitamente autorizada y verificada, nunca inferida. */
export function isValidPosition(value: unknown): value is NonNullable<Observation["position"]> {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.lat === "number" && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90
    && typeof p.lng === "number" && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180
    && typeof p.accuracy === "number" && Number.isFinite(p.accuracy) && p.accuracy >= 0 && p.accuracy <= 100000;
}

export function observationMapPoints(records: Observation[], module?: string): MapPoint[] {
  return records.filter(o => (!module || o.type === module) && isValidPosition(o.position))
    .map(o => {
      const position = o.position!;
      return {
        id: `obs-${o.id}`,
        type: o.type,
        name: o.note.length > 58 ? `${o.note.slice(0, 55)}…` : o.note,
        subtitle: `Observación privada · ${new Date(o.localTime).toLocaleDateString("es-NI")}`,
        lat: position.lat, lng: position.lng,
        value: `GPS ± ${Math.round(position.accuracy)} m · ${o.level}`,
        demo: false, kind: "observation",
      };
    });
}
