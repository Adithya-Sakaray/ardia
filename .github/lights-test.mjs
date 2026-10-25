import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { launch, session, sleep } from "../scripts/lib/instance.mjs";

const appPath = resolve(process.argv[2]);
const out = resolve("logs");
mkdirSync(out, { recursive: true });
const data = join(mkdtempSync(join(tmpdir(), "ac-lights-")), "data");

const fixture = session({
  profiles: [{ id: "default", name: "Personal", color: "plum" }],
  settings: { tabLayout: "sidebar", sidebarSide: "right", addressBar: "sidebar" },
  windows: [{ id: "w1", tabIds: ["t1", "t2"], activeTabIds: { default: "t2" }, frame: [40, 60, 900, 640], createdAt: 1 }],
  tabs: [
    { id: "t1", windowId: "w1", url: "https://example.com/", title: "Example", lastActiveAt: 1 },
    { id: "t2", windowId: "w1", url: "https://en.wikipedia.org/wiki/Main_Page", title: "Wikipedia", lastActiveAt: 2 },
  ],
});

const HELPERS = `
const C = globalThis.expo.modules.ArdiaCEF;
const st = () => ac.store.getState();
const win = (id) => C.chromeWindows().then((ws) => { const f = st().windows[id].frame; const w = ws.filter((w) => w.hasRoot).find((w) => { const r = w.frame.match(/[-\\d.]+/g).map(Number); return Math.abs(r[0] - f[0]) < 2 && Math.abs(r[2] - f[2]) < 2; }) ?? ws.find((w) => w.hasRoot); return w && w.window; });
const act = (id, a) => win(id).then((n) => C.devWindow(n, a));
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
`;
let app;
const run = (body) => app.eval(`${HELPERS}\n${body}`);

const summary = (json) => {
  const views = JSON.parse(json);
  return views.map((v) => {
    const lines = [`chain: ${v.chain.slice(0, 4).map((c) => `${c.class} ${c.inWindow}`).join(" | ")}`];
    const walk = (t, depth) => {
      lines.push(`${"  ".repeat(depth)}view ${t.class} frame ${t.frame} inWindow ${t.inWindow} flipped ${t.flipped}`);
      const layer = (l, d) => {
        if (!l || !l.class) return;
        lines.push(`${"  ".repeat(d)}layer ${l.class} frame ${l.frame} shown ${l.shown} bounds ${l.bounds} ty ${l.ty} subTy ${l.subTy} flipped ${l.flipped}`);
        for (const s of l.subs ?? []) layer(s, d + 1);
      };
      layer(t.layer, depth + 1);
      for (const s of t.subs ?? []) walk(s, depth + 1);
    };
    walk(v.tree, 0);
    return lines.join("\n");
  }).join("\n\n");
};

const record = async (label) => {
  const frames = await run(`return act("w1", "pageFrames");`);
  const js = await run(`return { frame: st().windows.w1.frame, side: st().settings.sidebarSide, active: st().windows.w1.activeTabIds };`);
  writeFileSync(join(out, `${label}.json`), frames);
  const text = `# ${label}\n${JSON.stringify(js)}\n${summary(frames)}\n`;
  writeFileSync(join(out, `${label}.txt`), text);
  console.log(text);
  try { execFileSync("screencapture", ["-x", join(out, `${label}.png`)]); } catch (e) { console.log("screencapture failed", e.message); }
};

const lights = async (label) => {
  const state = await run(`return act("w1", "lights");`);
  writeFileSync(join(out, `${label}-lights.json`), state);
  const j = JSON.parse(state);
  console.log(`# ${label} center ${j.center} inGroup ${j.inGroup} mouse ${j.mouseInWindow} mini ${j.miniScreen}`);
  for (const a of j.areas) console.log(`  area ${a}`);
  for (const b of j.buttons) console.log(`  button ${b.kind} inWindow ${b.inWindow} hidden ${b.hidden} alpha ${b.alpha} layerOpacity ${b.layerOpacity} tx ${b.tx} ty ${b.ty} | ${b.chain[0]}`);
  for (const v of j.frameSubviews) console.log(`  frame subview ${v}`);
  try { execFileSync("screencapture", ["-x", "-R", "0,40,1024,200", join(out, `${label}.png`)]); } catch (e) { console.log("screencapture failed", e.message); }
};
const cycle = async (label) => {
  await run(`globalThis.__acLights.w1.show(); return settle(700);`);
  await lights(`${label}-open`);
  await run(`globalThis.__acLights.w1.hide(); return settle(1000);`);
  await lights(`${label}-closed`);
};

try {
  app = await launch(appPath, { data, session: fixture, env: { ARDIA_TRAFFIC_LIGHTS_LOG: join(out, "traffic-lights.log") } });
  console.log(`pid ${app.pid}`);
  await sleep(15000);
  try { execFileSync("osascript", ["-e", `tell application "System Events" to set frontmost of (first process whose unix id is ${app.pid}) to true`]); } catch (e) { console.log("front failed", e.message); }
  await sleep(1500);
  console.log(await run(`return Object.keys(globalThis.__acLights ?? {});`));
  const start = JSON.parse(await run(`return act("w1", "lights");`));
  console.log("selectors", JSON.stringify(start.groupSelectors));
  const mouse = (x, y) => console.log(execFileSync("swift", [".github/mouse.swift", String(x), String(y)]).toString().trim());
  const page = [400, 400];
  const video = spawn("screencapture", ["-v", "-V", "60", "-x", join(out, "lights-bar.mov")], { stdio: "inherit" });
  await sleep(2000);
  for (const mode of ["on", "off"]) {
    console.log("tracking refresh", await run(`return act("w1", "trackingRefresh:${mode}");`));
    for (let i = 1; i <= 2; i++) {
      mouse(...page);
      await run(`globalThis.__acLights.w1.show(); return settle(700);`);
      const mini = JSON.parse(await run(`return act("w1", "lights");`)).miniScreen.split(",").map(Number);
      mouse(mini[0], mini[1]);
      await sleep(600);
      await lights(`${mode}-${i}-moved-onto`);
      mouse(...page);
      await sleep(1200);
      mouse(mini[0], mini[1]);
      await run(`globalThis.__acLights.w1.show(); return settle(900);`);
      await lights(`${mode}-${i}-arrived-under`);
      mouse(...page);
      await sleep(1200);
    }
  }
  await new Promise((r) => video.on("exit", r));
  await record("pages");
} finally {
  if (app) await app.quit({ graceful: false }).catch(() => {});
}
