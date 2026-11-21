// Draws the Lantern Lane street scene on a canvas.
//
// drawScene(ctx, applied) paints the whole picture. `applied` is a Set of
// difference ids: when an id is in the set, that spot is drawn changed. The
// left panel is always drawn with an empty set, the right panel with the
// round's differences, so the two pictures are near-identical by construction.
// Everything is fixed geometry — no randomness — so the same call always
// paints the same pixels.

import { PANEL_WIDTH, PANEL_HEIGHT } from './differences.js';

const W = PANEL_WIDTH;
const H = PANEL_HEIGHT;

const STARS = [
  [30, 40], [80, 24], [140, 52], [200, 30], [260, 44], [330, 26], [380, 48],
  [430, 30], [540, 36], [575, 60], [60, 90], [250, 84], [360, 92], [560, 110],
  [170, 110], [420, 108], [40, 130], [300, 130], [520, 140],
];

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h) {
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

// A paper lantern: glowing body, dark caps, hanging tassel.
function lantern(ctx, x, y, r, colour, glow) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = glow;
  circle(ctx, x, y, r + 12);
  ctx.restore();
  ctx.fillStyle = colour;
  ellipse(ctx, x, y, r, r * 1.15);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, x - r * 0.3, y - r * 0.35, r * 0.35, r * 0.5);
  ctx.fillStyle = '#3a2a1a';
  rect(ctx, x - r * 0.45, y - r * 1.15, r * 0.9, 5);
  rect(ctx, x - r * 0.45, y + r * 1.1, r * 0.9, 5);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 1.15);
  ctx.lineTo(x, y + r * 1.15 + 12);
  ctx.stroke();
}

function drawSky(ctx, applied) {
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#1b1440');
  sky.addColorStop(0.6, '#2c1e5e');
  sky.addColorStop(1, '#4a2b6b');
  ctx.fillStyle = sky;
  rect(ctx, 0, 0, W, 280);
  ctx.fillStyle = '#fff8d6';
  for (const [x, y] of STARS) circle(ctx, x, y, 1.6);
  ctx.fillStyle = '#ffe9a8';
  for (const [x, y] of [[140, 52], [330, 26], [430, 30]]) circle(ctx, x, y, 2.4);

  // The moon: full, unless the phase difference is applied (crescent).
  ctx.fillStyle = '#fdf3c4';
  circle(ctx, 492, 68, 34);
  ctx.fillStyle = 'rgba(230,205,130,0.7)';
  circle(ctx, 482, 60, 6);
  circle(ctx, 500, 78, 4);
  if (applied.has('moon-phase')) {
    ctx.fillStyle = '#241a52';
    circle(ctx, 506, 60, 30);
  }

  // A paper kite tangled over the rooftops, with or without its tail.
  ctx.strokeStyle = '#e8d9a0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(122, 82);
  ctx.lineTo(96, 140);
  ctx.stroke();
  ctx.fillStyle = '#e74c3c';
  poly(ctx, [[122, 58], [146, 84], [122, 108], [98, 84]]);
  ctx.fillStyle = '#f7dc6f';
  poly(ctx, [[122, 58], [134, 84], [122, 108], [110, 84]]);
  if (!applied.has('kite-tail')) {
    ctx.strokeStyle = '#f7dc6f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(122, 108);
    ctx.quadraticCurveTo(128, 128, 120, 146);
    ctx.stroke();
    ctx.fillStyle = '#e74c3c';
    poly(ctx, [[116, 122], [126, 122], [121, 132]]);
    poly(ctx, [[118, 138], [128, 138], [123, 148]]);
  }
}

function drawBuildings(ctx, applied) {
  // Rooftops silhouette.
  ctx.fillStyle = '#241a4d';
  poly(ctx, [[0, 250], [0, 200], [60, 200], [60, 180], [120, 180], [120, 210], [200, 210], [200, 190], [260, 190], [260, 230], [340, 230], [340, 205], [420, 205], [420, 235], [520, 235], [520, 210], [600, 210], [600, 250]]);
  // Pagoda roof on the left.
  ctx.fillStyle = '#1a1238';
  poly(ctx, [[20, 200], [100, 158], [180, 200]]);
  poly(ctx, [[40, 168], [100, 132], [160, 168]]);
  ctx.fillStyle = '#d4a017';
  circle(ctx, 100, 128, 4);

  // Tall house on the right with one window that may go dark.
  ctx.fillStyle = '#2e2158';
  rect(ctx, 430, 150, 110, 130);
  poly(ctx, [[425, 152], [485, 118], [545, 152]]);
  ctx.fillStyle = applied.has('window-light') ? '#241a4d' : '#ffd97a';
  rect(ctx, 458, 208, 28, 30);
  ctx.fillStyle = '#241a4d';
  rect(ctx, 470, 208, 4, 30);
  rect(ctx, 458, 221, 28, 4);
  ctx.fillStyle = '#ffd97a';
  rect(ctx, 500, 208, 28, 30);
  ctx.fillStyle = '#241a4d';
  rect(ctx, 512, 208, 4, 30);
}

