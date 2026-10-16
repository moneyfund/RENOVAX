import { useEffect, useMemo, useState } from "react";
import { BellRing, MapPin, ShieldAlert, ShieldCheck, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notify } from "@/types";
import type { Workspace } from "@/hooks/useWorkspace";
import { addWatchZone, createDraftEvent, isIncidentInZone, removeWatchZone,
  subscribeOrgs, subscribeOrgEvents, subscribePublicIncidents, subscribeWatchZones,
  type OrgRef, type NetworkEvent, type PublicIncident, type WatchZone, type AssetKind } from "@/lib/network";

function dated(v:unknown){return v&&typeof v==="object"&&"toMillis" in v&&typeof v.toMillis==="function"?
 new Date(v.toMillis()).toLocaleString("es-NI"):"Fecha no disponible";}
export default function Alerts({workspace,notify}:{workspace:Workspace;notify:Notify}){
 const uid=workspace.user?.uid||"";
 const [orgs,setOrgs]=useState<OrgRef[]>([]),[selected,setSelected]=useState("");
 const [events,setEvents]=useState<NetworkEvent[]>([]),[incidents,setIncidents]=useState<PublicIncident[]>([]),[zones,setZones]=useState<WatchZone[]>([]);
 const [zoneName,setZoneName]=useState(""),[lat,setLat]=useState(""),[lng,setLng]=useState(""),[radius,setRadius]=useState("5");
 const [title,setTitle]=useState(""),[kind,setKind]=useState<AssetKind>("ambiental"),[severity,setSeverity]=useState<"informativo"|"revision">("revision");
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>subscribePublicIncidents(setIncidents,setError),[]);
 useEffect(()=>{if(!uid){setOrgs([]);setZones([]);return;}const a=subscribeOrgs(uid,setOrgs,setError),b=subscribeWatchZones(uid,setZones,setError);return()=>{a();b();};},[uid]);
 useEffect(()=>{if(orgs.length&&!orgs.some(o=>o.id===selected))setSelected(orgs[0].id);},[orgs,selected]);
 useEffect(()=>{setEvents([]);if(!selected)return;return subscribeOrgEvents(selected,setEvents,setError);},[selected]);
 const matches=useMemo(()=>incidents.filter(i=>zones.some(z=>isIncidentInZone(i,z))),[incidents,zones]);
 const selectedOrg=orgs.find(o=>o.id===selected);
 const action=async(fn:()=>Promise<unknown>,success:string)=>{setBusy(true);setError("");try{await fn();notify(success);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <div className="network-page">
  <div className="page-heading"><div><span className="micro purple">RENOVAX / GESTIÓN DE EVENTOS</span><h1>Centro de alertas y prevención.</h1><p>Información privada de tus estaciones y boletines comunitarios verificados, claramente diferenciados.</p></div></div>
  {error&&<div className="network-error" role="alert">{error}</div>}
  <section className="network-card network-disclaimer"><ShieldAlert size={26}/><div><strong>La seguridad primero</strong><p>Las mediciones experimentales, registros manuales y movimientos del teléfono no activan avisos públicos. Solo se muestran boletines corroborados y publicados por un proceso administrativo de confianza. RENOVAX no sustituye las alertas de autoridades nacionales.</p></div></section>
  <section className="network-card"><div className="network-heading"><BellRing/><div><h2>Boletines públicos verificados</h2><p>Actualmente se consultan publicaciones validadas por servidor. Aún no están activadas las notificaciones push masivas.</p></div></div>
   {incidents.length===0?<p className="network-muted">No hay boletines públicos registrados. No significa ausencia de riesgos: consulta siempre las fuentes oficiales.</p>:
   <div className="network-list">{incidents.map(i=><div key={i.id} className="network-device"><div><span className="micro">VERIFICADO · {i.kind} · {dated(i.publishedAt)}</span><h3>{i.title}</h3><p>{i.detail}</p><small>Fuente: {i.source}</small></div></div>)}</div>}
  </section>
  {uid&&<section className="network-card"><div className="network-heading"><MapPin/><div><h2>Mis zonas de interés</h2><p>Guarda ubicaciones de interés de forma voluntaria; estas zonas solo son visibles en tu cuenta y sirven para destacar boletines que coincidan geográficamente.</p></div></div>
   <form className="network-form-row" onSubmit={e=>{e.preventDefault();void action(()=>addWatchZone(uid,zoneName,Number(lat),Number(lng),Number(radius)).then(()=>{setZoneName("");setLat("");setLng("");}),"Zona guardada");}}>
    <label>Nombre<input required maxLength={80} value={zoneName} onChange={e=>setZoneName(e.target.value)} placeholder="Mi comunidad"/></label>
    <label>Latitud<input required type="number" min="-90" max="90" step="any" value={lat} onChange={e=>setLat(e.target.value)} placeholder="12.93"/></label>
    <label>Longitud<input required type="number" min="-180" max="180" step="any" value={lng} onChange={e=>setLng(e.target.value)} placeholder="-85.92"/></label>
    <label>Radio (km)<input required type="number" min="0.1" max="100" step="any" value={radius} onChange={e=>setRadius(e.target.value)}/></label>
    <Button disabled={busy} type="submit">Guardar zona</Button>
   </form>
   <div className="network-list">{zones.map(z=><div className="network-device" key={z.id}><div><b>{z.name}</b><small>{z.lat.toFixed(4)}, {z.lng.toFixed(4)} · radio {z.radiusKm} km</small></div><Button size="sm" variant="outline" onClick={()=>void action(()=>removeWatchZone(uid,z.id),"Zona eliminada")}>Quitar</Button></div>)}</div>
   <p className="network-muted">{matches.length?matches.length+" boletines coinciden con tus zonas guardadas.":"No hay boletines verificados coincidentes con tus zonas."} Una coincidencia circular es solo orientativa: las inundaciones se evalúan por cuenca y topografía, y los sismos por intensidad, no por un radio universal.</p>
  </section>}
  {uid&&!!orgs.length&&<section className="network-card"><div className="network-heading"><Waves/><div><h2>Eventos internos de organizaciones</h2><p>Los operadores pueden proponer incidentes para revisión interna. No provocan notificaciones comunitarias.</p></div></div>
   <label>Organización<select value={selected} onChange={e=>setSelected(e.target.value)}>{orgs.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}</select></label>
   {selectedOrg?.role!=="viewer"&&<form className="network-form-row" onSubmit={e=>{e.preventDefault();void action(()=>createDraftEvent(selected,title,kind,severity).then(()=>setTitle("")),"Evento enviado a revisión privada");}}>
    <label>Descripción<input minLength={8} maxLength={140} required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Incremento observado en estación…"/></label>
    <label>Área<select value={kind} onChange={e=>setKind(e.target.value as AssetKind)}><option value="ambiental">Ambiental</option><option value="sismico">Vibración</option><option value="transporte">Transporte</option><option value="seguridad">Seguridad</option></select></label>
    <label>Prioridad<select value={severity} onChange={e=>setSeverity(e.target.value as typeof severity)}><option value="informativo">Informativo</option><option value="revision">Requiere revisión</option></select></label>
    <Button disabled={busy} type="submit">Registrar borrador</Button>
   </form>}
   <div className="network-list">{events.map(v=><div key={v.id} className="network-device"><div><span className="micro">INTERNO / SIN PUBLICAR · {v.severity}</span><h3>{v.title}</h3><small>{v.kind} · {dated(v.createdAt)}</small></div><ShieldCheck size={16}/></div>)}</div>
  </section>}
 </div>;
}
