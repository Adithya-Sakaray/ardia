import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the native launch reader expects the session.json version persist.ts writes", () => {
  const js = Number(read("./persist.ts").match(/const SESSION_VERSION = (\d+);/)[1]);
  const native = Number(read("../../../../../packages/ardiacore/ios/ArdiaSavedSession.mm").match(/\+ \(NSInteger\)version \{\s*return (\d+);/)[1]);
  assert.equal(native, js, "bump ArdiaSavedSession.version with SESSION_VERSION, and check the fields it reads still exist");
});
