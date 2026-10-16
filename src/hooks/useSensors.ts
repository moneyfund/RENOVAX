import { useCallback, useEffect, useRef, useState } from "react";
import type { LocationReading, MotionReading, SensorStatus } from "@/types";

type PermissionMotion = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<string>;
};
/**
 * The user controls sensor lifetime. In particular, a stationary phone may
 * produce no new watchPosition events for minutes; inactivity is NOT consent
 * to deactivate the GPS. Stale coordinates remain unusable for transmission.
 */
export function useSensors() {
  const [location, setLocation] = useState<LocationReading | null>(null);
  const [motion, setMotion] = useState<MotionReading | null>(null);
  const [gpsStatus, setGpsStatus] = useState<SensorStatus>("inactive");
  const [motionStatus, setMotionStatus] = useState<SensorStatus>("inactive");
  const watch = useRef<number | null>(null);
  const handler = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const motionGeneration = useRef(0);
  const gpsGeneration = useRef(0);
  const gpsRefresh = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const motionHeartbeat = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopGPS = useCallback(() => {
    gpsGeneration.current++;
    clearTimeout(gpsRefresh.current);
    gpsRefresh.current = undefined;
    if (watch.current !== null) navigator.geolocation?.clearWatch(watch.current);
    watch.current = null;
    setGpsStatus("inactive");
    setLocation(null);
  }, []);

  const startGPS = useCallback(() => {
    if (watch.current !== null) return;
    if (!navigator.geolocation) { setGpsStatus("unsupported"); return; }
    const request = ++gpsGeneration.current;
    setGpsStatus("requesting");
    const options: PositionOptions = {
      enableHighAccuracy: true, maximumAge: 0, timeout: 20000,
    };
    const isCurrent = () => request === gpsGeneration.current;
    const position = (p: GeolocationPosition) => {
      if (!isCurrent()) return;
      clearTimeout(gpsRefresh.current);
      setLocation({
        lat: p.coords.latitude, lng: p.coords.longitude,
        accuracy: p.coords.accuracy, speed: p.coords.speed,
        heading: p.coords.heading, timestamp: p.timestamp,
      });
      setGpsStatus("active");
      // Refresh while stationary, rather than cancelling the persistent watch.
      gpsRefresh.current = setTimeout(refresh, 40000);
    };
    const failure = (e: GeolocationPositionError) => {
      if (!isCurrent()) return;
      if (e.code === 1) {
        stopGPS();
        setGpsStatus("denied");
        return;
      }
      // Transient GPS errors must not discard the explicit user permission.
      setGpsStatus("unavailable");
      clearTimeout(gpsRefresh.current);
      gpsRefresh.current = setTimeout(refresh, 15000);
    };
    const refresh = () => {
      if (!isCurrent() || document.hidden) return;
      navigator.geolocation.getCurrentPosition(position, failure, options);
    };
    try {
      watch.current = navigator.geolocation.watchPosition(position, failure, options);
    } catch {
      stopGPS();
      setGpsStatus("unavailable");
    }
  }, [stopGPS]);

  const stopMotion = useCallback(() => {
    motionGeneration.current++;
    clearTimeout(motionHeartbeat.current);
    motionHeartbeat.current = undefined;
    if (handler.current) window.removeEventListener("devicemotion", handler.current);
    handler.current = null;
    setMotionStatus("inactive");
    setMotion(null);
  }, []);

  const startMotion = useCallback(async () => {
    if (handler.current) return;
    if (!("DeviceMotionEvent" in window)) {
      setMotionStatus("unsupported");
      return;
    }
    const request = ++motionGeneration.current;
    setMotionStatus("requesting");
    try {
      const event = window.DeviceMotionEvent as PermissionMotion;
      if (event.requestPermission && (await event.requestPermission()) !== "granted") {
        if (request === motionGeneration.current) setMotionStatus("denied");
        return;
      }
      if (request !== motionGeneration.current) return;
      let last = 0;
      handler.current = (e) => {
        const linear = e.acceleration;
        const a = linear && linear.x !== null ? linear : e.accelerationIncludingGravity;
        if (!a || a.x === null || a.y === null || a.z === null ||
            ![a.x, a.y, a.z].every(Number.isFinite)) return;
        if (Date.now() - last < 100) return;
        last = Date.now();
        clearTimeout(motionHeartbeat.current);
        motionHeartbeat.current = setTimeout(() => {
          // Report a pause, but keep the listener; it can recover on the next event.
          if (request === motionGeneration.current) setMotionStatus("unavailable");
        }, 20000);
        setMotion({x: a.x, y: a.y, z: a.z,
          magnitude: Math.hypot(a.x, a.y, a.z),
          includesGravity: a !== linear, timestamp: last});
        setMotionStatus("active");
      };
      window.addEventListener("devicemotion", handler.current, { passive: true });
      motionHeartbeat.current = setTimeout(() => {
        if (request === motionGeneration.current) setMotionStatus("unavailable");
      }, 20000);
    } catch {
      if (request === motionGeneration.current) setMotionStatus("denied");
    }
  }, []);

  useEffect(() => {
    const hidden = () => {
      if (document.hidden) {
        stopGPS();
        stopMotion();
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      stopGPS();
      stopMotion();
    };
  }, [stopGPS, stopMotion]);
  return {
    location, motion, gpsStatus, motionStatus,
    startGPS, stopGPS, startMotion, stopMotion,
  };
}
export type Sensors = ReturnType<typeof useSensors>;
