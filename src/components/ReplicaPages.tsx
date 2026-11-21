import { useEffect, useRef, useState, type ReactNode, type ComponentType } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Cloud,
  Cpu,
  FileText,
  Flame,
  HeartPulse,
  History,
  Lightbulb,
  LockKeyhole,
  Moon,
  Pill,
  Plus,
  Printer,
  ScanLine,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  UploadCloud,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useWorkspace } from '../state/Workspace';
import { dueEntries, localDay, type PlanMedicine } from '../services/carePlan';
import {
  dayPart,
  dayParts,
  exampleDocuments,
  recentDays,
  recordedEntries,
  type SessionDocument,
} from '../services/workspace';
import type { MedicationAnalysis } from '../types/medication';
export { GpSummary } from './GpSummary';
type Glyph = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
const partIcons = { Morning: Sunrise, Midday: Sun, Evening: Sunset, Night: Moon };
const clock = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return `${h! % 12 || 12}:${String(m).padStart(2, '0')} ${h! >= 12 ? 'pm' : 'am'}`;
};

export function WorkspaceExample() {
  const { example, setExample } = useWorkspace();
  return (
    <button className="r-example" aria-pressed={example} onClick={() => setExample(!example)}>
      {example ? 'Fictional example' : 'Explore an example'}
      <span className="r-switch" data-on={example}>
        <i />
      </span>
    </button>
  );
}
function Kicker({ children, icon: Icon }: { children: ReactNode; icon?: Glyph }) {
  return (
    <div className="r-kicker">
      {Icon && <Icon size={14} aria-hidden />}
      {children}
    </div>
  );
}
function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`r-panel ${className}`}>{children}</section>;
}
function Chip({ children, warm = false }: { children: ReactNode; warm?: boolean }) {
  return <span className={`r-chip ${warm ? 'warm' : ''}`}>{children}</span>;
}
function Intro({
  label,
  title,
  children,
  action,
  icon = FileText,
}: {
  label: string;
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  icon?: Glyph;
}) {
  return (
    <header className="r-intro">
      <div>
        <Kicker icon={icon}>{label}</Kicker>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      <div className="r-intro-actions">
        <WorkspaceExample />
        {action}
      </div>
    </header>
  );
}
function Filters({
  options,
  value,
  onChange,
  label,
}: {
  options: string[];
  value: string;
  onChange: (s: string) => void;
  label: string;
}) {
  return (
    <div className="r-filters" role="group" aria-label={label}>
      {options.map((s) => (
        <button key={s} onClick={() => onChange(s)} aria-pressed={value === s}>
          {s}
        </button>
      ))}
    </div>
  );
}
function DemoNote() {
  const { example } = useWorkspace();
  return example ? (
    <span className="r-demo-note">
      Fictional example · changes stay separate from your own plan.
    </span>
  ) : null;
}
function QuietNote({ children }: { children: ReactNode }) {
  return (
    <div className="r-quiet-note">
      <Lightbulb size={15} />
      <span>{children}</span>
    </div>
  );
}
function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="r-empty">
      <FileText size={25} />
      <p>{children}</p>
      <a href="#document-intake" className="button dark">
        Begin with the original <ArrowRight size={15} />
      </a>
    </div>
  );
}
function Study() {
  return (
    <Panel className="r-study">
      <p>
        In one hospital study, about <strong>1 in 5 patients</strong> had a care-related
        <br className="r-wide-break" /> problem after discharge. About <strong>2 in 3</strong> of
        those problems
        <br className="r-wide-break" /> involved medicines.
      </p>
      <a href="https://pubmed.ncbi.nlm.nih.gov/12558354/" target="_blank" rel="noreferrer">
        Forster et al. · Annals of Internal Medicine, 2003 <ArrowUpRight size={12} />
      </a>
      <small>A finding from one study, not a prediction of your personal risk.</small>
    </Panel>
  );
}

