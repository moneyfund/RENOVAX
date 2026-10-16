import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, where, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const config={
 apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
 projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
 storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
 messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
 appId:import.meta.env.VITE_FIREBASE_APP_ID,
};
export const firebaseReady=Boolean(config.apiKey&&config.projectId&&config.appId);
const app=firebaseReady?(getApps()[0]||initializeApp(config)):null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
export const login=()=>{if(!auth)throw new Error('Configura Firebase primero.');return signInWithPopup(auth,new GoogleAuthProvider());};
export const logout=()=>auth?signOut(auth):Promise.resolve();
export const observeUser=(callback)=>auth?onAuthStateChanged(auth,callback):()=>{};
export const observeDevices=(uid,callback,onError)=>db?onSnapshot(query(collection(db,'devices'),where('ownerUid','==',uid)),snap=>callback(snap.docs.map(d=>({id:d.id,...d.data()}))),onError):()=>{};
export const observeObservations=(uid,callback,onError)=>db?onSnapshot(query(collection(db,'observations'),where('ownerUid','==',uid)),snap=>callback(snap.docs.map(d=>({id:d.id,...d.data()}))),onError):()=>{};
export async function publishDevice(uid,deviceId,payload){if(!db||!uid)throw new Error('Inicia sesión para sincronizar.');await setDoc(doc(db,'devices',`${uid}_${deviceId}`),{...payload,ownerUid:uid,deviceId,updatedAt:serverTimestamp()},{merge:true});}
export async function publishObservation(uid,record){if(!db||!uid)throw new Error('Inicia sesión para sincronizar.');await addDoc(collection(db,'observations'),{...record,ownerUid:uid,createdAt:serverTimestamp()});}
