import { CurrentPlanCard } from './CurrentPlanCard';
import { dueEntries } from '../services/carePlan';
import { DailyCare } from './DailyCare';
import { useCarePlan } from '../state/CarePlan';
import { SamplePill } from './SamplePill';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  ShieldCheck,
  Check,
  Users,
  Sun,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from 'lucide-react';
interface Props {
  readonly raw: string;
  readonly medicineCount: number;
  readonly redactions: number;
  readonly onSample: () => void;
  readonly onDocuments: () => void;
  readonly policyLabel: string;
}
const moments = [
  {
    time: '8:00 AM',
    short: '8 AM',
    name: 'Examplemed',
    strength: '10 mg',
    appearance: 'round-white',
    form: 'tablet',
    x: 6,
    y: 78,
    period: 'Morning',
  },
  {
    time: '11:00 AM',
    short: '11 AM',
    name: 'Samplemed',
    strength: '5 mg',
    appearance: 'oval-peach',
    form: 'tablet',
    x: 22,
    y: 32,
    period: 'Late morning',
  },
  {
    time: '2:00 PM',
    short: '2 PM',
    name: 'Examplemed',
    strength: '10 mg',
    appearance: 'round-white',
    form: 'tablet',
    x: 48,
    y: 13,
    period: 'Afternoon',
  },
  {
    time: '6:00 PM',
    short: '6 PM',
    name: 'Samplemed',
    strength: '5 mg',
    appearance: 'oval-peach',
    form: 'tablet',
    x: 75,
    y: 30,
    period: 'Evening',
  },
  {
    time: '9:00 PM',
    short: '9 PM',
    name: 'Demomed',
    strength: '20 mg',
    appearance: 'capsule-blue',
    form: 'capsule',
    x: 94,
    y: 77,
    period: 'Night',
  },
] as const;
export function Overview({
  raw,
  medicineCount,
  redactions,
  onSample,
  onDocuments,
  policyLabel,
}: Props) {
  const { snapshot } = useCarePlan();
  const realEntries = dueEntries(snapshot),
    realTaken = realEntries.filter((e) => e.status === 'taken').length;
  const [example, setExample] = useState(false),
    [selected, setSelected] = useState(2),
    [taken, setTaken] = useState<number[]>([0, 1]),
    [message, setMessage] = useState('');
  const current = moments[selected]!;
  const completed = taken.includes(selected);
  function choose(index: number) {
    setSelected(index);
    setMessage('');
  }
  function markTaken() {
    setTaken((previous) => (previous.includes(selected) ? previous : [...previous, selected]));
    setMessage('Marked taken in this example only.');
  }
  return (
    <div className="sky-overview">
      <div className="day-toolbar">
        <span className="day-date">
          <Sun size={17} aria-hidden="true" />
          THE DAY AS A SKY
        </span>
        <button
          className={`example-toggle ${example ? 'selected' : ''}`}
          aria-pressed={example}
          onClick={() => {
            setExample(!example);
            setMessage('');
          }}
        >
          {example ? 'Example day' : 'Explore an example'}
          <span className="toggle-track">
            <i />
          </span>
        </button>
      </div>
      <section className="sky-day" aria-label={example ? 'Fictional example day' : 'Your day'}>
        <div className="sky-landscape">
          <div className="sky-greeting">
            {example ? 'A little practice. A calmer day.' : 'A little support for what’s next.'}
          </div>
          <h1>
            {example ? (
              <>
                {taken.length} of 5 doses
                <br />
                done today<span>.</span>
              </>
            ) : realEntries.length ? (
              <>
                {realTaken} of {realEntries.length}
                <br />
                check-ins today<span>.</span>
              </>
            ) : (
              <>
                Your day.
                <br />A little clearer<span>.</span>
              </>
            )}
          </h1>
          <p className="sky-intro">
            {example
              ? 'A fictional day, so you can try the experience.'
              : realEntries.length
                ? 'Your reviewed instructions, one check-in at a time.'
                : 'Start with your discharge instructions. We’ll help you review the words, one step at a time.'}
          </p>
          <div
            className="day-arc"
            role="group"
            aria-label={example ? 'Explore five fictional dose times' : 'Illustration of a day'}
          >
            <svg viewBox="0 0 600 245" fill="none" aria-hidden="true" preserveAspectRatio="none">
              <path className="arc-dashed" d="M22 219C116 -28 447 -44 581 219" />
              {example && (
                <path
                  className="arc-complete"
                  d="M22 219C116 -28 447 -44 581 219"
                  pathLength="100"
                  strokeDasharray={`${[5, 25, 49, 74, 96][selected]} 100`}
                />
              )}
              <path className="arc-horizon" d="M20 234H580" />
            </svg>
            {example ? (
              moments.map((moment, index) => (
                <button
                  key={moment.time}
                  className={`arc-moment ${index === selected ? 'is-sun' : ''} ${taken.includes(index) ? 'is-taken' : ''}`}
                  style={{ left: `${moment.x}%`, top: `${moment.y}%` }}
                  onClick={() => choose(index)}
                  aria-label={`${moment.period}, ${moment.time}${taken.includes(index) ? ', sample taken' : ''}`}
                  aria-pressed={index === selected}
                >
                  <span className="moment-orb">
                    {index !== selected && taken.includes(index) ? (
                      <Check size={13} aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="moment-time">{moment.short}</span>
                </button>
              ))
            ) : (
              <span className="empty-sun" aria-hidden="true" />
            )}
            <span className="arc-day-label">SUNRISE</span>
            <span className="arc-night-label">REST EASY</span>
          </div>
          <div className="sky-bottomline">
            <span>
              <span className="tiny-sun" />
              {example ? 'Every small step counts.' : 'Room for a gentler routine.'}
            </span>
            <span>{example ? 'FICTIONAL PREVIEW' : 'YOUR PACE. YOUR DAY.'}</span>
          </div>
        </div>
        {example ? (
          <div className="day-detail">
            <div className="dose-card">
              <div className="dose-topline">
                <span className="dose-eyebrow">
                  {completed ? 'A LITTLE MOMENT, COMPLETED' : 'NOW, ON THE PATH'}
                </span>
                <span className="dose-time">{current.time}</span>
              </div>
              <h2>
                {current.name}
                <span>{current.strength}</span>
              </h2>
              <SamplePill appearance={current.appearance} />
              <p className="dose-description">
                1 {current.form} · Fictional instruction for this preview
              </p>
              <div className="dose-actions">
                <button className="button dose-taken" onClick={markTaken} disabled={completed}>
                  {completed ? (
                    <>
                      <Check size={18} aria-hidden="true" />
                      Sample taken
                    </>
                  ) : (
                    <>
                      I took it <Check size={17} aria-hidden="true" />
                    </>
                  )}
                </button>
                <button
                  className="button dose-later"
                  onClick={() =>
                    setMessage('Sample reminder deferred. No notification has been scheduled.')
                  }
                >
                  Later
                </button>
              </div>
              <p className="dose-message" role="status">
                {message || 'Example only. Follow your care team’s instructions.'}
              </p>
            </div>
            <div className="day-pager">
              <button onClick={() => choose((selected + 4) % 5)} aria-label="Previous sample dose">
                <ChevronLeft size={18} />
              </button>
              <span>
                {current.period}
                <small>{selected + 1} OF 5 SAMPLE DOSES</small>
              </span>
              <button onClick={() => choose((selected + 1) % 5)} aria-label="Next sample dose">
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              className="reset-day"
              onClick={() => {
                setTaken([0, 1]);
                choose(2);
              }}
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reset example
            </button>
          </div>
        ) : realEntries.length ? (
          <div className="day-detail">
            <CurrentPlanCard />
          </div>
        ) : (
          <div className="day-detail">
            <div className="dose-card day-start-card">
              <span className="start-document-icon">
                <FileText size={29} aria-hidden="true" />
              </span>
              <span className="dose-eyebrow">BEGIN WITH THE ORIGINAL</span>
              <h2>
                A clearer picture
                <br />
                starts here.
              </h2>
              <p>
                Add a document, review its private preview, and keep every instruction connected to
                its source.
              </p>
              <button className="button dose-taken" onClick={onDocuments}>
                {raw.trim() ? 'Continue your review' : 'Add your document'}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <span className="start-footnote">
                <LockKeyhole size={13} aria-hidden="true" />
                Your document stays in this session.
              </span>
            </div>
          </div>
        )}
      </section>
      <aside className="discharge-research" aria-label="Why clearer discharge instructions matter">
        <p>
          In one hospital study, about <strong>1 in 5 patients</strong> had a care-related problem
          after discharge. About <strong>2 in 3</strong> of those problems involved medicines.
        </p>
        <a href="https://pubmed.ncbi.nlm.nih.gov/12558354/" target="_blank" rel="noreferrer">
          Forster et al. · Annals of Internal Medicine, 2003{' '}
          <ArrowUpRight size={13} aria-hidden="true" />
        </a>
        <small>A finding from one study, not a prediction of your personal risk.</small>
      </aside>
      {!example && <DailyCare />}
      <section className="sky-workspace" aria-label="Your workspace">
        <div className="workspace-heading">
          <div>
            <span className="section-kicker">A CLEARER WAY HOME</span>
            <h2>Everything in its place.</h2>
          </div>
          <span className="workspace-private">
            <LockKeyhole size={13} aria-hidden="true" />
            Just for this session
          </span>
        </div>
        <div className="sky-shortcuts">
          <a href="#documents" className="sky-shortcut">
            <span className="shortcut-icon">
              <FileText size={23} aria-hidden="true" />
            </span>
            <div>
              <h3>Your documents</h3>
              <p>
                {raw.trim() ? '1 document ready to review' : 'The starting point for your care.'}
              </p>
            </div>
            <ArrowUpRight size={19} />
          </a>
          <a href="#medicines" className="sky-shortcut">
            <span className="shortcut-icon butter">
              <Sun size={24} aria-hidden="true" />
            </span>
            <div>
              <h3>Your medicines</h3>
              <p>
                {medicineCount
                  ? `${medicineCount} source-linked draft entries`
                  : 'Original words. Clearer instructions.'}
              </p>
            </div>
            <ArrowUpRight size={19} />
          </a>
          <a href="#caregivers" className="sky-shortcut">
            <span className="shortcut-icon lavender">
              <Users size={23} aria-hidden="true" />
            </span>
            <div>
              <h3>Your care circle</h3>
              <p>Encrypted handoff. Your people, your choice.</p>
            </div>
            <ArrowUpRight size={19} />
          </a>
        </div>
        <div className="sky-privacy-strip">
          <ShieldCheck size={19} aria-hidden="true" />
          <p>
            <strong>Private starts here.</strong>{' '}
            {redactions
              ? `${redactions} identifiers masked locally.`
              : 'Review common identifiers before anything is shared.'}
          </p>
          <a href="#privacy">
            {policyLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <button className="text-button sky-example-document" onClick={onSample}>
          Try a fictional discharge document <ArrowRight size={15} />
        </button>
      </section>
    </div>
  );
}