function PlanList({ date = localDay(), compact = false }: { date?: string; compact?: boolean }) {
  const { display, setDisplay } = useWorkspace();
  const today = localDay(),
    entries = recordedEntries(display, date),
    completed = entries.filter((e) => e.status === 'taken').length;
  function mark(keys: string[], taken: boolean) {
    setDisplay((s) => {
      const checkins = { ...s.checkins };
      for (const key of keys) {
        if (taken) checkins[key] = 'taken';
        else delete checkins[key];
      }
      return { ...s, checkins };
    });
  }
  const groups = dayParts
    .map((part) => ({ part, entries: entries.filter((e) => dayPart(e.time) === part) }))
    .filter((g) => g.entries.length);
  const contents = groups.map((group) => {
    const Icon = partIcons[group.part],
      all = group.entries.every((e) => e.status === 'taken');
    return (
      <section className={compact ? 'r-small-day-group' : 'r-panel r-day-group'} key={group.part}>
        <header>
          <Icon size={18} />
          <div>
            <h3>{group.part}</h3>
            {!compact && (
              <small>
                {group.part === 'Morning'
                  ? '6:00 – 11:59 am'
                  : group.part === 'Midday'
                    ? '12:00 – 4:59 pm'
                    : group.part === 'Evening'
                      ? '5:00 – 8:59 pm'
                      : '9:00 pm – 5:59 am'}
              </small>
            )}
          </div>
          {!compact && (
            <>
              <Chip>
                {group.entries.filter((e) => e.status === 'taken').length} of {group.entries.length}{' '}
                taken
              </Chip>
              {date === today && (
                <button
                  className="r-outline-small"
                  onClick={() =>
                    mark(
                      group.entries.map((e) => e.key),
                      !all,
                    )
                  }
                >
                  {all ? 'Clear' : 'Mark all'}
                </button>
              )}
            </>
          )}
        </header>
        {group.entries.map((e) => (
          <div className="r-dose-row" key={e.key}>
            <button
              className="r-dose-toggle"
              aria-pressed={e.status === 'taken'}
              onClick={() => mark([e.key], e.status !== 'taken')}
            >
              <span className="r-checkbox">{e.status === 'taken' && <Check size={12} />}</span>
              <time>{clock(e.time)}</time>
              <span>
                <strong>
                  {e.medicine.name} · {e.medicine.strength}
                </strong>
                <small>
                  {e.status === 'taken'
                    ? 'Recorded taken'
                    : e.status === 'later'
                      ? 'Recorded for later'
                      : e.medicine.timing && !/fictional/i.test(e.medicine.timing)
                        ? e.medicine.timing
                        : e.medicine.dose || 'See original instructions'}
                </small>
              </span>
            </button>
            {e.status !== 'taken' && date === today && (
              <button
                className="r-later"
                aria-label={`Mark ${e.medicine.name} at ${e.time} for later`}
                onClick={() =>
                  setDisplay((s) => ({ ...s, checkins: { ...s.checkins, [e.key]: 'later' } }))
                }
              >
                Later
              </button>
            )}
          </div>
        ))}
      </section>
    );
  });
  if (!compact)
    return (
      <div className="r-stack">
        {contents.length ? (
          contents
        ) : (
          <Panel>
            <EmptyState>
              {date === today
                ? 'Confirm your medicine instructions and care-team times to build your schedule.'
                : 'No check-ins were recorded for this day. A past schedule is not inferred from today’s plan.'}
            </EmptyState>
          </Panel>
        )}
      </div>
    );
  return (
    <Panel className="r-personal-log">
      <div data-tour="daily-heading">
        <Kicker icon={Sun}>YOUR REVIEWED PLAN</Kicker>
        <h2>Today, in small steps</h2>
      </div>
      <p className="r-muted">Your reviewed instructions, one personal check-in at a time.</p>
      <div className="r-progress-label">
        <span>
          {completed} of {entries.length} confirmed
        </span>
        <span>{entries.length ? Math.round((completed / entries.length) * 100) : 0}%</span>
      </div>
      <div className="r-progress">
        <i style={{ width: `${entries.length ? (completed / entries.length) * 100 : 0}%` }} />
      </div>
      {contents.length ? (
        contents
      ) : (
        <EmptyState>
          Nothing is scheduled automatically. Review the source and confirm the times first.
        </EmptyState>
      )}
      <div className="r-paired-actions">
        <a className="button secondary" href="#schedule">
          <CalendarDays size={14} />
          Open the schedule
        </a>
        <a className="button secondary" href="#gp-summary">
          <Printer size={14} />
          Print for the GP
        </a>
      </div>
      <QuietNote>
        For missed doses or uncertainty, check the original instructions and ask your pharmacist.
      </QuietNote>
    </Panel>
  );
}
function AtAGlance() {
  const { display, example } = useWorkspace();
  const entries = dueEntries(display),
    next = entries.find((e) => e.status !== 'taken');
  return (
    <Panel className="r-glance">
      <Kicker>AT A GLANCE</Kicker>
      <div>
        <span className="r-icon">
          <Clock3 size={16} />
        </span>
        <section>
          <Kicker>YOUR NEXT REVIEWED TIME</Kicker>
          <strong>{next ? clock(next.time) : 'No pending times'}</strong>
          <p>
            {next ? `${next.medicine.name} ${next.medicine.strength}` : 'A little breathing room.'}
          </p>
        </section>
      </div>
      <div>
        <span className="r-icon">
          <HeartPulse size={16} />
        </span>
        <section>
          <Kicker>KEEP CLOSE</Kicker>
          <strong>Your original instructions</strong>
          <p>Check the source if anything is unclear.</p>
        </section>
      </div>
      <div>
        <span className="r-icon">
          <CalendarDays size={16} />
        </span>
        <section>
          <Kicker>YOUR NEXT CONVERSATION</Kicker>
          <a href="#gp-summary">
            Prepare for your GP <ArrowUpRight size={12} />
          </a>
          <p>
            {display.questions.length} {example ? 'example ' : ''}questions to bring along
          </p>
        </section>
      </div>
      <p className="r-blue-note">
        <CircleHelp size={13} />
        Facts come from your reviewed entries. Original wording stays close.
      </p>
    </Panel>
  );
}
function RoutingCard({ source }: { source?: MedicationAnalysis['inferenceSource'] }) {
  return (
    <Panel className="r-routing">
      <Kicker>WHERE THE WORDS GO</Kicker>
      <div className="r-progress-label">
        <span>{source === 'cloud' ? 'Approved cloud extraction' : 'On-device first'}</span>
        <strong>
          {source
            ? source === 'cloud'
              ? 'Cloud'
              : source === 'sample'
                ? 'Example'
                : 'Local'
            : 'Your choice'}
        </strong>
      </div>
      <div className="r-progress">
        <i style={{ width: source === 'cloud' ? '100%' : '72%' }} />
      </div>
      <p>
        {source === 'cloud'
          ? 'The last extraction used your explicitly approved, masked text.'
          : 'Strict local keeps document AI on this device. Cloud modes require a separate review and your approval.'}
      </p>
      <div className="r-chip-row">
        <Chip>
          <Cpu size={11} />
          On-device
        </Chip>
        <Chip warm>
          <Cloud size={11} />
          With approval
        </Chip>
      </div>
      <small>Illustrative routing bar · not usage telemetry.</small>
    </Panel>
  );
}

