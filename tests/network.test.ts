import {describe,expect,it} from "vitest";
import {distanceKm,isIncidentInZone,makeSerial,type PublicIncident,type WatchZone} from "../src/lib/network";

describe("RENOVAX identity and geospatial matching",()=>{
 it("generates a well-formed serial for each unit type",()=>{
  const items=[makeSerial("transporte"),makeSerial("ambiental"),makeSerial("sismico"),makeSerial("seguridad")];
  expect(items[0]).toMatch(/^RVX-TR-[A-F0-9]{12}$/);
  expect(items[1]).toMatch(/^RVX-RI-[A-F0-9]{12}$/);
  expect(items[2]).toMatch(/^RVX-SI-[A-F0-9]{12}$/);
  expect(items[3]).toMatch(/^RVX-SE-[A-F0-9]{12}$/);
  expect(new Set(items).size).toBe(4);
 });
 it("uses a consistent great-circle distance; does not classify missing location as verified alert",()=>{
  expect(distanceKm({lat:12.9,lng:-85.9},{lat:12.9,lng:-85.9})).toBe(0);
  const incident:PublicIncident={id:"1",title:"Ejemplo",detail:"Ninguna alerta real",kind:"ambiental",source:"example",status:"verified",lat:12.90,lng:-85.90,radiusKm:2};
  const zone:WatchZone={id:"zone",name:"Casa",lat:12.91,lng:-85.91,radiusKm:1,enabled:true};
  expect(isIncidentInZone(incident,zone)).toBe(true);
  expect(isIncidentInZone({...incident,radiusKm:0.1},{...zone,lat:13.2})).toBe(false);
  expect(isIncidentInZone({...incident,lat:undefined},zone)).toBe(false);
  expect(isIncidentInZone(incident,{...zone,enabled:false})).toBe(false);
 });
});
