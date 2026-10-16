import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInstallationId,
  readObservations,
  storeObservations,
} from "../src/lib/storage";
import { isFreshLocation, isLiveDevice } from "../src/lib/telemetry";
import type { Observation, DeviceRecord, LocationReading } from "../src/types";
const record: Observation = {
  id: "legacy-1",
  type: "ambiental",
  level: "observación",
  note: "Nivel observado en el río.",
  localTime: "2026-10-16T18:00:00Z",
  source: "manual",
  deviceId: "legacy-install",
};
beforeEach(() => localStorage.clear());
describe("Existing device data survives migration", () => {
  it("retains the installation identifier and valid observations", () => {
    localStorage.setItem("renovax-install-id", "legacy-install");
    localStorage.setItem("renovax-observations", JSON.stringify([record]));
    expect(getInstallationId()).toBe("legacy-install");
    expect(readObservations()).toEqual([record]);
  });
  it("rejects malformed and unexpected persisted data without crashing", () => {
    localStorage.setItem("renovax-observations", "{invalid");
    expect(readObservations()).toEqual([]);
    localStorage.setItem(
      "renovax-observations",
      JSON.stringify([
        record,
        { ...record, note: null },
        { ...record, type: "unknown" },
        { ...record, localTime: "invalid" },
      ]),
    );
    expect(readObservations()).toEqual([record]);
  });
  it("does not report a successful save when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(() => storeObservations([record])).toThrow();
  });
});
describe("Only recent, valid positions are represented as live", () => {
  const now = 1000000;
  const location: LocationReading = {
    lat: 12.9,
    lng: -85.9,
    accuracy: 10,
    speed: null,
    heading: null,
    timestamp: now - 1000,
  };
  const device: DeviceRecord = {
    id: "d1",
    ownerUid: "u1",
    deviceId: "phone",
    name: "Phone",
    module: "transporte",
    status: "online",
    lat: 12.9,
    lng: -85.9,
    accuracy: 10,
    motion: null,
    updatedAt: now - 1000,
  };
  it("expires GPS and remote heartbeats independently", () => {
    expect(isFreshLocation(location, now)).toBe(true);
    expect(isFreshLocation({ ...location, timestamp: now - 60001 }, now)).toBe(
      false,
    );
    expect(isLiveDevice(device, now)).toBe(true);
    expect(isLiveDevice(device, now + 90000)).toBe(false);
    expect(isLiveDevice({ ...device, status: "offline" }, now)).toBe(false);
  });
  it("rejects invalid coordinates and future timestamps", () => {
    expect(isFreshLocation({ ...location, lat: 91 }, now)).toBe(false);
    expect(isFreshLocation({ ...location, accuracy: NaN }, now)).toBe(false);
    expect(isLiveDevice({ ...device, lng: Infinity }, now)).toBe(false);
    expect(isLiveDevice({ ...device, updatedAt: now + 10000 }, now)).toBe(
      false,
    );
  });
});
