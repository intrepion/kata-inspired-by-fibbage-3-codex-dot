const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const mode = location.pathname.slice(1),
  key = mode === "host" ? "vb-host" : "vb-player";
let auth = sessionStorage.getItem(key) || "",
  state = null,
  last = "",
  selected = [],
  like = null,
  sound = false,
  audio,
  receivedAt = Date.now();
const drafts = new Map();
function chime() {
  if (!sound) return;
  audio ??= new AudioContext();
  const o = audio.createOscillator(),
    g = audio.createGain();
  o.connect(g);
  g.connect(audio.destination);
  o.frequency.setValueAtTime(330, audio.currentTime);
  o.frequency.exponentialRampToValueAtTime(660, audio.currentTime + 0.18);
  g.gain.setValueAtTime(0.08, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.4);
  o.start();
  o.stop(audio.currentTime + 0.4);
}
$("#sound").onclick = () => {
  sound = !sound;
  $("#sound").textContent = sound ? "Sound on" : "Sound off";
  chime();
};
function error(e) {
  $("#error").textContent = e.message;
  setTimeout(() => ($("#error").textContent = ""), 5500);
}
async function action(action, data = {}) {
  const r = await fetch("/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth,
    },
    body: JSON.stringify({ action, epoch: state?.epoch, ...data }),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error);
  if (b.token) {
    auth = b.token;
    sessionStorage.setItem(key, auth);
  }
  await poll();
  return b;
}
function bind(name, fn) {
  document.querySelectorAll(`[data-action="${name}"]`).forEach(
    (el) =>
      (el.onclick = async () => {
        try {
          await fn(el);
        } catch (e) {
          error(e);
        }
      }),
  );
}
const button = (text, act, cls = "") =>
  `<button type="button" class="${cls}" data-action="${act}">${text}</button>`;
function scores() {
  return `<table class="scoreboard"><tbody>${[...state.players]
    .sort((a, b) => b.score - a.score)
    .map(
      (p, i) =>
        `<tr><td>${i + 1}</td><td>${esc(p.name)} ${p.bot ? "· BOT" : ""}<div class="small">${p.likes} applause</div></td><td>${p.score.toLocaleString()}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}
