p = "apps/browser/scripts/tab-drag-test.mjs"
s = open(p).read()
anchor = "  const mid = (i) => Math.round((strip[i][0] + strip[i][1]) / 2);\n"
assert anchor in s
probe = '''  {
    const frame = await run(`return st().windows.w1.frame;`);
    const xs = [mid(2), mid(3), mid(4) + 75, strip[5][1] + 120, strip[5][1] + 150, strip[5][1] + 200];
    const hits = await run(`return win("w1").then((n) => Promise.all(${JSON.stringify(xs)}.map((x) => C.devWindow(n, "hit:" + x + ",21"))));`);
    const screens = await run(`return C.chromeWindows().then((ws) => ws.filter((w) => w.hasRoot).map((w) => w.frame));`);
    rep.say("PROBE " + JSON.stringify({ frame, strip, xs, hits, screens }));
  }
'''
s = s.replace(anchor, anchor + probe, 1)
old = '{ id: "w1", tabIds: ["p1", "p2", "t1", "t2", "t3", "t4"], activeTabIds: { default: "t1" }, frame: [80, 80, 1280, 800], createdAt: 1 }'
assert old in s
s = s.replace(old, old.replace("[80, 80, 1280, 800]", "[120, 80, 780, 600]"), 1)
open(p, "w").write(s)
