// End-to-end test: plays real games in Chromium against the built site at /jasoos/.
// Run:  npm run build && npx vite preview --port 4173   (in one terminal)
//       node tests/e2e.cjs                               (in another)
const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');

const SITE = process.env.SITE || 'http://localhost:4173/jasoos/';
const NONE = { detective: false, saboteur: false, sheriff: false, joker: false };
const settings = (o) => ({
  players: 6, names: [], spies: 1, tellSpies: false, cats: { fa: [0], en: [0] }, minutes: 8,
  on: NONE, jokerKnows: true, sound: false, ...o,
});

let browser;
let passed = 0;
const results = [];

async function newPage(lang, s, opts = {}) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], ...opts });
  await ctx.addInitScript(([l, st]) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('jasoos.lang', l);
      localStorage.setItem('jasoos.a2hs', '1');
      if (st) localStorage.setItem('jasoos.settings.v3', JSON.stringify(st));
      sessionStorage.setItem('seeded', '1');
    }
  }, [lang, s]);
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.goto(SITE);
  return page;
}

const tid = (p, id) => p.locator(`[data-testid="${id}"]`);

/** Deal and walk through the reveal; returns [{role, word}] per player. */
async function dealAndReveal(p) {
  await tid(p, 'new-game').click();
  await tid(p, 'start').click();
  const seen = [];
  const n = await tid(p, 'progress').textContent().then(() => p.evaluate(() =>
    JSON.parse(localStorage.getItem('jasoos.settings.v3')).players));
  for (let i = 0; i < n; i++) {
    await tid(p, 'show-role').click();
    const role = await tid(p, 'role-name').getAttribute('data-role');
    const word = (await tid(p, 'word').textContent()).trim();
    const spyCount = await tid(p, 'spy-count').count();
    const bg = await p.locator('main').evaluate((el) => el.classList.contains('spy') ? 'spy-bg' : 'normal');
    seen.push({ role, word, spyCount, bg });
    await tid(p, 'next').click();
  }
  await tid(p, 'round').waitFor();
  return seen;
}

async function vote(p, choice) {
  if (!(await tid(p, 'vote').count())) await tid(p, 'to-vote').click();
  await tid(p, choice === 'none' ? 'vote-none' : `vote-${choice}`).click();
  await tid(p, 'confirm-vote').click();
}

async function result(p) {
  await tid(p, 'result').waitFor();
  return {
    kind: await tid(p, 'result').getAttribute('data-result'),
    title: (await tid(p, 'result-title').textContent()).trim(),
    kicker: (await tid(p, 'result-kicker').textContent()).trim(),
  };
}

async function scenario(name, fn) {
  try {
    await fn();
    passed++;
    results.push(`  ✔ ${name}`);
  } catch (e) {
    results.push(`  ✘ ${name}\n      ${e.message.split('\n').join('\n      ')}`);
    process.exitCode = 1;
  }
}

