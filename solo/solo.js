import { Game } from "./game.js";
const app = document.querySelector("#app");
const error = document.querySelector("#error");
const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let game,
  player,
  lastRevision = -1;
function start() {
  game = new Game();
  player = game.join("You");
  for (const name of ["Marlow", "Juniper", "Sol"]) game.join(name, true);
  game.start(game.hostToken);
  update(true);
}
function perform(fn) {
  try {
    error.textContent = "";
    fn();
    update(true);
  } catch (e) {
    error.textContent = e.message;
  }
}
function update(force = false) {
  if (!game) return;
  for (let i = 0; i < 4; i++) game.tick();
  const s = game.view(player.token);
  if (!force && game.revision === lastRevision) return;
  lastRevision = game.revision;
  const scores = `<div class="notice">${s.players.map((p) => `${esc(p.name)}${p.bot ? " · computer" : ""}: ${p.score}`).join(" &nbsp; / &nbsp; ")}</div>`;
  const header = `<p class="eyebrow">${s.question === 5 ? "THE DOUBLE TAKE" : `QUESTION ${s.question} OF 5`} · ${s.multiplier}× POINTS</p>`;
  const prompt = s.prompt
    ? `<p class="eyebrow">${esc(s.prompt.category)}</p><h2>${esc(s.prompt.text)}</h2>`
    : "";
  let body = "";
  if (s.phase === "category") {
    body = `<h2>Choose a category</h2><div class="cards">${s.categories.map((c) => `<button data-category="${esc(c.id)}">${esc(c.label)}</button>`).join("")}</div>`;
  } else if (s.phase === "write") {
    body = `${prompt}<p>Write a convincing bluff for each blank.</p><form id="bluff">${Array.from({ length: s.prompt.blanks }, (_, i) => `<label>Bluff ${i + 1}<input name="answer${i}" maxlength="70" required autocomplete="off"></label>`).join("")}<button type="submit">Lock in bluff →</button></form>`;
  } else if (s.phase === "vote") {
    body = `${prompt}<p>Find the truth. Your own bluff is hidden.</p><form id="vote">${s.options.map((row, i) => `<fieldset><legend>Blank ${i + 1}</legend>${row.map((o) => `<label class="answer padded"><input type="radio" name="vote${i}" value="${esc(o.id)}" required> ${esc(o.text)}</label>`).join("")}</fieldset>`).join("")}<button type="submit">Lock in vote →</button></form>`;
  } else if (s.phase === "likes") {
    body = `${prompt}<p>Give applause to another answer, or skip.</p><div class="cards">${s.options
      .flat()
      .map((o) => `<button data-like="${esc(o.id)}">${esc(o.text)}</button>`)
      .join("")}</div><button id="skip">Skip applause</button>`;
  } else if (s.phase === "reveal") {
    body = `${prompt}${s.reveal.rows.map((row, i) => `<p class="eyebrow">${s.reveal.rows.length > 1 ? `BLANK ${i + 1}` : "THE TRUTH & THE TALL TALES"}</p><div class="cards">${row.map((o) => `<div class="answer padded ${o.truth ? "truth" : ""}"><span class="tag">${o.truth ? "THE TRUTH" : o.authors.length ? esc(o.authors.join(" + ")) : "HOUSE DECOY"}</span>${esc(o.text)}<p>${esc(o.voters.join(", ") || "No votes")}</p></div>`).join("")}</div>`).join("")}<p>${esc(s.reveal.note)} <a href="${esc(s.reveal.source)}" target="_blank" rel="noopener">Fact check ↗</a></p><button id="next">${s.question === 5 ? "Final standings →" : "Next question →"}</button>`;
  } else if (s.phase === "finished") {
    body = `<h2>Final standings</h2>${scores}<button id="again">Play again</button>`;
  }
  app.innerHTML =
    header +
    (s.phase === "finished" ? "" : scores) +
    body +
    '<p class="small">Solo mode runs in this browser with three computer opponents. Refreshing starts a new match; the separate local multiplayer mode remains available from the repository.</p>';
  app
    .querySelectorAll("[data-category]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        perform(() => game.choose(player.token, el.dataset.category, s.epoch)),
      ),
    );
  app.querySelector("#bluff")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    perform(() =>
      game.submit(
        player.token,
        Array.from({ length: s.prompt.blanks }, (_, i) => f.get(`answer${i}`)),
        s.epoch,
      ),
    );
  });
  app.querySelector("#vote")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    perform(() =>
      game.vote(
        player.token,
        s.options.map((_, i) => f.get(`vote${i}`)),
        s.epoch,
      ),
    );
  });
  app
    .querySelectorAll("[data-like]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        perform(() => game.like(player.token, el.dataset.like, s.epoch)),
      ),
    );
  app
    .querySelector("#skip")
    ?.addEventListener("click", () =>
      perform(() => game.like(player.token, null, s.epoch)),
    );
  app
    .querySelector("#next")
    ?.addEventListener("click", () => perform(() => game.next(game.hostToken)));
  app.querySelector("#again")?.addEventListener("click", start);
}
app.innerHTML =
  '<p class="eyebrow">SOLO LOUNGE</p><h1>Truth is stranger.<br><em>Bluff beautifully.</em></h1><p class="intro">Play five rounds of facts, fibs and applause against three computer opponents. No account or server needed.</p><button id="start">Start solo game →</button>';
app.querySelector("#start").addEventListener("click", start);
setInterval(() => update(), 250);
