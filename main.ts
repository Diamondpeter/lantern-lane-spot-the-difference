// Lantern Lane — the program that hands the game in.
//
// The entry is a folder of static files: game/ is the playable game (an
// index.html page with its own modules and stylesheet, no build step and no
// network at runtime), and screenshots/ holds three real renders of that
// game running in a desktop browser. This program's whole job is to gather
// those two folders into the output directory and write dossier.json there,
// using the vendored make.fun library, so the judge can read the game from
// the dossier alone. It runs on Node 22 with the standard library only, and
// it writes the same bytes every time it runs.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own limits, from the kit's RULES.txt: at most 4 screenshots of
// 256 KiB, at most 993 files and 48 MiB under game/, and the dossier text
// capped at 160 KiB. The dossier builder is handed the same numbers, so what
// it writes is what the gate measures.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function fail(message) {
  throw new Error(`main.ts: ${message}`);
}

function copyTree(source, target) {
  if (!existsSync(source)) fail(`missing ${source}`);
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function checkEntryShape() {
  const index = join(repoRoot, 'game', 'index.html');
  if (!statSync(index).isFile()) fail('game/index.html is not a file');
  const shots = join(repoRoot, 'screenshots');
  if (!existsSync(shots)) fail('screenshots/ is missing');
  const names = readdirSync(shots).filter((name) => !name.startsWith('.'));
  if (names.length < 3 || names.length > 4) {
    fail(`expected 3 or 4 screenshots, found ${names.length}`);
  }
}

checkEntryShape();
mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_OPTIONS));
