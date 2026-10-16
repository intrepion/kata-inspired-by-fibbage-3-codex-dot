# Verification evidence

Validated 2026-10-16. The final recovered source was copied into a durable non-cloud directory and compared against its recovery copy before testing and native acceptance. Original Documents workspace files were preserved when macOS offloaded them to unreadable cloud placeholders. The final source, not the abandoned placeholder copy, is published in this repository.

## Automated evidence

- Strict TypeScript (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes), build and formatting checks.
- Nine Node engine/HTTP tests: private truth/submission projection, capability isolation, alias/truth rejection, merged duplicate bluffs and all-coauthor exclusion, independent literal scoring example, duplicate votes/likes, deadlines and missing answers, stale epochs, complete deterministic five-question/two-blank match, seat-preserving restart, quick-to-standard timer reset, locked bluff/vote reconnect, disconnected-seat deadline progression, host takeover/cross-origin denial and static source allowlist.
- Headless Playwright: separate host and three isolated player contexts, five-question match, draft preservation while another submits, helper-only submission, private answers, own-answer exclusion, bluff and vote reload, reveal, restart and standard timer reset after quick mode.
- Additional mobile layout check: 390×844 landing and controller join pages with horizontal overflow assertion and screenshots.
- Headless test reports and screenshots are uploaded by CI. Automated evidence is distinct from native acceptance below.

## Native Chrome acceptance — final durable build

Dedicated **Velvet Bluff QA** session; existing tabs, other game previews and saves left untouched. Shared browser slot was granted after Factorio released it.

1. Opened the host and two separate private controller tabs, joining fictional players Mira and Jules in room 9141.
2. Submitted Mira’s “cicada” privately, reloaded that controller, and verified the locked answer remained; host and Jules displayed no private text during writing.
3. Submitted Jules’s “beetle”; ballot excluded each author’s own bluff. Both deliberately chose the other player’s lie. Reloaded Mira after voting and verified the locked vote persisted.
4. Jules applauded Mira’s bluff. Reveal showed voters/authors and **Mira +505 / Jules +500**, with truth and source link. See [native reveal](evidence/native-reveal.png).
5. Completed four regular questions with rotating category picker and 1×/2× scores. In the two-blank 3× finale, each player submitted two bluffs and selected three/blue; each earned **6000** truth points.
6. Match result: **Mira 11,505; Jules 11,500**, Mira applause award. See [native final standings](evidence/native-finished.png).
7. Clicked Play again, verified lobby and same seats, reloaded Mira and verified waiting controller. Preview left in this replay-ready lobby.
8. All three dedicated game tabs marked as deliverables. Native Chrome **Cancel** clicked; subsequent AX diff verified Infobar Container/debugging control removed. This confirms detachment for this session, not any historical extension state.

Native full-match acceptance was repeated after source/UI reconstruction. Earlier pre-recovery screenshots are not used as evidence for the final build.

## Independent review

Matt Pocock code-review Standards and Spec agents independently reviewed the first implementation. They found quick timers persisting after replay and a helper button also submitting its form. Both are fixed with regressions. A reconnect coverage gap was filled with locked-vote and offline-deadline checks. Recovered engine was independently compared with original semantics; final source received a follow-up review. A large UI renderer remains a maintainability tradeoff for this small dependency-free application.

## Limits

Small nine-prompt bank; short standard-inspired subset; no Enough About You or audience. Server-memory-only rooms, no closed-tab capability recovery and no Internet deployment. Loopback only; phone/LAN play unavailable by default. These are documented limits, not tested capabilities.
