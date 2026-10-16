import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../dist/game.js";
function setup() {
  let time = 1000;
  const g = new Game(
      () => time,
      () => 0,
    ),
    a = g.join("Ada"),
    b = g.join("Bo"),
    c = g.join("Cy");
  g.start(g.hostToken);
  return {
    g,
    a,
    b,
    c,
    expire() {
      time = g.deadline;
      g.tick();
    },
    pass(ms) {
      time += ms;
      g.tick();
    },
  };
}
function write({ g, a }) {
  g.choose(a.token, g.choices[0].id, g.epoch);
}
test("private identity and truth stay outside host, spectator and other controller views", () => {
  const x = setup();
  write(x);
  const { g, a, b } = x;
  g.submit(a.token, ["a secret bluff"], g.epoch);
  for (const auth of ["", g.hostToken, b.token]) {
    const json = JSON.stringify(g.view(auth));
    assert.ok(!json.includes("a secret bluff"));
    assert.ok(!json.includes(g.prompt.answers[0]));
    assert.ok(!json.includes(a.token));
    assert.ok(!json.includes(g.hostToken));
  }
  assert.deepEqual(g.view(a.token).me.answers, ["a secret bluff"]);
  assert.throws(() => g.submit("fake", ["hello"], g.epoch), /session/);
});
test("truth aliases rejected; duplicate lies merge and exclude all their authors", () => {
  const x = setup();
  write(x);
  const { g, a, b, c } = x;
  assert.throws(
    () => g.submit(a.token, [g.prompt.answers[0].toUpperCase() + "!"], g.epoch),
    /truth/,
  );
  g.submit(a.token, ["A tall tale"], g.epoch);
  g.submit(b.token, ["a tall tale!"], g.epoch);
  g.submit(c.token, ["elsewhere"], g.epoch);
  assert.equal(g.phase, "vote");
  assert.equal(
    g.view(c.token).options[0].filter((o) => o.text === "A tall tale").length,
    1,
  );
  for (const p of [a, b])
    assert.ok(
      !g.view(p.token).options[0].some((o) => o.text === "A tall tale"),
    );
  const own = g.options[0].find((o) => o.authors.includes(a.id));
  assert.throws(() => g.vote(a.token, [own.id], g.epoch), /eligible/);
});
test("worked scoring: truth 1000, deception 500 per coauthor, applause 5; immutable votes", () => {
  const x = setup();
  write(x);
  const { g, a, b, c } = x;
  g.submit(a.token, ["same"], g.epoch);
  g.submit(b.token, ["same"], g.epoch);
  g.submit(c.token, ["other"], g.epoch);
  const truth = g.options[0].find((o) => o.truth).id,
    lie = g.options[0].find((o) => o.authors.includes(a.id)).id;
  g.vote(a.token, [truth], g.epoch);
  assert.throws(() => g.vote(a.token, [truth], g.epoch), /locked/);
  g.vote(b.token, [truth], g.epoch);
  g.vote(c.token, [lie], g.epoch);
  assert.equal(g.phase, "likes");
  assert.throws(() => g.like(a.token, lie, g.epoch), /another/);
  g.like(a.token, null, g.epoch);
  assert.throws(() => g.like(a.token, null, g.epoch), /locked/);
  g.like(b.token, null, g.epoch);
  g.like(c.token, lie, g.epoch);
  assert.deepEqual(
    g.players.map((p) => p.score),
    [1505, 1505, 0],
  );
  assert.deepEqual(
    g.players.map((p) => p.likes),
    [1, 1, 0],
  );
  assert.equal(g.reveal.rows[0].find((o) => o.id === lie).voters[0], "Cy");
});
test("deadlines, missing answers, late actions and replay epochs safely progress", () => {
  const x = setup(),
    { g, a } = x,
    old = g.epoch;
  x.expire();
  assert.equal(g.phase, "write");
  assert.throws(() => g.choose(a.token, "zoozve", old), /ended/);
  const writeEpoch = g.epoch;
  x.expire();
  assert.equal(g.phase, "vote");
  assert.throws(() => g.submit(a.token, ["late"], writeEpoch), /ended/);
  assert.equal(g.view(a.token).options[0].length, 4);
  x.expire();
  assert.equal(g.phase, "likes");
  x.expire();
  assert.equal(g.phase, "reveal");
  assert.deepEqual(
    g.players.map((p) => p.score),
    [0, 0, 0],
  );
  assert.throws(() => g.next(a.token), /Host/);
});
function complete(x) {
  const { g } = x;
  for (let q = 0; q < 5; q++) {
    if (g.phase === "category") x.expire();
    assert.equal(g.phase, "write");
    assert.equal(g.multiplier(), q < 2 ? 1 : q < 4 ? 2 : 3);
    for (const p of g.players)
      g.submit(
        p.token,
        g.prompt.answers.map((_, i) => `lie ${p.id} ${i}`),
        g.epoch,
      );
    for (const p of g.players)
      g.vote(
        p.token,
        g.options.map((row) => row.find((o) => o.truth).id),
        g.epoch,
      );
    for (const p of g.players) g.like(p.token, null, g.epoch);
    assert.equal(g.phase, "reveal");
    if (q === 4) assert.equal(g.reveal.rows.length, 2);
    g.next(g.hostToken);
  }
}
test("full deterministic five-question match, double finale and restart preserve seats", () => {
  const x = setup(),
    { g, a } = x;
  complete(x);
  assert.equal(g.phase, "finished");
  assert.deepEqual(
    g.players.map((p) => p.score),
    [12000, 12000, 12000],
  );
  g.restart(g.hostToken);
  assert.equal(g.phase, "lobby");
  assert.equal(g.view(a.token).me.id, a.id);
  assert.deepEqual(
    g.players.map((p) => p.score),
    [0, 0, 0],
  );
  assert.equal(g.view(a.token).me.answers, null);
});
test("reconnect preserves private state and identity; fresh join cannot take an existing name", () => {
  const x = setup(),
    { g, a } = x;
  write(x);
  g.submit(a.token, ["private"], g.epoch);
  const again = g.view(a.token);
  assert.equal(again.me.id, a.id);
  assert.deepEqual(again.me.answers, ["private"]);
  assert.throws(() => g.join("new"), /started/);
  const lobby = new Game();
  lobby.join("Ada");
  assert.throws(() => lobby.join("ada!"), /already/);
});
test("a normal replay restores normal durations after a quick match", () => {
  const x = setup(),
    { g } = x;
  complete(x);
  g.restart(g.hostToken);
  g.start(g.hostToken, true);
  assert.equal(g.durations.write, 20000);
  complete(x);
  g.restart(g.hostToken);
  g.start(g.hostToken, false);
  assert.deepEqual(g.durations, {
    category: 20000,
    write: 60000,
    vote: 40000,
    likes: 12000,
    reveal: 15000,
  });
  assert.equal(g.deadline - g.now(), 20000);
});
test("locked votes reconnect unchanged and disconnected seats do not stop deadlines", () => {
  const x = setup(),
    { g, a, b, c } = x;
  write(x);
  for (const [p, text] of [
    [a, "first"],
    [b, "second"],
    [c, "third"],
  ])
    g.submit(p.token, [text], g.epoch);
  const truth = g.options[0].find((o) => o.truth).id,
    epoch = g.epoch;
  g.vote(a.token, [truth], epoch);
  x.pass(9000);
  assert.equal(
    g.view(b.token).players.find((p) => p.id === a.id).connected,
    false,
  );
  const again = g.view(a.token);
  assert.equal(again.me.id, a.id);
  assert.deepEqual(again.me.votes, [truth]);
  assert.throws(() => g.vote(a.token, [truth], epoch), /locked/);
  x.expire();
  assert.equal(g.phase, "likes");
  x.expire();
  assert.equal(g.phase, "reveal");
  assert.equal(g.players.find((p) => p.id === a.id).score, 1000);
  assert.throws(() => g.vote(a.token, [truth], epoch), /ended/);
  assert.equal(g.view(a.token).me.id, a.id);
});
