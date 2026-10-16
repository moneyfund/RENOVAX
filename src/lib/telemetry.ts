import type { DeviceRecord, LocationReading } from "@/types";
export function isFreshLocation(
  location: LocationReading | null,
  now = Date.now(),
): location is LocationReading {
  return (
    !!location &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    Math.abs(location.lat) <= 90 &&
    Math.abs(location.lng) <= 180 &&
    Number.isFinite(location.accuracy) &&
    location.accuracy >= 0 &&
    now - location.timestamp < 60000 &&
    now - location.timestamp >= -5000
  );
}
export function isLiveDevice(device: DeviceRecord, now = Date.now()) {
  return (
    device.status === "online" &&
    Number.isFinite(device.lat) &&
    Number.isFinite(device.lng) &&
    Math.abs(device.lat) <= 90 &&
    Math.abs(device.lng) <= 180 &&
    device.updatedAt > 0 &&
    now - device.updatedAt < 90000 &&
    now - device.updatedAt >= -5000
  );
}
