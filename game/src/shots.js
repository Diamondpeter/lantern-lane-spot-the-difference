// The screenshot scenes behind ?shot=start|play|end.
//
// Each one stages the real game in a state a player can reach, with no
// timers running: start is round one untouched, play is round two with four
// of seven differences found and three still hidden, end is the win screen
// with every difference ringed. The frames are what the game itself draws.

import { SCREENS } from './game.js';

export function stageShot(name, game) {
  if (name === 'play') {
    game.roundIndex = 1;
    game.startRound();
    game.debugSetFound(
      ['lantern-colour', 'awning-stripe', 'bunting-flag', 'stall-sign'],
      74, 400,
    );
    return;
  }
  if (name === 'end') {
    game.roundIndex = 2;
    game.startRound();
    game.debugSetFound(
      ['moon-phase', 'cat', 'basket-flowers', 'bunting-flag', 'stall-sign',
       'puddle', 'kite-tail', 'window-light', 'lantern-colour'],
      23, 1480,
    );
    game.clearRound();
    return;
  }
  // Anything else is the start scene: round one, nothing found yet.
  game.roundIndex = 0;
  game.startRound();
  game.debugSetFound([], 150, 0);
  game.screen = SCREENS.TITLE;
  game.onChange();
}
