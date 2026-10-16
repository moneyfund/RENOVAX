import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowUpRight, Building2, ClipboardCopy, Cpu, MapPin, Radio, ShieldCheck, Users, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Sensors } from "@/hooks/useSensors";
import type { Workspace } from "@/hooks/useWorkspace";
import type { MapPoint, Notify } from "@/types";
import { isFreshLocation } from "@/lib/telemetry";
import {
 acceptInvite, createAsset, createInvite, createNode, createOrganization, createReading,
 readOrgMembers, subscribeOrgAssets, subscribeOrgDevices, subscribeOrgReadings, subscribeOrgs,
 writeOffline, writePosition,
 type AssetKind, type NetworkAsset, type NetworkMember, type NetworkNode, type NetworkReading, type OrgRef,
} from "@/lib/network";
const GeoMap = lazy(() => import("@/components/GeoMap"));

const kindOptions: {id:AssetKind;label:string}[] = [
 {id:"transporte",label:"Transporte y GPS"},{id:"ambiental",label:"Ríos y laderas"},
 {id:"sismico",label:"Vibración experimental"},{id:"seguridad",label:"Seguridad"},
];
const fmt = (v:unknown) => {
 if(v && typeof v==="object" && "toMillis" in v && typeof v.toMillis==="function"){
  return new Date(v.toMillis()).toLocaleString("es-NI");
 }
 return "Sin registro";
};
const current = (n:NetworkNode,now:number) => n.status==="online" &&
 n.updatedAt && typeof n.updatedAt==="object" &&
 "toMillis" in n.updatedAt && typeof n.updatedAt.toMillis==="function" &&
 now-n.updatedAt.toMillis()<90000;

