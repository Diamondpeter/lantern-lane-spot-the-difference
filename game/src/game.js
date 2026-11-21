// The rules of Lantern Lane: rounds, clicks, keyboard, timer, hints, score.
//
// A round shows the plain scene on the left and the changed scene on the
// right. Clicking either panel tests the same spot: within a difference's
// radius the difference is found (a golden ring appears on both panels and
// the counter drops); anywhere else costs 3 seconds. The firefly hint
// circles the nearest unfound difference for a few seconds and costs 25
// points. Find them all before the lanterns burn down to clear the round;
// three cleared rounds wins the game.

import { PANEL_WIDTH, PANEL_HEIGHT, ROUNDS, differencesForRound } from './differences.js';
import { drawScene } from './scene.js';
import { SoundBank } from './audio.js';

export const SCREENS = { TITLE: 'title', PLAY: 'play', ROUND_END: 'round-end', WIN: 'win', LOSE: 'lose' };

const POINTS_PER_FIND = 100;
const HINT_COST = 25;
const WRONG_CLICK_SECONDS = 3;
const HINT_MS = 3500;

export class Game {
  constructor(leftCanvas, rightCanvas, leftMark, rightMark, hud) {
    this.left = leftCanvas;
    this.right = rightCanvas;
    this.leftMark = leftMark;
    this.rightMark = rightMark;
    this.hud = hud;
    this.sounds = new SoundBank();
    this.screen = SCREENS.TITLE;
    this.roundIndex = 0;
    this.diffs = [];
    this.found = new Set();
    this.score = 0;
    this.best = 0;
    this.timeLeft = 0;
    this.lastTickSecond = -1;
    this.hintId = null;
    this.hintUntil = 0;
    this.cursor = { x: PANEL_WIDTH / 2, y: PANEL_HEIGHT / 2, visible: false };
    this.message = '';
    this.messageUntil = 0;
    this.roundBonus = 0;
    this.onChange = () => {};
    this.drawPanels();
  }

  round() {
    return ROUNDS[this.roundIndex];
  }

  remaining() {
    return this.diffs.length - this.found.size;
  }

  startGame() {
    this.score = 0;
    this.roundIndex = 0;
    this.startRound();
  }

  startRound() {
    this.diffs = differencesForRound(this.roundIndex);
    this.found = new Set();
    this.timeLeft = this.round().seconds;
    this.lastTickSecond = -1;
    this.hintId = null;
    this.screen = SCREENS.PLAY;
    this.message = '';
    this.drawPanels();
    this.onChange();
  }

  drawPanels() {
    const applied = new Set(this.diffs.map((d) => d.id));
    const leftCtx = this.left.getContext('2d');
    const rightCtx = this.right.getContext('2d');
    drawScene(leftCtx, new Set());
    drawScene(rightCtx, applied);
    this.drawMarks();
  }

