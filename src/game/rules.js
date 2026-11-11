// Pure game logic: no React, no browser. Everything here is covered by tests/rules.test.js.

export const SPECIALS = ['detective', 'saboteur', 'sheriff', 'joker'];
export const ROLE_ORDER = ['citizen', 'spy', ...SPECIALS];
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MIN_CITIZENS = 2;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Which enabled special roles fit, in the fixed order Detective → Saboteur → Sheriff → Joker.
 * A special is added only while at least 2 non-spy slots would still remain as Citizens.
 */
export function planSpecials(players, spies, enabled) {
  const spyN = clamp(spies, 0, players);
  const used = [];
  const skipped = [];
  for (const k of SPECIALS) {
    if (!enabled[k]) continue;
    const citizensLeft = players - spyN - (used.length + 1);
    if (citizensLeft >= MIN_CITIZENS) used.push(k);
    else skipped.push(k);
  }
  return { used, skipped };
}

/** Build the role list for one round (already shuffled). */
export function dealRoles(players, spies, enabled, rng = Math.random) {
  const spyN = clamp(spies, 0, players);
  const { used } = planSpecials(players, spyN, enabled);
  const roles = Array(spyN).fill('spy').concat(used);
  while (roles.length < players) roles.push('citizen');
  return shuffle(roles, rng);
}

export const pickWord = (pool, rng = Math.random) => pool[Math.floor(rng() * pool.length)];

/** Two different random player indexes: [asker, target]. */
export function pickAsk(n, rng = Math.random) {
  if (n < 2) return [0, 0];
  const a = Math.floor(rng() * n);
  let b = Math.floor(rng() * (n - 1));
  if (b >= a) b += 1;
  return [a, b];
}

/** 6 choices for the caught spy: the real word + 5 other random words from the pool, shuffled. */
export function guessOptions(pool, word, rng = Math.random) {
  const others = shuffle([...new Set(pool)].filter((w) => w !== word), rng).slice(0, 5);
  return shuffle([...others, word], rng);
}

export const NO_SPY = 'none';

/**
 * Decide what happens after the group confirms its choice.
 * @param roles   role of every player
 * @param choice  a player index, or NO_SPY ("There is no spy")
 * @param immune  player indexes whose Sheriff immunity is already used
 * @returns {{type:'immune', player}} | {{type:'guess', player}} | {{type:'result', result}}
 */
export function resolveVote(roles, choice, immune = []) {
  const spyCount = roles.filter((r) => r === 'spy').length;

  if (choice === NO_SPY) {
    return { type: 'result', result: spyCount === 0 ? 'noSpyRight' : 'spyNoSpy' };
  }

  const role = roles[choice];
  if (role === 'sheriff' && !immune.includes(choice)) return { type: 'immune', player: choice };
  if (role === 'spy') return { type: 'guess', player: choice };
  if (role === 'joker') return { type: 'result', result: 'joker' };
  if (role === 'citizen' && roles.includes('saboteur')) return { type: 'result', result: 'saboteur' };
  return { type: 'result', result: spyCount > 0 ? 'spyHidden' : 'nobody' };
}

/** The caught spy picked a word. */
export const resolveGuess = (word, guess) => (guess === word ? 'spyGuessed' : 'citizens');

/** Results whose wording changes when there is more than one spy. */
const PLURAL = { spyHidden: 'spyHiddenMany', spyGuessed: 'spyGuessedMany', spyNoSpy: 'spyNoSpyMany' };

/** Text key for a result, using the plural ("The spies win") when there are 2+ spies. */
export const resultTextKey = (result, spyCount) => (spyCount > 1 && PLURAL[result]) || result;

export const RESULT_COLORS = {
  citizens: '#2A7C74',
  noSpyRight: '#2A7C74',
  spyHidden: '#C4562A',
  spyGuessed: '#C4562A',
  spyNoSpy: '#C4562A',
  saboteur: '#8B5CC4',
  joker: '#3F6FD8',
  nobody: '#17130F',
};

export const ROLE_COLORS = {
  citizen: '#17130F',
  spy: '#C4562A',
  detective: '#2A7C74',
  saboteur: '#8B5CC4',
  sheriff: '#B08A1E',
  joker: '#3F6FD8',
};

/** Who does not see the secret word. */
export const isBlind = (role, jokerKnows) => role === 'spy' || (role === 'joker' && !jokerKnows);