export default function Network({workspace,sensors,notify}:{workspace:Workspace;sensors:Sensors;notify:Notify}) {
 const uid=workspace.user?.uid??"";
 const [orgs,setOrgs]=useState<OrgRef[]>([]);
 const [orgId,setOrgId]=useState("");
 const [assets,setAssets]=useState<NetworkAsset[]>([]);
 const [nodes,setNodes]=useState<NetworkNode[]>([]);
 const [readings,setReadings]=useState<NetworkReading[]>([]);
 const [members,setMembers]=useState<NetworkMember[]>([]);
 const [orgName,setOrgName]=useState("");
 const [assetName,setAssetName]=useState("");
 const [kind,setKind]=useState<AssetKind>("transporte");
 const [nodeAsset,setNodeAsset]=useState("");
 const [emitter,setEmitter]=useState("");
 const [name,setName]=useState("");
 const [inviteMail,setInviteMail]=useState("");
 const [inviteRole,setInviteRole]=useState<"admin"|"operator"|"viewer">("viewer");
 const [readingNode,setReadingNode]=useState("");
 const [readingValue,setReadingValue]=useState("");
 const [readingNote,setReadingNote]=useState("");
 const [link,setLink]=useState("");
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [tracking,setTracking]=useState<string|null>(null);
 const [now,setNow]=useState(Date.now());
 const [selectedPoint,setSelectedPoint]=useState<MapPoint|null>(null);
 const uidRef=useRef(uid);uidRef.current=uid;
 const latest=useRef(sensors);latest.current=sensors;
 const trackingRef=useRef<{orgId:string;node:NetworkNode}|null>(null);
 const org=orgs.find(o=>o.id===orgId);
 const canManage=org?.role==="owner"||org?.role==="admin";
 const canOperate=canManage||org?.role==="operator";
 const selectedAsset=assets.find(a=>a.id===nodeAsset);
 useEffect(()=>{if(!uid){setOrgs([]);setOrgId("");return;}return subscribeOrgs(uid,setOrgs,setError)},[uid]);
 useEffect(()=>{
  if(orgs.length && !orgs.some(x=>x.id===orgId))setOrgId(orgs[0].id);
 },[orgs,orgId]);
 useEffect(()=>{
  setAssets([]);setNodes([]);setReadings([]);setMembers([]);
  if(!orgId)return;
  const dispose=[
   subscribeOrgAssets(orgId,setAssets,setError),
   subscribeOrgDevices(orgId,setNodes,setError),
   subscribeOrgReadings(orgId,setReadings,setError),
  ];
  void readOrgMembers(orgId).then(setMembers).catch(e=>setError((e as Error).message));
  return()=>dispose.forEach(d=>d());
 },[orgId]);
 useEffect(()=>{
  const request=new URLSearchParams(window.location.search).get("invitation");
  if(!request||!uid)return;
  let cancelled=false;
  void acceptInvite(uid,request).then(()=>{
   if(cancelled)return;
   const params=new URLSearchParams(window.location.search);params.delete("invitation");
   history.replaceState(null,"",window.location.pathname+(params.size?"?"+params.toString():"")+"#red");
   notify("Invitación aceptada. Bienvenido a la organización.");
  }).catch(e=>{if(!cancelled)setError((e as Error).message);});
  return()=>{cancelled=true;};
 },[uid,notify]);
 useEffect(()=>{
  const timer=window.setInterval(()=>setNow(Date.now()),10000);return()=>clearInterval(timer);
 },[]);
 useEffect(()=>{
  const info=trackingRef.current;
  if(!info)return;
  if(document.hidden||!workspace.online){setTracking(null);return;}
  if(!tracking)return;
  const send=async()=>{
   const location=latest.current.location;
   if(latest.current.gpsStatus!=="active"||!isFreshLocation(location))return;
   if(!trackingRef.current)return;
   try {
    await writePosition(trackingRef.current.orgId,trackingRef.current.node,location,"online");
   } catch(e){setError((e as Error).message);setTracking(null);}
  };
  void send();
  const interval=setInterval(()=>void send(),15000);
  const hidden=()=>{if(document.hidden)setTracking(null);};
  document.addEventListener("visibilitychange",hidden);
  return()=>{
   clearInterval(interval);document.removeEventListener("visibilitychange",hidden);
  };
 },[tracking,workspace.online]);
 useEffect(()=>{
  if(tracking===null && trackingRef.current){
   const {orgId:id,node}=trackingRef.current;
   trackingRef.current=null;
   void writeOffline(id,node).catch(()=>{});
  }
 },[tracking]);
 useEffect(()=>()=>{const v=trackingRef.current;if(v)void writeOffline(v.orgId,v.node).catch(()=>{});},[]);
 const doAction=async(action:()=>Promise<unknown>,success:string)=>{
  setError("");setLoading(true);
  try{await action();notify(success);}catch(e){setError((e as Error).message);}finally{setLoading(false);}
 };
 const points:MapPoint[]=useMemo(()=>nodes.filter(n=>n.kind==="transporte"&&Number.isFinite(n.lat)&&Number.isFinite(n.lng))
  .map(n=>({id:n.id,type:"actual",name:n.name,lat:n.lat!,lng:n.lng!,subtitle:current(n,now)?"Ubicación reciente":"Última posición conocida · sin señal",value:fmt(n.updatedAt),demo:false,kind:"device"})),[nodes,now]);
 if(!uid)return <div className="network-page"><div className="page-heading"><h1>Mi red de dispositivos</h1></div><section className="network-card"><ShieldCheck size={30}/><h2>Una sola cuenta para todos tus dispositivos</h2><p>Inicia sesión con Google en la barra superior para gestionar unidades, estaciones, usuarios y permisos.</p><Button onClick={()=>void workspace.signIn()}>Conectar cuenta de Google</Button></section></div>;
 return <div className="network-page">
  <div className="page-heading"><div><span className="micro purple">RENOVAX NETWORK / OPERACIONES</span><h1>Tu red. Tus dispositivos. Tu equipo.</h1><p>Gestiona estaciones, vehículos y usuarios autorizados desde un espacio seguro.</p></div></div>
  {error&&<div className="network-error" role="alert">{error} <button onClick={()=>setError("")} aria-label="Cerrar aviso">×</button></div>}
  <section className="network-card">
   <div className="network-heading"><Building2/><div><h2>Organizaciones y espacios compartidos</h2><p>Una organización puede administrar múltiples buses o estaciones sin compartir contraseñas.</p></div></div>
   <div className="network-actions">
    <label>Organización activa<select value={orgId} onChange={e=>{setTracking(null);setOrgId(e.target.value);}}><option value="">Seleccionar…</option>{orgs.map(o=><option value={o.id} key={o.id}>{o.name} · {o.role}</option>)}</select></label>
    <form onSubmit={e=>{e.preventDefault();void doAction(()=>createOrganization(uid,orgName).then(id=>{setOrgId(id);setOrgName("");}),"Organización creada");}}>
     <label>Crear organización<input value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="Cooperativa, empresa o proyecto" required minLength={3} maxLength={80}/></label>
     <Button type="submit" disabled={loading||orgName.trim().length<3}>Crear</Button>
    </form>
   </div>
  </section>
  {org&&<>
   <div className="network-quickstats">
    <span><Building2/> {org.name}</span>
    <span><Users/> Rol: <b>{org.role}</b></span>
    <span><Cpu/> {nodes.length} nodos</span>
    <span><Activity/> {readings.length} lecturas recientes</span>
   </div>
   {canManage&&<section className="network-card">
    <div className="network-heading"><Users/><div><h2>Compartir acceso a la organización</h2><p>Los permisos se validan en Firestore. Compartir un enlace no concede acceso sin el correo invitado.</p></div></div>
    <form className="network-form-row" onSubmit={e=>{e.preventDefault();void doAction(async()=>{setLink(await createInvite(orgId,inviteMail,inviteRole,org.name));},"Invitación creada");}}>
     <label>Correo de Google<input type="email" required value={inviteMail} onChange={e=>setInviteMail(e.target.value)} placeholder="persona@correo.com"/></label>
     <label>Permiso<select value={inviteRole} onChange={e=>setInviteRole(e.target.value as typeof inviteRole)}><option value="viewer">Observador</option><option value="operator">Operador</option><option value="admin">Administrador local</option></select></label>
     <Button type="submit" disabled={loading}>Crear invitación</Button>
    </form>
    {link&&<div className="network-copy"><input readOnly value={link} aria-label="Enlace de invitación"/><Button variant="outline" onClick={()=>void navigator.clipboard.writeText(link)}>Copiar enlace <ClipboardCopy size={15}/></Button></div>}
    <div className="network-members"><span className="micro">MIEMBROS AUTORIZADOS</span>{members.map(m=><div key={m.uid}><b>{m.email||m.uid.slice(0,10)}</b><small>{m.role} · UID {m.uid.slice(0,12)}…</small></div>)}</div>
   </section>}
   <section className="network-card">
    <div className="network-heading"><Cpu/><div><h2>Inventario físico y series</h2><p>Los números RVX identifican unidades, pero no sirven como contraseñas ni credenciales de emisión.</p></div></div>
    {canOperate&&<form className="network-form-row" onSubmit={e=>{e.preventDefault();void doAction(()=>createAsset(orgId,assetName,kind).then(()=>setAssetName("")),"Activo creado");}}>
     <label>Nombre del activo<input required minLength={3} maxLength={80} value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="Bus 01, estación Río Grande…"/></label>
     <label>Tipo<select value={kind} onChange={e=>setKind(e.target.value as AssetKind)}>{kindOptions.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}</select></label>
     <Button disabled={loading||assetName.trim().length<3} type="submit">Añadir activo</Button>
    </form>}
    {canManage&&!!assets.length&&<form className="network-form-row" onSubmit={e=>{e.preventDefault();if(!selectedAsset)return;void doAction(()=>createNode(orgId,selectedAsset,emitter||uid,name).then(serial=>{notify("Serie asignada: "+serial);setName("");}),"Nodo registrado");}}>
      <label>Activo<select required value={nodeAsset} onChange={e=>setNodeAsset(e.target.value)}><option value="">Elegir activo…</option>{assets.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label>Nombre del nodo<input value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="Rastreador principal"/></label>
      <label>UID autorizado para emitir<input value={emitter} onChange={e=>setEmitter(e.target.value)} placeholder={uid} aria-label="UID de la cuenta emisora"/></label>
      <Button disabled={loading||!selectedAsset} type="submit">Asignar serie RVX</Button>
    </form>}
    <div className="network-list">{nodes.map(n=><div className="network-device" key={n.id}>
      <div><span className="micro">{n.serial}</span><h3>{n.name}</h3><small>{n.kind} · {n.assetId.slice(0,8)}… · {current(n,now)?"En línea":"Sin posición reciente"}</small></div>
      <div><small>Emisor: {n.emitterUid===uid?"Esta cuenta":n.emitterUid.slice(0,12)+"…"}</small><small>Última señal: {fmt(n.updatedAt)}</small>
       {n.emitterUid===uid&&n.kind==="transporte"&&<Button size="sm" variant={tracking===n.id?"outline":"default"} onClick={()=>{
        if(tracking===n.id){setTracking(null);notify("Emisión detenida.");return;}
        if(sensors.gpsStatus!=="active"||!isFreshLocation(sensors.location)){void sensors.startGPS();notify("Concede GPS y espera una lectura reciente. Vuelve a pulsar para transmitir.");return;}
        setTracking(n.id);trackingRef.current={orgId,node:n};
       }}>{tracking===n.id?<><Radio/>Detener emisión</>:<><Radio/>Emitir GPS</>}</Button>}
      </div>
     </div>)}</div>
    {!nodes.length&&<p className="network-muted">Aún no hay nodos. Crea un activo y asígnale una serie RENOVAX.</p>}
   </section>
   <section className="network-card"><div className="network-heading"><MapPin/><div><h2>Mapa privado de unidades</h2><p>El propietario y sus miembros autorizados ven los mismos nodos. La PWA emisora requiere permanecer abierta.</p></div></div>
    <div className="network-map"><Suspense fallback={<p>Cargando mapa…</p>}><GeoMap points={points} selected={selectedPoint?.id??null} onSelect={setSelectedPoint} online={workspace.online} basemap="street"/></Suspense></div>
    {selectedPoint&&<p className="network-muted">{selectedPoint.name} · {selectedPoint.subtitle} · {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}</p>}
   </section>
   <section className="network-card">
    <div className="network-heading"><Waves/><div><h2>Lecturas y registros compartidos</h2><p>Estaciones ambientales necesitan un sensor de nivel calibrado. Estas lecturas se introducen manualmente y NO generan alertas públicas.</p></div></div>
    {canOperate&&<form className="network-form-row" onSubmit={e=>{e.preventDefault();const n=nodes.find(d=>d.id===readingNode);if(!n)return;void doAction(()=>createReading(orgId,n,Number(readingValue),n.kind==="ambiental"?"m":n.kind==="transporte"?"km/h":"unidad",readingNote).then(()=>{setReadingValue("");setReadingNote("");}),"Lectura registrada para la organización");}}>
      <label>Estación<select required value={readingNode} onChange={e=>setReadingNode(e.target.value)}><option value="">Elegir nodo…</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.name} · {n.serial}</option>)}</select></label>
      <label>Valor<input type="number" min="0" max="100000" step="any" required value={readingValue} onChange={e=>setReadingValue(e.target.value)} placeholder="1.42"/></label>
      <label>Nota<input value={readingNote} maxLength={240} onChange={e=>setReadingNote(e.target.value)} placeholder="Lectura manual verificada"/></label>
      <Button disabled={loading||!readingNode||!readingValue} type="submit">Registrar lectura</Button>
    </form>}
    <div className="network-list">{[...readings].sort((a,b)=>timeOf(b.createdAt)-timeOf(a.createdAt)).slice(0,12).map(r=><div className="network-device" key={r.id}><div><strong>{r.value} {r.unit}</strong><small>{r.kind} · {r.note||"Lectura manual"}</small></div><small>{fmt(r.createdAt)}</small></div>)}</div>
   </section>
  </>}
  <section className="network-card network-disclaimer"><ShieldCheck/><div><strong>Seguridad y límites operativos</strong><p>La serie es una etiqueta; la autenticación depende de Google y del permiso por organización. Esta versión transmite GPS solo mientras la página está visible. La información sísmica y de inundaciones no es un sistema certificado de emergencia.</p><p>Tu UID para asignar emisores autorizados: <code>{uid}</code> <Button size="sm" variant="ghost" onClick={()=>void navigator.clipboard.writeText(uid)}>Copiar <ClipboardCopy size={12}/></Button></p></div></section>
 </div>;
}
function timeOf(value:unknown){return value&&typeof value==="object"&&"toMillis" in value&&typeof value.toMillis==="function"?value.toMillis():0;}
