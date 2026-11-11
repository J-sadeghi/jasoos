import { CREDIT, VERSION } from '../config.js';
import { formatNum } from '../i18n/index.js';

export const versionText = (t) => `${t.versionWord} ${formatNum(t, VERSION)}`;

export function Footer({ t }) {
  return (
    <div className="footer">
      {CREDIT.trim() && <><span>{CREDIT}</span><span>·</span></>}
      <span>{versionText(t)}</span>
    </div>
  );
}