  drawMarks() {
    for (const [canvas, ctx] of [[this.leftMark, this.leftMark.getContext('2d')], [this.rightMark, this.rightMark.getContext('2d')]]) {
      ctx.clearRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT);
      for (const diff of this.diffs) {
        if (!this.found.has(diff.id)) continue;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.r + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(diff.x + diff.r * 0.7, diff.y - diff.r * 0.7, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5b3a00';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(diff.x + diff.r * 0.7 - 5, diff.y - diff.r * 0.7);
        ctx.lineTo(diff.x + diff.r * 0.7 - 1, diff.y - diff.r * 0.7 + 4);
        ctx.lineTo(diff.x + diff.r * 0.7 + 6, diff.y - diff.r * 0.7 - 5);
        ctx.stroke();
      }
      // The hint firefly: a pulsing ring around the hinted difference.
      if (this.hintId && performance.now() < this.hintUntil) {
        const diff = this.diffs.find((d) => d.id === this.hintId);
        if (diff) {
          const pulse = 1 + 0.12 * Math.sin(performance.now() / 120);
          ctx.strokeStyle = 'rgba(173,255,173,0.95)';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(diff.x, diff.y, diff.r * pulse + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // The keyboard spyglass.
      if (this.cursor.visible && this.screen === SCREENS.PLAY) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.cursor.x, this.cursor.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.cursor.x - 20, this.cursor.y);
        ctx.lineTo(this.cursor.x - 8, this.cursor.y);
        ctx.moveTo(this.cursor.x + 8, this.cursor.y);
        ctx.lineTo(this.cursor.x + 20, this.cursor.y);
        ctx.moveTo(this.cursor.x, this.cursor.y - 20);
        ctx.lineTo(this.cursor.x, this.cursor.y - 8);
        ctx.moveTo(this.cursor.x, this.cursor.y + 8);
        ctx.lineTo(this.cursor.x, this.cursor.y + 20);
        ctx.stroke();
      }
    }
  }

  // Test a click at panel coordinates; works for either panel.
  clickAt(x, y) {
    if (this.screen !== SCREENS.PLAY) return 'idle';
    this.sounds.ensure();
    for (const diff of this.diffs) {
      if (this.found.has(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= diff.r * diff.r) {
        this.found.add(diff.id);
        this.score += POINTS_PER_FIND;
        this.sounds.chime();
        this.showMessage(`Found: ${diff.label}! +${POINTS_PER_FIND}`);
        this.drawMarks();
        this.onChange();
        if (this.found.size === this.diffs.length) this.clearRound();
        return 'found';
      }
    }
    this.timeLeft = Math.max(0, this.timeLeft - WRONG_CLICK_SECONDS);
    this.sounds.wrong();
    this.showMessage(`Not there — ${WRONG_CLICK_SECONDS}s lost!`);
    this.onChange();
    return 'miss';
  }

  checkCursor() {
    return this.clickAt(this.cursor.x, this.cursor.y);
  }

  moveCursor(dx, dy) {
    this.cursor.visible = true;
    this.cursor.x = Math.min(PANEL_WIDTH - 1, Math.max(0, this.cursor.x + dx));
    this.cursor.y = Math.min(PANEL_HEIGHT - 1, Math.max(0, this.cursor.y + dy));
    this.drawMarks();
  }

  useHint() {
    if (this.screen !== SCREENS.PLAY) return;
    const unfound = this.diffs.filter((d) => !this.found.has(d.id));
    if (unfound.length === 0) return;
    // Hint the difference nearest the spyglass (or the first, if it never moved).
    let best = unfound[0];
    let bestDist = Infinity;
    for (const diff of unfound) {
      const dx = diff.x - this.cursor.x;
      const dy = diff.y - this.cursor.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = diff;
      }
    }
    this.hintId = best.id;
    this.hintUntil = performance.now() + HINT_MS;
    this.score = Math.max(0, this.score - HINT_COST);
    this.sounds.hint();
    this.showMessage(`Firefly: ${best.hint} (−${HINT_COST} pts)`);
    this.drawMarks();
    this.onChange();
  }

  showMessage(text) {
    this.message = text;
    this.messageUntil = performance.now() + 2600;
  }

  clearRound() {
    this.roundBonus = Math.round(this.timeLeft) * 5;
    this.score += this.roundBonus;
    this.sounds.win();
    if (this.roundIndex + 1 >= ROUNDS.length) {
      this.screen = SCREENS.WIN;
      this.best = Math.max(this.best, this.score);
    } else {
      this.screen = SCREENS.ROUND_END;
    }
    this.onChange();
  }

  nextRound() {
    this.roundIndex += 1;
    this.startRound();
  }

  tick(dtSeconds) {
    if (this.screen !== SCREENS.PLAY) return;
    this.timeLeft -= dtSeconds;
    const whole = Math.ceil(this.timeLeft);
    if (whole <= 10 && whole !== this.lastTickSecond && whole > 0) {
      this.lastTickSecond = whole;
      this.sounds.tick();
    }
    if (this.hintId && performance.now() >= this.hintUntil) {
      this.hintId = null;
      this.drawMarks();
    }
    if (this.message && performance.now() >= this.messageUntil) {
      this.message = '';
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.screen = SCREENS.LOSE;
      this.best = Math.max(this.best, this.score);
      this.sounds.wrong();
    }
    this.onChange();
  }

  // Deterministic staging for screenshots and tests: mark ids as found.
  debugSetFound(ids, secondsLeft, score) {
    this.found = new Set(ids);
    if (secondsLeft !== undefined) this.timeLeft = secondsLeft;
    if (score !== undefined) this.score = score;
    this.drawMarks();
    this.onChange();
  }
}
