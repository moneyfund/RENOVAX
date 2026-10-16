import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name !== "sw.js" && entry.name !== "robots.txt")
      files.push(path);
  }
}
await walk("dist");
files.sort();
const hash = createHash("sha256");
for (const file of files) {
  hash.update(file);
  hash.update(await readFile(file));
}
const version = hash.digest("hex").slice(0, 16),
  urls = files.map((f) => "/" + f.replace(/^dist\//, ""));
const source = `// Generated from the verified build. Private API responses and external maps are never cached.
const CACHE='renovax-os-${version}';
const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(name=>(name.startsWith('renovax-os-')||name==='renovax-shell-v1')&&name!==CACHE).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate'){
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match('/index.html'))||fetch(event.request)));return;
 }
 if(!ASSETS.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname))||fetch(event.request)));
});
`;
await writeFile("dist/sw.js", source);
console.log(`PWA: ${urls.length} local resources precached; build ${version}.`);
