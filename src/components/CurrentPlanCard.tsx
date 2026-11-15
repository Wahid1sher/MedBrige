import { useCarePlan } from '../state/CarePlan';
import { dueEntries } from '../services/carePlan';
import { Check, Clock3, FileText, ArrowRight } from 'lucide-react';
export function CurrentPlanCard() {
  const { snapshot, setSnapshot } = useCarePlan();
  const entries = dueEntries(snapshot),
    next = entries.find((e) => e.status !== 'taken') ?? entries[entries.length - 1];
  if (!next) return null;
  return (
    <div className="dose-card current-plan-card">
      <div className="dose-topline">
        <span className="dose-eyebrow">
          {next.status === 'taken' ? 'YOUR CHECK-INS ARE COMPLETE' : 'NEXT IN YOUR REVIEWED PLAN'}
        </span>
        <span className="dose-time">{next.time}</span>
      </div>
      <h2>
        {next.medicine.name}
        <span>{next.medicine.strength}</span>
      </h2>
      <div className="real-pill-placeholder">
        <FileText size={32} />
        <span>Follow your original label</span>
        <small>Pill appearance is not verified.</small>
      </div>
      <p className="dose-description">
        {next.medicine.dose || 'Dose not stated'} · User-entered time
      </p>
      <p className="source-status-line">
        Duration: {next.medicine.duration || 'not stated'} · Status:{' '}
        {next.medicine.status || 'not stated'}
      </p>
      <div className="dose-actions">
        <button
          className="button dose-taken"
          disabled={next.status === 'taken'}
          onClick={() =>
            setSnapshot((s) => ({ ...s, checkins: { ...s.checkins, [next.key]: 'taken' } }))
          }
        >
          {next.status === 'taken' ? (
            <>
              <Check size={17} />
              Marked taken
            </>
          ) : (
            'I took it'
          )}
        </button>
        <a className="button dose-later" href="#day-plan">
          <Clock3 size={16} />
          All times
        </a>
      </div>
      <p className="dose-message">Personal log only. Ask your pharmacist about missed doses.</p>
      <a href="#medicines" className="text-button">
        Review original wording
        <ArrowRight size={14} />
      </a>
    </div>
  );
}