function roster() {
  return `<div class="roster">${state.players.map((p) => `<div class="person"><div class="avatar">${esc(p.name.slice(0, 1))}</div><div><strong>${esc(p.name)}</strong><small>${p.bot ? "TEST BOT" : p.connected ? "IN THE LOUNGE" : "RECONNECTING"}${p.submitted && state.phase === "write" ? " · LOCKED" : ""}${p.voted && state.phase === "vote" ? " · VOTED" : ""}</small></div></div>`).join("")}</div>`;
}
function bar() {
  return `<div class="phasebar"><p class="eyebrow">${state.question === 5 ? "THE DOUBLE TAKE" : `ROUND ${state.question <= 2 ? "01" : "02"} · QUESTION ${state.question <= 2 ? state.question : state.question - 2}`} / ${state.multiplier}× POINTS</p><span class="timer" id="timer"></span></div>`;
}
function prompt() {
  return `<div class="prompt"><p class="eyebrow">${esc(state.prompt?.category)}</p><h2>${esc(state.prompt?.text).replaceAll("____", '<span class="blank">&nbsp;?&nbsp;</span>')}</h2></div>`;
}
function answerCards(rows) {
  return rows
    .map(
      (row, i) =>
        `<p class="eyebrow">${rows.length > 1 ? `BLANK ${i + 1}` : "THE SUSPECTS"}</p><div class="cards">${row.map((o) => `<div class="answer padded">${esc(o.text)}</div>`).join("")}</div>`,
    )
    .join("");
}
function reveal() {
  return `${prompt()}${state.reveal.rows.map((row, i) => `<p class="eyebrow">${state.reveal.rows.length > 1 ? `BLANK ${i + 1}` : "THE TRUTH & THE TALL TALES"}</p><div class="cards">${row.map((o) => `<div class="answer padded ${o.truth ? "truth" : ""}"><span class="tag">${o.truth ? "THE TRUTH" : o.authors.length ? esc(o.authors.join(" + ")) : "HOUSE DECOY"}</span>${esc(o.text)}<p>${o.voters.length ? `${esc(o.voters.join(", "))} ${o.truth ? "found it" : "fell for it"}` : "No votes"}${o.likes ? ` · ${o.likes} applause` : ""}</p></div>`).join("")}</div>`).join("")}<div class="notice">${state.reveal.deltas.map((d) => `${esc(d.name)} +${d.points}`).join(" &nbsp; / &nbsp; ")}</div><p class="source">${esc(state.reveal.note)} <a href="${esc(state.reveal.source)}" target="_blank" rel="noopener">Fact check ↗</a></p>${mode === "host" ? button(state.question === 5 ? "Final standings →" : "Next question →", "next") : ""}`;
}
function render() {
  const focusId = document.activeElement?.id;
  document
    .querySelectorAll("input")
    .forEach((el) =>
      drafts.set(el.id, { value: el.value, checked: el.checked }),
    );
  const s = state;
  let html = "";
  if (!mode)
    html = `<div class="hero"><section><p class="eyebrow">THE LOUNGE IS OPEN · 2–8 PLAYERS</p><h1>A little truth.<br>A lovely <em>lie.</em></h1><p class="intro">Welcome to Velvet Bluff. Invent a convincing answer to a very strange fact. Fool your friends. Then find the truth hiding in plain sight.</p><div class="actions"><a class="button" href="/host">Host a lounge ↗</a><a class="button secondary" href="/play" target="_blank" rel="noopener">Join as a player</a></div><p class="small spaced">One shared display. A private controller tab for each player.<br>5 questions · 2 rounds + The Double Take finale</p></section><div class="seal">Trust your friends?<small>THAT’S YOUR FIRST MISTAKE.</small></div></div>`;
  else if (!auth)
    html =
      mode === "host"
        ? `<div class="controller"><p class="eyebrow">THE SHARED SCREEN</p><h1>Make room<br>for <em>mischief.</em></h1><p class="intro">Keep this screen where everyone can see it. Players enter their bluffs on separate controller tabs.</p>${button("Open the lounge", "host")}</div>`
        : `<div class="controller"><p class="eyebrow">YOUR PRIVATE CONTROLLER</p><h1>Slip into<br>the <em>lounge.</em></h1><form id="join"><label for="code">ROOM CODE</label><input id="code" name="code" maxlength="4" autocomplete="off" placeholder="ABCD" value="${esc(new URLSearchParams(location.search).get("room") || "")}" required><label for="name">YOUR NAME</label><input id="name" name="name" maxlength="18" autocomplete="nickname" placeholder="The believable one" required><div class="actions"><button type="submit">Take a seat →</button></div></form><p class="small">Use one controller tab per player. Reload this tab to reconnect. The host display is a separate role.</p></div>`;
  else if (s.phase === "lobby")
    html = `<div class="split"><section><p class="eyebrow">${mode === "host" ? "THE LOUNGE IS OPEN" : "YOU’RE IN, " + esc(s.me?.name)}</p><h1>Good company.<br><em>Bad alibis.</em></h1>${roster()}${!s.players.length ? '<div class="notice">Your table is waiting. Open private player tabs to join.</div>' : ""}${mode === "host" ? `<div class="actions">${button("Start the game →", "start")}${button("Add test bot", "bot", "secondary")}</div><label><input type="checkbox" id="quick"> Quick timers (20-second bluffs)</label><p class="small">At least two players. Bots are clearly labeled and choose automatically.<br>Standard: 60s bluff · 40s vote · 12s applause. Categories rotate between players.</p>` : '<div class="notice">Waiting for the host to start. Keep this controller private.</div>'}</section><aside><div class="room"><p>JOIN THE LOUNGE</p><div class="code">${s.code}</div><p><a href="/play?room=${s.code}" target="_blank" rel="noopener">Open a player controller ↗</a><br>${esc(location.origin + "/play")}</p></div><p class="small spaced">Find the truth: 1,000 points<br>Fool a friend: 500 points<br>Earn applause: 5 points<br>Round 2 doubles it. Finale triples it.</p></aside></div>`;
  else if (s.phase === "finished") {
    const ranked = [...s.players].sort((a, b) => b.score - a.score),
      winners = ranked.filter((p) => p.score === ranked[0].score),
      maxLikes = Math.max(...s.players.map((p) => p.likes));
    html = `<p class="eyebrow">THE LOUNGE HAS SPOKEN</p><h1>${esc(winners.map((p) => p.name).join(" & "))}<br><em>${winners.length > 1 ? "share the crown." : "takes the crown."}</em></h1>${scores()}<div class="notice">✦ Applause award: ${
      maxLikes
        ? esc(
            s.players
              .filter((p) => p.likes === maxLikes)
              .map((p) => p.name)
              .join(" & "),
          ) +
          " · " +
          maxLikes +
          " likes"
        : "No applause this time. A tough crowd."
    }</div>${mode === "host" ? button("Play again · return to lobby", "restart") : '<p class="small">The host can start another match. Your seat stays reserved.</p>'}`;
  } else {
    html = bar();
    if (s.phase === "category") {
      const chooser = s.players.find((p) => p.id === s.chooser);
      html += `<p class="eyebrow">THE NEXT UNLIKELY STORY</p><h1>Pick your<br><em>poison.</em></h1><p class="intro">${esc(chooser?.name)} is choosing a category.</p><div class="cards">${s.categories.map((c, i) => `<button type="button" class="category" data-id="${c.id}" data-action="choose" ${s.me?.id !== s.chooser ? "disabled" : ""}><small>FILE 0${i + 1} ↗</small>${esc(c.label)}</button>`).join("")}</div>`;
    } else if (s.phase === "reveal") html += reveal() + scores();
    else {
      html += prompt();
      if (mode === "host")
        html += `<div class="notice">${s.phase === "write" ? "Invent something believable on your private controller." : s.phase === "vote" ? "Find the real answer. You cannot vote for your own bluff." : "Give one answer a little applause. Likes earn a small bonus."}</div>${s.phase === "write" ? roster() : answerCards(s.options)}`;
      else if (s.phase === "write")
        html += s.me.answers
          ? `<div class="notice">Your bluff is locked. Keep a straight face.<br>${s.me.answers.map(esc).join(" / ")}</div>`
          : `<form id="bluff">${Array.from({ length: s.prompt.blanks }, (_, i) => `<label for="blank${i}">YOUR BELIEVABLE LIE${s.prompt.blanks > 1 ? " · BLANK " + (i + 1) : ""}</label><input id="blank${i}" name="blank${i}" maxlength="70" placeholder="It could almost be true…" required autocomplete="off">`).join("")}<div class="actions"><button type="submit">Lock my bluff →</button>${button("Write one for me", "help", "secondary")}</div></form><p class="small">Aim for plausible. If you enter the truth, you’ll be asked to try again. Identical bluffs share credit.</p>`;
      else if (s.phase === "vote")
        html += s.me.votes
          ? '<div class="notice">Vote locked. Prepare your poker face.</div>'
          : `${s.options.map((row, i) => `<p class="eyebrow">${s.options.length > 1 ? `BLANK ${i + 1} · ` : ""}WHICH ONE IS TRUE?</p><div class="stack">${row.map((o) => `<button type="button" class="answer ${selected[i] === o.id ? "selected" : ""}" data-action="select" data-row="${i}" data-id="${o.id}">${esc(o.text)} ${selected[i] === o.id ? "✓" : ""}</button>`).join("")}</div>`).join("")}<div class="actions">${button("Lock my vote →", "vote")}</div><p class="small">Your own bluff is excluded. Select one answer for each blank.</p>`;
      else if (s.phase === "likes")
        html += s.me.liked
          ? '<div class="notice">Applause sent. The truth is coming…</div>'
          : `<p class="intro">A good lie deserves applause. Pick one favorite answer, or skip.</p><div class="stack">${s.options
              .flat()
              .map(
                (o) =>
                  `<button type="button" class="answer ${like === o.id ? "selected" : ""}" data-action="favorite" data-id="${o.id}">♡ ${esc(o.text)}</button>`,
              )
              .join(
                "",
              )}</div><div class="actions">${button("Send applause", "like")}${button("Skip", "skip", "secondary")}</div>`;
    }
  }
  $("#app").className = mode === "play" ? "controller" : "";
  $("#app").innerHTML = html;
  bind("host", () => action("host"));
  bind("bot", () => action("bot"));
  bind("start", () => action("start", { quick: $("#quick").checked }));
  bind("choose", (el) => action("choose", { id: el.dataset.id }));
  bind("help", () => action("help"));
  bind("next", () => action("next"));
  bind("restart", () => action("restart"));
  bind("select", (el) => {
    selected[Number(el.dataset.row)] = el.dataset.id;
    render();
  });
  bind("vote", () => {
    if (selected.filter(Boolean).length !== s.options.length)
      throw new Error("Select an answer for every blank.");
    return action("vote", { votes: selected });
  });
  bind("favorite", (el) => {
    like = el.dataset.id;
    render();
  });
  bind("like", () => {
    if (!like) throw new Error("Select a favorite, or skip.");
    return action("like", { id: like });
  });
  bind("skip", () => action("like", { id: null }));
  if ($("#join"))
    $("#join").onsubmit = (e) => {
      e.preventDefault();
      action("join", {
        code: $("#code").value.trim().toUpperCase(),
        name: $("#name").value,
      }).catch(error);
    };
  if ($("#bluff"))
    $("#bluff").onsubmit = (e) => {
      e.preventDefault();
      action("submit", {
        answers: Array.from(
          { length: s.prompt.blanks },
          (_, i) => $("#blank" + i).value,
        ),
      }).catch(error);
    };
  document.querySelectorAll("input").forEach((el) => {
    const d = drafts.get(el.id);
    if (d) {
      el.value = d.value;
      el.checked = d.checked;
    }
  });
  if (focusId) document.getElementById(focusId)?.focus();
  updateTimer();
}
function updateTimer() {
  if ($("#timer") && state)
    $("#timer").textContent =
      Math.max(
        0,
        Math.ceil(
          (state.deadline - state.serverNow - (Date.now() - receivedAt)) / 1000,
        ),
      ) + "s";
}
let polling = false;
async function poll() {
  if (polling) return;
  polling = true;
  try {
    const r = await fetch("/api/state", {
      headers: { Authorization: "Bearer " + auth },
    });
    if (!r.ok) throw new Error("Connection lost");
    const s = await r.json();
    receivedAt = Date.now();
    $("#connection").textContent = "● LOCAL LOUNGE";
    if (
      auth &&
      ((mode === "play" && !s.me) || (mode === "host" && s.role !== "host"))
    ) {
      auth = "";
      sessionStorage.removeItem(key);
    }
    const comparable = JSON.stringify({ ...s, serverNow: 0 });
    const epochChanged = state && s.epoch !== state.epoch;
    if (epochChanged) {
      selected = [];
      like = null;
      drafts.clear();
      document
        .querySelectorAll("#bluff input")
        .forEach((el) => (el.value = ""));
      chime();
    }
    state = s;
    if (comparable !== last) {
      last = comparable;
      render();
    }
    updateTimer();
  } catch {
    $("#connection").textContent = "RECONNECTING…";
  } finally {
    polling = false;
  }
}
await poll();
setInterval(poll, 650);
setInterval(updateTimer, 200);
