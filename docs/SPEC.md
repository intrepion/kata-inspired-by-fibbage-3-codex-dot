# Velvet Bluff specification and decisions

User brief: original Fibbage 3-inspired browser party game, public repository, MIT license, OS ignores, authoritative local multiplayer, original factual prompts, tests, native acceptance, CI and running loopback preview.

The user explicitly chose recommended defaults and no optional questions. This overrides interview/seam-confirmation steps in Grill with Docs/TDD. Resolved decisions:

- Original midnight-blue, cream, coral and brass lounge, system fonts, CSS ornament and original synthesized chime. No proprietary questions or assets.
- One shared host with a capability token; 2–8 private player controllers with distinct capability tokens; public spectator display without controls.
- One ephemeral room per process, four-character code, polling, per-tab session storage reconnect. No accounts/database.
- Two round-one questions, two doubled round-two questions, one tripled two-blank finale. Categories rotate between players; picker chooses among three unused prompts.
- Lobby → category → write → vote → likes → reveal → next question → finished. All submissions/votes/likes advance early. Deadline progression handles missing/disconnected players; host can continue during reveal.
- Identity, phase epoch, deadline, duplicate votes and own-answer votes are server-validated. Truth and normalized aliases are rejected. Matching bluffs merge, share full credit, and are excluded for every coauthor. Missing bluffs create no player answer; house decoys pad ballots. No penalty for selecting house decoys.
- 1000 truth points per blank, 500 per person fooled for each coauthor, 5 per applause for each bluff coauthor; multipliers 1/2/3. Ties share victory/applause award.
- Explicitly a short standard-mode-inspired subset. No Enough About You, audience, proprietary media, exact full question count/parity or public deployment.
- Test seams requested in brief: Game commands/projections with injected clock/RNG; HTTP capability/static boundary; isolated browser clients and visible interface.

Acceptance: host and distinct private controllers complete all questions, hide submissions until voting, exclude own answers, reveal who fooled whom, reconnect a locked controller and restart with the same seats.
