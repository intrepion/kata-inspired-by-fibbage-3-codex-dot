import { randomBytes, randomInt } from "node:crypto";
import { prompts, type Prompt } from "./prompts.js";
export const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const token = () => randomBytes(24).toString("hex");
export type Phase =
  "lobby" | "category" | "write" | "vote" | "likes" | "reveal" | "finished";
interface Player {
  id: string;
  token: string;
  name: string;
  score: number;
  likes: number;
  bot: boolean;
  seen: number;
  answers: string[] | null;
  votes: string[] | null;
  like: string | null;
  liked: boolean;
}
interface Option {
  id: string;
  text: string;
  authors: string[];
  truth: boolean;
  system: boolean;
}
const normalDurations = () => ({
  category: 20000,
  write: 60000,
  vote: 40000,
  likes: 12000,
  reveal: 15000,
});
export class Game {
  code = randomBytes(3).toString("hex").slice(0, 4).toUpperCase();
  hostToken = token();
  players: Player[] = [];
  phase: Phase = "lobby";
  deadline = 0;
  revision = 0;
  question = 0;
  epoch = 0;
  prompt: Prompt | null = null;
  choices: Prompt[] = [];
  used = new Set<string>();
  options: Option[][] = [];
  reveal: unknown = null;
  durations = normalDurations();
  constructor(
    public now = () => Date.now(),
    public rng = (n: number) => randomInt(n),
  ) {}
  fail(message: string): never {
    throw new Error(message);
  }
  touch() {
    this.revision++;
  }
  player(auth: string) {
    return (
      this.players.find((p) => p.token === auth) ??
      this.fail(
        "Player session not found. Rejoin from your original controller.",
      )
    );
  }
  join(name: unknown, bot = false) {
    if (this.phase !== "lobby")
      this.fail("The match has started. Existing players can reconnect.");
    if (this.players.length >= 8) this.fail("The lounge is full (8 players).");
    if (typeof name !== "string" || !name.trim() || name.trim().length > 18)
      this.fail("Use a name of 1–18 characters.");
    if (this.players.some((p) => normalize(p.name) === normalize(name)))
      this.fail("That name is already in the lounge.");
    const p: Player = {
      id: token().slice(0, 12),
      token: token(),
      name: name.trim(),
      score: 0,
      likes: 0,
      bot,
      seen: this.now(),
      answers: null,
      votes: null,
      like: null,
      liked: false,
    };
    this.players.push(p);
    this.touch();
    return { token: p.token, id: p.id };
  }
  host(auth: string) {
    if (auth !== this.hostToken)
      this.fail("Host control requires the host session.");
  }
  setPhase(phase: Phase) {
    this.phase = phase;
    this.epoch++;
    this.deadline =
      phase === "lobby" || phase === "finished"
        ? 0
        : this.now() + this.durations[phase];
    this.touch();
  }
  start(auth: string, quick = false) {
    this.host(auth);
    if (this.phase !== "lobby") this.fail("Already started.");
    if (this.players.length < 2)
      this.fail("Invite at least two players, or add a test bot.");
    this.durations = quick
      ? {
          category: 15000,
          write: 20000,
          vote: 20000,
          likes: 5000,
          reveal: 6000,
        }
      : normalDurations();
    this.question = 0;
    this.select();
  }
  select() {
    this.players.forEach((p) => {
      p.answers = null;
      p.votes = null;
      p.like = null;
      p.liked = false;
    });
    this.options = [];
    this.reveal = null;
    if (this.question === 4) {
      this.prompt = prompts.find((p) => p.id === "final")!;
      this.setPhase("write");
      return;
    }
    this.prompt = null;
    this.choices = this.shuffle(
      prompts.filter((p) => p.id !== "final" && !this.used.has(p.id)),
    ).slice(0, 3);
    this.setPhase("category");
  }
  shuffle<T>(a: T[]) {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.rng(i + 1);
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }
  choose(auth: string, id: unknown, epoch: unknown) {
    const p = this.player(auth);
    this.guard("category", epoch);
    if (p.id !== this.players[this.question % this.players.length]!.id)
      this.fail("Another player is choosing.");
    this.pick(id);
  }
  pick(id: unknown) {
    const p =
      this.choices.find((x) => x.id === id) ??
      this.fail("Choose an offered category.");
    this.prompt = p;
    this.used.add(p.id);
    this.setPhase("write");
  }
  guard(phase: Phase, epoch: unknown) {
    if (this.now() >= this.deadline) this.tick();
    if (this.phase !== phase || epoch !== this.epoch)
      this.fail("That phase has ended.");
  }
  submit(auth: string, answers: unknown, epoch: unknown) {
    const p = this.player(auth);
    this.guard("write", epoch);
    if (p.answers) this.fail("Your bluff is already locked.");
    if (
      !Array.isArray(answers) ||
      answers.length !== this.prompt!.answers.length ||
      !answers.every(
        (a) =>
          typeof a === "string" &&
          a.trim().length > 0 &&
          a.trim().length <= 70 &&
          normalize(a),
      )
    )
      this.fail("Fill each blank with 1–70 letters or numbers.");
    const clean = answers.map((a) => (a as string).trim());
    if (
      clean.some((a, i) =>
        [this.prompt!.answers[i]!, ...this.prompt!.aliases[i]!].some(
          (t) => normalize(t) === normalize(a),
        ),
      )
    )
      this.fail("Too close to the truth! Write a different bluff.");
    p.answers = clean;
    this.touch();
    if (this.players.every((x) => x.answers)) this.openVote();
  }
  help(auth: string, epoch: unknown) {
    const p = this.player(auth);
    this.guard("write", epoch);
    const answers = this.prompt!.decoys.map(
      (list, i) =>
        list.find(
          (a) =>
            !this.players.some(
              (x) =>
                x.answers?.[i] && normalize(x.answers[i]!) === normalize(a),
            ),
        ) ?? list[0]!,
    );
    this.submit(p.token, answers, epoch);
  }
  openVote() {
    this.options = this.prompt!.answers.map((truth, i) => {
      const list: Option[] = [
        {
          id: token().slice(0, 12),
          text: truth,
          authors: [],
          truth: true,
          system: false,
        },
      ];
      for (const p of this.players) {
        const text = p.answers?.[i];
        if (!text) continue;
        const exists = list.find((o) => normalize(o.text) === normalize(text));
        if (exists) exists.authors.push(p.id);
        else
          list.push({
            id: token().slice(0, 12),
            text,
            authors: [p.id],
            truth: false,
            system: false,
          });
      }
      for (const text of this.prompt!.decoys[i]!) {
        if (list.length >= 4) break;
        if (!list.some((o) => normalize(o.text) === normalize(text)))
          list.push({
            id: token().slice(0, 12),
            text,
            authors: [],
            truth: false,
            system: true,
          });
      }
      return this.shuffle(list);
    });
    this.setPhase("vote");
  }
  vote(auth: string, votes: unknown, epoch: unknown) {
    const p = this.player(auth);
    this.guard("vote", epoch);
    if (p.votes) this.fail("Your vote is already locked.");
    if (
      !Array.isArray(votes) ||
      votes.length !== this.options.length ||
      !votes.every((id, i) =>
        this.options[i]!.some((o) => o.id === id && !o.authors.includes(p.id)),
      )
    )
      this.fail("Choose one eligible answer for each blank.");
    p.votes = votes as string[];
    this.touch();
    if (this.players.every((x) => x.votes)) this.setPhase("likes");
  }
  like(auth: string, id: unknown, epoch: unknown) {
    const p = this.player(auth);
    this.guard("likes", epoch);
    if (p.liked) this.fail("Your applause is already locked.");
    if (
      id !== null &&
      !this.options.flat().some((o) => o.id === id && !o.authors.includes(p.id))
    )
      this.fail("Choose another player’s answer.");
    p.like = id as string | null;
    p.liked = true;
    this.touch();
    if (this.players.every((x) => x.liked)) this.score();
  }
  multiplier() {
    return this.question < 2 ? 1 : this.question < 4 ? 2 : 3;
  }
  score() {
    const m = this.multiplier(),
      delta = new Map(this.players.map((p) => [p.id, 0]));
    const rows = this.options.map((list) =>
      list.map((o) => {
        const voters = this.players.filter((p) => p.votes?.includes(o.id));
        for (const p of voters) {
          if (o.truth) delta.set(p.id, delta.get(p.id)! + 1000 * m);
          else
            for (const author of o.authors)
              delta.set(author, delta.get(author)! + 500 * m);
        }
        const fans = this.players.filter((p) => p.like === o.id);
        for (const author of o.authors) {
          const p = this.players.find((x) => x.id === author)!;
          p.likes += fans.length;
          delta.set(author, delta.get(author)! + fans.length * 5 * m);
        }
        return {
          id: o.id,
          text: o.text,
          truth: o.truth,
          system: o.system,
          authors: o.authors.map(
            (id) => this.players.find((p) => p.id === id)!.name,
          ),
          voters: voters.map((p) => p.name),
          likes: fans.length,
        };
      }),
    );
    for (const p of this.players) p.score += delta.get(p.id)!;
    this.reveal = {
      rows,
      source: this.prompt!.source,
      note: this.prompt!.note,
      deltas: this.players.map((p) => ({
        name: p.name,
        points: delta.get(p.id),
      })),
    };
    this.setPhase("reveal");
  }
  next(auth: string) {
    this.host(auth);
    if (this.phase !== "reveal") this.fail("Continue after the reveal.");
    this.advance();
  }
  advance() {
    this.question++;
    if (this.question >= 5) this.setPhase("finished");
    else this.select();
  }
  restart(auth: string) {
    this.host(auth);
    if (this.phase !== "finished") this.fail("Restart after the match.");
    this.used.clear();
    this.prompt = null;
    this.options = [];
    this.reveal = null;
    this.question = 0;
    for (const p of this.players) {
      p.score = 0;
      p.likes = 0;
      p.answers = null;
      p.votes = null;
      p.like = null;
      p.liked = false;
    }
    this.setPhase("lobby");
  }
  tick() {
    if (this.deadline && this.now() >= this.deadline) {
      switch (this.phase) {
        case "category":
          this.pick(this.choices[0]!.id);
          break;
        case "write":
          this.openVote();
          break;
        case "vote":
          this.setPhase("likes");
          break;
        case "likes":
          this.score();
          break;
        case "reveal":
          this.advance();
          break;
      }
    }
    for (const p of this.players.filter((p) => p.bot)) {
      try {
        if (
          this.phase === "category" &&
          this.players[this.question % this.players.length] === p
        )
          this.choose(p.token, this.choices[0]!.id, this.epoch);
        else if (this.phase === "write" && !p.answers)
          this.help(p.token, this.epoch);
        else if (this.phase === "vote" && !p.votes)
          this.vote(
            p.token,
            this.options.map((list) => {
              const eligible = list.filter((o) => !o.authors.includes(p.id));
              return eligible[this.rng(eligible.length)]!.id;
            }),
            this.epoch,
          );
        else if (this.phase === "likes" && !p.liked)
          this.like(p.token, null, this.epoch);
      } catch {
        /* A bot racing a phase transition waits until the next tick. */
      }
    }
  }
  view(auth = "") {
    const p = this.players.find((x) => x.token === auth);
    if (p) p.seen = this.now();
    const isHost = auth === this.hostToken;
    return {
      code: this.code,
      phase: this.phase,
      epoch: this.epoch,
      deadline: this.deadline,
      serverNow: this.now(),
      question: this.question + 1,
      multiplier: this.multiplier(),
      role: isHost ? "host" : p ? "player" : "spectator",
      players: this.players.map((x) => ({
        id: x.id,
        name: x.name,
        score: x.score,
        likes: x.likes,
        bot: x.bot,
        connected: x.bot || this.now() - x.seen < 8000,
        submitted: !!x.answers,
        voted: !!x.votes,
      })),
      chooser:
        this.players[this.question % Math.max(1, this.players.length)]?.id,
      categories:
        this.phase === "category"
          ? this.choices.map((x) => ({ id: x.id, label: x.category }))
          : [],
      prompt: this.prompt
        ? {
            text: this.prompt.text,
            category: this.prompt.category,
            blanks: this.prompt.answers.length,
          }
        : null,
      options: ["vote", "likes"].includes(this.phase)
        ? this.options.map((list) =>
            list
              .filter((o) => !p || !o.authors.includes(p.id))
              .map((o) => ({ id: o.id, text: o.text })),
          )
        : [],
      me: p
        ? {
            id: p.id,
            name: p.name,
            answers: p.answers,
            votes: p.votes,
            liked: p.liked,
          }
        : null,
      reveal: ["reveal", "finished"].includes(this.phase) ? this.reveal : null,
    };
  }
}
