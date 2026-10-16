import {spawnSync} from "node:child_process";
import {writeFileSync} from "node:fs";
const type=spawnSync("npx",["tsc","-b","--pretty","false"],{encoding:"utf8",shell:process.platform==="win32"});
const log=(type.stdout||"")+(type.stderr||"");
writeFileSync("public/build-diagnostics.txt",log||"NO TYPECHECK ERRORS");
console.log("Captured TypeScript diagnostics: "+(log.length)+" bytes; exit "+type.status);
const vite=spawnSync("npx",["vite","build"],{stdio:"inherit",shell:process.platform==="win32"});
if(vite.status!==0)process.exit(vite.status||1);
const sw=spawnSync("node",["scripts/build-sw.mjs"],{stdio:"inherit"});process.exit(sw.status||0);
