import { getClient } from "./firebase";

export type NetworkRole = "owner" | "admin" | "operator" | "viewer";
export type AssetKind = "transporte" | "ambiental" | "sismico" | "seguridad";
export interface OrgRef { id: string; name: string; role: NetworkRole; }
export interface NetworkAsset { id: string; name: string; kind: AssetKind; createdAt?: unknown; }
export interface NetworkNode {
  id: string; serial: string; name: string; kind: AssetKind; assetId: string;
  emitterUid: string; status: "online" | "offline";
  lat?: number; lng?: number; accuracy?: number; battery?: number;
  updatedAt?: unknown;
}
export interface NetworkReading { id: string; deviceId: string; kind: AssetKind; value: number; unit: string; note: string; createdAt?: unknown; }
export interface NetworkEvent { id: string; title: string; kind: AssetKind; severity: "informativo" | "revision"; status: "draft"; createdAt?: unknown; }
export interface PublicIncident {
  id: string; title: string; detail: string; kind: AssetKind;
  source: string; status: "verified"; publishedAt?: unknown;
  lat?: number; lng?: number; radiusKm?: number;
}
export interface NetworkMember { id: string; uid: string; role: NetworkRole; email: string; joinedAt?: unknown; }

function subscribed<T>(start: () => Promise<() => void>, _onData: (items: T[]) => void, onError: (message: string) => void) {
  let stopped = false; let unsubscribe: () => void = () => {};
  void start().then(fn => { if (stopped) fn(); else unsubscribe = fn; }).catch(e => { if (!stopped) onError(errorMessage(e)); });
  return () => { stopped = true; unsubscribe(); };
}
function errorMessage(e: unknown) {
  const code = (e as {code?: string})?.code;
  if (code === "permission-denied") return "Permiso de Firestore denegado: publica las reglas nuevas y comprueba tu rol.";
  return e instanceof Error ? e.message : "No fue posible sincronizar los datos.";
}
function list<T extends {id: string}>(snap: {docs: Array<{id:string;data:()=>Record<string,unknown>}>}): T[] {
  return snap.docs.map(d=>({ ...d.data(), id:d.id }) as T);
}
export function subscribeOrgs(uid: string, onData: (items: OrgRef[]) => void, onError: (msg:string)=>void) {
  return subscribed<OrgRef>(async()=>{
    const {db,dbSDK:s}=await getClient();
    return s.onSnapshot(s.collection(db,"users",uid,"orgRefs"), snap=>onData(list<OrgRef>(snap)), e=>onError(errorMessage(e)));
  },onData,onError);
}
export function subscribeOrgAssets(orgId:string,onData:(v:NetworkAsset[])=>void,onError:(v:string)=>void){
  return subscribed<NetworkAsset>(async()=>{
    const {db,dbSDK:s}=await getClient();
    return s.onSnapshot(s.collection(db,"organizations",orgId,"assets"),snap=>onData(list<NetworkAsset>(snap)),e=>onError(errorMessage(e)));
  },onData,onError);
}
export function subscribeOrgDevices(orgId:string,onData:(v:NetworkNode[])=>void,onError:(v:string)=>void){
  return subscribed<NetworkNode>(async()=>{
    const {db,dbSDK:s}=await getClient();
    return s.onSnapshot(s.collection(db,"organizations",orgId,"nodes"),snap=>onData(list<NetworkNode>(snap)),e=>onError(errorMessage(e)));
  },onData,onError);
}
export function subscribeOrgReadings(orgId:string,onData:(v:NetworkReading[])=>void,onError:(v:string)=>void){
  return subscribed<NetworkReading>(async()=>{
    const {db,dbSDK:s}=await getClient();
    return s.onSnapshot(s.query(s.collection(db,"organizations",orgId,"readings"),s.limit(100)),snap=>onData(list<NetworkReading>(snap)),e=>onError(errorMessage(e)));
  },onData,onError);
}
export function subscribeOrgEvents(orgId:string,onData:(v:NetworkEvent[])=>void,onError:(v:string)=>void){
  return subscribed<NetworkEvent>(async()=>{
    const {db,dbSDK:s}=await getClient();
    return s.onSnapshot(s.query(s.collection(db,"organizations",orgId,"events"),s.limit(100)),snap=>onData(list<NetworkEvent>(snap)),e=>onError(errorMessage(e)));
  },onData,onError);
}
export function subscribePublicIncidents(onData:(v:PublicIncident[])=>void,onError:(v:string)=>void){
  return subscribed<PublicIncident>(async()=>{
    const {db,dbSDK:s}=await getClient();
    return s.onSnapshot(s.query(s.collection(db,"publicIncidents"),s.limit(100)),snap=>onData(list<PublicIncident>(snap).filter(x=>x.status==="verified")),e=>onError(errorMessage(e)));
  },onData,onError);
}
export async function createOrganization(uid:string,name:string) {
  if(name.trim().length<3 || name.trim().length>80) throw new Error("Nombre de organización: 3 a 80 caracteres.");
  const {db,dbSDK:s,auth}=await getClient();
  if(auth.currentUser?.uid!==uid) throw new Error("Sesión inválida.");
  const id=crypto.randomUUID();
  const org=s.doc(db,"organizations",id);
  const batch=s.writeBatch(db);
  batch.set(org,{name:name.trim(),ownerUid:uid,createdAt:s.serverTimestamp()});
  batch.set(s.doc(db,"organizations",id,"members",uid),{uid,role:"owner",email:(auth.currentUser.email||"").toLowerCase(),joinedAt:s.serverTimestamp()});
  batch.set(s.doc(db,"users",uid,"orgRefs",id),{id,name:name.trim(),role:"owner"});
  await batch.commit();return id;
}
export async function createAsset(orgId:string,name:string,kind:AssetKind) {
  if(name.trim().length<3||name.trim().length>80)throw new Error("Nombre de activo: 3 a 80 caracteres.");
  const {db,dbSDK:s}=await getClient();
  const d=s.doc(s.collection(db,"organizations",orgId,"assets"));
  await s.setDoc(d,{name:name.trim(),kind,createdAt:s.serverTimestamp()});return d.id;
}
const serialCode:Record<AssetKind,string>={transporte:"TR",ambiental:"RI",sismico:"SI",seguridad:"SE"};
export function makeSerial(kind:AssetKind){
  const hex=Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();
  return `RVX-${serialCode[kind]}-${hex}`;
}
export async function createNode(orgId:string,asset:NetworkAsset,emitterUid:string,name:string) {
  if(!emitterUid.trim())throw new Error("Indica el UID del teléfono emisor autorizado.");
  const {db,dbSDK:s}=await getClient();
  const d=s.doc(s.collection(db,"organizations",orgId,"nodes"));
  const serial=makeSerial(asset.kind);
  await s.setDoc(d,{serial,name:name.trim().slice(0,80)||asset.name,kind:asset.kind,assetId:asset.id,
    emitterUid:emitterUid.trim(),status:"offline",createdAt:s.serverTimestamp(),updatedAt:s.serverTimestamp()});
  return serial;
}
export async function writePosition(orgId:string,node:NetworkNode,location:{lat:number;lng:number;accuracy:number},status:"online"|"offline") {
  const {db,dbSDK:s,auth}=await getClient();
  if(auth.currentUser?.uid!==node.emitterUid)throw new Error("Este nodo está asignado a otra cuenta emisora.");
  if(!Number.isFinite(location.lat)||Math.abs(location.lat)>90||!Number.isFinite(location.lng)||Math.abs(location.lng)>180||!Number.isFinite(location.accuracy)||location.accuracy<0)throw new Error("Coordenadas GPS inválidas.");
  await s.updateDoc(s.doc(db,"organizations",orgId,"nodes",node.id),{lat:location.lat,lng:location.lng,accuracy:location.accuracy,status,updatedAt:s.serverTimestamp()});
}
export async function writeOffline(orgId:string,node:NetworkNode) {
  const {db,dbSDK:s,auth}=await getClient();if(auth.currentUser?.uid!==node.emitterUid)return;
  await s.updateDoc(s.doc(db,"organizations",orgId,"nodes",node.id),{status:"offline",updatedAt:s.serverTimestamp()});
}
export async function createReading(orgId:string,node:NetworkNode,value:number,unit:string,note:string) {
  if(!Number.isFinite(value)||value<0||value>100000)throw new Error("Valor de medición no válido.");
  const {db,dbSDK:s}=await getClient();
  await s.addDoc(s.collection(db,"organizations",orgId,"readings"),{
    deviceId:node.id,kind:node.kind,value,unit,note:note.trim().slice(0,240),
    origin:"manual",createdAt:s.serverTimestamp()});
}
export async function createDraftEvent(orgId:string,title:string,kind:AssetKind,severity:"informativo"|"revision"){
  if(title.trim().length<8||title.length>140)throw new Error("Describe el evento entre 8 y 140 caracteres.");
  const {db,dbSDK:s,auth}=await getClient();
  await s.addDoc(s.collection(db,"organizations",orgId,"events"),{
    title:title.trim(),kind,severity,status:"draft",createdBy:auth.currentUser?.uid||"",createdAt:s.serverTimestamp()});
}
export async function createInvite(orgId:string,email:string,role:Exclude<NetworkRole,"owner">,orgName:string) {
  const address=email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw new Error("Correo no válido.");
  const {db,dbSDK:s,auth}=await getClient();
  const inv=s.doc(s.collection(db,"organizations",orgId,"invitations"));
  await s.setDoc(inv,{email:address,role,orgName:orgName.slice(0,80),status:"pending",createdBy:auth.currentUser?.uid||"",createdAt:s.serverTimestamp()});
  return `${window.location.origin}/?invitation=${encodeURIComponent(orgId+"."+inv.id)}#red`;
}
export async function acceptInvite(uid:string,raw:string) {
  const [orgId,inviteId]=raw.split(".");
  if(!orgId||!inviteId)throw new Error("Enlace de invitación incompleto.");
  const {db,dbSDK:s,auth}=await getClient();
  if(auth.currentUser?.uid!==uid||!auth.currentUser.emailVerified)throw new Error("Inicia sesión con un correo Google verificado.");
  const invRef=s.doc(db,"organizations",orgId,"invitations",inviteId);
  const inv=await s.getDoc(invRef);if(!inv.exists())throw new Error("Invitación inexistente.");
  const info=inv.data();const email=auth.currentUser.email?.toLowerCase();
  if(info.status!=="pending"||info.email!==email)throw new Error("La invitación no corresponde a esta cuenta o expiró.");
  if(typeof info.orgName!=="string"||!info.orgName.trim())throw new Error("Invitación no válida.");
  const role=info.role as NetworkRole;
  const batch=s.writeBatch(db);
  batch.update(invRef,{status:"accepted",acceptedBy:uid,acceptedAt:s.serverTimestamp()});
  batch.set(s.doc(db,"organizations",orgId,"members",uid),{uid,email,role,inviteId,joinedAt:s.serverTimestamp()});
  batch.set(s.doc(db,"users",uid,"orgRefs",orgId),{id:orgId,name:info.orgName,role});
  await batch.commit();
}
export async function readOrgMembers(orgId:string):Promise<NetworkMember[]>{
  const {db,dbSDK:s}=await getClient();
  return list<NetworkMember>(await s.getDocs(s.collection(db,"organizations",orgId,"members")));
}
export async function readPlatformAdmin():Promise<boolean>{
  const {auth}=await getClient();
  if(!auth.currentUser)return false;
  const token=await auth.currentUser.getIdTokenResult();
  return token.claims.platformAdmin===true;
}
export async function listAllOrgsForAdmin(){
  const {db,dbSDK:s}=await getClient();
  const snap=await s.getDocs(s.query(s.collection(db,"organizations"),s.limit(100)));
  return snap.docs.map(d=>({id:d.id,name:String(d.data().name||""),ownerUid:String(d.data().ownerUid||"")}));
}

