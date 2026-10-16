import { useCallback, useEffect, useRef, useState } from "react";
import type { LocationReading, MotionReading, SensorStatus } from "@/types";

type PermissionMotion = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<string>;
};
export function useSensors() {
  const [location, setLocation] = useState<LocationReading | null>(null);
  const [motion, setMotion] = useState<MotionReading | null>(null);
  const [gpsStatus, setGpsStatus] = useState<SensorStatus>("inactive");
  const [motionStatus, setMotionStatus] = useState<SensorStatus>("inactive");
  const watch = useRef<number | null>(null),
    handler = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const generation = useRef(0),
    gpsGeneration = useRef(0),
    gpsExpiry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stopGPS = useCallback(() => {
    gpsGeneration.current++;
    clearTimeout(gpsExpiry.current);
    if (watch.current !== null)
      navigator.geolocation?.clearWatch(watch.current);
    watch.current = null;
    setGpsStatus("inactive");
    setLocation(null);
  }, []);
  const startGPS = useCallback(() => {
    if (watch.current !== null) return;
    if (!navigator.geolocation) {
      setGpsStatus("unsupported");
      return;
    }
    const request = ++gpsGeneration.current;
    setGpsStatus("requesting");
    try {
      watch.current = navigator.geolocation.watchPosition(
        (p) => {
          if (request !== gpsGeneration.current) return;
          clearTimeout(gpsExpiry.current);
          gpsExpiry.current = setTimeout(
            () => {
              stopGPS();
              setGpsStatus("unavailable");
            },
            Math.max(0, 60000 - (Date.now() - p.timestamp)),
          );
          setLocation({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: p.coords.accuracy,
            speed: p.coords.speed,
            heading: p.coords.heading,
            timestamp: p.timestamp,
          });
          setGpsStatus("active");
        },
        (e) => {
          if (request !== gpsGeneration.current) return;
          stopGPS();
          setGpsStatus(e.code === 1 ? "denied" : "unavailable");
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
    } catch {
      stopGPS();
      setGpsStatus("unavailable");
    }
  }, [stopGPS]);
  const stopMotion = useCallback(() => {
    generation.current++;
    clearTimeout(timer.current);
    if (handler.current)
      window.removeEventListener("devicemotion", handler.current);
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
    const request = ++generation.current;
    setMotionStatus("requesting");
    try {
      const event = window.DeviceMotionEvent as PermissionMotion;
      if (
        event.requestPermission &&
        (await event.requestPermission()) !== "granted"
      ) {
        if (request === generation.current) setMotionStatus("denied");
        return;
      }
      if (request !== generation.current) return;
      let last = 0;
      handler.current = (e) => {
        const linear = e.acceleration;
        const a =
          linear && linear.x !== null ? linear : e.accelerationIncludingGravity;
        if (
          !a ||
          a.x === null ||
          a.y === null ||
          a.z === null ||
          ![a.x, a.y, a.z].every(Number.isFinite)
        )
          return;
        if (Date.now() - last < 100) return;
        last = Date.now();
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          stopMotion();
          setMotionStatus("unavailable");
        }, 6000);
        setMotion({
          x: a.x,
          y: a.y,
          z: a.z,
          magnitude: Math.hypot(a.x, a.y, a.z),
          includesGravity: a !== linear,
          timestamp: last,
        });
        setMotionStatus("active");
      };
      window.addEventListener("devicemotion", handler.current, {
        passive: true,
      });
      timer.current = setTimeout(() => {
        stopMotion();
        setMotionStatus("unavailable");
      }, 6000);
    } catch {
      if (request === generation.current) setMotionStatus("denied");
    }
  }, [stopMotion]);
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
    location,
    motion,
    gpsStatus,
    motionStatus,
    startGPS,
    stopGPS,
    startMotion,
    stopMotion,
  };
}
export type Sensors = ReturnType<typeof useSensors>;
