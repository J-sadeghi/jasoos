// Game flow: which screen we are on and the state of the current round.
import { dealRoles, pickWord, pickAsk, resolveVote, resolveGuess, guessOptions } from './rules.js';

export const initialGame = { screen: 'home', game: null, confirmExit: false };

const IN_GAME = ['reveal', 'round', 'vote', 'guess'];
export const isInGame = (screen) => IN_GAME.includes(screen);

/** Seconds left on the discussion timer. */
export const secondsLeft = (timer, now = Date.now()) =>
  timer.endAt == null ? timer.left : Math.max(0, Math.ceil((timer.endAt - now) / 1000));

function newRound(settings, pool) {
  const roles = dealRoles(settings.players, settings.spies, settings.on);
  return {
    roles,
    spyCount: roles.filter((r) => r === 'spy').length,
    word: pickWord(pool),
    pool,
    jokerKnows: settings.jokerKnows,
    tellSpies: settings.tellSpies,
    turn: 0,
    revealed: false,
    ask: pickAsk(roles.length),
    timer: { total: settings.minutes * 60, left: settings.minutes * 60, endAt: null },
    choice: null, // player index, 'none', or null
    immune: [],
    notice: '', // key of a text to show on the vote screen
    guessPlayer: null,
    guessOpts: [],
    result: null,
  };
}

export function gameReducer(state, action) {
  const g = state.game;
  switch (action.type) {
    case 'go': // home / rules / setup
      return { ...state, screen: action.screen, confirmExit: false };

    case 'deal':
      return { ...state, screen: 'reveal', confirmExit: false, game: newRound(action.settings, action.pool) };

    case 'reveal':
      return { ...state, game: { ...g, revealed: true } };

    case 'nextPlayer': {
      if (!g.revealed) return state;
      if (g.turn + 1 < g.roles.length) return { ...state, game: { ...g, turn: g.turn + 1, revealed: false } };
      const timer = { ...g.timer, left: g.timer.total, endAt: action.now + g.timer.total * 1000 };
      return { ...state, screen: 'round', game: { ...g, revealed: false, timer, ask: pickAsk(g.roles.length) } };
    }

    case 'rollAsk':
      return { ...state, game: { ...g, ask: pickAsk(g.roles.length) } };

    case 'togglePause': {
      const t = g.timer;
      const timer = t.endAt == null
        ? { ...t, endAt: action.now + t.left * 1000 }
        : { ...t, left: secondsLeft(t, action.now), endAt: null };
      return { ...state, game: { ...g, timer } };
    }

    case 'timeUp':
      if (state.screen !== 'round') return state;
      return { ...state, screen: 'vote', game: { ...g, timer: { ...g.timer, left: 0, endAt: null }, notice: 'timeOverNotice' } };

    case 'toVote':
      return { ...state, screen: 'vote', game: { ...g, timer: { ...g.timer, left: secondsLeft(g.timer, action.now), endAt: null } } };

    case 'choose':
      return { ...state, game: { ...g, choice: action.choice } };

    case 'confirmVote': {
      if (state.screen !== 'vote' || g.choice == null) return state;
      const out = resolveVote(g.roles, g.choice, g.immune);
      if (out.type === 'immune') {
        return { ...state, game: { ...g, immune: [...g.immune, out.player], choice: null, notice: 'sheriffNotice' } };
      }
      if (out.type === 'guess') {
        return { ...state, screen: 'guess', game: { ...g, notice: '', guessPlayer: out.player, guessOpts: guessOptions(g.pool, g.word) } };
      }
      return { ...state, screen: 'result', game: { ...g, notice: '', result: out.result } };
    }

    case 'guess':
      if (state.screen !== 'guess') return state;
      return { ...state, screen: 'result', game: { ...g, result: resolveGuess(g.word, action.word) } };

    case 'askExit':
      return { ...state, confirmExit: true };
    case 'cancelExit':
      return { ...state, confirmExit: false };
    case 'exitHome':
      return { ...state, screen: 'home', confirmExit: false, game: null };

    default:
      return state;
  }
}
