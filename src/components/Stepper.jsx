/** − value + control. */
export function Stepper({ value, onDec, onInc, decDisabled, incDisabled, small, label, testId }) {
  return (
    <>
      <button type="button" className={`step ${small ? 'small' : ''}`} onClick={onDec} disabled={decDisabled}
        aria-label={`${label} −`} data-testid={testId && `${testId}-dec`}>−</button>
      <div className={small ? 'custom-num' : 'big-num'} aria-live="polite" data-testid={testId && `${testId}-value`}>{value}</div>
      <button type="button" className={`step plus ${small ? 'small' : ''}`} onClick={onInc} disabled={incDisabled}
        aria-label={`${label} +`} data-testid={testId && `${testId}-inc`}>+</button>
    </>
  );
}
