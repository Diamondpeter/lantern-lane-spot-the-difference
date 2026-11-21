// Boots Lantern Lane: wires the canvases, buttons, mouse and keyboard to
// the Game, keeps the HUD in step, and runs the clock.
//
// URL modes (all optional, all deterministic):
//   ?shot=start|play|end  stage a screenshot scene instead of the title screen
//   ?selftest=1           play a scripted game on load and report PASS/FAIL
//                          in #selftest (used to verify the build headlessly)

import { Game, SCREENS } from './game.js';
import { ROUNDS } from './differences.js';
import { stageShot } from './shots.js';

const $ = (id) => document.getElementById(id);

const leftCanvas = $('panel-left');
const rightCanvas = $('panel-right');
const leftMark = $('marks-left');
const rightMark = $('marks-right');

const hud = {
  round: $('hud-round'),
  timer: $('hud-timer'),
  score: $('hud-score'),
  counter: $('hud-counter'),
  message: $('hud-message'),
  banner: $('banner'),
  bannerTitle: $('banner-title'),
  bannerText: $('banner-text'),
  bannerButton: $('banner-button'),
};

const game = new Game(leftCanvas, rightCanvas, leftMark, rightMark, hud);

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function syncHud() {
  const round = ROUNDS[game.roundIndex];
  hud.round.textContent = `Round ${game.roundIndex + 1} of ${ROUNDS.length} · ${round.name}`;
  hud.timer.textContent = `⏳ ${fmtTime(game.timeLeft)}`;
  hud.timer.classList.toggle('low', game.timeLeft <= 10 && game.screen === SCREENS.PLAY);
  hud.score.textContent = `Score ${game.score}`;
  hud.counter.textContent = game.screen === SCREENS.TITLE
    ? `${round.diffs.length} differences hide in this street`
    : `Found ${game.found.size} of ${game.diffs.length} · ${game.remaining()} remain`;
  hud.message.textContent = game.message;
  const show = game.screen !== SCREENS.PLAY && game.screen !== SCREENS.TITLE;
  hud.banner.hidden = !show;
  if (show) {
    if (game.screen === SCREENS.ROUND_END) {
      hud.bannerTitle.textContent = `Round ${game.roundIndex + 1} clear!`;
      hud.bannerText.textContent = `All ${game.diffs.length} differences found — time bonus +${game.roundBonus}. The next street is darker and the differences trickier.`;
      hud.bannerButton.textContent = 'Next round →';
    } else if (game.screen === SCREENS.WIN) {
      hud.bannerTitle.textContent = 'You found them all! 🏮';
      hud.bannerText.textContent = `Lantern Lane is yours — final score ${game.score} (best ${game.best}). Three rounds, every difference ringed.`;
      hud.bannerButton.textContent = 'Play again';
    } else {
      hud.bannerTitle.textContent = 'The lanterns burned down…';
      hud.bannerText.textContent = `Time ran out with ${game.remaining()} difference${game.remaining() === 1 ? '' : 's'} still hiding. Score ${game.score} — try the round again.`;
      hud.bannerButton.textContent = 'Retry round';
    }
  }
}

game.onChange = syncHud;

function panelClick(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  game.clickAt(x, y);
}

leftCanvas.addEventListener('click', (e) => panelClick(e, leftCanvas));
rightCanvas.addEventListener('click', (e) => panelClick(e, rightCanvas));

$('btn-start').addEventListener('click', () => {
  game.sounds.click();
  game.startGame();
  $('screen-title').hidden = true;
});
hud.bannerButton.addEventListener('click', () => {
  game.sounds.click();
  if (game.screen === SCREENS.ROUND_END) game.nextRound();
  else if (game.screen === SCREENS.WIN) game.startGame();
  else game.startRound();
  $('screen-title').hidden = true;
});
$('btn-hint').addEventListener('click', () => game.useHint());
$('btn-mute').addEventListener('click', () => {
  game.sounds.muted = !game.sounds.muted;
  $('btn-mute').textContent = game.sounds.muted ? '🔇 Muted' : '🔊 Sound on';
});
$('btn-restart').addEventListener('click', () => {
  game.sounds.click();
  game.startGame();
  $('screen-title').hidden = true;
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    const step = event.shiftKey ? 4 : 14;
    game.moveCursor(
      event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
      event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
    );
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    game.checkCursor();
  } else if (event.key === 'h' || event.key === 'H') {
    game.useHint();
  } else if (event.key === 'm' || event.key === 'M') {
    game.sounds.muted = !game.sounds.muted;
    $('btn-mute').textContent = game.sounds.muted ? '🔇 Muted' : '🔊 Sound on';
  }
});

// The clock: one tick a frame, only while a round is being played.
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Screenshot staging, then the title screen for real players.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshot scenes show the bare game, never the title overlay.
  $('screen-title').hidden = true;
  stageShot(shot, game);
} else {
  game.screen = SCREENS.TITLE;
}
syncHud();

// Headless self-test: scripted play, results written into the page.
if (params.get('selftest') === '1') {
  const results = [];
  const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  try {
    game.startGame();
    check('round 1 has 5 differences', game.diffs.length === 5);
    check('counter starts at 5 remaining', game.remaining() === 5);
    const first = game.diffs[0];
    check('click on a difference finds it', game.clickAt(first.x, first.y) === 'found');
    check('counter drops to 4 remaining', game.remaining() === 4);
    check('click on the same spot again is a miss', game.clickAt(first.x, first.y) === 'miss');
    check('click on empty street is a miss', game.clickAt(20, 300) === 'miss');
    const before = game.score;
    game.useHint();
    check('hint costs points and marks a target', game.score === before - 25 && game.hintId !== null);
    game.moveCursor(10, 0);
    check('keyboard cursor moves', game.cursor.visible && game.cursor.x === 310);
    for (const diff of [...game.diffs]) game.clickAt(diff.x, diff.y);
    check('finding all clears round 1', game.screen === SCREENS.ROUND_END);
    game.nextRound();
    check('round 2 has 7 differences', game.diffs.length === 7);
    game.timeLeft = 0.5;
    game.tick(1);
    check('timeout loses the round', game.screen === SCREENS.LOSE);
    game.startRound();
    for (const diff of [...game.diffs]) game.clickAt(diff.x, diff.y);
    game.nextRound();
    for (const diff of [...game.diffs]) game.clickAt(diff.x, diff.y);
    check('clearing round 3 wins the game', game.screen === SCREENS.WIN);
    check('score is positive', game.score > 0);
  } catch (err) {
    results.push(`FAIL exception: ${err.message}`);
  }
  const el = $('selftest');
  el.textContent = results.join(' | ');
  el.dataset.done = results.every((r) => r.startsWith('PASS')) ? 'pass' : 'fail';
  document.title = el.dataset.done === 'pass' ? 'SELFTEST PASS' : 'SELFTEST FAIL';
}
