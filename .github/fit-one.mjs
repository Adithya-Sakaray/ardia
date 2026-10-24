import { readFileSync, writeFileSync } from "node:fs";
import { fitSymbols } from "../apps/demo/scripts/icons/fit.mjs";
import { computeNudges } from "../apps/demo/scripts/icons/nudge.mjs";
import { layersFor } from "../apps/demo/scripts/icons/layers.mjs";

const name = process.argv[2];
const file = new URL("../apps/demo/src/shims/web/symbols/data.ts", import.meta.url);
const WEIGHTS = ["light", "regular", "medium", "semibold", "bold"];
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const fits = await fitSymbols([name]);
const nudges = computeNudges(fits, [name]);
const entry = fits[name];
console.log(`${name}: ${entry.layers.map((l) => l.src).join(" + ")} (${entry.perWeight.regular.exact.toFixed(3)})`);

let ts = readFileSync(file, "utf8");
const bodiesStart = ts.indexOf("const BODIES: readonly string[] = [\n");
const bodiesEnd = ts.indexOf("\n];\n", bodiesStart);
const bodyLines = ts.slice(bodiesStart, bodiesEnd).split("\n").slice(1);
const bodies = bodyLines.map((l) => JSON.parse(l.trim().replace(/,$/, "")));
const encoded = layersFor(entry).map((layer) => {
  const body = layer.body.replace(/\s+/g, " ").replace(/> </g, "><").trim();
  let index = bodies.indexOf(body);
  if (index < 0) {
    index = bodies.length;
    bodies.push(body);
    ts = ts.slice(0, bodiesEnd) + `\n  ${JSON.stringify(body)},` + ts.slice(bodiesEnd);
    console.log(`new body ${index}`);
  }
  return [index, layer.viewBox, layer.paint === "stroke" ? 0 : 1, layer.opacity ?? 1, layer.knockout ?? 0, WEIGHTS.map((w) => layer.fits[w].map((n) => +n.toFixed(4)))];
});
const { NUDGE_WEIGHTS } = await import("../apps/demo/scripts/icons/nudge.mjs");
const row = `  ${JSON.stringify(name)}: "${NUDGE_WEIGHTS.map((w) => nudges[name][w].map(([x, y]) => DIGITS[x + 12] + DIGITS[y + 12]).join("")).join("")}",`;
const insert = (marker, line) => {
  const start = ts.indexOf(marker);
  const end = ts.indexOf("\n};\n", start);
  const lines = ts.slice(start, end).split("\n");
  const head = lines.shift();
  const kept = lines.filter((l) => !l.startsWith(`  ${JSON.stringify(name)}:`));
  kept.push(line);
  kept.sort((a, b) => JSON.parse(a.trim().split(":")[0]) < JSON.parse(b.trim().split(":")[0]) ? -1 : 1);
  ts = ts.slice(0, start) + [head, ...kept].join("\n") + ts.slice(end);
};
insert("const ENCODED: Record<string, readonly EncodedLayer[]> = {", `  ${JSON.stringify(name)}: ${JSON.stringify(encoded)},`);
insert("const NUDGES: Record<string, string> = {", row);
writeFileSync(file, ts);
