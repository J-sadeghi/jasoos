import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { LANGS, DEFAULT_LANG, formatNum } from './i18n/index.js';
import { loadLang, saveLang, saveSettings } from './game/storage.js';
import { initialSettings } from './game/settings.js';
import { gameReducer, initialGame, isInGame, secondsLeft } from './game/gameReducer.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import { useTick } from './hooks/useTick.js';
import { useInstallBanner } from './hooks/useInstallBanner.js';
import { unlockAudio, playAlarm } from './alarm.js';
import { applyPendingUpdate, setReloadGuard } from './registerSW.js';
import { ExitButton, ExitDialog } from './components/ExitDialog.jsx';
import { InstallBanner } from './components/InstallBanner.jsx';
import { Home } from './screens/Home.jsx';
import { Rules } from './screens/Rules.jsx';
import { Setup } from './screens/Setup.jsx';
import { Reveal } from './screens/Reveal.jsx';
import { Round } from './screens/Round.jsx';
import { Vote } from './screens/Vote.jsx';
import { Guess } from './screens/Guess.jsx';
import { Result } from './screens/Result.jsx';

const CAT_COUNTS = Object.fromEntries(Object.entries(LANGS).map(([k, L]) => [k, L.cats.length]));

export default function App() {
  const [lang, setLang] = useState(() => (LANGS[loadLang()] ? loadLang() : DEFAULT_LANG));
  const [settings, setSettings] = useState(() => initialSettings(CAT_COUNTS));
  const [state, dispatch] = useReducer(gameReducer, initialGame);
  const install = useInstallBanner();
  const t = LANGS[lang];
  const { screen, game } = state;

  // Remember language + setup on this device.
  useEffect(() => { saveLang(lang); }, [lang]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  // Page language / direction (RTL for Persian).
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang, t.dir]);

  // A new version was downloaded in the background: switch to it when we are back on the home screen.
  useEffect(() => {
    setReloadGuard(() => screen === 'home');
    if (screen === 'home') applyPendingUpdate();
  }, [screen]);

  const num = useCallback((v) => formatNum(t, v), [t]);
  const nameOf = useCallback((i) => (settings.names[i] || '').trim() || `${t.player} ${num(i + 1)}`, [settings.names, t, num]);

  const pool = useMemo(() => settings.cats[lang].flatMap((i) => t.cats[i].words), [settings.cats, lang, t]);
  const deal = () => dispatch({ type: 'deal', settings, pool });

  // ----- discussion timer -----
  const timerRunning = screen === 'round' && game?.timer.endAt != null;
  useTick(timerRunning, 250); // re-render 4× per second while the clock runs
  const left = game ? Math.min(game.timer.total, secondsLeft(game.timer, Date.now())) : 0;
  useWakeLock(screen === 'round' || screen === 'reveal');

  const soundRef = useRef(settings.sound);
  soundRef.current = settings.sound;
  useEffect(() => {
    if (timerRunning && left <= 0) {
      playAlarm(soundRef.current);
      dispatch({ type: 'timeUp' });
    }
  }, [timerRunning, left]);

  const go = (s) => dispatch({ type: 'go', screen: s });
  const common = { t, num, game, nameOf };

  let view = null;
  switch (screen) {
    case 'home':
      view = <Home t={t} lang={lang} onLang={setLang} onSetup={() => go('setup')} onRules={() => go('rules')} />;
      break;
    case 'rules':
      view = <Rules t={t} onBack={() => go('home')} />;
      break;
    case 'setup':
      view = (
        <Setup t={t} num={num} lang={lang} settings={settings} update={setSettings} poolSize={pool.length}
          onBack={() => go('home')} onStart={deal} />
      );
      break;
    case 'reveal':
      view = (
        <Reveal {...common} onReveal={() => dispatch({ type: 'reveal' })}
          onNext={() => { unlockAudio(); dispatch({ type: 'nextPlayer', now: Date.now() }); }} />
      );
      break;
    case 'round':
      view = (
        <Round {...common} left={left} onRoll={() => dispatch({ type: 'rollAsk' })}
          onPause={() => { unlockAudio(); dispatch({ type: 'togglePause', now: Date.now() }); }}
          onVote={() => dispatch({ type: 'toVote', now: Date.now() })} />
      );
      break;
    case 'vote':
      view = <Vote {...common} onChoose={(c) => dispatch({ type: 'choose', choice: c })} onConfirm={() => dispatch({ type: 'confirmVote' })} />;
      break;
    case 'guess':
      view = <Guess {...common} onGuess={(w) => dispatch({ type: 'guess', word: w })} />;
      break;
    case 'result':
      view = <Result {...common} onHome={() => go('home')} onAgain={deal} />;
      break;
    default:
      view = null;
  }

  return (
    <div className="app" dir={t.dir} lang={lang}>
      {/* key makes each screen play its entry animation */}
      <div key={screen} style={{ display: 'contents' }}>{view}</div>
      {isInGame(screen) && <ExitButton t={t} onClick={() => dispatch({ type: 'askExit' })} />}
      {state.confirmExit && (
        <ExitDialog t={t} onCancel={() => dispatch({ type: 'cancelExit' })} onConfirm={() => dispatch({ type: 'exitHome' })} />
      )}
      {screen === 'home' && (
        <InstallBanner t={t} kind={install.kind} onDismiss={install.dismiss} onInstall={install.install} />
      )}
    </div>
  );
}
