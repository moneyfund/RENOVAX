import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import vm from "node:vm";
const manifest = JSON.parse(
  await readFile("dist/manifest.webmanifest", "utf8"),
);
for (const icon of manifest.icons) {
  assert.ok((await stat("dist" + icon.src)).size > 0);
}
const handlers = new Map(),
  deleted = [],
  cached = [];
const context = {
  self: {
    location: { origin: "https://renovax.example" },
    clients: { claim: async () => {} },
    addEventListener: (name, fn) => handlers.set(name, fn),
    skipWaiting: () => {},
  },
  caches: {
    keys: async () => ["another-app", "renovax-shell-v1", "renovax-os-old"],
    delete: async (name) => deleted.push(name),
    open: async () => ({
      addAll: async (urls) => cached.push(...urls),
      match: async (url) => (url === "/index.html" ? "offline-shell" : null),
    }),
  },
  URL,
  fetch: () => {
    throw new Error("Network should not be used in this case");
  },
  Promise,
};
vm.runInNewContext(await readFile("dist/sw.js", "utf8"), context);
let wait;
handlers.get("install")({
  waitUntil: (promise) => {
    wait = promise;
  },
});
await wait;
assert.ok(cached.includes("/index.html"));
assert.ok(cached.some((p) => p.includes("CameraPanel") && p.endsWith(".js")));
assert.ok(cached.some((p) => p.includes("GeoMap") && p.endsWith(".js")));
assert.ok(cached.every((p) => p.startsWith("/") && !p.startsWith("//")));
for (const path of cached) assert.ok((await stat("dist" + path)).size > 0);
handlers.get("activate")({
  waitUntil: (promise) => {
    wait = promise;
  },
});
await wait;
assert.deepEqual(deleted, ["renovax-shell-v1", "renovax-os-old"]);
let response;
handlers.get("fetch")({
  request: { url: "https://renovax.example/", method: "GET", mode: "navigate" },
  respondWith: (p) => {
    response = p;
  },
});
assert.equal(await response, "offline-shell");
let intercepted = false;
for (const url of [
  "https://firestore.googleapis.com/private",
  "https://renovax.example/api/private",
])
  handlers.get("fetch")({
    request: { url, method: "GET", mode: "cors" },
    respondWith: () => {
      intercepted = true;
    },
  });
assert.equal(intercepted, false);
const headers = JSON.parse(
  await readFile("vercel.json", "utf8"),
).headers.flatMap((rule) => rule.headers);
assert.ok(
  headers.some(
    (h) =>
      h.key === "Content-Security-Policy" &&
      h.value.includes("object-src 'none'"),
  ),
);
console.log(
  `Build verified: ${cached.length} offline resources, installed icons, cache upgrade isolation and no private-response caching.`,
);
