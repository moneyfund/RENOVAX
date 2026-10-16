import { describe, expect, it } from "vitest";
import { isValidPosition, observationMapPoints } from "../src/lib/geo";
import type { Observation } from "../src/types";
const base: Observation = { id: "1", type: "ambiental", level: "observación", note: "Inspección del río", localTime: "2026-10-16T00:00:00.000Z", deviceId: "node", source: "manual" };
describe("mapa privado y georreferenciación voluntaria", () => {
  it("rechaza coordenadas inválidas", () => {
    expect(isValidPosition({lat: 98, lng: -85, accuracy: 8})).toBe(false);
    expect(isValidPosition({lat: 12.9, lng: -85.9, accuracy: -5})).toBe(false);
  });
  it("muestra solo registros con consentimiento de ubicación y módulo", () => {
    const records = [base, {...base, id: "2", type: "sismico" as const, position: {lat: 13, lng: -86, accuracy: 8}}, {...base, id: "3", position: {lat: 12.9, lng: -85.9, accuracy: 7}}];
    expect(observationMapPoints(records, "ambiental")).toHaveLength(1);
    expect(observationMapPoints(records)).toHaveLength(2);
    expect(observationMapPoints(records, "ambiental")[0].kind).toBe("observation");
  });
});
