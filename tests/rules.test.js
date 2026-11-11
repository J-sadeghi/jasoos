import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planSpecials, dealRoles, pickAsk, guessOptions, resolveVote, resolveGuess,
  resultTextKey, isBlind, NO_SPY, SPECIALS,
} from '../src/game/rules.js';
import fa from '../src/i18n/fa.json' with { type: 'json' };
import en from '../src/i18n/en.json' with { type: 'json' };

const ALL_ON = { detective: true, saboteur: true, sheriff: true, joker: true };
const NONE_ON = { detective: false, saboteur: false, sheriff: false, joker: false };
const count = (roles, r) => roles.filter((x) => x === r).length;

// ---------- dealing ----------
test('every player count / spy count / role combination deals correctly', () => {
  for (let n = 3; n <= 12; n++) {
    for (let s = 0; s <= n; s++) {
      for (let mask = 0; mask < 16; mask++) {
        const on = Object.fromEntries(SPECIALS.map((k, i) => [k, !!(mask & (1 << i))]));
        const roles = dealRoles(n, s, on);
        const { used, skipped } = planSpecials(n, s, on);
        assert.equal(roles.length, n);
        assert.equal(count(roles, 'spy'), s, 'exact spy count');
        for (const k of used) assert.equal(count(roles, k), 1);
        for (const k of skipped) assert.equal(count(roles, k), 0);
        // specials keep at least 2 citizens; skipped ones are always the tail of the order
        if (used.length) assert.ok(count(roles, 'citizen') >= 2);
        const enabled = SPECIALS.filter((k) => on[k]);
        assert.deepEqual([...used, ...skipped], enabled);
        assert.equal(count(roles, 'citizen'), n - s - used.length);
      }
    }
  }
});

test('special role order and skipping', () => {
  assert.deepEqual(planSpecials(6, 1, ALL_ON), { used: ['detective', 'saboteur', 'sheriff'], skipped: ['joker'] });
  assert.deepEqual(planSpecials(5, 2, ALL_ON), { used: ['detective'], skipped: ['saboteur', 'sheriff', 'joker'] });
  assert.deepEqual(planSpecials(3, 1, ALL_ON), { used: [], skipped: SPECIALS });
  assert.deepEqual(planSpecials(12, 0, ALL_ON), { used: SPECIALS, skipped: [] });
  assert.deepEqual(planSpecials(6, 6, ALL_ON), { used: [], skipped: SPECIALS });
  // default setup: 6 players, 1 spy, detective + saboteur
  assert.deepEqual(planSpecials(6, 1, { ...NONE_ON, detective: true, saboteur: true }), { used: ['detective', 'saboteur'], skipped: [] });
});

test('0 spies and all spies', () => {
  assert.equal(count(dealRoles(6, 0, NONE_ON), 'spy'), 0);
  assert.deepEqual(dealRoles(7, 7, ALL_ON), Array(7).fill('spy'));
});

test('shuffle actually varies the spy position', () => {
  const seen = new Set();
  for (let i = 0; i < 300; i++) seen.add(dealRoles(6, 1, NONE_ON).indexOf('spy'));
  assert.equal(seen.size, 6);
});

// ---------- discussion draw ----------
test('ask draw is always two different players', () => {
  for (let n = 3; n <= 12; n++) for (let i = 0; i < 500; i++) {
    const [a, b] = pickAsk(n);
    assert.notEqual(a, b);
    assert.ok(a >= 0 && a < n && b >= 0 && b < n);
  }
});

// ---------- word visibility ----------
test('who sees the word', () => {
  assert.equal(isBlind('spy', true), true);
  assert.equal(isBlind('joker', false), true);
  assert.equal(isBlind('joker', true), false);
  for (const r of ['citizen', 'detective', 'saboteur', 'sheriff']) assert.equal(isBlind(r, false), false);
});

// ---------- guess options ----------
test('guess screen has 6 unique options including the real word', () => {
  for (const lang of [fa, en]) for (const c of lang.cats) {
    for (const w of c.words) {
      const o = guessOptions(c.words, w);
      assert.equal(o.length, 6);
      assert.equal(new Set(o).size, 6);
      assert.ok(o.includes(w));
      assert.ok(o.every((x) => c.words.includes(x)));
    }
  }
});

// ---------- win conditions ----------
const R = (roles, choice, immune) => resolveVote(roles, choice, immune);

