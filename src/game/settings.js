import { clamp, MIN_PLAYERS, MAX_PLAYERS, SPECIALS } from './rules.js';
import { loadSettings } from './storage.js';

export const TIME_PRESETS = [3, 5, 8, 12];
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 30;

export const DEFAULT_SETTINGS = {
  players: 6,
  names: [],
  spies: 1,
  tellSpies: false,
  cats: { fa: [0], en: [0] }, // selected category indexes, per language
  minutes: 8,
  on: { detective: true, saboteur: true, sheriff: false, joker: false },
  jokerKnows: true,
  sound: true,
};

/** Merge saved settings with defaults and fix anything out of range. */
export function sanitize(raw, catCounts) {
  const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  const num = (v, d) => (Number.isFinite(+v) ? Math.round(+v) : d);
  s.players = clamp(num(s.players, 6), MIN_PLAYERS, MAX_PLAYERS);
  s.spies = clamp(num(s.spies, 1), 0, s.players);
  s.minutes = clamp(num(s.minutes, 8), MIN_MINUTES, MAX_MINUTES);
  s.names = Array.isArray(s.names) ? s.names.slice(0, MAX_PLAYERS).map((n) => (typeof n === 'string' ? n : '')) : [];
  s.on = Object.fromEntries(SPECIALS.map((k) => [k, typeof s.on?.[k] === 'boolean' ? s.on[k] : DEFAULT_SETTINGS.on[k]]));
  s.tellSpies = !!s.tellSpies;
  s.jokerKnows = s.jokerKnows !== false;
  s.sound = s.sound !== false;
  const cats = {};
  for (const [lang, total] of Object.entries(catCounts)) {
    const list = Array.isArray(s.cats?.[lang]) ? [...new Set(s.cats[lang])].filter((i) => Number.isInteger(i) && i >= 0 && i < total) : [];
    cats[lang] = list.length ? list.sort((a, b) => a - b) : [0];
  }
  s.cats = cats;
  return s;
}

export const initialSettings = (catCounts) => sanitize(loadSettings(), catCounts);