(async () => {
  browser = await chromium.launch();

  // ---------------- win conditions ----------------
  await scenario('0 spies + "There is no spy" → Citizens win', async () => {
    const p = await newPage('fa', settings({ spies: 0 }));
    const seen = await dealAndReveal(p);
    assert.ok(seen.every((s) => s.role !== 'spy' && s.word !== '؟ ؟ ؟'), 'everyone sees the word');
    await vote(p, 'none');
    const r = await result(p);
    assert.equal(r.kind, 'noSpyRight');
    assert.equal(r.title, 'شهروندها بردند');
    assert.deepEqual(p.errors, []);
    await p.context().close();
  });

  await scenario('0 spies + accuse a citizen (no saboteur) → Nobody wins', async () => {
    const p = await newPage('en', settings({ spies: 0 }));
    await dealAndReveal(p);
    await vote(p, 0);
    const r = await result(p);
    assert.equal(r.kind, 'nobody');
    assert.equal(r.title, 'Nobody wins');
    assert.equal(r.kicker, 'There was no spy!');
    await p.context().close();
  });

  await scenario('0 spies + saboteur + accuse plain citizen → Saboteur wins', async () => {
    const p = await newPage('fa', settings({ spies: 0, on: { ...NONE, saboteur: true } }));
    const seen = await dealAndReveal(p);
    await vote(p, seen.findIndex((s) => s.role === 'citizen'));
    const r = await result(p);
    assert.equal(r.kind, 'saboteur');
    assert.equal(r.title, 'خرابکار برد');
    await p.context().close();
  });

  await scenario('1 spy + "There is no spy" → The spy wins (singular)', async () => {
    const p = await newPage('en', settings({ spies: 1 }));
    const seen = await dealAndReveal(p);
    assert.equal(seen.filter((s) => s.role === 'spy').length, 1);
    await vote(p, 'none');
    const r = await result(p);
    assert.equal(r.kind, 'spyNoSpy');
    assert.equal(r.title, 'The spy wins');
    await p.context().close();
  });

  await scenario('3 spies + "There is no spy" → The spies win (plural)', async () => {
    const p = await newPage('fa', settings({ spies: 3 }));
    const seen = await dealAndReveal(p);
    assert.equal(seen.filter((s) => s.role === 'spy').length, 3);
    await vote(p, 'none');
    const r = await result(p);
    assert.equal(r.title, 'جاسوس‌ها بردند');
    await p.context().close();
  });

  await scenario('Accused spy guesses RIGHT → spy wins (caught, but guessed)', async () => {
    const p = await newPage('en', settings({ spies: 1 }));
    const seen = await dealAndReveal(p);
    const word = seen.find((s) => s.role !== 'spy').word;
    await vote(p, seen.findIndex((s) => s.role === 'spy'));
    await tid(p, 'guess').waitFor();
    const opts = await tid(p, 'guess-opt').allTextContents();
    assert.equal(opts.length, 6);
    assert.equal(new Set(opts).size, 6);
    assert.ok(opts.includes(word));
    await tid(p, 'guess-opt').filter({ hasText: new RegExp(`^${word}$`) }).click();
    const r = await result(p);
    assert.equal(r.kind, 'spyGuessed');
    assert.equal(r.title, 'The spy wins');
    assert.equal(r.kicker, 'Caught, but guessed the word');
    await p.context().close();
  });

  await scenario('Accused spy guesses WRONG → Citizens win', async () => {
    const p = await newPage('fa', settings({ spies: 2 }));
    const seen = await dealAndReveal(p);
    const word = seen.find((s) => s.role !== 'spy').word;
    await vote(p, seen.findIndex((s) => s.role === 'spy'));
    const opts = await tid(p, 'guess-opt').allTextContents();
    await tid(p, 'guess-opt').filter({ hasText: new RegExp(`^${opts.find((o) => o !== word)}$`) }).click();
    const r = await result(p);
    assert.equal(r.kind, 'citizens');
    assert.equal(r.title, 'شهروندها بردند');
    await p.context().close();
  });

  await scenario('Accused Joker → Joker wins', async () => {
    const p = await newPage('en', settings({ spies: 1, on: { ...NONE, joker: true, saboteur: true } }));
    const seen = await dealAndReveal(p);
    await vote(p, seen.findIndex((s) => s.role === 'joker'));
    assert.equal((await result(p)).title, 'The Joker wins');
    await p.context().close();
  });

  await scenario('Sheriff immune first time, normal second time', async () => {
    const p = await newPage('en', settings({ spies: 1, on: { ...NONE, sheriff: true } }));
    const seen = await dealAndReveal(p);
    const sh = seen.findIndex((s) => s.role === 'sheriff');
    await vote(p, sh);
    await tid(p, 'notice').waitFor();
    assert.equal(await tid(p, 'notice').textContent(), 'The Sheriff was immune — no one was ejected. Vote again.');
    assert.equal(await tid(p, 'vote').count(), 1, 'still on vote screen');
    await vote(p, sh);
    const r = await result(p);
    assert.equal(r.kind, 'spyHidden');
    assert.equal(r.title, 'The spy wins');
    assert.equal(r.kicker, 'Nobody figured it out');
    await p.context().close();
  });

  await scenario('Accused Detective (not a plain citizen) with saboteur → spy wins', async () => {
    const p = await newPage('fa', settings({ spies: 1, on: { ...NONE, detective: true, saboteur: true } }));
    const seen = await dealAndReveal(p);
    await vote(p, seen.findIndex((s) => s.role === 'detective'));
    const r = await result(p);
    assert.equal(r.kind, 'spyHidden');
    assert.equal(r.title, 'جاسوس برد');
    await p.context().close();
  });

  await scenario('2 spies, accuse a citizen, no saboteur → The spies win (nobody figured it out)', async () => {
    const p = await newPage('en', settings({ spies: 2 }));
    const seen = await dealAndReveal(p);
    await vote(p, seen.findIndex((s) => s.role === 'citizen'));
    const r = await result(p);
    assert.equal(r.title, 'The spies win');
    assert.equal(r.kicker, 'Nobody figured it out');
    await p.context().close();
  });

  await scenario('Everyone is a spy: no word for anyone; "no spy" → spies win; accuse → guess', async () => {
    const p = await newPage('fa', settings({ players: 5, spies: 5, on: { detective: true, saboteur: true, sheriff: true, joker: true } }));
    const seen = await dealAndReveal(p);
    assert.ok(seen.every((s) => s.role === 'spy' && s.word === '؟ ؟ ؟'));
    assert.ok(seen.every((s) => s.bg === 'spy-bg'), 'spy screen is light red');
    await vote(p, 'none');
    assert.equal((await result(p)).title, 'جاسوس‌ها بردند');
    // next round, same settings: accuse someone → that spy guesses
    await tid(p, 'again').click();
    for (let i = 0; i < 5; i++) { await tid(p, 'show-role').click(); await tid(p, 'next').click(); }
    await vote(p, 3);
    await tid(p, 'guess').waitFor();
    assert.ok((await p.locator('h1').textContent()).startsWith('بازیکن ۴'));
    await p.context().close();
  });

  // ---------------- other rules ----------------
  await scenario('Spy count hidden when option OFF, shown when ON', async () => {
    let p = await newPage('en', settings({ spies: 2, tellSpies: false }));
    let seen = await dealAndReveal(p);
    assert.ok(seen.every((s) => s.spyCount === 0));
    assert.equal(await tid(p, 'spy-count').count(), 0);
    await p.context().close();
    p = await newPage('en', settings({ spies: 2, tellSpies: true }));
    seen = await dealAndReveal(p);
    assert.ok(seen.every((s) => s.spyCount === 1));
    assert.equal((await tid(p, 'spy-count').textContent()).trim(), 'Spies in this round: 2');
    await p.context().close();
  });

  await scenario('Joker does not see the word when "Joker knows" is off', async () => {
    const p = await newPage('en', settings({ spies: 0, on: { ...NONE, joker: true }, jokerKnows: false }));
    const seen = await dealAndReveal(p);
    const j = seen.find((s) => s.role === 'joker');
    assert.equal(j.word, '? ? ?');
    assert.ok(seen.filter((s) => s.role !== 'joker').every((s) => s.word !== '? ? ?'));
    await p.context().close();
  });

  await scenario('Timer reaching 0 goes to voting with "Discussion time is over."', async () => {
    const p = await newPage('en', settings({ minutes: 1 }));
    await p.clock.install();
    await dealAndReveal(p);
    assert.equal(await tid(p, 'clock').textContent(), '1:00');
    await tid(p, 'pause').click(); // pause…
    await p.clock.runFor(20000);
    assert.equal(await tid(p, 'clock').textContent(), '1:00', 'paused clock does not move');
    await tid(p, 'pause').click(); // …resume
    await p.clock.runFor(30000);
    assert.equal(await tid(p, 'clock').textContent(), '0:30');
    await p.clock.runFor(31000);
    await tid(p, 'vote').waitFor();
    assert.equal(await tid(p, 'notice').textContent(), 'Discussion time is over.');
    await p.context().close();
  });

  await scenario('Ask draw always shows two different players', async () => {
    const p = await newPage('en', settings({ players: 3 }));
    await dealAndReveal(p);
    for (let i = 0; i < 25; i++) {
      const names = await tid(p, 'ask').locator('.nm').allTextContents();
      assert.notEqual(names[0], names[1]);
      await tid(p, 'roll').click();
    }
    await p.context().close();
  });

  await scenario('Setup: spies follow player count down, skipped-roles note, persistence', async () => {
    const p = await newPage('en', settings({ players: 4, spies: 4, on: { detective: true, saboteur: true, sheriff: false, joker: false } }));
    await tid(p, 'new-game').click();
    assert.equal(await tid(p, 'spies-value').textContent(), '4');
    await tid(p, 'players-dec').click();
    assert.equal(await tid(p, 'players-value').textContent(), '3');
    assert.equal(await tid(p, 'spies-value').textContent(), '3', 'spies lowered automatically');
    assert.equal(await tid(p, 'spies-inc').isDisabled(), true);
    assert.equal(await tid(p, 'specials-note').textContent(), 'With 3 players and 3 spies, these roles are skipped: Detective, Saboteur');
    await tid(p, 'spies-dec').click(); await tid(p, 'spies-dec').click(); await tid(p, 'spies-dec').click();
    assert.equal(await tid(p, 'spies-value').textContent(), '0');
    assert.equal(await tid(p, 'spies-dec').isDisabled(), true);
    assert.equal(await tid(p, 'specials-note').textContent(), 'With 3 players and 0 spies, these roles are skipped: Saboteur');
    // categories: "All" → count, deselecting last keeps one
    await tid(p, 'cat-all').click();
    assert.equal(await tid(p, 'cat-count').textContent(), '176 words in 12 categories');
    await tid(p, 'cat-all').click();
    assert.equal(await tid(p, 'cat-count').textContent(), '20 words in 1 categories');
    await tid(p, 'cat-0').click();
    assert.equal(await tid(p, 'cat-count').textContent(), '20 words in 1 categories', 'last category stays selected');
    await tid(p, 'time-12').click();
    await tid(p, 'minutes-inc').click();
    assert.equal(await tid(p, 'minutes-value').textContent(), '13');
    await tid(p, 'edit-names').click();
    await tid(p, 'name-0').fill('Sara');
    await p.reload();
    await tid(p, 'new-game').click();
    assert.equal(await tid(p, 'players-value').textContent(), '3');
    assert.equal(await tid(p, 'spies-value').textContent(), '0');
    assert.equal(await tid(p, 'minutes-value').textContent(), '13');
    await tid(p, 'edit-names').click();
    assert.equal(await tid(p, 'name-0').inputValue(), 'Sara');
    await p.context().close();
  });

  await scenario('Persian digits, custom names, Home confirm, next round keeps names', async () => {
    const p = await newPage('fa', settings({ players: 12, spies: 1, names: ['علی', '', 'مریم'] }));
    await tid(p, 'new-game').click();
    assert.equal(await tid(p, 'players-value').textContent(), '۱۲');
    assert.equal(await tid(p, 'cat-count').textContent(), '۲۲ کلمه در ۱ دسته');
    await tid(p, 'start').click();
    assert.equal(await tid(p, 'pass-name').textContent(), 'علی');
    assert.equal(await tid(p, 'progress').textContent(), '۱ از ۱۲');
    await tid(p, 'show-role').click(); await tid(p, 'next').click();
    assert.equal(await tid(p, 'pass-name').textContent(), 'بازیکن ۲');
    await tid(p, 'exit').click();
    await tid(p, 'keep-playing').click();
    assert.equal(await tid(p, 'pass-name').textContent(), 'بازیکن ۲', 'keep playing stays');
    await tid(p, 'exit').click();
    await tid(p, 'confirm-exit').click();
    await tid(p, 'new-game').waitFor();
    await tid(p, 'new-game').click(); await tid(p, 'start').click();
    for (let i = 0; i < 12; i++) { await tid(p, 'show-role').click(); await tid(p, 'next').click(); }
    await vote(p, 'none');
    await result(p);
    assert.equal(await tid(p, 'final-row').count(), 12);
    await tid(p, 'again').click();
    assert.equal(await tid(p, 'pass-name').textContent(), 'علی');
    await p.context().close();
  });

  await scenario('Language switch is remembered; Rules show the new paragraph', async () => {
    const p = await newPage('fa', null);
    assert.equal(await p.evaluate(() => document.documentElement.dir), 'rtl');
    await tid(p, 'lang-en').click();
    assert.equal(await p.evaluate(() => document.documentElement.dir), 'ltr');
    await p.reload();
    assert.equal(await tid(p, 'new-game').textContent(), 'New game');
    await tid(p, 'rules').click();
    assert.match(await tid(p, 'flow2').textContent(), /There is no spy/);
    await p.context().close();
  });

  // ---------------- PWA ----------------
  await scenario('PWA: manifest at /jasoos/, installable, works offline', async () => {
    const ctx = await browser.newContext({ ...devices['Pixel 7'] });
    const p = await ctx.newPage();
    await p.goto(SITE);
    const m = await (await p.request.get(SITE + 'manifest.webmanifest')).json();
    assert.equal(m.start_url, '/jasoos/');
    assert.equal(m.scope, '/jasoos/');
    for (const i of m.icons) assert.equal((await p.request.get(new URL(i.src, SITE).href)).status(), 200, i.src);
    const reg = await p.evaluate(async () => {
      const r = await navigator.serviceWorker.ready;
      return r.scope;
    });
    assert.equal(reg, SITE);
    const cdp = await ctx.newCDPSession(p);
    const inst = await cdp.send('Page.getInstallabilityErrors');
    assert.deepEqual(inst.installabilityErrors, [], JSON.stringify(inst.installabilityErrors));
    await p.reload(); // page is now controlled by the service worker
    await ctx.setOffline(true);
    await p.reload();
    await tid(p, 'new-game').click();
    await tid(p, 'start').click();
    await tid(p, 'show-role').waitFor();
    const fontsOk = await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('40px Lalezar', 'جاسوس') && [...document.fonts].some((f) => f.family.includes('Lalezar') && f.status === 'loaded'); });
    assert.ok(fontsOk, 'fonts loaded offline');
    await ctx.close();
  });

  await browser.close();
  console.log(results.join('\n'));
  console.log(`\n${passed} / ${results.length} scenarios passed`);
})();