function drawLanternString(ctx, applied) {
  // The string sags between two poles; lanterns hang along it.
  ctx.strokeStyle = '#120c2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, 60);
  ctx.quadraticCurveTo(300, 110, 590, 60);
  ctx.stroke();
  const spots = [
    [60, 76, 16, '#e74c3c'], [140, 88, 14, '#f39c12'], [220, 94, 16, '#e74c3c'],
    [300, 96, 16, '#e74c3c'], [380, 94, 14, '#f39c12'], [460, 86, 16, '#e74c3c'],
    [540, 74, 14, '#f39c12'],
  ];
  for (const [x, y, r, colour] of spots) {
    const c = applied.has('lantern-colour') && x === 300 ? '#27ae60' : colour;
    lantern(ctx, x, y, r, c, '#ffb347');
  }
  // Bunting flags under the string; one may be missing.
  const flags = [[180, 116], [212, 120], [244, 122], [356, 122], [388, 120], [420, 116]];
  const colours = ['#e74c3c', '#f7dc6f', '#3498db', '#e74c3c', '#f7dc6f', '#3498db'];
  flags.forEach(([x, y], i) => {
    if (applied.has('bunting-flag') && x === 212) return;
    ctx.fillStyle = colours[i];
    poly(ctx, [[x - 9, y], [x + 9, y], [x, y + 16]]);
  });
}

function drawStalls(ctx, applied) {
  // Left stall: dumplings, striped awning, sign board.
  ctx.fillStyle = '#6e3b1f';
  rect(ctx, 90, 230, 120, 10);
  ctx.fillStyle = '#8a4b28';
  rect(ctx, 96, 240, 108, 66);
  ctx.fillStyle = '#c98a4b';
  rect(ctx, 96, 240, 108, 8);
  // Awning: five stripes, or six when the difference is applied.
  const stripes = applied.has('awning-stripe') ? 6 : 5;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#c0392b' : '#f5e6c8';
    const x = 84 + i * (132 / stripes);
    poly(ctx, [[x, 168], [x + 132 / stripes, 168], [x + 132 / stripes + 6, 196], [x + 6, 196]]);
  }
  ctx.fillStyle = '#3a2a1a';
  rect(ctx, 88, 196, 124, 6);
  // Dumpling stack on the counter.
  ctx.fillStyle = '#f5e6c8';
  for (const [x, y] of [[120, 226], [140, 226], [160, 226], [130, 214], [150, 214], [140, 202]]) {
    ellipse(ctx, x, y, 11, 7);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, 150, 200, 22, 5);
  // Sign board: five dumpling dots, or three when changed.
  ctx.fillStyle = '#2c1e10';
  rect(ctx, 128, 196, 44, 26);
  ctx.fillStyle = '#ffd97a';
  const dots = applied.has('stall-sign') ? 3 : 5;
  for (let i = 0; i < dots; i += 1) circle(ctx, 136 + i * 8, 209, 3);

  // Right stall: fruit under a teal awning.
  ctx.fillStyle = '#145a4a';
  rect(ctx, 380, 230, 120, 10);
  ctx.fillStyle = '#1b7a5e';
  rect(ctx, 386, 240, 108, 66);
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#16a085' : '#eafaf1';
    const x = 376 + i * 33;
    poly(ctx, [[x, 168], [x + 33, 168], [x + 33 + 5, 196], [x + 5, 196]]);
  }
  ctx.fillStyle = '#e67e22';
  for (const [x, y] of [[410, 226], [430, 226], [450, 226], [420, 214], [440, 214], [430, 202]]) {
    circle(ctx, x, y, 8);
  }
  ctx.fillStyle = '#c0392b';
  circle(ctx, 470, 224, 8);
  circle(ctx, 480, 214, 8);
}

