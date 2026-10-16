import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Game } from "./game.js";
export function createServer(game = new Game()) {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
    );
    const reply = (status: number, data: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const auth = req.headers.authorization?.replace(/^Bearer /, "") ?? "";
      if (url.pathname === "/api/state" && req.method === "GET") {
        game.tick();
        reply(200, game.view(auth));
        return;
      }
      if (url.pathname === "/api/action" && req.method === "POST") {
        const origin = req.headers.origin;
        if (origin && origin !== `http://${req.headers.host}`) {
          reply(403, { error: "Cross-origin action denied." });
          return;
        }
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          reply(415, { error: "Send JSON." });
          return;
        }
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 4096) {
            reply(413, { error: "Request too large." });
            return;
          }
        }
        const b = JSON.parse(raw) as Record<string, unknown>;
        game.tick();
        switch (b.action) {
          case "host": {
            if (game.phase !== "lobby" || game.players.length)
              throw new Error(
                "Host already reserved. Open the saved host tab.",
              );
            if (hostClaimed) throw new Error("Host already reserved.");
            hostClaimed = true;
            reply(200, { token: game.hostToken });
            return;
          }
          case "join":
            if (b.code !== game.code) throw new Error("Room code not found.");
            reply(200, game.join(b.name));
            return;
          case "bot":
            game.host(auth);
            game.join(
              `BOT ${game.players.filter((p) => p.bot).length + 1}`,
              true,
            );
            break;
          case "start":
            game.start(auth, b.quick === true);
            break;
          case "choose":
            game.choose(auth, b.id, b.epoch);
            break;
          case "submit":
            game.submit(auth, b.answers, b.epoch);
            break;
          case "help":
            game.help(auth, b.epoch);
            break;
          case "vote":
            game.vote(auth, b.votes, b.epoch);
            break;
          case "like":
            game.like(auth, b.id, b.epoch);
            break;
          case "next":
            game.next(auth);
            break;
          case "restart":
            game.restart(auth);
            break;
          default:
            throw new Error("Unknown action.");
        }
        reply(200, { ok: true });
        return;
      }
      if (req.method !== "GET") {
        reply(405, { error: "Method not allowed." });
        return;
      }
      const files: Record<string, string> = {
        "/": "index.html",
        "/host": "index.html",
        "/play": "index.html",
        "/app.js": "app.js",
        "/style.css": "style.css",
      };
      const file = files[url.pathname];
      if (!file) {
        reply(404, { error: "Not found." });
        return;
      }
      const data = await readFile(new URL(`./public/${file}`, import.meta.url));
      res.writeHead(200, {
        "Content-Type": file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : "text/html",
      });
      res.end(data);
    } catch (e) {
      reply(400, {
        error: e instanceof Error ? e.message : "Invalid request.",
      });
    }
  });
  let hostClaimed = false;
  const timer = setInterval(() => game.tick(), 250);
  server.on("close", () => clearInterval(timer));
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 5231);
  const server = createServer();
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Velvet Bluff host: http://127.0.0.1:${port}/host\nPlayer controllers: http://127.0.0.1:${port}/play`,
    ),
  );
}
