# Research and fact-check ledger

Reviewed 2026-10-16. All prompts, decoys and interface copy are original writing. This file contains spoilers for the nine-prompt bank.

## Official mechanics research

- [Fibbage 3](https://www.jackboxgames.com/games/fibbage-3): 2–8 players, obscure fill-in-the-blank facts, player lies, truth voting, Thumbs Cup, Lie for Me, lounge-era presentation and separate Enough About You mode. The truth-and-lie-about-yourself final described on that page belongs to Enough About You.
- [Joining](https://support.jackboxgames.com/hc/en-us/articles/15794759479959-How-do-I-join-a-game): room code, player names, browser controllers, separate shared host.
- [Audience comparison](https://www.jackbox.studio/blog/how-audience-play-along-differs-in-each-jackbox-game): Fibbage 3 audience chooses a decoy then guesses truth. Audience omitted here.
- [Official two-player guide](https://www.jackboxgames.com/blog/the-best-2-player-jackbox-games-for-a-cheap-at-home-date-night): missing-detail trivia, convincing fake answers and points for fooling another player.
- [Fibbage 4](https://www.jackboxgames.com/games/fibbage-4) distinguishes its new final structure. This game does not use the Fibbage 4 same-lie-for-two-questions mechanic.

Official current pages do not fully specify all standard-mode scoring constants or final-round details. This implementation documents its own scoring and uses a two-blank final inspired by standard Fibbage 3 rather than claiming exact rule parity. Two answer fields and two ballots score independently.

## Original factual prompts

Each ID maps to `src/prompts.ts`. Decoys are invented false answers. Sources are displayed after reveal. The repository/ledger intentionally exposes the bank to maintainers; gameplay secrecy concerns ordinary clients, not source readers.

| ID | Answer | Evidence and scope |
|---|---|---|
| zoozve | Zoozve | [NASA Venus facts, naming section](https://science.nasa.gov/venus/venus-facts/): a poster artist misread handwritten “2002 VE”; name approved February 2024. |
| pancake | pancake | [NASA, Surface](https://science.nasa.gov/venus/venus-facts/): flat-topped volcanic pancake domes, up to 38 miles across. |
| tick | tick | [NASA, Surface](https://science.nasa.gov/venus/venus-facts/): volcanoes with radiating spurs nicknamed tick domes. |
| west | west | [NASA, Orbit and Rotation](https://science.nasa.gov/venus/venus-facts/): backward rotation makes the Sun rise in the west. |
| snow | snow | [Smithsonian, Diversity](https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives): vampire squid collect drifting particles called marine snow. |
| brain | brain | [Smithsonian, In the Food Web](https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives): esophagus passes through brain, requiring pulverized food. |
| copper | copper | [Smithsonian, Circulatory System](https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives): hemocyanin is copper-based. |
| bamboo | bamboo | [Smithsonian, Human Use and Conservation](https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives): historical account of Roman chefs avoiding iron knives for bamboo; the question attributes the account, not cooking advice. |
| final | three; blue | [Smithsonian, Circulatory System](https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives): two branchial hearts and one systemic heart; blue blood from copper-based oxygen transport. |

Answer matching folds case/accents and strips punctuation/spacing with curated aliases. It does not detect every paraphrase. Bank is small and repeats across matches.
