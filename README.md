# Velvet Bluff

An original local multiplayer browser party game inspired by Fibbage 3. Invent plausible answers to unusual facts, fool friends and find the truth. Original writing, lounge design, CSS ornament and synthesized sound; no Jackbox assets or questions. This independent kata is not a Jackbox product.

## Play

Node.js 22+ and npm:

```sh
npm ci
npm run build
npm start
```

- Shared host: **http://127.0.0.1:5231/host**
- Private player: **http://127.0.0.1:5231/play**
- Introduction: **http://127.0.0.1:5231/**

Open the lounge on the host screen. Open a fresh controller tab per player, enter the room code and a unique name, then start with 2–8 players. Open tabs directly or from the host link; duplicating an already joined controller can copy its session storage and reconnect the same seat. Use **Add test bot** for solo testing; bots are clearly labeled and automatically submit/vote.

The server binds **127.0.0.1 only**. Phones on another device cannot connect with this default. No firewall, router, tunnel or security settings are changed. No public deployment. `PORT=5232 npm start` changes the local port. Preserve the original host tab, whose capability stays in per-tab session storage.

## Controls and rules

Use mouse, touch, Tab/Shift+Tab and Enter with labeled inputs/buttons. Sound is off initially; **Sound on** enables an original phase chime.

1. A rotating player selects one of three categories (20s).
2. Everyone writes a private believable lie (60s). Truth matches are rejected so you can try again. **Write one for me** supplies a prewritten bluff credited to that player.
3. Select truth from shuffled answers (40s). Own bluffs, including coauthored duplicates, are excluded. Each vote locks once.
4. Award one optional applause (12s), or skip. Own answers are excluded.
5. Reveal shows truth, authors, voters, score changes and a fact-check source. Host can continue or room advances after 15s.

Two questions in round one, two in round two, then **The Double Take**, with two blanks, two bluffs and two votes. Truth earns 1000 points per blank; every person fooled earns each bluff author 500; applause earns each bluff author 5. Round two doubles, finale triples. Duplicate normalized bluffs merge and share full credit. Missed submissions/votes earn no points; house decoys receive no player deception credit. Tied leaders share the crown and applause award. Quick timers use 15s category, 20s write/vote, 5s applause and 6s reveal. **Play again** returns to lobby, resets scores and preserves seats.

## Reconnect and authority

Reload the same player tab to keep identity and locked bluff/vote. Disconnected seats remain reserved and deadlines keep advancing. Server validates identity, epoch, deadline, duplicate commands and eligible votes. Truth and other private submissions are absent from public state until appropriate phases. Static routes never expose server source or question bank. Room code grants no host control.

One room lives in memory per server process. Server restart loses room/seats; reload host/controllers for new sessions. Closing a tab loses its capability. No persistence, account recovery, multi-room hosting or adversarial Internet hardening. The public repository and fact ledger reveal questions to maintainers/source readers; client secrecy cannot prevent source spoilers.

## Scope and limits

Complete short match of an explicitly limited **standard-mode-inspired subset**, not the entire Fibbage 3 product. Includes host/controllers, categories, escalating rounds, likes, double-blank finale, ties, restart and clearly labeled bots. Omits Enough About You, audience, special media/Russian/celebrity questions, exact full question count, exact undocumented rule parity and public deployment. Nine fact-checked prompts repeat between matches. Bots are test aids. Player text is unmoderated.

## Verify

```sh
npm run check
npm run format:check
npm test
npx playwright install chromium
npm run test:browser
```

Deterministic engine tests inject clock/RNG and check scoring, timing, transitions, secrecy, identity, duplicate answers, own-answer exclusion, reconnect and restart. HTTP tests check capabilities, same-origin writes and static allowlist. Headless tests use host plus three isolated player contexts through a complete match. GitHub Actions runs these checks and uploads browser evidence. [QA](docs/QA.md) distinguishes headless evidence from native Chrome acceptance. [Research](docs/RESEARCH.md) records official mechanics and factual sources. [Domain terms](CONTEXT.md) and [decisions](docs/SPEC.md) describe the implemented subset.

MIT licensed. Official github/gitignore Global Linux, Windows and macOS files are retained verbatim in `docs/gitignore` and included in `.gitignore`, followed by project ignores.
