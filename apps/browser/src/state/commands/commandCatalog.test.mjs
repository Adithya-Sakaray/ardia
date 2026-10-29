import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const { COMMANDS, shortcutSources, staticShortcutSources } = await import("./commandCatalog.ts");
const { formatShortcut } = await import("./shortcuts.ts");

const { TABLE_FILES, renderSwift, renderUnion } = await import("../../../scripts/command-tables.mjs");

const swift = readFileSync(new URL("../../../../../packages/shell/ios/MainMenu.swift", import.meta.url), "utf8");

test("the generated BrowserCommand union and Swift command table match the catalog (node apps/browser/scripts/command-tables.mjs)", () => {
  assert.equal(readFileSync(TABLE_FILES.union, "utf8"), renderUnion());
  assert.equal(readFileSync(TABLE_FILES.swift, "utf8"), renderSwift());
});

test("no two shortcut ids share a default key", () => {
  const holders = new Map();
  for (const source of staticShortcutSources()) {
    for (const key of source.keys) holders.set(formatShortcut(key), [...(holders.get(formatShortcut(key)) ?? []), source.id]);
  }
  assert.deepEqual([...holders].filter(([, ids]) => ids.length > 1), []);
});

test("profiles get ⌃1 to ⌃9 in order, as the Profiles menu numbers them", () => {
  const ids = Array.from({ length: 10 }, (_, i) => `p${i}`);
  const keys = new Map(shortcutSources(ids, []).map((s) => [s.id, s.keys.map(formatShortcut)]));
  assert.deepEqual(keys.get("switchProfile:p0"), ["⌃1"]);
  assert.deepEqual(keys.get("switchProfile:p8"), ["⌃9"]);
  assert.deepEqual(keys.get("switchProfile:p9"), []);
  assert.ok(swift.includes(`key: i < 9 ? "\\(i + 1)" : "", .control)`), "MainMenu.swift still numbers profiles with ⌃");
});

test("the app-wide commands are exactly the ones the app integration runs, so the window router never acts on them", () => {
  const source = readFileSync(new URL("../app/appIntegration.ts", import.meta.url), "utf8");
  const body = source.slice(source.indexOf("function runAppCommand("), source.indexOf("export async function sendFeedback"));
  const handled = [...body.matchAll(/case "(\w+)":/g)].map((m) => m[1]).sort();
  const appWide = Object.entries(COMMANDS).filter(([, spec]) => spec.app).map(([command]) => command).sort();
  assert.deepEqual(appWide, handled);
});