function drawStreet(ctx, applied) {
  // Cobblestones.
  ctx.fillStyle = '#4a3a52';
  rect(ctx, 0, 306, W, 144);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let y = 320; y < 450; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = 0; x < W; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 306);
    ctx.lineTo(x - 12, 450);
    ctx.stroke();
  }
  // Low wall on the left, where the cat sits.
  ctx.fillStyle = '#5d4a68';
  rect(ctx, 30, 318, 130, 26);
  ctx.fillStyle = '#7a6584';
  rect(ctx, 30, 318, 130, 6);
  if (!applied.has('cat')) {
    // The cat: dark silhouette, tail curled, ears up.
    ctx.fillStyle = '#1a1238';
    ellipse(ctx, 92, 322, 16, 12);
    circle(ctx, 104, 306, 9);
    poly(ctx, [[98, 300], [101, 290], [105, 299]]);
    poly(ctx, [[106, 299], [110, 290], [112, 300]]);
    ctx.fillStyle = '#ffd97a';
    circle(ctx, 107, 305, 1.6);
    ctx.strokeStyle = '#1a1238';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(78, 326, 10, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();
  }
  // The vendor, standing between the stalls with a tray of buns.
  ctx.fillStyle = '#2c4a6b';
  poly(ctx, [[292, 306], [308, 306], [304, 268], [296, 268]]);
  ctx.fillStyle = '#f5d7a1';
  circle(ctx, 300, 258, 11);
  ctx.fillStyle = '#f7dc6f';
  ellipse(ctx, 300, 250, 18, 6);
  poly(ctx, [[284, 250], [300, 236], [316, 250]]);
  ctx.fillStyle = '#2c1e10';
  circle(ctx, 296, 257, 1.6);
  circle(ctx, 304, 257, 1.6);
  ctx.strokeStyle = '#2c1e10';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(300, 261, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#c98a4b';
  ellipse(ctx, 300, 282, 14, 4);
  ctx.fillStyle = '#f5e6c8';
  circle(ctx, 294, 279, 4);
  circle(ctx, 300, 278, 4);
  circle(ctx, 306, 279, 4);
  // Puddle with the moon's reflection, unless it has gone.
  ctx.fillStyle = 'rgba(120,90,180,0.55)';
  ellipse(ctx, 332, 414, 62, 12);
  if (!applied.has('puddle')) {
    ctx.fillStyle = 'rgba(253,243,196,0.85)';
    ellipse(ctx, 332, 412, 16, 4);
    ctx.fillStyle = 'rgba(253,243,196,0.4)';
    ellipse(ctx, 332, 416, 26, 3);
  }
  // Bicycle leaning by the right stall, basket with or without flowers.
  ctx.strokeStyle = '#d5d8dc';
  ctx.lineWidth = 3;
  circle(ctx, 500, 396, 20);
  circle(ctx, 556, 396, 20);
  ctx.beginPath();
  ctx.moveTo(500, 396);
  ctx.lineTo(528, 360);
  ctx.lineTo(556, 396);
  ctx.moveTo(528, 360);
  ctx.lineTo(516, 396);
  ctx.moveTo(528, 360);
  ctx.lineTo(548, 352);
  ctx.stroke();
  ctx.strokeStyle = '#a93226';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(528, 360);
  ctx.lineTo(540, 344);
  ctx.stroke();
  // Basket on the handlebars.
  ctx.fillStyle = '#8a5a2b';
  rect(ctx, 540, 344, 30, 20);
  ctx.strokeStyle = '#6e4419';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(540, 352);
  ctx.lineTo(570, 352);
  ctx.moveTo(540, 358);
  ctx.lineTo(570, 358);
  ctx.stroke();
  if (!applied.has('basket-flowers')) {
    ctx.fillStyle = '#e74c3c';
    circle(ctx, 548, 340, 5);
    circle(ctx, 558, 338, 5);
    circle(ctx, 566, 341, 5);
    ctx.fillStyle = '#f7dc6f';
    circle(ctx, 548, 340, 2);
    circle(ctx, 558, 338, 2);
    circle(ctx, 566, 341, 2);
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(548, 344);
    ctx.lineTo(548, 338);
    ctx.moveTo(558, 344);
    ctx.lineTo(558, 336);
    ctx.moveTo(566, 344);
    ctx.lineTo(566, 339);
    ctx.stroke();
  }
}

export function drawScene(ctx, applied) {
  const set = applied instanceof Set ? applied : new Set(applied ?? []);
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx, set);
  drawBuildings(ctx, set);
  drawLanternString(ctx, set);
  drawStalls(ctx, set);
  drawStreet(ctx, set);
}
