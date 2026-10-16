import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../dist/server.js";
import { Game } from "../dist/game.js";
test("HTTP boundary blocks source access, host takeover, cross-origin writes and forged identities", async () => {
  const g = new Game(),
    server = createServer(g);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (data, auth = "", origin) => {
    const r = await fetch(base + "/api/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth,
        ...(origin ? { Origin: origin } : {}),
      },
      body: JSON.stringify(data),
    });
    return { status: r.status, data: await r.json() };
  };
  try {
    const h = await post({ action: "host" });
    assert.equal(h.status, 200);
    assert.equal((await post({ action: "host" })).status, 400);
    assert.equal((await post({ action: "bot" }, "", base)).status, 400);
    assert.equal(
      (await post({ action: "bot" }, h.data.token, "https://evil.example"))
        .status,
      403,
    );
    const code = (await (await fetch(base + "/api/state")).json()).code;
    const a = await post({ action: "join", code, name: "Alpha" }),
      b = await post({ action: "join", code, name: "Beta" });
    assert.notEqual(a.data.token, b.data.token);
    assert.equal((await post({ action: "start" }, h.data.token)).status, 200);
    const s = await (
      await fetch(base + "/api/state", {
        headers: { Authorization: "Bearer " + a.data.token },
      })
    ).json();
    assert.equal(s.me.name, "Alpha");
    assert.equal(
      (
        await post(
          { action: "choose", id: s.categories[0].id, epoch: s.epoch },
          b.data.token,
        )
      ).status,
      400,
    );
    for (const path of [
      "/src/prompts.ts",
      "/dist/prompts.js",
      "/package.json",
      "/../src/game.ts",
      "/.git/config",
    ])
      assert.equal((await fetch(base + path)).status, 404);
    assert.equal((await fetch(base + "/")).status, 200);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
