// The Linden Ledger — entrypoint (Node 22, standard library only).
//
// Hands the site in: copies app/ and screenshots/ from this
// repository into the output directory and writes dossier.json there
// with buildDossier from vendor/makefun-frontend.ts (the kit's copy,
// unchanged). Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output. The program runs twice and both runs write the same bytes:
// the copy is a plain recursive copy and buildDossier is deterministic
// for a fixed app/ and screenshots/.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

if (outDir === repoRoot) {
  throw new Error("MAKEFUN_OUTPUT_DIR must not be the repository root.");
}

if (!existsSync(join(repoRoot, "app", "index.html"))) {
  throw new Error("app/index.html is missing — nothing to hand in.");
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });

cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = await buildDossier(outDir, { text_max_bytes: 163840 });
writeFileSync(join(outDir, "dossier.json"), dossier);
