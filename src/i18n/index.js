import fa from './fa.json';
import en from './en.json';

export const LANGS = { fa, en };
export const DEFAULT_LANG = 'fa';

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Write a number with Persian digits when the language wants it. */
export const formatNum = (t, value) => {
  const s = String(value);
  return t.digits ? s.replace(/[0-9]/g, (d) => FA_DIGITS[+d]) : s;
};

/** Fill "{name}" placeholders. */
export const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));
