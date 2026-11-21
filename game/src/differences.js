// The differences hidden in Lantern Lane, and the rounds that use them.
//
// Every difference has a fixed spot (x, y) in the 600x450 panel space and a
// hit radius. The left panel always shows the plain scene; the right panel
// shows it with the round's differences applied. Coordinates never move, so a
// click in either panel tests the same spot.

export const PANEL_WIDTH = 600;
export const PANEL_HEIGHT = 450;

export const DIFFERENCES = [
  { id: 'moon-phase', label: 'The moon changed phase', x: 492, y: 68, r: 40,
    hint: 'Look up, at the night sky.' },
  { id: 'lantern-colour', label: 'A lantern changed colour', x: 300, y: 92, r: 26,
    hint: 'One lantern in the string is a different colour.' },
  { id: 'cat', label: 'The cat vanished', x: 92, y: 332, r: 30,
    hint: 'Something small used to sit on the low wall.' },
  { id: 'awning-stripe', label: 'An awning gained a stripe', x: 150, y: 152, r: 30,
    hint: 'Count the stripes over the dumpling stall.' },
  { id: 'basket-flowers', label: 'The basket lost its flowers', x: 522, y: 362, r: 28,
    hint: 'The bicycle by the right stall carries something.' },
  { id: 'bunting-flag', label: 'A bunting flag is missing', x: 212, y: 122, r: 22,
    hint: 'Follow the little flags under the lanterns.' },
  { id: 'stall-sign', label: 'The sign lost two dumplings', x: 150, y: 212, r: 28,
    hint: 'The dumpling stall sign shows a different number.' },
  { id: 'puddle', label: 'The moon left the puddle', x: 332, y: 412, r: 30,
    hint: 'Something shines in the wet street.' },
  { id: 'kite-tail', label: 'The kite lost its tail', x: 122, y: 82, r: 30,
    hint: 'A kite is tangled over the rooftops.' },
  { id: 'window-light', label: 'A window went dark', x: 472, y: 222, r: 28,
    hint: 'One window in the tall house is no longer lit.' },
];

export const ROUNDS = [
  { name: 'First Stroll', seconds: 150, diffs: ['moon-phase', 'lantern-colour', 'cat', 'awning-stripe', 'basket-flowers'] },
  { name: 'Lantern Rush', seconds: 120, diffs: ['lantern-colour', 'awning-stripe', 'bunting-flag', 'stall-sign', 'puddle', 'kite-tail', 'window-light'] },
  { name: 'Midnight Hunt', seconds: 90, diffs: ['moon-phase', 'cat', 'basket-flowers', 'bunting-flag', 'stall-sign', 'puddle', 'kite-tail', 'window-light', 'lantern-colour'] },
];

export function differencesForRound(roundIndex) {
  const round = ROUNDS[roundIndex];
  return round.diffs.map((id) => DIFFERENCES.find((d) => d.id === id));
}
