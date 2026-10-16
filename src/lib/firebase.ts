import type { DeviceRecord, Observation, SessionUser } from "@/types";
import { isObservation } from "./storage";
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const firebaseReady = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);
async function initialize() {
  if (!firebaseReady)
    throw new Error("La conexión de datos aún no está configurada.");
  const [appSDK, authSDK, dbSDK] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]);
  const app = appSDK.getApps()[0] || appSDK.initializeApp(config);
  const auth = authSDK.getAuth(app);
  // Keep the user's Google session across reloads in normal browser sessions.
  // Storage-restricted browsers may reject persistence; Auth can still run.
  try {
    await authSDK.setPersistence(auth, authSDK.browserLocalPersistence);
  } catch {
    // Do not block login when storage access is restricted.
  }
  return {
    auth,
    db: dbSDK.getFirestore(app),
    authSDK,
    dbSDK,
  };
}
let client: ReturnType<typeof initialize> | undefined;
const getClient = () =>
  (client ??= initialize().catch((error) => {
    client = undefined;
    throw error;
  }));
export async function login() {
  const { auth, authSDK } = await getClient();
  const provider = new authSDK.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    return await authSDK.signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await authSDK.signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}
export async function logout() {
  if (firebaseReady) {
    const { auth, authSDK } = await getClient();
    await authSDK.signOut(auth);
  }
}
function subscribe(
  start: () => Promise<() => void>,
  onError: (e: unknown) => void,
) {
  let stopped = false;
  let unsubscribe = () => {};
  void start()
    .then((fn) => {
      if (stopped) fn();
      else unsubscribe = fn;
    })
    .catch((e) => {
      if (!stopped) onError(e);
    });
  return () => {
    stopped = true;
    unsubscribe();
  };
}
export function observeUser(
  callback: (u: SessionUser | null) => void,
  onError: (e: unknown) => void,
) {
  if (!firebaseReady) {
    callback(null);
    return () => {};
  }
  return subscribe(async () => {
    const { auth, authSDK } = await getClient();
    // Finalize pending redirect sign-ins so the observer restores Google profiles.
    void authSDK.getRedirectResult(auth).catch(onError);
    return authSDK.onAuthStateChanged(auth, callback, onError);
  }, onError);
}
export function observeDevices(
  uid: string,
  callback: (d: DeviceRecord[]) => void,
  onError: (e: unknown) => void,
) {
  return subscribe(async () => {
    const { db, dbSDK: s } = await getClient();
    return s.onSnapshot(
      s.query(
        s.collection(db, "devices"),
        s.where("ownerUid", "==", uid),
        s.limit(200),
      ),
      (snap) =>
        callback(
          snap.docs
            .map((doc) => {
              const d = doc.data();
              return {
                ...d,
                id: doc.id,
                name:
                  typeof d.name === "string"
                    ? d.name.slice(0, 80)
                    : "Dispositivo RENOVAX",
                updatedAt: d.updatedAt?.toMillis?.() ?? 0,
              } as DeviceRecord;
            })
            .filter(
              (d) => d.ownerUid === uid && typeof d.deviceId === "string",
            ),
        ),
      onError,
    );
  }, onError);
}
export function observeObservations(
  uid: string,
  callback: (o: Observation[]) => void,
  onError: (e: unknown) => void,
) {
  return subscribe(async () => {
    const { db, dbSDK: s } = await getClient();
    return s.onSnapshot(
      s.query(
        s.collection(db, "observations"),
        s.where("ownerUid", "==", uid),
        s.limit(150),
      ),
      (snap) => {
        const records: unknown[] = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
          cloud: true,
        }));
        callback(records.filter(isObservation).sort((a, b) =>
          Date.parse(b.localTime) - Date.parse(a.localTime),
        ).slice(0, 100));
      },
      onError,
    );
  }, onError);
}
export type DevicePayload = Pick<
  DeviceRecord,
  "name" | "module" | "status" | "lat" | "lng" | "accuracy" | "motion"
>;
export async function publishDevice(
  uid: string,
  deviceId: string,
  payload: DevicePayload,
) {
  const { db, dbSDK: s, auth } = await getClient();
  if (auth.currentUser?.uid !== uid)
    throw new Error("Inicia sesión para sincronizar.");
  await s.setDoc(
    s.doc(db, "devices", `${uid}_${deviceId}`),
    { ...payload, ownerUid: uid, deviceId, updatedAt: s.serverTimestamp() },
    { merge: true },
  );
}
export async function markDeviceOffline(uid: string, deviceId: string) {
  const { db, dbSDK: s, auth } = await getClient();
  if (auth.currentUser?.uid !== uid) return;
  await s.updateDoc(s.doc(db, "devices", `${uid}_${deviceId}`), {
    status: "offline",
    updatedAt: s.serverTimestamp(),
  });
}
export async function publishObservation(uid: string, record: Observation) {
  const { db, dbSDK: s, auth } = await getClient();
  if (auth.currentUser?.uid !== uid)
    throw new Error("Inicia sesión para sincronizar.");
  const { id, cloud: _cloud, ...data } = record;
  await s.setDoc(s.doc(db, "observations", id), {
    ...data,
    ownerUid: uid,
    createdAt: s.serverTimestamp(),
  });
}

/** Firebase Storage para archivos privados. Nunca se inicializa sin sesión. */
export async function getAuthorizedStorage() {
  const { auth } = await getClient();
  const user = auth.currentUser;
  if (!user) throw new Error("Inicia sesión para acceder a Storage.");
  const { getStorage } = await import("firebase/storage");
  return { storage: getStorage(auth.app), ownerUid: user.uid };
}
