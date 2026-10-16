import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Run the actual client functions without its automatic polling bootstrap.
const source = (
  await readFile(new URL("../public/app.js", import.meta.url), "utf8")
).replace(
  /await poll\(\);\s*setInterval\(poll, 650\);\s*setInterval\(updateTimer, 200\);\s*$/,
  "",
);

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

for (const [mode, actionName, storageKey] of [
  ["host", "host", "vb-host"],
  ["play", "join", "vb-player"],
]) {
  test(`${actionName} credential survives an older unauthenticated spectator response`, async () => {
    const oldResponse = deferred();
    const stateRequested = deferred();
    const storage = new Map();
    const elements = new Map();
    const actionRequests = [];
    const issuedToken = `issued-${mode}-capability`;
    const document = {
      activeElement: {},
      querySelector(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, {
            textContent: "",
            innerHTML: "",
            className: "",
          });
        }
        return elements.get(selector);
      },
      querySelectorAll() {
        return [];
      },
      getElementById() {
        return null;
      },
    };
    const context = vm.createContext({
      document,
      location: {
        pathname: `/${mode}`,
        origin: "http://127.0.0.1:5231",
        search: "",
      },
      sessionStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
      URLSearchParams,
      Date,
      Map,
      JSON,
      Math,
      setTimeout() {},
      async fetch(url, options) {
        if (url === "/api/state") {
          assert.equal(options.headers.Authorization, "Bearer ");
          stateRequested.resolve();
          return oldResponse.promise;
        }
        assert.equal(url, "/api/action");
        actionRequests.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({ token: issuedToken }) };
      },
    });
    vm.runInContext(source, context, { filename: "public/app.js" });

    // A scheduled spectator poll starts before the user claims a role.
    const pendingPoll = vm.runInContext("poll()", context);
    await stateRequested.promise;
    await vm.runInContext(
      `action(${JSON.stringify(actionName)}, { code: "ABCD", name: "Ada" })`,
      context,
    );
    assert.equal(actionRequests.length, 1);
    assert.equal(actionRequests[0].action, actionName);
    assert.equal(storage.get(storageKey), issuedToken);

    // Only now deliver the obsolete public state. It must not revoke the new role.
    oldResponse.resolve({
      ok: true,
      json: async () => ({
        role: "spectator",
        me: null,
        phase: "lobby",
        code: "ABCD",
        players: [],
        epoch: 0,
        serverNow: Date.now(),
      }),
    });
    await pendingPoll;
    assert.equal(storage.get(storageKey), issuedToken);
    assert.equal(vm.runInContext("auth", context), issuedToken);
  });
}
