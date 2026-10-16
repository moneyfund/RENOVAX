import { beforeEach, expect, it, vi } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { useWorkspace } from "../src/hooks/useWorkspace";
import type { Sensors } from "../src/hooks/useSensors";
vi.mock("../src/lib/firebase", () => ({
  firebaseReady: true,
  observeUser: (cb: (value: unknown) => void) => {
    cb({uid:"alpha",displayName:"Operadora Alfa",email:"alpha@example.com",photoURL:"https://example.com/avatar.png"});
    return () => {};
  },
  observeDevices: () => () => {},
  observeObservations: () => () => {},
  login: vi.fn(),logout:vi.fn(),publishDevice:vi.fn(),markDeviceOffline:vi.fn(),publishObservation:vi.fn(),
}));
const sensors: Sensors = {
  location:null,motion:null,gpsStatus:"inactive",motionStatus:"inactive",
  startGPS:vi.fn(),stopGPS:vi.fn(),startMotion:vi.fn(),stopMotion:vi.fn(),
};
beforeEach(()=> {cleanup();localStorage.clear();});
it("restores Google profile without showing another user's browser records",async()=>{
 const records=["alpha","beta",null].map((ownerUid,i)=>({
  id:`record-${i}`,type:"ambiental",level:"observación",note:"Registro privado",
  localTime:"2026-10-16T00:00:00.000Z",source:"manual",deviceId:"node",
  ...(ownerUid?{ownerUid}:{})
 }));
 localStorage.setItem("renovax-observations",JSON.stringify(records));
 const {result,unmount}=renderHook(()=>useWorkspace(sensors,vi.fn()));
 await waitFor(()=>expect(result.current.authReady).toBe(true));
 expect(result.current.user?.displayName).toBe("Operadora Alfa");
 expect(result.current.user?.photoURL).toContain("avatar.png");
 expect(result.current.observations.map(o=>o.id)).toEqual(["record-0"]);
 unmount();
});
