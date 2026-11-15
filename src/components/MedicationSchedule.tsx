import { useState } from 'react';
import {
  Pill,
  Clock3,
  TriangleAlert,
  BookOpen,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowRight,
  Cloud,
  FileText,
} from 'lucide-react';
import {
  medicationFields,
  type MedicationAnalysis,
  type MedicationDraft,
} from '../types/medication';
import { parseMedicationResponse } from '../services/hybridAi';
import { type PlanMedicine } from '../services/carePlan';
import { useCarePlan } from '../state/CarePlan';
export function draftToPlan(m: MedicationDraft): PlanMedicine {
  return {
    id: m.id,
    name: m.name.value,
    strength: m.strength?.value ?? '',
    dose: m.dose?.value ?? '',
    frequency: m.frequency?.value ?? '',
    timing: m.timing?.value ?? '',
    route: m.route?.value ?? '',
    duration: m.duration?.value ?? '',
    status: m.status?.value ?? '',
    quote: [
      ...new Set(medicationFields.map((key) => m[key]?.quote).filter((q): q is string => !!q)),
    ].join('\n'),
    times: [],
    confirmed: false,
  };
}
function MedicinePlanCard({ medicine: m }: { medicine: PlanMedicine }) {
  const { setSnapshot } = useCarePlan();
  const [time, setTime] = useState(''),
    [error, setError] = useState('');
  function update(change: Partial<PlanMedicine>) {
    setSnapshot((s) => ({
      ...s,
      medicines: s.medicines.map((v) => (v.id === m.id ? { ...v, ...change } : v)),
      checkins: Object.fromEntries(
        Object.entries(s.checkins).filter(([key]) => !key.includes(`:${m.id}:`)),
      ),
    }));
  }
  return (
    <article className="medicine plan-medicine">
      <div className="medicine-title">
        <span className="medicine-icon">
          <Pill size={21} />
        </span>
        <div>
          <small>{m.confirmed ? 'USER REVIEWED' : 'REVIEW REQUIRED'}</small>
          <h3>{m.name}</h3>
        </div>
        {m.strength && <span className="strength-chip">{m.strength}</span>}
      </div>
      <dl>
        <div>
          <dt>Dose in source</dt>
          <dd>{m.dose || 'Not stated / not confirmed'}</dd>
        </div>
        <div>
          <dt>Frequency / conditions</dt>
          <dd>{m.frequency || 'Not stated / not confirmed'}</dd>
        </div>
        <div>
          <dt>Timing words in source</dt>
          <dd>{m.timing || 'No specific timing provided'}</dd>
        </div>
        <div>
          <dt>Route in source</dt>
          <dd>{m.route || 'Not stated / not confirmed'}</dd>
        </div>
        <div>
          <dt>Duration in source</dt>
          <dd>{m.duration || 'Not stated / not confirmed'}</dd>
        </div>
        <div>
          <dt>Status in source</dt>
          <dd>{m.status || 'Not stated / not confirmed'}</dd>
        </div>
      </dl>
      <details open={!m.confirmed}>
        <summary>
          <BookOpen size={15} />
          Compare original wording
        </summary>
        <blockquote>{m.quote}</blockquote>
      </details>
      <div className="time-editor">
        <label htmlFor={`time-${m.id}`}>
          <Clock3 size={15} />
          Time confirmed by your care team
        </label>
        <div>
          <input
            id={`time-${m.id}`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <button
            className="button secondary"
            disabled={!time || m.times.length >= 8}
            onClick={() => {
              if (m.times.includes(time)) {
                setError('That time is already added.');
                return;
              }
              update({ times: [...m.times, time].sort(), confirmed: false });
              setTime('');
              setError('');
            }}
          >
            <Plus size={15} />
            Add time
          </button>
        </div>
        <div className="time-chips">
          {m.times.map((t) => (
            <button
              key={t}
              onClick={() => update({ times: m.times.filter((v) => v !== t), confirmed: false })}
              aria-label={`Remove ${t} for ${m.name}`}
            >
              {t}
              <span>×</span>
            </button>
          ))}
        </div>
        <p>
          Times are entered by you, never guessed by AI. As-needed and changing-dose instructions
          need care-team guidance.
        </p>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <label className="review-confirm">
        <input
          type="checkbox"
          checked={m.confirmed}
          onChange={(e) => update({ confirmed: e.target.checked })}
        />
        <span>I checked this entry and any times against my care team’s instructions.</span>
      </label>
      <button
        className="text-button remove-entry"
        onClick={() =>
          setSnapshot((s) => ({
            ...s,
            medicines: s.medicines.filter((v) => v.id !== m.id),
            checkins: Object.fromEntries(
              Object.entries(s.checkins).filter(([key]) => !key.includes(`:${m.id}:`)),
            ),
          }))
        }
      >
        <Trash2 size={14} />
        Remove entry
      </button>
    </article>
  );
}
export function MedicationSchedule({
  analysis,
  sourceText,
}: {
  readonly analysis: MedicationAnalysis | null;
  readonly sourceText: string;
}) {
  const { snapshot, setSnapshot } = useCarePlan();
  const [manual, setManual] = useState(false),
    [fields, setFields] = useState({
      name: '',
      strength: '',
      dose: '',
      frequency: '',
      timing: '',
      route: '',
      duration: '',
      status: '',
      quote: '',
    }),
    [error, setError] = useState('');
  const allFromAnalysis =
    !!analysis && snapshot.medicines.every((m) => analysis.medications.some((a) => a.id === m.id));
  const label = !allFromAnalysis
    ? 'User-entered or restored care notes'
    : analysis?.inferenceSource === 'cloud'
      ? 'Firebase AI Logic · cloud'
      : analysis?.inferenceSource === 'on-device'
        ? 'Firebase AI Logic · on-device'
        : analysis?.inferenceSource === 'sample'
          ? 'Hand-authored example · not an AI result'
          : 'Manual source entry';
  function addManual() {
    try {
      const field = (key: keyof typeof fields) =>
        fields[key].trim() ? { value: fields[key].trim(), quote: fields.quote } : null;
      const [draft] = parseMedicationResponse(
        JSON.stringify({
          medications: [
            {
              name: field('name'),
              strength: field('strength'),
              dose: field('dose'),
              frequency: field('frequency'),
              timing: field('timing'),
              route: field('route'),
              duration: field('duration'),
              status: field('status'),
            },
          ],
        }),
        sourceText,
      );
      if (!draft) throw new Error();
      setSnapshot((s) => ({ ...s, medicines: [...s.medicines, draftToPlan(draft)] }));
      setFields({
        name: '',
        strength: '',
        dose: '',
        frequency: '',
        timing: '',
        route: '',
        duration: '',
        status: '',
        quote: '',
      });
      setManual(false);
      setError('');
    } catch {
      setError(
        'Copy the exact medicine words and an exact source quote containing them. Nothing was added.',
      );
    }
  }
  return (
    <>
      <section className="card medicine-workspace">
        <div className="card-heading">
          <div>
            <span className="section-kicker">SOURCE → REVIEW → YOUR DAY</span>
            <h2>Your medicine review</h2>
          </div>
          <span className="count-badge">{snapshot.medicines.length} entries</span>
        </div>
        <p className="supporting">
          Check names, decimals, units and instructions. Add only times your care team has
          confirmed, then mark the entry reviewed.
        </p>
        {snapshot.medicines.length > 0 && (
          <div className="analysis-source">
            {analysis?.inferenceSource === 'cloud' ? (
              <Cloud size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
            {label}
            <span>{snapshot.medicines.filter((m) => m.confirmed).length} user-reviewed</span>
          </div>
        )}
        {!snapshot.medicines.length && (
          <div className="empty-state">
            <div className="medicine-illustration" aria-hidden="true">
              <span className="pill-shape one" />
              <span className="pill-shape two" />
              <span className="empty-orbit" />
            </div>
            <h3>
              The original words.
              <br />A clearer plan.
            </h3>
            <p>
              Extract instructions with private or consented hybrid AI, or copy entries manually
              from your source. Every entry needs your review.
            </p>
            <a href="#documents" className="button dark">
              Add or review a document
              <ArrowRight size={17} />
            </a>
          </div>
        )}
        <div className="medicine-grid">
          {snapshot.medicines.map((m) => (
            <MedicinePlanCard key={m.id} medicine={m} />
          ))}
        </div>
        <div className="medicine-toolbar">
          <button
            className="button secondary"
            disabled={!sourceText.trim() || snapshot.medicines.length >= 60}
            onClick={() => setManual(!manual)}
          >
            <Plus size={16} />
            {manual ? 'Close manual entry' : 'Add an entry from source'}
          </button>
          {snapshot.medicines.some((m) => m.confirmed && m.times.length > 0) && (
            <a className="button dark" href="#overview">
              View your day
              <ArrowRight size={17} />
            </a>
          )}
        </div>
        {!sourceText.trim() && (
          <p className="input-note">
            <FileText size={14} />
            Add a document before copying an entry manually.
          </p>
        )}
        {manual && (
          <form
            className="manual-entry"
            onSubmit={(e) => {
              e.preventDefault();
              addManual();
            }}
          >
            <h3>Copy exact source wording</h3>
            <details>
              <summary>Show current source</summary>
              <pre>{sourceText}</pre>
            </details>
            <div className="manual-fields">
              {(
                [
                  'name',
                  'strength',
                  'dose',
                  'frequency',
                  'timing',
                  'route',
                  'duration',
                  'status',
                ] as const
              ).map((key) => (
                <label key={key}>
                  {key === 'name'
                    ? 'Medicine name (required)'
                    : key === 'frequency'
                      ? 'Frequency / conditions'
                      : key.charAt(0).toUpperCase() + key.slice(1)}
                  <input
                    value={fields[key]}
                    maxLength={600}
                    required={key === 'name'}
                    onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <label htmlFor="manual-quote">Exact source quote containing the words above</label>
            <textarea
              id="manual-quote"
              required
              rows={4}
              value={fields.quote}
              maxLength={4000}
              onChange={(e) => setFields({ ...fields, quote: e.target.value })}
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button dark">Add draft entry</button>
          </form>
        )}
      </section>
      <div className="safety-note">
        <TriangleAlert size={20} />
        <div>
          <strong>A draft for a conversation. Not a prescription.</strong>
          <p>
            This app does not check drug interactions or decide what you should take. A pharmacist
            must confirm the current medicine list and any conflicts.
          </p>
        </div>
      </div>
    </>
  );
}
