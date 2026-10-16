import { useEffect, useState } from "react";
import { Building2, Cpu, ShieldCheck, ShieldX, Users } from "lucide-react";
import type { Workspace } from "@/hooks/useWorkspace";
import { listAllOrgsForAdmin, readPlatformAdmin } from "@/lib/network";
import { Button } from "@/components/ui/button";
interface Entry {id:string;name:string;ownerUid:string;}
export default function Admin({workspace}:{workspace:Workspace}){
 const [authorized,setAuthorized]=useState(false),[ready,setReady]=useState(false),[orgs,setOrgs]=useState<Entry[]>([]),[error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 useEffect(()=>{
  let active=true;
  if(!workspace.user){setAuthorized(false);setReady(true);return;}
  void readPlatformAdmin().then(valid=>{
   if(!active)return;setAuthorized(valid);setReady(true);
   if(valid)return listAllOrgsForAdmin().then(r=>{if(active)setOrgs(r);});
  }).catch(e=>{if(active){setError((e as Error).message);setReady(true);}});
  return()=>{active=false;};
 },[workspace.user?.uid]);
 const reload=async()=>{
  setLoading(true);try{setOrgs(await listAllOrgsForAdmin());}catch(e){setError((e as Error).message);}finally{setLoading(false);}
 };
 return <div className="network-page"><div className="page-heading"><div><span className="micro purple">RENOVAX / CONSOLA INTERNA</span><h1>Administración de plataforma.</h1><p>Gestión global protegida por permisos emitidos desde el servidor Firebase.</p></div></div>
 {!ready?<div className="network-card">Validando credenciales administrativas…</div>:!authorized?
 <section className="network-card network-disclaimer"><ShieldX size={27}/><div><h2>Acceso restringido</h2><p>Tu cuenta puede utilizar RENOVAX como cliente y administrador de sus organizaciones, pero no es administradora de la plataforma. Este acceso requiere el custom claim <code>platformAdmin=true</code>, asignado exclusivamente por Firebase Admin SDK. No se permite autoproclamarse administrador desde el navegador.</p><p>{error}</p></div></section>:
 <>
 <section className="network-card network-disclaimer"><ShieldCheck size={26}/><div><h2>Sesión de administración verificada</h2><p>Este panel solo expone metadatos de organizaciones, sin mostrar ubicaciones privadas ni datos sensibles de sus propietarios. Los cambios de privilegios y la gestión de identidad requieren operaciones en un backend confiable y auditado.</p></div></section>
 <div className="network-quickstats"><span><Building2/> {orgs.length} organizaciones consultadas</span><span><Users/> Sesión admin validada</span><span><Cpu/> Inventario por organización</span></div>
 <section className="network-card"><div className="network-heading"><Building2/><div><h2>Organizaciones registradas</h2><p>Listado paginado a un máximo de 100 organizaciones por consulta inicial.</p></div><Button variant="outline" disabled={loading} onClick={()=>void reload()}>Actualizar</Button></div>
 <div className="network-list">{orgs.map(o=><div className="network-device" key={o.id}><div><h3>{o.name}</h3><small>ID {o.id}</small></div><small>Propietario UID {o.ownerUid.slice(0,12)}…</small></div>)}</div>
 </section>
 </>}
 </div>;
}