export interface WatchZone {
 id: string; name: string; lat: number; lng: number; radiusKm: number; enabled: boolean;
}
export function subscribeWatchZones(uid:string,onData:(zones:WatchZone[])=>void,onError:(message:string)=>void){
 return subscribed<WatchZone>(async()=>{
  const {db,dbSDK:s}=await getClient();
  return s.onSnapshot(s.collection(db,"users",uid,"watchZones"),snap=>onData(list<WatchZone>(snap)),e=>onError(errorMessage(e)));
 },onData,onError);
}
export async function addWatchZone(uid:string, name:string,lat:number,lng:number,radiusKm:number) {
 if(!name.trim()||name.length>80||!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lng)||Math.abs(lng)>180||!Number.isFinite(radiusKm)||radiusKm<=0||radiusKm>100)throw new Error("Datos de zona inválidos.");
 const {db,dbSDK:s,auth}=await getClient();
 if(auth.currentUser?.uid!==uid)throw new Error("No autorizado.");
 await s.addDoc(s.collection(db,"users",uid,"watchZones"),{name:name.trim(),lat,lng,radiusKm,enabled:true,createdAt:s.serverTimestamp()});
}
export async function removeWatchZone(uid:string,zoneId:string) {
 const {db,dbSDK:s,auth}=await getClient();if(auth.currentUser?.uid!==uid)throw new Error("No autorizado.");
 await s.deleteDoc(s.doc(db,"users",uid,"watchZones",zoneId));
}
export function distanceKm(a:{lat:number;lng:number},b:{lat:number;lng:number}){
 const toRad=Math.PI/180;
 const dlat=(b.lat-a.lat)*toRad,dlng=(b.lng-a.lng)*toRad;
 const h=Math.sin(dlat/2)**2+Math.cos(a.lat*toRad)*Math.cos(b.lat*toRad)*Math.sin(dlng/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
export function isIncidentInZone(incident:PublicIncident,zone:WatchZone){
 if(incident.status!=="verified"||!zone.enabled||!Number.isFinite(incident.lat)||!Number.isFinite(incident.lng)||!Number.isFinite(incident.radiusKm))return false;
 // Overlap approximation for visualization ONLY, not a hydrological or shaking-intensity model.
 return distanceKm({lat:incident.lat!,lng:incident.lng!},zone)<=incident.radiusKm!+zone.radiusKm;
}
