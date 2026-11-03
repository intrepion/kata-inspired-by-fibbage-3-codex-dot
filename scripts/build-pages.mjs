import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import ts from "typescript";
const out = "dist-pages";
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp("solo", out, { recursive: true });
await cp("public/style.css", `${out}/style.css`);
await cp("public/arcade", `${out}/arcade`, { recursive: true });
for (const name of ["game", "prompts"]) {
  let source = await readFile(`src/${name}.ts`, "utf8");
  if (name === "game") {
    if (
      !source.includes('import { randomBytes, randomInt } from "node:crypto";')
    )
      throw new Error("Game crypto import changed; review Pages adapter");
    source = source.replace(
      'import { randomBytes, randomInt } from "node:crypto";',
      `const randomBytes = (n) => { const bytes = crypto.getRandomValues(new Uint8Array(n)); return {toString: () => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}; };\nconst randomInt = (n) => { const limit = Math.floor(4294967296 / n) * n; let v; do { v = crypto.getRandomValues(new Uint32Array(1))[0]; } while (v >= limit); return v % n; };`,
    );
  }
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  await writeFile(`${out}/${name}.js`, output);
}