export function TodayPage({ onAdd, raw }: { onAdd: () => void; raw: string }) {
  const { display, example, setDisplay } = useWorkspace();
  const entries = dueEntries(display),
    taken = entries.filter((e) => e.status === 'taken').length,
    next = entries.find((e) => e.status !== 'taken');
  return (
    <div className="r-page r-today">
      <div className="r-day-toolbar">
        <Kicker icon={Sun}>THE DAY AS A SKY</Kicker>
        <WorkspaceExample />
      </div>
      <section className="r-day-hero">
        <div className="r-day-copy">
          <p>
            {example ? 'A little practice. A calmer day.' : 'A little support for what’s next.'}
          </p>
          <h1 data-tour="day-heading">
            {entries.length ? (
              <>
                {taken} of {entries.length} check-ins
                <br />
                done today<span>.</span>
              </>
            ) : (
              <>
                Your day.
                <br />A little clearer<span>.</span>
              </>
            )}
          </h1>
          <p>
            {example
              ? 'A fictional day to explore. Your own plan stays separate.'
              : 'Start with your discharge instructions. We’ll help you review the words, one step at a time.'}
          </p>
          <div className="r-engine-labels">
            <span>
              <Cpu size={15} />
              On-device AI first
            </span>
            <span>
              <Cloud size={15} />
              Cloud only with approval
            </span>
          </div>
        </div>
        <div className="r-horizon" aria-hidden="true">
          <svg viewBox="0 0 900 220" preserveAspectRatio="none">
            <path
              d="M10 210 Q450 -210 890 210"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 6"
            />
          </svg>
          <i className="r-sun" />
          <span>
            <i />
            Room for a gentler routine.
          </span>
        </div>
        <aside className="r-panel r-start-card">
          {example && next ? (
            <>
              <Kicker>NEXT ON YOUR PATH · {clock(next.time)}</Kicker>
              <span className="r-start-icon">
                <Pill size={30} />
              </span>
              <h2>
                {next.medicine.name}
                <br />
                {next.medicine.strength}
              </h2>
              <p>{next.medicine.dose} · fictional example only</p>
              <button
                className="button dark"
                onClick={() =>
                  setDisplay((s) => ({ ...s, checkins: { ...s.checkins, [next.key]: 'taken' } }))
                }
              >
                <Check size={16} />I took it
              </button>
              <a href="#schedule" className="r-text-link">
                Open the schedule <ArrowRight size={15} />
              </a>
            </>
          ) : (
            <>
              <span className="r-start-icon">
                <FileText size={24} />
              </span>
              <Kicker>BEGIN WITH THE ORIGINAL</Kicker>
              <h2>
                A clearer picture
                <br />
                starts here.
              </h2>
              <p>
                Add a document, review its private preview, and keep every instruction connected to
                its source.
              </p>
              <button className="button dark" onClick={onAdd}>
                {raw.trim() ? 'Continue your review' : 'Add your document'}
                <ArrowRight size={18} />
              </button>
              <small>
                <LockKeyhole size={13} />
                Your document stays in this session.
              </small>
            </>
          )}
        </aside>
      </section>
      <div className="r-page-grid r-home-grid">
        <div className="r-stack">
          <Study />
          <PlanList compact />
        </div>
        <aside className="r-stack">
          <AtAGlance />
          <RoutingCard />
          <Panel>
            <Kicker>NEXT STEP</Kicker>
            <h3>A little clearer, together.</h3>
            <p>
              Prepare the plan and your questions for someone you trust. Original documents stay
              here.
            </p>
            <a className="button secondary r-full" href="#caregivers">
              Open care circle <ArrowRight size={14} />
            </a>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

const documentMeta = [
  {
    detail: 'Hospital · discharge instructions',
    pages: 10,
    status: 'Reviewed',
    route: 'On-device',
    category: 'On-device',
  },
  {
    detail: 'Blood work · fasting panel',
    pages: 3,
    status: 'In review',
    route: 'Cloud example',
    category: 'Cloud',
  },
  {
    detail: 'Clinic · follow-up',
    pages: 4,
    status: 'Reviewed',
    route: 'On-device',
    category: 'On-device',
  },
  {
    detail: 'Photo · pill bottle label',
    pages: 1,
    status: 'Reviewed',
    route: 'Read locally',
    category: 'On-device',
  },
  {
    detail: 'Handout · exercise plan',
    pages: 6,
    status: 'Needs attention',
    route: 'Needs review',
    category: 'Needs attention',
  },
];
export function DocumentsLibrary({
  raw,
  redactions,
  onOpen,
  onAdd,
}: {
  raw: string;
  redactions: number;
  onOpen: (s: string) => void;
  onAdd: () => void;
}) {
  const { example, documents, setDocuments } = useWorkspace();
  const [filter, setFilter] = useState('All'),
    [selected, setSelected] = useState(''),
    [notice, setNotice] = useState('');
  const currentDoc: SessionDocument[] = raw.trim()
    ? [
        {
          id: 'active',
          title: 'Current document',
          text: raw,
          redactions,
          savedAt: 'Current review',
          source: 'Session',
        },
      ]
    : [];
  const list = (example ? exampleDocuments : [...currentDoc, ...documents]).map((doc, i) => ({
    ...doc,
    meta: example
      ? documentMeta[i]!
      : {
          detail: 'Your original · session document',
          pages: null,
          status: doc.id === 'active' ? 'Needs attention' : 'Saved locally',
          route: 'Session only',
          category: 'On-device',
        },
  }));
  const visible = list.filter((d) => filter === 'All' || d.meta.category === filter),
    active = visible.find((d) => d.id === selected) ?? visible[0];
  function save() {
    if (documents.length >= 20) {
      setNotice('This session already contains 20 saved copies.');
      return;
    }
    setDocuments((d) => [
      ...d,
      {
        id: crypto.randomUUID(),
        title: `Saved document ${d.length + 1}`,
        text: raw,
        redactions,
        savedAt: new Date().toLocaleString(),
        source: 'Session',
      },
    ]);
    setNotice('Saved in this tab’s memory only. Refreshing clears session documents.');
  }
  return (
    <section className="r-page">
      <Intro
        label="YOUR DOCUMENTS"
        title={
          <>
            Everything you were
            <br />
            handed, in one place.
          </>
        }
        action={
          <div className="r-header-button-row">
            <span className="r-glass-chip">
              <LockKeyhole size={12} />
              {list.length} files · session only
            </span>
            <button className="button dark" onClick={onAdd}>
              <Plus size={15} />
              Add document
            </button>
          </div>
        }
      >
        Each file keeps its original wording. The reviewed plan sits beside it, never instead of it.
      </Intro>
      <Filters
        options={['All', 'On-device', 'Cloud', 'Needs attention']}
        value={filter}
        onChange={setFilter}
        label="Document filter"
      />
      <DemoNote />
      <div className="r-page-grid">
        <div className="r-stack r-file-list">
          {visible.map((d) => (
            <button
              key={d.id}
              className={`r-file-row ${active?.id === d.id ? 'selected' : ''}`}
              aria-pressed={active?.id === d.id}
              onClick={() => setSelected(d.id)}
            >
              <span className={`r-icon ${d.meta.category === 'Cloud' ? 'warm' : ''}`}>
                <FileText size={17} />
              </span>
              <span className="r-file-copy">
                <strong>
                  {d.title}
                  <Chip warm={d.meta.category === 'Needs attention'}>{d.meta.status}</Chip>
                </strong>
                <small>{d.meta.detail}</small>
                <span>
                  {d.meta.pages ? `${d.meta.pages} pages · ` : ''}
                  {d.savedAt} <Cpu size={11} />
                  {d.meta.route}
                </span>
                <span className="r-chip-row">
                  <Chip warm={d.meta.category === 'Cloud'}>
                    {example ? d.meta.route : 'On-device'}
                  </Chip>
                  <Chip>{example ? 'Fictional example' : 'Original stays here'}</Chip>
                </span>
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
          {!visible.length && (
            <Panel>
              <p className="r-muted">
                {list.length
                  ? 'No documents match this filter.'
                  : 'Bring your first document to begin.'}
              </p>
            </Panel>
          )}
          <button className="r-add-document-tile" onClick={onAdd}>
            <span className="r-icon">
              <UploadCloud size={20} />
            </span>
            <strong>Add a new document</strong>
            <small>PDF, photo or text · read locally first</small>
          </button>
          {!example && raw.trim() && (
            <button className="r-text-link" onClick={save}>
              <Plus size={14} />
              Keep a copy in this session
            </button>
          )}
          <p role="status" className="r-muted">
            {notice}
          </p>
        </div>
        <aside className="r-panel r-file-preview">
          <Kicker>IN THIS FILE</Kicker>
          <h2>{active?.title ?? 'Your original, close by.'}</h2>
          <p>{active?.savedAt ?? 'Select a document or add one to begin.'}</p>
          {active && (
            <>
              <div className="r-preview-box">
                <Kicker>ORIGINAL WORDING</Kicker>
                <pre>{active.text}</pre>
              </div>
              <div className="r-preview-box blue">
                <Kicker>WHAT HAPPENS NEXT</Kicker>
                <p>
                  Compare every extracted instruction with the original. Missing details stay
                  unconfirmed until you review them.
                </p>
              </div>
              <dl className="r-facts">
                <div>
                  <dt>Read by</dt>
                  <dd>{example ? 'Example only' : 'On this device'}</dd>
                </div>
                <div>
                  <dt>Original pages in the cloud</dt>
                  <dd>0</dd>
                </div>
                <div>
                  <dt>Personal details masked</dt>
                  <dd>{active.redactions}</dd>
                </div>
              </dl>
              <a href="#medicines" className="button dark r-full">
                See the medicines <ArrowRight size={15} />
              </a>
              <button className="button secondary r-full" onClick={onAdd}>
                Replace this file
              </button>
              {active.source === 'Session' && active.id !== 'active' && (
                <>
                  <button
                    className="r-text-link"
                    onClick={() => {
                      onOpen(active.text);
                      location.hash = '#privacy';
                    }}
                  >
                    Use as a new source <ArrowRight size={13} />
                  </button>
                  <small>Replaces the current source and clears its medicine review.</small>
                  <button
                    className="r-text-link"
                    onClick={() => setDocuments((d) => d.filter((v) => v.id !== active.id))}
                  >
                    <Trash2 size={13} />
                    Remove session copy
                  </button>
                </>
              )}
            </>
          )}
          <p className="r-footnote">
            <ShieldCheck size={13} />
            The original stays in this session. Only a care file you choose to share leaves it.
          </p>
        </aside>
      </div>
    </section>
  );
}

export function MedicinesBrowser() {
  const { display, setDisplay, example } = useWorkspace();
  const [selected, setSelected] = useState(''),
    [filter, setFilter] = useState('All');
  const visible = display.medicines.filter(
      (m) =>
        filter === 'All' ||
        (filter === 'As needed'
          ? /as needed|prn/i.test(`${m.status} ${m.frequency}`)
          : m.times.some((t) => dayPart(t) === filter)),
    ),
    active = visible.find((m) => m.id === selected) ?? visible[0];
  const entries = dueEntries(display),
    taken = entries.filter((e) => e.status === 'taken').length,
    next = entries.find((e) => e.medicine.id === active?.id && e.status !== 'taken');
  function status(m: PlanMedicine) {
    return /paused|stop|hold/i.test(m.status ?? '')
      ? 'Paused'
      : /as needed|prn/i.test(`${m.status} ${m.frequency}`)
        ? 'As needed'
        : m.confirmed
          ? 'Active'
          : 'Needs review';
  }
  return (
    <section className="r-page">
      <Intro
        icon={Pill}
        label="YOUR MEDICINES"
        title={
          <>
            {display.medicines.length === 5 ? 'Five names.' : 'Your medicines.'}
            <br />
            One simple rhythm.
          </>
        }
        action={
          <span className="r-glass-chip">
            <Check size={13} />
            {taken} taken today
          </span>
        }
      >
        Every instruction stays linked to the source, so you can compare the amount, wording and
        timing.
      </Intro>
      <Filters
        options={['All', 'Morning', 'Midday', 'Evening', 'As needed']}
        value={filter}
        onChange={setFilter}
        label="Medicine time filter"
      />
      <DemoNote />
      <div className="r-page-grid">
        <div className="r-stack r-medicine-list">
          {visible.map((m) => {
            const logged =
              entries.filter((e) => e.medicine.id === m.id).length > 0 &&
              entries.filter((e) => e.medicine.id === m.id).every((e) => e.status === 'taken');
            return (
              <button
                key={m.id}
                className={`r-medicine-row ${active?.id === m.id ? 'selected' : ''}`}
                aria-pressed={active?.id === m.id}
                onClick={() => setSelected(m.id)}
              >
                <span className={`r-icon ${logged ? 'solid' : ''}`}>
                  {logged ? <Check size={17} /> : <Pill size={17} />}
                </span>
                <span className="r-file-copy">
                  <strong>
                    {m.name}
                    <Chip>{status(m)}</Chip>
                  </strong>
                  <small>
                    {m.strength} {m.frequency}
                  </small>
                  <span>
                    <Clock3 size={11} />
                    {m.times.length
                      ? m.times.map(clock).join(' and ')
                      : m.status || 'Times not confirmed'}
                  </span>
                </span>
                <ChevronRight size={15} />
              </button>
            );
          })}
          {!visible.length && (
            <Panel>
              <EmptyState>
                {display.medicines.length
                  ? 'No medicines match this filter.'
                  : 'Start with a document, then review the source instructions below.'}
              </EmptyState>
            </Panel>
          )}
          <QuietNote>
            <strong>One thing to keep close</strong>
            <br />
            This app does not check drug interactions or decide treatment. Confirm your current list
            with your pharmacist.
          </QuietNote>
        </div>
        <aside className="r-stack">
          <Panel className="r-selected-medicine">
            <Kicker>SELECTED MEDICINE</Kicker>
            <h2>{active?.name ?? 'A little more understanding.'}</h2>
            <p>{active?.strength ?? 'Choose a medicine to see its source.'}</p>
            {active && (
              <>
                <div className="r-two-boxes">
                  <div>
                    <Kicker>AMOUNT</Kicker>
                    <strong>
                      {active.dose || 'Not stated'}
                      <br />
                      {active.frequency}
                    </strong>
                  </div>
                  <div>
                    <Kicker>WHEN</Kicker>
                    <strong>{active.times.map(clock).join(' and ') || 'Not confirmed'}</strong>
                  </div>
                </div>
                <p>
                  {active.timing || 'Read the original instructions before confirming this entry.'}
                </p>
                <div className="r-preview-box warm">
                  <Kicker>TAKE CARE</Kicker>
                  <p>
                    For unclear instructions or missed doses, ask your pharmacist. This is a
                    personal log, not dosing advice.
                  </p>
                </div>
                <details className="r-source-quote">
                  <summary>
                    <FileText size={12} />
                    Original wording
                  </summary>
                  <blockquote>{active.quote || 'No source quote entered.'}</blockquote>
                </details>
                {next && (
                  <button
                    className="button secondary r-full"
                    onClick={() =>
                      setDisplay((s) => ({
                        ...s,
                        checkins: { ...s.checkins, [next.key]: 'taken' },
                      }))
                    }
                  >
                    <Check size={14} />
                    Record {clock(next.time)} taken
                  </button>
                )}
                <button
                  className="button secondary r-full"
                  onClick={() => {
                    const question = `Can we review the instructions for ${active.name} ${active.strength}?`;
                    setDisplay((s) => ({
                      ...s,
                      questions: s.questions.includes(question)
                        ? s.questions
                        : [...s.questions, question],
                    }));
                    location.hash = '#caregivers';
                  }}
                >
                  <CircleHelp size={14} />
                  Ask about this one
                </button>
                {!example && (
                  <a href="#source-review" className="r-text-link">
                    Review source & times <ArrowRight size={13} />
                  </a>
                )}
              </>
            )}
          </Panel>
          <Panel>
            <Kicker>MEMORY AID</Kicker>
            <p>
              Use the times confirmed by your care team. A simple pattern can make the day easier to
              follow.
            </p>
            <div className="r-chip-row">
              <Chip>1 · Morning</Chip>
              <Chip>2 · Midday</Chip>
              <Chip>3 · Evening</Chip>
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  );
}

export function SchedulePage() {
  const { display, setDisplay, example } = useWorkspace();
  const [date, setDate] = useState(localDay),
    [reminders, setReminders] = useState(false),
    [message, setMessage] = useState(''),
    [catchUp, setCatchUp] = useState<Record<string, string>>({});
  const seen = useRef(new Set<string>());
  const today = localDay(),
    entries = recordedEntries(display, date),
    taken = entries.filter((e) => e.status === 'taken').length,
    todayEntries = dueEntries(display),
    next = todayEntries.find((e) => e.status !== 'taken');
  const loggedDays = new Set(Object.keys(display.checkins).map((k) => k.split(':')[0])).size;
  const catchUpEntries = example ? todayEntries.slice(1).filter((e) => !catchUp[e.key]) : [];
  useEffect(() => {
    if (!reminders) return;
    const timer = setInterval(() => {
      const now = new Date(),
        time = now.toTimeString().slice(0, 5);
      for (const entry of dueEntries(display, localDay(now)).filter(
        (e) => e.time === time && e.status !== 'taken',
      ))
        if (!seen.current.has(entry.key)) {
          seen.current.add(entry.key);
          setMessage(
            `A reviewed time in your plan: ${clock(entry.time)} · ${entry.medicine.name}.`,
          );
        }
    }, 15000);
    return () => clearInterval(timer);
  }, [reminders, display]);
  function resolveCatchUp(value: string, keys: string[]) {
    setCatchUp((s) => ({ ...s, ...Object.fromEntries(keys.map((key) => [key, value])) }));
  }
  return (
    <section className="r-page">
      <Intro
        icon={CalendarDays}
        label="YOUR SCHEDULE"
        title={
          <>
            The day,
            <br />
            in four quiet parts.
          </>
        }
        action={
          <div className="r-header-button-row">
            <span className="r-glass-chip">
              <Flame size={13} />
              {example ? 'Example day' : `${loggedDays} days logged`}
            </span>
            <a href="#gp-summary" className="button secondary">
              <Printer size={14} />
              Print for the GP
            </a>
          </div>
        }
      >
        Your reviewed times, grouped by the part of the day they belong to. Record what happened, at
        your own pace.
      </Intro>
      <DemoNote />
      <div className="r-page-grid">
        <div className="r-stack">
          {catchUpEntries.length > 0 && (
            <Panel className="r-catchup">
              <header>
                <span className="r-icon warm">
                  <History size={18} />
                </span>
                <div>
                  <Kicker>CATCH-UP · FICTIONAL EXAMPLE</Kicker>
                  <h3>Yesterday · {catchUpEntries.length} example check-ins</h3>
                  <small>Try recording what happened. Your real plan stays separate.</small>
                </div>
                <Chip>Yesterday</Chip>
              </header>
              <div>
                {catchUpEntries.map((e) => (
                  <article key={e.key}>
                    <span className="r-icon">
                      <Pill size={14} />
                    </span>
                    <div>
                      <strong>
                        {e.medicine.name} · {e.medicine.strength}
                      </strong>
                      <small>
                        {clock(e.time)} · {dayPart(e.time).toLowerCase()}
                      </small>
                    </div>
                    <button
                      className="r-mini-dark"
                      onClick={() => resolveCatchUp('taken-late', [e.key])}
                    >
                      Took it late
                    </button>
                    <button
                      className="r-outline-small"
                      onClick={() => resolveCatchUp('skipped', [e.key])}
                    >
                      Skipped
                    </button>
                  </article>
                ))}
                <div className="r-chip-row">
                  <button
                    className="r-outline-small"
                    onClick={() =>
                      resolveCatchUp(
                        'skipped',
                        catchUpEntries.map((e) => e.key),
                      )
                    }
                  >
                    Mark all as skipped
                  </button>
                  <button
                    className="r-outline-small"
                    onClick={() =>
                      resolveCatchUp(
                        'taken-late',
                        catchUpEntries.map((e) => e.key),
                      )
                    }
                  >
                    All taken late
                  </button>
                </div>
                <small className="r-footnote">
                  Record what actually happened. This example does not advise taking or skipping a
                  dose.
                </small>
              </div>
            </Panel>
          )}
          <Panel className="r-schedule-summary">
            <header>
              <div>
                <Kicker>{date === today ? 'TODAY SO FAR' : 'RECORDED THAT DAY'}</Kicker>
                <p>
                  <strong>{taken}</strong> of {entries.length}{' '}
                  {date === today ? 'check-ins taken' : 'recorded check-ins'}
                </p>
                <small>
                  {date === today
                    ? 'Your personal log, one small step at a time.'
                    : 'Only existing check-ins are shown for earlier days.'}
                </small>
              </div>
              <div className="r-day-count">
                <Flame size={22} />
                <div>
                  <Kicker>RECORDED DAYS</Kicker>
                  <b>
                    {loggedDays} {loggedDays === 1 ? 'day' : 'days'}
                  </b>
                </div>
              </div>
            </header>
            <div className="r-progress-label">
              <span>Progress {date === today ? 'today' : 'recorded'}</span>
              <span>{entries.length ? Math.round((taken / entries.length) * 100) : 0}%</span>
            </div>
            <div className="r-progress">
              <i style={{ width: `${entries.length ? (taken / entries.length) * 100 : 0}%` }} />
            </div>
            <div className="r-week" role="group" aria-label="Choose log date">
              {recentDays().map((d) => (
                <button key={d.key} aria-pressed={date === d.key} onClick={() => setDate(d.key)}>
                  <small>{d.date.toLocaleDateString(undefined, { weekday: 'narrow' })}</small>
                  <strong>{d.date.getDate()}</strong>
                </button>
              ))}
            </div>
          </Panel>
          <PlanList date={date} />
        </div>
        <aside className="r-stack">
          <Panel className="r-next-reminder">
            <Kicker>NEXT REVIEWED TIME</Kicker>
            <h2>{next ? clock(next.time) : 'A little room.'}</h2>
            <strong>
              {next
                ? `${next.medicine.name} · ${next.medicine.strength}`
                : 'No pending times in your plan'}
            </strong>
            <p>{next?.medicine.dose || 'Times are never assigned automatically.'}</p>
            {next && (
              <button
                className="button dark r-full"
                onClick={() =>
                  setDisplay((s) => ({ ...s, checkins: { ...s.checkins, [next.key]: 'taken' } }))
                }
              >
                <Check size={15} />
                Mark this one taken
              </button>
            )}
          </Panel>
          <Panel className="r-reminders">
            <div className="r-panel-topline">
              <Kicker>GENTLE REMINDERS</Kicker>
              <button
                className="r-toggle"
                aria-label="Toggle reminders"
                aria-pressed={reminders}
                onClick={() => setReminders(!reminders)}
              >
                <span className="r-switch" data-on={reminders}>
                  <i />
                </span>
              </button>
            </div>
            <p>Quiet in-app reminders while this schedule is open. No background notifications.</p>
            {dayParts.map((part) => {
              const Icon = partIcons[part],
                first = todayEntries.find((e) => dayPart(e.time) === part);
              return (
                <div className="r-reminder-time" key={part}>
                  <Icon size={13} />
                  <span>{part}</span>
                  <small>{first ? clock(first.time) : 'Not set'}</small>
                </div>
              );
            })}
            <button
              className="button secondary r-full"
              onClick={() =>
                setMessage(
                  'Test reminder: check your reviewed plan and the original instructions if unsure.',
                )
              }
            >
              <Bell size={14} />
              Send me a test reminder
            </button>
            <p className="r-reminder-status" role="status">
              {message}
            </p>
          </Panel>
          <Panel>
            <Kicker>EVERY SMALL STEP COUNTS</Kicker>
            <p>
              A personal record can help you remember what happened and bring clearer questions to
              your care team.
            </p>
            <QuietNote>
              Missed one? Read your original instructions and ask your pharmacist.
            </QuietNote>
            <a href="#how-it-works" className="r-text-link">
              How the plan is built <ArrowUpRight size={12} />
            </a>
          </Panel>
        </aside>
      </div>
    </section>
  );
}

export function CareCirclePanel() {
  const { display, setDisplay, contacts, setContacts, example, observations, setObservations } =
    useWorkspace();
  const [adding, setAdding] = useState(false),
    [name, setName] = useState(''),
    [relation, setRelation] = useState(''),
    [notice, setNotice] = useState('');
  const contactDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => setNotice(''), [example]);
  useEffect(() => {
    const node = contactDialog.current;
    if (!node) return;
    if (adding && !node.open) node.showModal();
    else if (!adding && node.open) node.close();
  }, [adding]);
  const entries = dueEntries(display),
    taken = entries.filter((e) => e.status === 'taken').length;
  const people = example
    ? [
        {
          id: 'amara',
          name: 'Amara O.',
          relation: 'Daughter',
          note: 'Fictional contact · no live access',
        },
        {
          id: 'daniel',
          name: 'Daniel O.',
          relation: 'Son',
          note: 'Fictional contact · no live access',
        },
        {
          id: 'nurse',
          name: 'Nurse Adeyemi',
          relation: 'Community nurse',
          note: 'Fictional contact · no live access',
        },
      ]
    : contacts;
  const activity = Object.entries(display.checkins).slice(-4).reverse();
  function savePerson(e: React.FormEvent) {
    e.preventDefault();
    if (example) {
      setNotice('Leave the fictional example to add a contact to your own session.');
      return;
    }
    if (!name.trim() || !relation.trim()) return;
    if (contacts.length >= 20) {
      setNotice('This session can keep up to 20 contacts.');
      return;
    }
    setContacts((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        relation: relation.trim(),
        note: 'Session contact · no access granted',
      },
    ]);
    setAdding(false);
    setName('');
    setRelation('');
    setNotice('Contact saved in this session. No invitation was sent and no access was granted.');
  }
  return (
    <section className="r-page">
      <Intro
        icon={Users}
        label="CARE CIRCLE"
        title={
          <>
            A few people,
            <br />
            on the same page.
          </>
        }
        action={
          <button className="button r-invite" onClick={() => setAdding(true)}>
            <UserPlus size={15} />
            Add someone
          </button>
        }
      >
        A private care handoff for family and the people you trust. You decide what to share and
        when.
      </Intro>
      <DemoNote />
      <p role="status" className="r-live-notice">
        {notice}
      </p>
      <div className="r-page-grid">
        <div className="r-stack">
          <Panel className="r-circle-summary">
            <Kicker>TODAY’S CHECK-INS</Kicker>
            <h2>
              {taken} of {entries.length} confirmed in your log
            </h2>
            <div className="r-chip-row">
              {entries.map((e) => (
                <Chip key={e.key}>
                  {e.status === 'taken' ? <Check size={11} /> : <Clock3 size={11} />}
                  {clock(e.time)} · {e.medicine.name}
                </Chip>
              ))}
            </div>
            {!entries.length && (
              <p>Add reviewed medicines and confirmed times to start your personal log.</p>
            )}
          </Panel>
          <div className="r-contact-grid">
            {people.map((p, i) => (
              <article className="r-panel r-contact-card" key={p.id}>
                <header>
                  <span className={`r-avatar tone-${i % 3}`}>
                    {p.name
                      .split(' ')
                      .map((s) => s[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.relation}</p>
                  </div>
                  {!example && (
                    <button
                      className="r-icon-button"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => setContacts((s) => s.filter((v) => v.id !== p.id))}
                    >
                      <X size={13} />
                    </button>
                  )}
                </header>
                <p>{p.note}</p>
                <small>
                  <i />
                  {example ? 'Example only' : 'Kept on this device for this session'}
                </small>
              </article>
            ))}
            <button className="r-add-person" onClick={() => setAdding(true)}>
              <span className="r-icon">
                <Plus size={19} />
              </span>
              <strong>Add someone to your circle</strong>
              <small>A session contact, with no automatic sharing</small>
            </button>
          </div>
          <Panel className="r-share-circle">
            <Kicker>SHARE THIS CARE CONVERSATION</Kicker>
            <div>
              <span>
                <LockKeyhole size={15} />
                YOUR PLAN. YOUR PEOPLE. YOUR PERMISSION.
              </span>
              <a href={example ? '#gp-summary' : '#care-handoff'} className="button dark">
                {example ? 'Preview example' : 'Prepare a care file'}
                <ArrowRight size={14} />
              </a>
            </div>
            <small>
              Care files use passphrase encryption. You share the file yourself and send the
              passphrase separately.
            </small>
          </Panel>
          {example && (
            <Panel>
              <Kicker>EXAMPLE CARE-TEAM QUESTIONS</Kicker>
              <ul className="r-question-list">
                {display.questions.map((q, i) => (
                  <li key={`${i}-${q}`}>
                    <span>{q}</span>
                    <button
                      className="r-icon-button"
                      aria-label={`Remove example question ${i + 1}`}
                      onClick={() =>
                        setDisplay((s) => ({
                          ...s,
                          questions: s.questions.filter((_, index) => index !== i),
                        }))
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {!example && (
            <Panel className="r-observations">
              <Kicker>FOR YOUR NEXT APPOINTMENT</Kicker>
              <label htmlFor="gp-observations">What have you noticed?</label>
              <textarea
                id="gp-observations"
                maxLength={3000}
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Write a question or observation in your own words…"
              />
              <small>
                Session only. These optional notes appear on your GP sheet and are excluded from
                care-file exports.
              </small>
              <a href="#gp-summary" className="r-text-link">
                Preview your GP sheet <ArrowRight size={13} />
              </a>
            </Panel>
          )}
        </div>
        <aside className="r-stack">
          <Panel>
            <Kicker>RECENT ACTIVITY</Kicker>
            <div className="r-activity">
              {activity.map(([key, value]) => {
                const [date, id, h, m] = key.split(':'),
                  medicine = display.medicines.find((v) => v.id === id);
                return (
                  <div key={key}>
                    <span className="r-icon">
                      <Check size={13} />
                    </span>
                    <section>
                      <p>
                        <strong>{medicine?.name ?? 'Medicine entry'}</strong>{' '}
                        {value === 'taken' ? 'was marked taken' : 'was marked for later'}
                      </p>
                      <small>
                        {date} · {h}:{m}
                        {example ? ' · fictional example' : ' · your session log'}
                      </small>
                    </section>
                  </div>
                );
              })}
              {!activity.length && (
                <p>Your own check-ins will appear here. There is no live caregiver feed.</p>
              )}
            </div>
          </Panel>
          <Panel>
            <Kicker>WHAT A CARE FILE CAN INCLUDE</Kicker>
            <ul className="r-checklist">
              <li>
                <Check size={13} />
                Reviewed medicine entries
              </li>
              <li>
                <Check size={13} />
                Your check-in history
              </li>
              <li>
                <Check size={13} />
                Care-team questions
              </li>
              <li className="muted">
                <X size={13} />
                Original hospital documents
              </li>
              <li className="muted">
                <X size={13} />
                Source photos
              </li>
            </ul>
            <button className="button secondary r-full" onClick={() => setAdding(true)}>
              Manage contacts
            </button>
            <p className="r-footnote">
              <ShieldCheck size={13} />
              Listing a contact grants no access. Sharing happens only through a care file you
              choose to send.
            </p>
          </Panel>
        </aside>
      </div>
      <dialog
        ref={contactDialog}
        className="r-dialog r-contact-dialog"
        aria-labelledby="contact-title"
        onCancel={(e) => {
          e.preventDefault();
          setAdding(false);
        }}
      >
        {adding && (
          <>
            <button
              className="r-dialog-close"
              aria-label="Close contact form"
              onClick={() => setAdding(false)}
            >
              <X size={17} />
            </button>
            <Kicker>YOUR PEOPLE. YOUR PERMISSION.</Kicker>
            <h2 id="contact-title">Add someone to your circle.</h2>
            <p>
              A local contact for this session. No invitation is sent and no account access is
              granted.
            </p>
            <form onSubmit={savePerson}>
              <label>
                Name
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Relationship
                <input
                  required
                  maxLength={100}
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                />
              </label>
              <button className="button dark" type="submit">
                Save session contact <ArrowRight size={14} />
              </button>
              <button className="button secondary" type="button" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </form>
            <p className="r-live-notice" role="status">
              {notice}
            </p>
          </>
        )}
      </dialog>
    </section>
  );
}

export function HowItWorks({
  analysis,
  redactions,
  runtimeStatus,
}: {
  analysis: MedicationAnalysis | null;
  redactions: number;
  runtimeStatus: string;
}) {
  const { display, example, openIntake } = useWorkspace();
  const source = analysis?.inferenceSource,
    medications = example
      ? display.medicines
      : (analysis?.medications.map((m) => ({
          id: m.id,
          name: m.name.value,
          strength: m.strength?.value ?? '',
          quote: m.name.quote,
          status: m.status?.value ?? '',
          times: [] as string[],
          confirmed: false,
        })) ?? []);
  const steps: { icon: Glyph; title: string; text: string; badge: string; warm?: boolean }[] = [
    {
      icon: ScanLine,
      title: 'Read the page',
      text: 'Paste text, import a PDF, or read a photo locally in the browser.',
      badge: 'On-device',
    },
    {
      icon: ShieldCheck,
      title: 'Find personal details',
      text: 'Common names, birth dates and record numbers are masked locally. Review every line.',
      badge: 'On-device',
    },
    {
      icon: Pill,
      title: 'Extract the medication table',
      text: 'Firebase AI Logic returns structured, source-linked medicine drafts.',
      badge: source === 'cloud' ? 'Cloud · approved' : 'On-device first',
    },
    {
      icon: Cloud,
      title: 'Use the cloud only with permission',
      text: 'Balanced or Best quality requires approval of the exact masked text. Strict local never falls back.',
      badge: 'Your choice',
      warm: true,
    },
    {
      icon: FileText,
      title: 'Review the plain-language plan',
      text: 'Compare names, units and source wording. Only care-team-confirmed times enter your schedule.',
      badge: 'Human review',
    },
    {
      icon: Users,
      title: 'Share with the care circle',
      text: 'An encrypted care file carries your reviewed entries and questions. Originals are excluded.',
      badge: 'Encrypted file',
    },
  ];
  return (
    <section className="r-page r-how">
      <Intro
        icon={Cpu}
        label="HOW IT WORKS"
        title={
          <>
            Two models.
            <br />
            One quiet decision.
          </>
        }
        action={
          <span className="r-glass-chip">
            <Cpu size={13} />
            Firebase AI Logic · hybrid inference
          </span>
        }
      >
        Keep what can stay on this device, choose what may leave, and review every instruction
        against the original.
      </Intro>
      <div className="r-how-grid">
        <Panel className="r-decision">
          <Kicker icon={Cpu}>THE DECISION, STEP BY STEP</Kicker>
          {steps.map((s, i) => (
            <article key={s.title}>
              <span className="r-icon">
                <s.icon size={17} />
              </span>
              <div>
                <h3>
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {s.title}
                </h3>
                <p>{s.text}</p>
              </div>
              <Chip warm={!!s.warm}>{s.badge}</Chip>
            </article>
          ))}
        </Panel>
        <aside className="r-stack">
          <Panel className="r-routing-big">
            <Kicker>WHERE THE WORDS GO</Kicker>
            <div className="r-progress">
              <i style={{ width: source === 'cloud' ? '28%' : '72%' }} />
            </div>
            <div className="r-routing-legend">
              <span>
                <i />
                On this device
              </span>
              <strong>
                {source === 'on-device' ? 'Verified last result' : 'Local-first option'}
              </strong>
            </div>
            <div className="r-routing-legend">
              <span>
                <i />
                Cloud, masked and approved
              </span>
              <strong>{source === 'cloud' ? 'Verified last result' : 'Consent required'}</strong>
            </div>
            <small>Illustrative bar · no measured usage percentages. {runtimeStatus}.</small>
          </Panel>
          <Panel className="r-boundaries">
            <Kicker>STAYS ON THIS DEVICE</Kicker>
            <ul className="r-checklist">
              <li>
                <Check size={13} />
                Original source text and photos
              </li>
              <li>
                <Check size={13} />
                Locally masked common identifiers
              </li>
              <li>
                <Check size={13} />
                Your unsaved care workspace
              </li>
            </ul>
            <hr />
            <Kicker>LEAVES ONLY WHEN YOU CHOOSE</Kicker>
            <ul className="r-checklist">
              <li>
                <ArrowUpRight size={13} />
                The exact text you approved for cloud AI
              </li>
              <li>
                <ArrowUpRight size={13} />A care file you explicitly download and share
              </li>
            </ul>
            <a href="#privacy" className="r-text-link">
              Review text & privacy <ArrowRight size={13} />
            </a>
          </Panel>
        </aside>
      </div>
      <Panel className="r-stack-description">
        <div className="r-panel-topline">
          <div>
            <Kicker icon={Cpu}>THE FIREBASE STACK</Kicker>
            <h2>What each piece is responsible for</h2>
          </div>
          <Chip>App Check for cloud AI</Chip>
        </div>
        <div className="r-table-wrap">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>ROLE</th>
                <th>WHAT IT DOES HERE</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'Firebase AI Logic',
                  'Hybrid inference',
                  'Runs generative extraction through the official Firebase SDK.',
                ],
                [
                  'App Check',
                  'Request attestation',
                  'Protects cloud calls with the configured app attestation provider.',
                ],
                [
                  'Authentication',
                  'Account foundation',
                  'Initialized; caregiver account flows are not implemented.',
                ],
                [
                  'Firestore',
                  'Database foundation',
                  'Initialized; real-time family sharing is not implemented.',
                ],
                [
                  'Local OCR',
                  'Photo to text',
                  'Bundled Tesseract reads images locally, including English and Spanish.',
                ],
                [
                  'Encrypted handoff',
                  'Private care sharing',
                  'Passphrase-protected files contain reviewed entries, questions and check-ins.',
                ],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="r-blue-note">
          <Cpu size={15} />
          <span>
            <strong>Runtime proof.</strong>{' '}
            {source === 'cloud'
              ? 'The last result reported cloud inference.'
              : source === 'on-device'
                ? 'The last result reported on-device inference.'
                : source === 'sample'
                  ? 'The current draft is a hand-authored example, not AI output.'
                  : 'No completed extraction in this session.'}{' '}
            Model revision requires separate Chrome verification.
          </span>
        </div>
      </Panel>
      <Panel className="r-parser">
        <div className="r-panel-topline">
          <div>
            <Kicker icon={FileText}>PARSER CHECK</Kicker>
            <h2>
              {example
                ? 'The fictional example, in its own words'
                : 'What the last extraction returned'}
            </h2>
            <p>
              {example
                ? 'Hand-authored example entries are labeled. This table is not a live parser result.'
                : 'Every AI field is checked against quoted source evidence before a draft is accepted.'}
            </p>
          </div>
          <div className="r-chip-row">
            <Chip>{medications.length} entries</Chip>
            <Chip warm>Human review required</Chip>
          </div>
        </div>
        <div className="r-table-wrap">
          <table>
            <thead>
              <tr>
                <th>STATUS</th>
                <th>LINE FROM THE SOURCE</th>
                <th>RESULT</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Chip warm={/paused|stop|hold/i.test(m.status ?? '')}>
                      {/paused|stop|hold/i.test(m.status ?? '')
                        ? 'Paused in source'
                        : example
                          ? 'Example'
                          : 'Draft'}
                    </Chip>
                  </td>
                  <td>{m.quote}</td>
                  <td>
                    {m.name} {m.strength}
                  </td>
                </tr>
              ))}
              {!medications.length && (
                <tr>
                  <td colSpan={3}>
                    Add a document and complete extraction to see source-linked results here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="r-limitations">
          <Kicker>STILL NEEDS YOUR CARE TEAM</Kicker>
          <ul>
            <li>Drug interactions and clinical decisions are not checked.</li>
            <li>Photo recognition can miss or misread text.</li>
            <li>Complex tapers and unclear instructions need review.</li>
            <li>On-device model availability varies by browser and device.</li>
          </ul>
        </div>
      </Panel>
      <div className="r-impact-grid">
        <Panel>
          <strong>1 in 5</strong>
          <p>had a care-related problem in the cited hospital study</p>
        </Panel>
        <Panel>
          <strong>2 in 3</strong>
          <p>of those problems involved medicines</p>
        </Panel>
        <Panel>
          <strong>{redactions}</strong>
          <p>common identifiers masked in the current document</p>
        </Panel>
        <Panel>
          <strong>0</strong>
          <p>original photos sent to cloud AI</p>
        </Panel>
      </div>
      <Panel className="r-last-step">
        <div>
          <h2>If the local model isn’t there</h2>
          <p>
            Strict local stays local and reports the problem. You can review manually, or explicitly
            approve the masked text before choosing a cloud mode.
          </p>
        </div>
        <div className="r-chip-row">
          <Chip>
            <Cpu size={12} />
            On-device
          </Chip>
          <Chip warm>
            <Cloud size={12} />
            Cloud with approval
          </Chip>
          <button className="button dark" onClick={openIntake}>
            Add a document <Plus size={14} />
          </button>
        </div>
      </Panel>
    </section>
  );
}
