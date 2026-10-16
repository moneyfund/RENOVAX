import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useWorkspace } from "../src/hooks/useWorkspace";
import type { Sensors } from "../src/hooks/useSensors";
const sdk = vi.hoisted(() => ({
  publishDevice: vi.fn(),
  markDeviceOffline: vi.fn(),
  publishObservation: vi.fn(),
  user: { uid: "user-one", displayName: "Test", email: "test@example.com" },
}));
vi.mock("../src/lib/firebase", () => ({
  ...sdk,
  login: vi.fn(),
  logout: vi.fn(),
  observeUser: (cb: (u: unknown) => void) => {
    cb(sdk.user);
    return () => {};
  },
  observeDevices: () => () => {},
  observeObservations: () => () => {},
}));
const sensors: Sensors = {
  location: {
    lat: 12,
    lng: -85,
    accuracy: 10,
    speed: null,
    heading: null,
    timestamp: Date.now(),
  },
  motion: null,
  gpsStatus: "active",
  motionStatus: "inactive",
  startGPS: vi.fn(),
  stopGPS: vi.fn(),
  startMotion: vi.fn(),
  stopMotion: vi.fn(),
};
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  sdk.publishDevice.mockResolvedValue(undefined);
  sdk.markDeviceOffline.mockResolvedValue(undefined);
});
afterEach(cleanup);
it("never starts transmission automatically and orders offline after an in-flight update", async () => {
  let complete!: () => void;
  const events: string[] = [];
  sdk.publishDevice.mockImplementation(
    () =>
      new Promise<void>((r) => {
        events.push("online-start");
        complete = () => {
          events.push("online-complete");
          r();
        };
      }),
  );
  sdk.markDeviceOffline.mockImplementation(async () => {
    events.push("offline");
  });
  const notify = vi.fn();
  const { result } = renderHook(() => useWorkspace(sensors, notify));
  expect(sdk.publishDevice).not.toHaveBeenCalled();
  act(() => result.current.toggleSharing());
  await waitFor(() => expect(sdk.publishDevice).toHaveBeenCalledOnce());
  act(() => result.current.toggleSharing());
  expect(sdk.markDeviceOffline).not.toHaveBeenCalled();
  await act(async () => complete());
  await waitFor(() =>
    expect(events).toEqual(["online-start", "online-complete", "offline"]),
  );
});
it("keeps a private local copy when a cloud save fails", async () => {
  sdk.publishObservation.mockRejectedValue(new Error("offline"));
  const notify = vi.fn();
  const { result } = renderHook(() => useWorkspace(sensors, notify));
  await act(async () => {
    await result.current.save(
      "ambiental",
      "observación",
      "Cambio de nivel observado.",
    );
  });
  const stored = JSON.parse(localStorage.getItem("renovax-observations")!);
  expect(stored[0].ownerUid).toBe("user-one");
  expect(stored[0].note).toBe("Cambio de nivel observado.");
  expect(result.current.observations).toHaveLength(1);
});