test('"There is no spy" with 0 spies → citizens win', () => {
  assert.deepEqual(R(['citizen', 'citizen', 'detective'], NO_SPY), { type: 'result', result: 'noSpyRight' });
});
test('"There is no spy" with spies → spy/spies win', () => {
  assert.deepEqual(R(['spy', 'citizen', 'citizen'], NO_SPY), { type: 'result', result: 'spyNoSpy' });
  assert.deepEqual(R(['spy', 'spy', 'citizen', 'citizen'], NO_SPY), { type: 'result', result: 'spyNoSpy' });
  assert.deepEqual(R(['spy', 'spy', 'spy'], NO_SPY), { type: 'result', result: 'spyNoSpy' });
});
test('Sheriff immune the first time, normal the second time', () => {
  const roles = ['spy', 'sheriff', 'citizen', 'citizen'];
  assert.deepEqual(R(roles, 1, []), { type: 'immune', player: 1 });
  assert.deepEqual(R(roles, 1, [1]), { type: 'result', result: 'spyHidden' });
  // sheriff second time, no spies → nobody
  assert.deepEqual(R(['sheriff', 'citizen', 'citizen'], 0, [0]), { type: 'result', result: 'nobody' });
});
test('accused spy → guess; correct = spies win, wrong = citizens win', () => {
  assert.deepEqual(R(['citizen', 'spy', 'citizen'], 1), { type: 'guess', player: 1 });
  assert.deepEqual(R(['spy', 'spy', 'spy'], 2), { type: 'guess', player: 2 });
  assert.equal(resolveGuess('Zoo', 'Zoo'), 'spyGuessed');
  assert.equal(resolveGuess('Zoo', 'Bank'), 'citizens');
});
test('accused Joker → Joker wins (with or without spies, with saboteur too)', () => {
  assert.deepEqual(R(['spy', 'joker', 'saboteur', 'citizen', 'citizen'], 1), { type: 'result', result: 'joker' });
  assert.deepEqual(R(['joker', 'citizen', 'citizen'], 0), { type: 'result', result: 'joker' });
});
test('accused plain Citizen with a Saboteur → Saboteur wins (also with 0 spies)', () => {
  assert.deepEqual(R(['spy', 'saboteur', 'citizen', 'citizen'], 2), { type: 'result', result: 'saboteur' });
  assert.deepEqual(R(['saboteur', 'citizen', 'citizen'], 1), { type: 'result', result: 'saboteur' });
});
test('any other accused → spy/spies win, or nobody with 0 spies', () => {
  assert.deepEqual(R(['spy', 'citizen', 'citizen'], 1), { type: 'result', result: 'spyHidden' });
  assert.deepEqual(R(['spy', 'detective', 'saboteur', 'citizen', 'citizen'], 1), { type: 'result', result: 'spyHidden' });
  assert.deepEqual(R(['spy', 'detective', 'saboteur', 'citizen', 'citizen'], 2), { type: 'result', result: 'spyHidden' });
  assert.deepEqual(R(['citizen', 'citizen', 'citizen'], 0), { type: 'result', result: 'nobody' });
  assert.deepEqual(R(['detective', 'citizen', 'citizen'], 0), { type: 'result', result: 'nobody' });
});

test('singular / plural wording and every result has text in both languages', () => {
  assert.equal(resultTextKey('spyHidden', 1), 'spyHidden');
  assert.equal(resultTextKey('spyHidden', 2), 'spyHiddenMany');
  assert.equal(resultTextKey('spyGuessed', 3), 'spyGuessedMany');
  assert.equal(resultTextKey('spyNoSpy', 2), 'spyNoSpyMany');
  assert.equal(resultTextKey('citizens', 4), 'citizens');
  for (const lang of [fa, en]) {
    for (const k of ['citizens', 'noSpyRight', 'spyHidden', 'spyGuessed', 'spyNoSpy', 'saboteur', 'joker', 'nobody']) {
      for (const s of [0, 1, 2]) {
        const t = lang.res[resultTextKey(k, s)];
        assert.ok(Array.isArray(t) && t[0] && t[1], `${k}/${s}`);
      }
    }
  }
  assert.equal(en.res.spyNoSpyMany[0], 'The spies win');
  assert.equal(en.res.spyHidden[0], 'The spy wins');
  assert.equal(en.res.nobody[0], 'Nobody wins');
});

test('both language files have the same keys', () => {
  const keys = (o) => Object.keys(o).sort();
  assert.deepEqual(keys(fa), keys(en));
  assert.deepEqual(keys(fa.res), keys(en.res));
  assert.deepEqual(keys(fa.roles), keys(en.roles));
  assert.equal(fa.cats.length, en.cats.length);
});
