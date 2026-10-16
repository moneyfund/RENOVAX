import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { useSensors } from "../src/hooks/useSensors";
import CameraPanel from "../src/components/CameraPanel";
let positionSuccess: PositionCallback;
const clearWatch = vi.fn();
beforeEach(() => {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      watchPosition: vi.fn((success: PositionCallback) => {
        positionSuccess = success;
        return 9;
      }),
      clearWatch,
    },
  });
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("Sensor consent and lifecycle", () => {
  it("starts only on request, clears GPS and discards late callbacks after stopping", () => {
    const { result } = renderHook(() => useSensors());
    expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled();
    act(() => result.current.startGPS());
    expect(result.current.gpsStatus).toBe("requesting");
    const position = {
      coords: {
        latitude: 12.9,
        longitude: -85.9,
        accuracy: 8,
        speed: null,
        heading: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition;
    act(() => positionSuccess(position));
    expect(result.current.location?.lat).toBe(12.9);
    act(() => result.current.stopGPS());
    expect(clearWatch).toHaveBeenCalledWith(9);
    expect(result.current.location).toBeNull();
    act(() => positionSuccess(position));
    expect(result.current.location).toBeNull();
  });
  it("stops GPS when the app is backgrounded", () => {
    const { result } = renderHook(() => useSensors());
    act(() => result.current.startGPS());
    act(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.gpsStatus).toBe("inactive");
    expect(clearWatch).toHaveBeenCalled();
  });
  it("does not attach a motion listener after a permission prompt outlives its view", async () => {
    let resolve!: (permission: string) => void;
    const requestPermission = vi.fn(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        }),
    );
    vi.stubGlobal(
      "DeviceMotionEvent",
      class {
        static requestPermission = requestPermission;
      },
    );
    const add = vi.spyOn(window, "addEventListener");
    const { result, unmount } = renderHook(() => useSensors());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.startMotion();
    });
    unmount();
    await act(async () => {
      resolve("granted");
      await pending;
    });
    expect(add.mock.calls.filter((c) => c[0] === "devicemotion")).toHaveLength(
      0,
    );
  });
});
describe("Camera privacy", () => {
  it("releases a stream returned after the camera panel was closed", async () => {
    let resolve!: (stream: MediaStream) => void;
    const stop = vi.fn();
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((r) => {
          resolve = r;
        }),
    );
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    const { unmount } = render(<CameraPanel />);
    expect(getUserMedia).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    unmount();
    await act(async () =>
      resolve({ getTracks: () => [{ stop }] } as unknown as MediaStream),
    );
    expect(stop).toHaveBeenCalledOnce();
  });
  it("reports denied permission and allows a retry", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new DOMException("Denied", "NotAllowedError")),
      },
    });
    render(<CameraPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Autoriza la cámara",
      ),
    );
    expect(screen.getByRole("button", { name: "Activar cámara" })).toBeTruthy();
  });
});
