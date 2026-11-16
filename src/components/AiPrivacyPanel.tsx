import { LockKeyhole, Scale, Cloud, ShieldCheck } from 'lucide-react';
import type { AnalysisPolicy } from '../services/hybridAi';
import type { LocalAiCheckState } from '../state/useLocalAiCheck';
import { LocalAiCheck } from './LocalAiCheck';

const choices = [
  { policy: 'local-only', label: 'Strict local', icon: LockKeyhole },
  { policy: 'local-first-with-consent', label: 'Balanced', icon: Scale },
  { policy: 'cloud-first-with-consent', label: 'Best quality', icon: Cloud },
] as const;
export function AiPrivacyPanel({
  policy,
  disabled,
  onSelect,
  status,
  check,
}: {
  policy: AnalysisPolicy;
  disabled: boolean;
  onSelect: (policy: AnalysisPolicy) => void;
  status: string;
  check: LocalAiCheckState;
}) {
  return (
    <section className="ai-privacy-panel" aria-label="AI privacy preferences">
      <p className="privacy-panel-label">PRIVACY</p>
      <div className="privacy-options" role="group" aria-label="Privacy mode">
        {choices.map(({ policy: value, label, icon: Icon }) => (
          <button
            key={value}
            aria-pressed={policy === value}
            disabled={disabled || check.busy}
            onClick={() => onSelect(value)}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
            {policy === value && <span className="privacy-selected" aria-hidden="true" />}
          </button>
        ))}
      </div>
      <p className="privacy-panel-description">
        {policy === 'local-only'
          ? 'Document text stays on this device. Cloud fallback is off.'
          : policy === 'local-first-with-consent'
            ? 'On-device first. Only your reviewed text may go to cloud AI.'
            : 'Cloud first for your reviewed text. Original photos stay on this device.'}
      </p>
      <p className="privacy-runtime-status" role="status">
        <span
          className={`runtime-dot ${check.outcome === 'ready' ? 'ready' : ''}`}
          aria-hidden="true"
        />
        {status}
      </p>
      <span className="privacy-model-note">
        <ShieldCheck size={13} aria-hidden="true" />
        Model version unverified
      </span>
      <LocalAiCheck check={check} disabled={disabled} compact />
      <a className="privacy-details-link" href="#privacy">
        Review text & privacy
      </a>
    </section>
  );
}
