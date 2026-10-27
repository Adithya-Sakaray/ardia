import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { launch, session, sleep } from "../scripts/lib/instance.mjs";

const appPath = resolve(process.argv[2]);
const out = resolve("logs");
mkdirSync(out, { recursive: true });
const data = join(mkdtempSync(join(tmpdir(), "ac-port-")), "data");
const fixture = session({
  profiles: [{ id: "default", name: "Personal", color: "plum" }],
  settings: { tabLayout: "sidebar", sidebarSide: "right", addressBar: "sidebar", commandBarPlacement: "field" },
  windows: [{ id: "w1", tabIds: ["t1", "t2"], activeTabIds: { default: "t2" }, frame: [40, 60, 900, 640], createdAt: 1 }],
  tabs: [
    { id: "t1", windowId: "w1", url: "https://example.com/", title: "Example", lastActiveAt: 1 },
    { id: "t2", windowId: "w1", url: "https://en.wikipedia.org/wiki/Main_Page", title: "Wikipedia", lastActiveAt: 2 },
  ],
});
const HELPERS = `const st = () => ac.store.getState(); const settle = (ms) => new Promise((r) => setTimeout(r, ms));`;
let app;
const run = (body) => app.eval(`${HELPERS}\n${body}`);
const shot = (name, region) => { try { execFileSync("screencapture", ["-x", ...(region ? ["-R", region] : []), join(out, `${name}.png`)]); } catch (e) { console.log("screencapture failed", e.message); } };
const results = [];
const note = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${name} ${detail}`); };

try {
  app = await launch(appPath, { data, session: fixture });
  console.log(`pid ${app.pid}`);
  await sleep(15000);
  try { execFileSync("osascript", ["-e", `tell application "System Events" to set frontmost of (first process whose unix id is ${app.pid}) to true`]); } catch (e) { console.log("front failed", e.message); }
  await sleep(1500);
  const side = await run(`return [st().settings.sidebarSide, st().windows.w1.frame, Object.keys(globalThis.__acLights ?? {})];`);
  note("the app starts with the sidebar on the right and the bar hook registered", side[0] === "right" && side[2].includes("w1"), JSON.stringify(side));
  shot("1-docked-right");
  const video = spawn("screencapture", ["-v", "-V", "40", "-x", join(out, "port.mov")], { stdio: "inherit" });
  await sleep(2000);
  for (let i = 1; i <= 3; i++) {
    await run(`globalThis.__acLights.w1.show(); return settle(900);`);
    shot(`2-bar-open-${i}`, "0,40,1024,200");
    await run(`globalThis.__acLights.w1.hide(); return settle(900);`);
  }
  const width = side[1][2];
  await run(`st().toggleSidebar("w1"); return settle(1200);`);
  await run(`return ac.shell.devSidebarEdgePointer("w1", { x: ${width} + 4, y: 300 }).then(() => settle(900));`);
  const peekRight = await run(`return !!globalThis.acLayout.peek.w1?.live;`);
  note("just past the right edge peeks the hidden sidebar", peekRight === true);
  shot("3-peek-right");
  await run(`return ac.shell.devSidebarEdgePointer("w1", { x: ${width / 2}, y: 300 }).then(() => settle(1200));`);
  await run(`return ac.shell.devSidebarEdgePointer("w1", { x: -4, y: 300 }).then(() => settle(900));`);
  const peekLeft = await run(`return !!globalThis.acLayout.peek.w1?.live;`);
  note("the left edge doesn't peek a right-hand sidebar", peekLeft === false);
  await run(`return ac.shell.devSidebarEdgePointer("w1", null).then(() => { st().toggleSidebar("w1"); return settle(1200); });`);
  shot("4-docked-again");
  await new Promise((r) => video.on("exit", r));
} finally {
  writeFileSync(join(out, "results.json"), JSON.stringify(results, null, 2));
  if (app) await app.quit({ graceful: false }).catch(() => {});
}
if (results.some((r) => !r.ok)) process.exit(1);
