# lantern-lane-spot-the-difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Diamondpeter/lantern-lane-spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Diamondpeter/lantern-lane-spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Lantern Lane** is a spot-the-difference game set on a lantern-lit night-market street.
Two near-identical hand-drawn scenes sit side by side: find all 7 hidden differences
before the lanterns burn down. Click a difference (or move the spyglass with the arrow
keys and press Enter), earn a chime and a golden ring, and ask the firefly for a hint
when you are stuck. Three rounds grow harder — more differences, less time, dimmer
light — and every round is a fresh scene drawn from the same little street.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in desktop Chrome
```

Or open `game/index.html` from any static server. No build step, no network requests:
every file the game loads lives under `game/`.

## How it is built

- `main.ts` — the entrypoint (Node 22, standard library only). It copies `game/` and
  `screenshots/` to the output directory and writes `dossier.json` with the vendored
  `vendor/makefun-game.ts` library.
- `game/index.html` — the page; `game/src/` holds the game, one file per job:
  `scene.js` draws the street, `differences.js` lists what changed,
  `audio.js` synthesises every sound with WebAudio, `game.js` runs the rules,
  `shots.js` stages the three screenshot scenes, `main.js` wires it together.
- `screenshots/` — three real renders of the game running in a browser.

---

<sub>Entered on [make.fun](https://make.fun/?ref=h68hpwev&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
