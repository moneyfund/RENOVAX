/**
 * SERVER/OPERATOR-ONLY TOOL.
 * Requires authenticated Application Default Credentials with permission to
 * manage Firebase Auth. Never run in the browser or commit credential JSON.
 * Usage: ADMIN_UID=... GOOGLE_APPLICATION_CREDENTIALS=/secure/path.json npm run grant-admin
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const uid=process.env.ADMIN_UID;
if(!uid || !/^[a-zA-Z0-9_-]{6,128}$/.test(uid))throw new Error("Define ADMIN_UID con UID válido.");
if(!process.env.GOOGLE_APPLICATION_CREDENTIALS)throw new Error("Usa GOOGLE_APPLICATION_CREDENTIALS en entorno privado.");
initializeApp({credential:applicationDefault(),projectId:"renovax-5fbf0"});
const user=await getAuth().getUser(uid);
const claims={...(user.customClaims||{}),platformAdmin:true};
await getAuth().setCustomUserClaims(uid,claims);
console.log("RENOVAX platformAdmin otorgado al UID:",uid,"(el usuario debe refrescar el ID token)");
