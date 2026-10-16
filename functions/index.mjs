/**
 * Verified public incident approval — trusted backend, NOT a browser function.
 * Requires Cloud Functions deployment in Firebase and an operator whose ID
 * token has platformAdmin=true. Does NOT convert sensor readings into alerts.
 */
import {onCall,HttpsError} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore,FieldValue} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
initializeApp();
const db=getFirestore();
function must(condition,message){if(!condition)throw new HttpsError("invalid-argument",message);}
function clean(v,max){return typeof v==="string"?v.trim().slice(0,max):"";}
function validCoord(lat,lng){return Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lng)&&Math.abs(lng)<=180;}
function distanceKm(a,b){const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLng=(b.lng-a.lng)*r;
 const h=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLng/2)**2;return 12742*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export const approvePublicIncident=onCall({region:"us-central1",enforceAppCheck:true},async req=>{
 if(!req.auth || req.auth.token.platformAdmin!==true)throw new HttpsError("permission-denied","Acceso restringido a administradores RENOVAX.");
 const d=req.data||{};
 const title=clean(d.title,140),detail=clean(d.detail,1200),source=clean(d.source,180),sourceUrl=clean(d.sourceUrl,500),kind=d.kind;
 must(title.length>=10 && detail.length>=30 && source.length>=5,"El boletín requiere título, contexto y fuente.");
 must(["ambiental","sismico"].includes(kind),"Tipo de incidente no autorizado.");
 must(/^https:\/\//.test(sourceUrl),"Incluye enlace HTTPS de fuente verificable.");
 must(validCoord(d.lat,d.lng) && Number.isFinite(d.radiusKm) && d.radiusKm>0 && d.radiusKm<=100,"Define zona validada de afectación.");
 must(d.humanReviewed===true && clean(d.reviewNote,400).length>=20,"Se requiere revisión humana y justificación explícita.");
 const ref=db.collection("publicIncidents").doc();
 await ref.create({title,detail,source,sourceUrl,kind,lat:d.lat,lng:d.lng,radiusKm:d.radiusKm,
  status:"verified",reviewNote:clean(d.reviewNote,400),approvedBy:req.auth.uid,publishedAt:FieldValue.serverTimestamp(),
  expireAt: new Date(Date.now()+24*3600000)});
 await db.collection("platformAudit").add({action:"public_incident_approved",incidentId:ref.id,actorUid:req.auth.uid,createdAt:FieldValue.serverTimestamp()});
 return {incidentId:ref.id};
});
/**
 * Geofence fan-out is intentionally restricted to opt-in subscribers with
 * server-issued push tokens. It supports a CIRCULAR APPROXIMATION only and is
 * not a certified flood/sismo hazard propagation model. This first version
 * caps work and requires supervised small-scale pilots.
 */
export const dispatchVerifiedIncident=onDocumentCreated({
 document:"publicIncidents/{incidentId}",region:"us-central1",retry:false
},async event=>{
 const d=event.data?.data();if(!d||d.status!=="verified"||!validCoord(d.lat,d.lng))return;
 const zones=await db.collectionGroup("watchZones").where("enabled","==",true).limit(1500).get();
 const audience=new Set();
 for(const doc of zones.docs){
  const z=doc.data();if(!validCoord(z.lat,z.lng)||!(z.radiusKm>0&&z.radiusKm<=100))continue;
  if(distanceKm(d,z)<=d.radiusKm+z.radiusKm){
   // users/{uid}/watchZones/{zoneId}
   const userRef=doc.ref.parent.parent;
   if(userRef?.parent.id==="users")audience.add(userRef.id);
  }
 }
 const tokens=[];
 for(const uid of audience){
  const snapshot=await db.collection("users").doc(uid).collection("pushTokens").limit(5).get();
  for(const tokenDoc of snapshot.docs){
   const token=tokenDoc.data();
   if(token.consent===true && typeof token.token==="string")tokens.push(token.token);
  }
 }
 let sent=0;
 for(let i=0;i<tokens.length;i+=500){
  const slice=tokens.slice(i,i+500);
  const result=await getMessaging().sendEachForMulticast({
   tokens:slice,
   notification:{title:"RENOVAX · "+d.title,body:"Boletín validado. Consulta fuentes oficiales y el mapa en RENOVAX."},
   data:{incidentId:event.params.incidentId,kind:d.kind,url:"https://renovax-rho.vercel.app/#alertas"}
  });
  sent+=result.successCount;
 }
 await db.collection("platformAudit").add({action:"public_incident_dispatched",incidentId:event.params.incidentId,
   matchingAccounts:audience.size,tokens:tokens.length,successful:sent,createdAt:FieldValue.serverTimestamp()});
});
