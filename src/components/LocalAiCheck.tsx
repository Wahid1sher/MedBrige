import { LoaderCircle, Cpu, ArrowRight, X } from 'lucide-react';
import type { LocalAiCheckState } from '../state/useLocalAiCheck';

export function LocalAiCheck({
  disabled,
  check,
  compact = false,
}: {
  disabled: boolean;
  check: LocalAiCheckState;
  compact?: boolean;
}) {
  return (
    <section
      className={`local-ai-check ${compact ? 'compact' : ''}`}
      aria-label={compact ? 'Sidebar local AI check' : 'Local AI check'}
    >
      {!compact && (
        <>
          <span className="check-eyebrow">
            <Cpu size={16} aria-hidden="true" /> ON YOUR DEVICE
          </span>
          <h2>Having trouble with local AI?</h2>
          <p>
            Test a short reply first. This uses no document text and cannot fall back to the cloud.
          </p>
        </>
      )}
      <div className="local-check-actions">
        {!(compact && check.busy) && (
          <button
            className="button secondary"
            disabled={disabled || check.busy}
            onClick={() => void check.start()}
          >
            {check.busy ? (
              <LoaderCircle size={16} className="spin" aria-hidden="true" />
            ) : (
              <Cpu size={16} aria-hidden="true" />
            )}
            {check.busy ? 'Checking local AI…' : 'Check local AI'}
            {!compact && !check.busy && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        )}
        {check.busy && (
          <button className="button secondary cancel-check" onClick={check.cancel}>
            <X size={15} aria-hidden="true" />
            Cancel check
          </button>
        )}
      </div>
      {!compact && check.message && (
        <p role="status" className={`local-check-message ${check.outcome}`}>
          {check.message}
          {check.busy && ` · ${check.elapsed}s`}
        </p>
      )}
      {!compact && (
        <p className="local-check-footnote">
          First-time model setup can take longer. Keep this Chrome tab open. A successful check does
          not confirm a specific Nano version.
        </p>
      )}
    </section>
  );
}
