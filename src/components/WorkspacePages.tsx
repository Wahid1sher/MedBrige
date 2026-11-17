import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  LockKeyhole,
  Pill,
  Plus,
  Printer,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Users,
  Bell,
  Cloud,
  Cpu,
  ScanLine,
  Eye,
  CircleHelp,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../state/Workspace';
import { useCarePlan } from '../state/CarePlan';
import { dueEntries, localDay, type CareSnapshot } from '../services/carePlan';
import {
  dayPart,
  dayParts,
  exampleDocuments,
  recentDays,
  recordedEntries,
  type SessionDocument,
} from '../services/workspace';
import type { MedicationAnalysis } from '../types/medication';

export function WorkspaceExample() {
  const { example, setExample } = useWorkspace();
  return (
    <button className="ws-example" aria-pressed={example} onClick={() => setExample(!example)}>
      {example ? 'Fictional example workspace' : 'Explore an example'}
      <span className="ws-switch" data-on={example}>
        <i />
      </span>
    </button>
  );
}
export function TodayPage({ onAdd, raw }: { onAdd: () => void; raw: string }) {
  const { display, setDisplay, example } = useWorkspace();
  const entries = dueEntries(display),
    done = entries.filter((e) => e.status === 'taken').length;
  const next = entries.find((e) => e.status !== 'taken');
  return (
    <div className="ws-page ws-today">
      <div className="ws-day-toolbar">
        <span className="ws-kicker">
          <Sun size={16} />
          THE DAY AS A SKY
        </span>
        <WorkspaceExample />
      </div>
      <section className="ws-today-hero">
        <div className="ws-day-landscape">
          <p>
            {example ? 'A little practice. A calmer day.' : 'A little support for what’s next.'}
          </p>
          <h1 data-tour="day-heading">
            {entries.length ? (
              <>
                {done} of {entries.length} check-ins
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
              ? 'A fictional plan to explore, one small step at a time.'
              : 'Your original instructions. A clearer plan. A little more peace of mind.'}
          </p>
          <div className="ws-sky-arc" aria-hidden="true">
            <svg viewBox="0 0 640 200" preserveAspectRatio="none">
              <path
                d="M12 190 Q290 -170 628 190"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="4 7"
              />
            </svg>
            <i className="ws-arc-dot d1" />
            <i className="ws-arc-dot d2" />
            <i className="ws-arc-sun" />
            <i className="ws-arc-dot d4" />
            <i className="ws-arc-dot d5" />
            <span className="ws-arc-label">ONE SMALL STEP AT A TIME</span>
          </div>
        </div>
        <aside className="ws-card ws-hero-card">
          {next ? (
            <>
              <span className="ws-kicker">NEXT ON YOUR PATH · {next.time}</span>
              <h2>{next.medicine.name}</h2>
              <p>
                {next.medicine.strength} · {next.medicine.dose}
              </p>
              <div className="ws-hero-pill">
                <Pill size={64} />
              </div>
              <p className="ws-footnote">Symbolic illustration · check the actual label.</p>
              <button
                className="button dark ws-full"
                onClick={() =>
                  setDisplay((s) => ({ ...s, checkins: { ...s.checkins, [next.key]: 'taken' } }))
                }
              >
                <Check size={17} />I took it
              </button>
              <a href="#schedule" className="button secondary ws-full">
                Open schedule <ArrowRight size={16} />
              </a>
            </>
          ) : (
            <>
              <span className="ws-kicker">ONE STEP AT A TIME</span>
              <span className="ws-hero-document">
                <FileText size={43} />
              </span>
              <h2>
                {entries.length ? (
                  'A moment to breathe.'
                ) : (
                  <>
                    A clearer picture
                    <br />
                    starts here.
                  </>
                )}
              </h2>
              <p>
                {entries.length
                  ? 'Your reviewed check-ins are complete for today. This is your personal log.'
                  : 'Bring a document, a photo or a few lines of text. Keep the original close as you review.'}
              </p>
              <button className="button dark ws-full" onClick={onAdd}>
                <Plus size={18} />
                {raw.trim() ? 'Continue document review' : 'Add your document'}
              </button>
              <p className="ws-footnote">
                <LockKeyhole size={13} />
                Session only · no automatic upload
              </p>
            </>
          )}
        </aside>
      </section>
      <aside className="discharge-research">
        <p>
          In one hospital study, about <strong>1 in 5 patients</strong> had a care-related problem
          after discharge. About <strong>2 in 3</strong> of those problems involved medicines.
        </p>
        <a href="https://pubmed.ncbi.nlm.nih.gov/12558354/" target="_blank" rel="noreferrer">
          Forster et al. · Annals of Internal Medicine, 2003 <ArrowUpRight size={13} />
        </a>
        <small>A finding from one study, not a prediction of your personal risk.</small>
      </aside>
      <SchedulePage compact />
      <div className="ws-home-shortcuts">
        {[
          ['documents', 'Your documents', FileText],
          ['medicines', 'Your medicines', Pill],
          ['caregivers', 'Your care circle', Users],
        ].map(([href, label, Icon]) => {
          const Glyph = Icon as typeof FileText;
          return (
            <a className="ws-card" key={String(href)} href={`#${href}`}>
              <Glyph size={23} />
              <strong>{String(label)}</strong>
              <ArrowUpRight size={18} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
export function PageIntro({
  kicker,
  title,
  children,
  action,
}: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="ws-intro">
      <div>
        <span className="ws-kicker">{kicker}</span>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      <div className="ws-intro-actions">
        <WorkspaceExample />
        {action}
      </div>
    </header>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="ws-empty">
      <FileText size={28} />
      <p>{children}</p>
      <a className="button dark" href="#documents">
        Add a document <ArrowRight size={16} />
      </a>
    </div>
  );
}
function Filters({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="ws-filters" role="group" aria-label={label}>
      {options.map((v) => (
        <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>
          {v}
        </button>
      ))}
    </div>
  );
}
export function DocumentsLibrary({
  raw,
  redactions,
  onOpen,
  onAdd,
}: {
  raw: string;
  redactions: number;
  onOpen: (text: string) => void;
  onAdd: () => void;
}) {
  const { example, documents, setDocuments } = useWorkspace();
  const [selected, setSelected] = useState('active'),
    [filter, setFilter] = useState('All'),
    [notice, setNotice] = useState('');
  const active: SessionDocument[] = raw.trim()
    ? [
        {
          id: 'active',
          title: 'Current document',
          text: raw,
          savedAt: 'Current review',
          redactions,
          source: 'Session',
        },
      ]
    : [];
  const list = example ? exampleDocuments : [...active, ...documents];
  const visible = list.filter(
    (d) =>
      filter === 'All' ||
      (filter === 'On-device' && d.source === 'Session') ||
      (filter === 'Examples' && d.source === 'Example') ||
      (filter === 'Needs review' && d.id === 'active'),
  );
  const current = visible.find((d) => d.id === selected) ?? visible[0];
  return (
    <section className="ws-page">
      <PageIntro
        kicker="YOUR DOCUMENTS"
        title={
          <>
            Everything you were handed,
            <br />
            in one place.
          </>
        }
        action={
          <button className="button dark" onClick={onAdd}>
            <Plus size={17} />
            Add document
          </button>
        }
      >
        Keep the original wording close. Read a document here, then review the medicine instructions
        below.
      </PageIntro>
      <Filters
        label="Document filter"
        options={['All', 'On-device', 'Needs review', 'Examples']}
        value={filter}
        onChange={setFilter}
      />
      {example && (
        <p className="ws-demo-note">
          Fictional library · illustrative documents, not real patient records.
        </p>
      )}
      <div className="ws-columns">
        <div className="ws-doc-list">
          {visible.map((doc, i) => (
            <button
              key={doc.id}
              className={`ws-doc-row ${current?.id === doc.id ? 'selected' : ''}`}
              aria-pressed={current?.id === doc.id}
              onClick={() => setSelected(doc.id)}
            >
              <span className={`ws-tile tone-${i % 3}`}>
                <FileText size={23} />
              </span>
              <span className="ws-grow">
                <strong>{doc.title}</strong>
                <small>{doc.savedAt}</small>
                <span className="ws-doc-tags">
                  <em>{doc.source === 'Example' ? 'Example only' : 'Session only'}</em>
                  <em>
                    <LockKeyhole size={11} />
                    Original kept locally
                  </em>
                </span>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
          <button className="ws-add-tile" onClick={onAdd}>
            <Plus size={24} />
            <strong>Add a new document</strong>
            <span>Photo, PDF, text or camera · read locally first</span>
          </button>
          {!visible.length && (
            <p className="ws-muted">
              {list.length
                ? 'No documents match this filter.'
                : 'Your documents will appear here during this session.'}
            </p>
          )}
          {!example && raw.trim() && (
            <button
              className="ws-text-link"
              onClick={() => {
                if (documents.length >= 20) {
                  setNotice(
                    'This session has 20 saved documents. Remove one before saving another.',
                  );
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
                setNotice(
                  'Copy saved in this tab’s memory. It will be cleared when the page is closed or reloaded.',
                );
              }}
            >
              Keep a copy in this session <Plus size={15} />
            </button>
          )}
          <p className="ws-muted" role="status">
            {notice}
          </p>
        </div>
        <aside className="ws-card ws-document-preview">
          <span className="ws-kicker">IN THIS FILE</span>
          <h2>{current?.title ?? 'The original stays close.'}</h2>
          <p className="ws-muted">{current?.savedAt ?? 'Choose a document to read it here.'}</p>
          {current && (
            <>
              <h3>Original wording</h3>
              <pre className="ws-source-text">{current.text}</pre>
              <div className="ws-fact-row">
                <span>
                  Stored in<b> This session</b>
                </span>
                <span>
                  Uploaded originals<b>0</b>
                </span>
                <span>
                  Identifiers masked in preview<b>{current.redactions}</b>
                </span>
              </div>
              <a className="ws-text-link" href="#medicines">
                See medicines <ArrowRight size={16} />
              </a>
              {current.source === 'Session' && current.id !== 'active' && (
                <>
                  <button
                    className="button secondary"
                    onClick={() => {
                      onOpen(current.text);
                      setNotice(
                        'Opened as a new source. Review the new text and medicine list again.',
                      );
                    }}
                  >
                    Use as current source
                  </button>
                  <button
                    className="ws-text-link"
                    onClick={() => setDocuments((d) => d.filter((v) => v.id !== current.id))}
                  >
                    <Trash2 size={14} />
                    Remove session copy
                  </button>
                </>
              )}
            </>
          )}
          <p className="ws-footnote">
            <LockKeyhole size={14} /> Originals are kept in memory only. No automatic upload or
            clinical interpretation.
          </p>
        </aside>
      </div>
    </section>
  );
}

export function MedicinesBrowser() {
  const { display, setDisplay, example } = useWorkspace();
  const { setNotice } = useCarePlan();
  const [selected, setSelected] = useState(''),
    [filter, setFilter] = useState('All');
  const list = display.medicines.filter(
    (m) =>
      filter === 'All' ||
      (filter === 'As needed'
        ? /as needed|prn/i.test(`${m.status} ${m.frequency}`)
        : m.times.some((t) => dayPart(t) === filter)),
  );
  const current = list.find((m) => m.id === selected) ?? list[0];
  const todayEntries = dueEntries(display),
    taken = todayEntries.filter((e) => e.status === 'taken').length;
  const nextForMedicine = todayEntries.find(
    (e) => e.medicine.id === current?.id && e.status !== 'taken',
  );
  return (
    <section className="ws-page">
      <PageIntro
        kicker="YOUR MEDICINES"
        title={
          <>
            Each name.
            <br />A little more understanding.
          </>
        }
        action={
          <span className="ws-badge">
            <Check size={15} />
            {taken} check-ins today
          </span>
        }
      >
        The amount, timing and source stay together. Review every entry with your original
        instructions.
      </PageIntro>
      <Filters
        label="Medicine time filter"
        options={['All', 'Morning', 'Midday', 'Evening', 'Night', 'As needed']}
        value={filter}
        onChange={setFilter}
      />
      {example && (
        <p className="ws-demo-note">
          Fictional example · these times and medicines are for exploring the interface only.
        </p>
      )}
      <div className="ws-columns">
        <div className="ws-stack">
          {list.map((m, i) => (
            <button
              key={m.id}
              className={`ws-medicine-row ${current?.id === m.id ? 'selected' : ''}`}
              aria-pressed={current?.id === m.id}
              onClick={() => setSelected(m.id)}
            >
              <span className={`ws-pill-icon tone-${i % 3}`}>
                <Pill size={30} />
              </span>
              <span className="ws-grow">
                <span className="ws-row-top">
                  <strong>{m.name}</strong>
                  <em>{m.confirmed ? 'Reviewed' : 'Needs review'}</em>
                </span>
                <span>
                  {m.strength || 'Strength not stated'} · {m.frequency || 'Frequency not stated'}
                </span>
                <small>
                  <Clock3 size={13} />
                  {m.times.join(' · ') || 'No confirmed clock times'}
                </small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
          {!list.length &&
            (display.medicines.length ? (
              <p className="ws-card">No medicines match this filter.</p>
            ) : (
              <Empty>
                Start with a document or enter an instruction manually in the source review below.
              </Empty>
            ))}
          <div className="ws-note">
            <ShieldCheck size={21} />
            <div>
              <strong>Keep one thing in mind.</strong>
              <p>
                MedBrige has not checked interactions or decided which medicines you should take.
                Ask your pharmacist to confirm the current list.
              </p>
            </div>
          </div>
        </div>
        <aside className="ws-card ws-medicine-detail">
          {current ? (
            <>
              <span className="ws-kicker">A CLOSER LOOK</span>
              <span className="ws-large-pill">
                <Pill size={48} />
              </span>
              <h2>{current.name}</h2>
              <p className="ws-muted">
                {current.strength} · {current.status || 'Source status not stated'}
              </p>
              <div className="ws-two-facts">
                <div>
                  <small>AMOUNT IN SOURCE</small>
                  <strong>{current.dose || 'Not stated'}</strong>
                </div>
                <div>
                  <small>YOUR REVIEWED TIMES</small>
                  <strong>{current.times.join(', ') || 'Not set'}</strong>
                </div>
              </div>
              <h3>In the original words</h3>
              <blockquote>{current.quote || 'No source quote entered.'}</blockquote>
              <p className="ws-footnote">
                Illustration is symbolic. Do not use it to identify a pill.
              </p>
              {nextForMedicine && (
                <button
                  className="button dark ws-full"
                  onClick={() =>
                    setDisplay((s) => ({
                      ...s,
                      checkins: { ...s.checkins, [nextForMedicine.key]: 'taken' },
                    }))
                  }
                >
                  <Check size={16} />
                  Record {nextForMedicine.time} taken
                </button>
              )}
              <button
                className="button secondary ws-full"
                onClick={() => {
                  const question = `Can we review the instructions for ${current.name} ${current.strength}?`;
                  setDisplay((s) => ({
                    ...s,
                    questions: s.questions.includes(question)
                      ? s.questions
                      : [...s.questions, question],
                  }));
                  setNotice(
                    example
                      ? 'Question added to the fictional example.'
                      : 'Question added to your care conversation.',
                  );
                  location.hash = '#caregivers';
                }}
              >
                Ask about this one <ArrowRight size={16} />
              </button>
              {!example && (
                <a className="ws-text-link" href="#source-review">
                  Review source & times <ArrowRight size={14} />
                </a>
              )}
            </>
          ) : (
            <>
              <Pill size={36} />
              <h2>One clear place for the details.</h2>
              <p>Choose a medicine to see its original instructions.</p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

const partIcons = { Morning: Sunrise, Midday: Sun, Evening: Sunset, Night: Moon };
export function SchedulePage({ compact = false }: { compact?: boolean }) {
  const { display, setDisplay, example } = useWorkspace();
  const [date, setDate] = useState(localDay),
    [reminders, setReminders] = useState(false),
    [message, setMessage] = useState('');
  const today = localDay(),
    todayEntries = dueEntries(display, today),
    entries = recordedEntries(display, date, today);
  const completed = entries.filter((e) => e.status === 'taken').length;
  const next = todayEntries.find(
    (e) => e.status !== 'taken' && e.time >= new Date().toTimeString().slice(0, 5),
  );
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
  useEffect(() => {
    if (!reminders) return;
    const seen = new Set<string>();
    const timer = setInterval(() => {
      const now = new Date(),
        clock = now.toTimeString().slice(0, 5);
      const due = dueEntries(display, localDay(now)).filter(
        (e) => e.time === clock && e.status !== 'taken',
      );
      for (const entry of due)
        if (!seen.has(entry.key)) {
          seen.add(entry.key);
          setMessage(
            `A time in your reviewed plan: ${entry.time}, ${entry.medicine.name}. Check the original instructions if unsure.`,
          );
        }
    }, 15000);
    return () => clearInterval(timer);
  }, [reminders, display]);
  return (
    <section className="ws-page">
      {!compact && (
        <PageIntro
          kicker="YOUR SCHEDULE"
          title={
            <>
              The day,
              <br />
              in four quiet parts.
            </>
          }
          action={
            <a className="button secondary" href="#gp-summary">
              <Printer size={16} />
              Print for the GP
            </a>
          }
        >
          Your reviewed times, grouped into a calmer day. Record what happened, at your own pace.
        </PageIntro>
      )}
      {example && (
        <p className="ws-demo-note">
          Fictional example log · changes here never affect your own plan.
        </p>
      )}
      <div className="ws-columns">
        <div className="ws-stack">
          <section className="ws-card">
            <div className="ws-card-title" data-tour={compact ? 'daily-heading' : undefined}>
              <div>
                <span className="ws-kicker">
                  {compact
                    ? 'TODAY, IN SMALL STEPS'
                    : date === today
                      ? 'TODAY SO FAR'
                      : 'RECORDED THAT DAY'}
                </span>
                <h2>
                  {completed} <span className="ws-soft">of {entries.length} check-ins</span>
                </h2>
              </div>
              <span className="ws-round-icon">
                <Sun size={24} />
              </span>
            </div>
            <p className="ws-muted">
              {entries.length
                ? 'A personal record of your reviewed plan. Every small step counts.'
                : date === today
                  ? 'Review your medicines and confirm times to build your day.'
                  : 'No check-ins recorded for this date. A past schedule is not inferred from your current plan.'}
            </p>
            <div
              className="ws-progress"
              role="progressbar"
              aria-label="Check-ins marked taken"
              aria-valuemin={0}
              aria-valuemax={entries.length || 1}
              aria-valuenow={completed}
            >
              <i style={{ width: `${entries.length ? (completed / entries.length) * 100 : 0}%` }} />
            </div>
            <div className="ws-row-top">
              <small>
                {entries.length ? Math.round((completed / entries.length) * 100) : 0}% marked taken
              </small>
              <a href={compact ? '#schedule' : '#medicines'} className="ws-text-link">
                {compact ? 'Open schedule' : 'Review your times'} <ArrowRight size={14} />
              </a>
            </div>
          </section>
          {!compact && (
            <div className="ws-week" role="group" aria-label="Choose log date">
              {recentDays().map((d) => (
                <button key={d.key} aria-pressed={date === d.key} onClick={() => setDate(d.key)}>
                  <small>{d.date.toLocaleDateString(undefined, { weekday: 'narrow' })}</small>
                  <strong>{d.date.getDate()}</strong>
                  <i
                    className={
                      Object.keys(display.checkins).some((k) => k.startsWith(d.key))
                        ? 'has-log'
                        : ''
                    }
                  />
                </button>
              ))}
            </div>
          )}
          {dayParts.map((part) => {
            const group = entries.filter((e) => dayPart(e.time) === part),
              Icon = partIcons[part],
              done = group.filter((e) => e.status === 'taken').length;
            if (!group.length) return null;
            return (
              <section className="ws-card ws-day-part" key={part}>
                <div className="ws-card-title">
                  <span className="ws-round-icon">
                    <Icon size={22} />
                  </span>
                  <div className="ws-grow">
                    <h3>{part}</h3>
                    <p className="ws-muted">
                      {done} of {group.length} marked taken
                    </p>
                  </div>
                  {date === today && (
                    <button
                      className="ws-text-link"
                      onClick={() =>
                        mark(
                          group.map((e) => e.key),
                          done !== group.length,
                        )
                      }
                    >
                      {done === group.length ? 'Clear' : 'Mark all'}
                    </button>
                  )}
                </div>
                {group.map((e) => (
                  <div className="ws-log-entry" key={e.key}>
                    <button
                      className={`ws-check-row ${e.status === 'taken' ? 'taken' : ''}`}
                      aria-pressed={e.status === 'taken'}
                      onClick={() => mark([e.key], e.status !== 'taken')}
                    >
                      <span className="ws-check-box">
                        {e.status === 'taken' && <Check size={15} />}
                      </span>
                      <time>{e.time}</time>
                      <span className="ws-grow">
                        <strong>
                          {e.medicine.name} <span>{e.medicine.strength}</span>
                        </strong>
                        <small>
                          {e.status === 'taken'
                            ? 'Recorded taken'
                            : e.status === 'later'
                              ? 'Recorded for later'
                              : e.medicine.dose || 'See original instructions'}
                        </small>
                      </span>
                    </button>
                    {date === today && e.status !== 'taken' && (
                      <button
                        className="ws-later"
                        aria-label={`Mark ${e.medicine.name} at ${e.time} for later`}
                        onClick={() =>
                          setDisplay((s) => ({
                            ...s,
                            checkins: { ...s.checkins, [e.key]: 'later' },
                          }))
                        }
                      >
                        {e.status === 'later' ? 'Marked later' : 'Later'}
                      </button>
                    )}
                  </div>
                ))}
              </section>
            );
          })}
          {!entries.length && (
            <Empty>
              {date === today
                ? 'Nothing is scheduled automatically. Confirm the instructions and times first.'
                : 'Only previously recorded entries are shown for earlier days.'}
            </Empty>
          )}
          <p className="ws-footnote">
            <CircleHelp size={17} />
            For missed doses or uncertainty, read the original instructions and ask your pharmacist.
            This log does not tell you to take, skip or double a dose.
          </p>
        </div>
        <aside className="ws-stack">
          <section className="ws-card">
            <span className="ws-kicker">AT A GLANCE</span>
            <h2>{next ? next.time : 'A little breathing room.'}</h2>
            <p>
              {next
                ? `${next.medicine.name} · ${next.medicine.strength}`
                : 'No later pending times in today’s reviewed plan.'}
            </p>
            {next && (
              <button className="button dark ws-full" onClick={() => mark([next.key], true)}>
                <Check size={16} />
                Mark this one taken
              </button>
            )}
            <a className="ws-text-link" href="#gp-summary">
              Prepare for your GP <ArrowRight size={14} />
            </a>
          </section>
          {!compact && (
            <section className="ws-card">
              <div className="ws-card-title">
                <Bell size={22} />
                <h3>Gentle reminders</h3>
              </div>
              <p className="ws-muted">
                In-app reminders while this page is open. Keep this tab open; there are no
                background or push notifications.
              </p>
              <button
                className="ws-toggle-row"
                aria-pressed={reminders}
                onClick={() => {
                  setReminders(!reminders);
                  setMessage(
                    reminders
                      ? 'Reminders turned off.'
                      : 'In-app reminders are on while this schedule stays open.',
                  );
                }}
              >
                While this page is open
                <span className="ws-switch" data-on={reminders}>
                  <i />
                </span>
              </button>
              <button
                className="button secondary ws-full"
                onClick={() =>
                  setMessage(
                    'Test reminder: pause, check your reviewed plan, and read the original instructions if unsure.',
                  )
                }
              >
                <Bell size={15} />
                Send a test reminder
              </button>
              <p role="status" className="ws-reminder-message">
                {message}
              </p>
            </section>
          )}
          <section className="ws-card ws-tinted">
            <span className="ws-kicker">A KINDER KIND OF RECORD</span>
            <h3>Your pace. Your people.</h3>
            <p>
              A check-in helps you remember what happened. It is not a score, a prescription, or a
              measure of your health.
            </p>
            <a className="ws-text-link" href="#caregivers">
              Your care circle <ArrowRight size={15} />
            </a>
          </section>
        </aside>
      </div>
    </section>
  );
}

export function CareCirclePanel() {
  const { contacts, setContacts, example, display, setDisplay, observations, setObservations } =
    useWorkspace();
  const [adding, setAdding] = useState(false),
    [name, setName] = useState(''),
    [relation, setRelation] = useState(''),
    [message, setMessage] = useState('');
  const people = example
    ? [
        { id: 'demo-1', name: 'Amara O.', relation: 'Daughter', note: 'Fictional contact' },
        { id: 'demo-2', name: 'Daniel O.', relation: 'Son', note: 'Fictional contact' },
        { id: 'demo-3', name: 'Nurse Adeyemi', relation: 'Care team', note: 'Fictional contact' },
      ]
    : contacts;
  const entries = dueEntries(display),
    taken = entries.filter((e) => e.status === 'taken').length;
  return (
    <section className="ws-page">
      <PageIntro
        kicker="YOUR CARE CIRCLE"
        title={
          <>
            A few people,
            <br />
            on the same page.
          </>
        }
        action={
          <button className="button dark" onClick={() => setAdding(!adding)}>
            <Plus size={16} />
            Add someone
          </button>
        }
      >
        Keep trusted people in mind and prepare an encrypted care handoff. Nothing is sent or shared
        automatically.
      </PageIntro>
      {example && (
        <p className="ws-demo-note">
          Fictional care circle · no real people, live activity or invitations.
        </p>
      )}
      {adding && (
        <form
          className="ws-card ws-contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (example) {
              setMessage('Leave example mode to add a contact to your own session.');
              return;
            }
            if (!name.trim() || !relation.trim()) {
              setMessage('Enter a name and relationship.');
              return;
            }
            if (contacts.length >= 20) {
              setMessage('You can keep up to 20 contacts in this session.');
              return;
            }
            setContacts((c) => [
              ...c,
              {
                id: crypto.randomUUID(),
                name: name.trim(),
                relation: relation.trim(),
                note: 'Session contact · no access granted',
              },
            ]);
            setName('');
            setRelation('');
            setAdding(false);
            setMessage(
              'Contact saved in this tab only. No invitation was sent and no access was granted.',
            );
          }}
        >
          <label>
            Name
            <input
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
            Save session contact
          </button>
          <button className="button secondary" type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      )}
      <p role="status" className="ws-muted">
        {message}
      </p>
      <div className="ws-contact-grid">
        {people.map((p, i) => (
          <article key={p.id} className="ws-card ws-contact">
            <span className={`ws-avatar tone-${i % 3}`}>
              {p.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </span>
            <h3>{p.name}</h3>
            <p>{p.relation}</p>
            <small>{p.note}</small>
            {!example && (
              <button
                className="ws-text-link"
                onClick={() => setContacts((c) => c.filter((v) => v.id !== p.id))}
              >
                <Trash2 size={13} />
                Remove
              </button>
            )}
          </article>
        ))}
        <button className="ws-add-tile" onClick={() => setAdding(true)}>
          <Users size={25} />
          <strong>A little support, together.</strong>
          <span>Add a contact to this session</span>
        </button>
      </div>
      <div className="ws-columns">
        <section className="ws-card">
          <span className="ws-kicker">YOUR RECORDED ACTIVITY</span>
          <h2>
            {taken} of {entries.length} check-ins today
          </h2>
          <div className="ws-activity-list">
            {Object.entries(display.checkins)
              .slice(-6)
              .reverse()
              .map(([key, value]) => {
                const [day, id, h, min] = key.split(':');
                const m = display.medicines.find((v) => v.id === id);
                return (
                  <div key={key}>
                    <span className="ws-round-icon">
                      <Check size={15} />
                    </span>
                    <div>
                      <strong>
                        {m?.name ?? 'Medicine entry'} ·{' '}
                        {value === 'taken' ? 'Marked taken' : 'Marked for later'}
                      </strong>
                      <small>
                        {day} · {h}:{min} · {example ? 'Fictional example' : 'Your session log'}
                      </small>
                    </div>
                  </div>
                );
              })}
            {!Object.keys(display.checkins).length && (
              <p className="ws-muted">
                Your personal check-ins will appear here. There is no live caregiver feed.
              </p>
            )}
          </div>
          <a href="#schedule" className="ws-text-link">
            Open your schedule <ArrowRight size={15} />
          </a>
        </section>
        <aside className="ws-card">
          <span className="ws-kicker">YOU CHOOSE WHAT TO SHARE</span>
          <h3>A plan, not your whole story.</h3>
          <ul className="ws-sharing-list">
            <li>
              <Check size={16} />
              Reviewed medicine entries
            </li>
            <li>
              <Check size={16} />
              Your check-in history
            </li>
            <li>
              <Check size={16} />
              Questions you choose to include
            </li>
            <li>
              <LockKeyhole size={16} />
              Original documents are excluded
            </li>
          </ul>
          <p className="ws-muted">
            {example
              ? 'This is an illustrative care circle. Preview the example sheet; nothing is sent to anyone.'
              : 'Use the encrypted file handoff below. Share its passphrase separately. Contacts listed here do not receive access.'}
          </p>
          <a href={example ? '#gp-summary' : '#care-handoff'} className="button dark ws-full">
            {example ? 'Preview example GP sheet' : 'Prepare a care handoff'}{' '}
            <ArrowRight size={16} />
          </a>
        </aside>
      </div>
      {example && (
        <section className="ws-card ws-observations">
          <span className="ws-kicker">FICTIONAL CARE CONVERSATION</span>
          <h2>Questions to bring along.</h2>
          <ul className="ws-limitations">
            {display.questions.map((q, i) => (
              <li key={`${i}-${q}`}>
                {q}
                <button
                  className="ws-text-link"
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
          <a href="#gp-summary" className="ws-text-link">
            Preview the conversation sheet <ArrowRight size={15} />
          </a>
        </section>
      )}
      {!example && (
        <section className="ws-card ws-observations">
          <label htmlFor="gp-observations">
            <span className="ws-kicker">FOR YOUR NEXT CONVERSATION</span>
            <h3>What have you noticed?</h3>
          </label>
          <p className="ws-muted">
            Optional notes for your GP sheet. Kept in this session and excluded from the care-file
            export.
          </p>
          <textarea
            id="gp-observations"
            rows={3}
            maxLength={3000}
            placeholder="Write a question or observation in your own words…"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          <a href="#gp-summary" className="ws-text-link">
            Preview your GP sheet <ArrowRight size={15} />
          </a>
        </section>
      )}
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
  const steps = [
    {
      title: 'Start with the page.',
      text: 'Paste text, import a PDF or scan a photo. Photo recognition runs locally; originals are not sent to cloud AI.',
      icon: ScanLine,
      label: 'On this device',
    },
    {
      title: 'Put personal details behind a boundary.',
      text: 'Local rules mask common identifiers. Review the preview yourself: no automatic scrubber can guarantee complete de-identification.',
      icon: ShieldCheck,
      label: 'Local masking',
    },
    {
      title: 'You decide where AI runs.',
      text: 'Strict local never falls back to the cloud. Balanced and Best quality require explicit approval of the masked text.',
      icon: Cpu,
      label: 'Your existing privacy controls',
    },
    {
      title: 'Keep every instruction accountable.',
      text: 'Firebase AI Logic extracts structured medicine fields. The app checks quoted evidence and leaves missing details for review.',
      icon: FileText,
      label: 'Source-linked extraction',
    },
    {
      title: 'A human makes the final review.',
      text: 'Compare every medicine with the original, then enter times confirmed by your care team. AI does not prescribe or screen interactions.',
      icon: Eye,
      label: 'Review required',
    },
    {
      title: 'Bring the right people closer.',
      text: 'An encrypted care file can carry reviewed entries, questions and check-ins. No automatic family access or live sharing is enabled.',
      icon: Users,
      label: 'Encrypted file handoff',
    },
  ];
  return (
    <section className="ws-page">
      <PageIntro
        kicker="HOW IT WORKS"
        title={
          <>
            Two places for AI.
            <br />
            One clear boundary.
          </>
        }
        action={
          <span className="ws-badge">
            <Cpu size={16} />
            Firebase AI Logic
          </span>
        }
      >
        A plain view of what stays on your device, what can leave with approval, and where your
        review matters most.
      </PageIntro>
      <div className="ws-columns">
        <div className="ws-stack">
          <section className="ws-card ws-flow">
            {steps.map((s, i) => (
              <article key={s.title}>
                <div className="ws-flow-line">
                  <span>{i + 1}</span>
                </div>
                <div className="ws-grow">
                  <div className="ws-row-top">
                    <h3>{s.title}</h3>
                    <s.icon size={21} />
                  </div>
                  <p>{s.text}</p>
                  <em className="ws-chip">{s.label}</em>
                </div>
              </article>
            ))}
          </section>
          <section className="ws-card">
            <span className="ws-kicker">THE TECHNOLOGY, HONESTLY</span>
            <h2>Built around a review.</h2>
            <div className="ws-stack-table">
              {[
                [
                  'Firebase AI Logic',
                  'Local and consented cloud inference through the official SDK.',
                ],
                ['App Check', 'App attestation for cloud AI; subject to project configuration.'],
                [
                  'Authentication & Firestore',
                  'Initialized foundations. Live caregiver accounts and Firestore sharing are not implemented.',
                ],
                [
                  'Local OCR',
                  'Tesseract recognizes images on your device. Review scan errors before extraction.',
                ],
                [
                  'Encrypted handoff',
                  'AES-GCM care files, protected by a passphrase. Originals are excluded.',
                ],
              ].map(([name, text]) => (
                <div key={name}>
                  <strong>{name}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="ws-stack">
          <section className="ws-card">
            <span className="ws-kicker">WHAT ACTUALLY RAN</span>
            <span className="ws-runtime-icon">
              {analysis?.inferenceSource === 'cloud' ? <Cloud size={33} /> : <Cpu size={33} />}
            </span>
            <h2>
              {analysis?.inferenceSource === 'cloud'
                ? 'Cloud AI'
                : analysis?.inferenceSource === 'on-device'
                  ? 'On-device AI'
                  : analysis?.inferenceSource === 'sample'
                    ? 'Hand-authored example'
                    : 'No extraction yet'}
            </h2>
            <p className="ws-muted">{runtimeStatus}</p>
            <div className="ws-two-facts">
              <div>
                <small>LOCAL REDACTIONS</small>
                <strong>{redactions}</strong>
              </div>
              <div>
                <small>EXTRACTED ENTRIES</small>
                <strong>{analysis?.medications.length ?? 0}</strong>
              </div>
            </div>
            <p className="ws-footnote">
              Chrome does not expose a reliable model version to this app. No Nano 4 claim is made
              without separate verification.
            </p>
            <a href="#privacy" className="ws-text-link">
              Review text & privacy <ArrowRight size={15} />
            </a>
          </section>
          <section className="ws-card ws-tinted">
            <LockKeyhole size={25} />
            <h3>The original stays close.</h3>
            <p>
              Original photos and source text stay in this session. Closing or refreshing the page
              clears them. Cloud mode only uses the exact text you explicitly approved.
            </p>
          </section>
          <section className="ws-card">
            <h3>Still needs a care team.</h3>
            <ul className="ws-limitations">
              <li>Drug interactions and clinical safety checks are not performed.</li>
              <li>Scan and extraction errors need human review.</li>
              <li>Complex tapers and unclear instructions need a pharmacist.</li>
              <li>Reminders work only while the schedule is open.</li>
            </ul>
            <a href="#documents" className="ws-text-link">
              Start with a document <ArrowRight size={15} />
            </a>
          </section>
        </aside>
      </div>
    </section>
  );
}

export function GpSummary() {
  const { display, example, observations } = useWorkspace();
  const entries = dueEntries(display),
    taken = entries.filter((e) => e.status === 'taken').length;
  const printable: CareSnapshot = display;
  return (
    <section className="ws-gp">
      <div className="ws-print-controls">
        <a href="#schedule" className="button secondary">
          <ChevronLeft size={16} />
          Back to schedule
        </a>
        <span>Review personal details before sharing</span>
        <button className="button dark" onClick={() => window.print()}>
          <Printer size={16} />
          Print or save PDF
        </button>
      </div>
      <article className="ws-gp-sheet">
        <header>
          <span className="ws-kicker">MEDBRIGE · CARE CONVERSATION SHEET</span>
          <h1>
            Notes for my
            <br />
            GP appointment.
          </h1>
          <p>Prepared {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
          <strong>
            {example
              ? 'FICTIONAL EXAMPLE · NOT A REAL MEDICINE LIST'
              : 'Personal notes · verify with your care team'}
          </strong>
        </header>
        <div className="ws-gp-stats">
          <div>
            <strong>{printable.medicines.length}</strong>
            <span>source entries</span>
          </div>
          <div>
            <strong>{entries.length}</strong>
            <span>reviewed times today</span>
          </div>
          <div>
            <strong>{taken}</strong>
            <span>recorded taken today</span>
          </div>
        </div>
        <h2>Medicines to review together</h2>
        <p>
          This includes unreviewed and paused source entries. It is not a current prescription or
          dosing recommendation.
        </p>
        <div className="ws-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Strength / dose</th>
                <th>Reviewed times</th>
                <th>Source status</th>
              </tr>
            </thead>
            <tbody>
              {printable.medicines.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                    <small>{m.confirmed ? 'User reviewed' : 'Needs review'}</small>
                  </td>
                  <td>
                    {m.strength || 'Not stated'}
                    <small>{m.dose || 'Not stated'}</small>
                  </td>
                  <td>{m.confirmed ? m.times.join(', ') || 'No clock times' : 'Not confirmed'}</td>
                  <td>
                    {m.status || 'Not stated'}
                    <small>{m.duration ? `Duration: ${m.duration}` : ''}</small>
                  </td>
                </tr>
              ))}
              {!printable.medicines.length && (
                <tr>
                  <td colSpan={4}>No medicine entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <h2>What I have noticed</h2>
        <p className="ws-gp-observation">
          {example
            ? 'Fictional example: I would like help understanding the written instructions.'
            : observations || 'No observations entered. Add your own notes in Care circle.'}
        </p>
        <h2>Questions I want to ask</h2>
        <ol>
          {printable.questions.length ? (
            printable.questions.map((q, i) => <li key={`${i}-${q}`}>{q}</li>)
          ) : (
            <li>Write your questions in Care circle before printing.</li>
          )}
        </ol>
        <h2>Notes from the appointment</h2>
        <div className="ws-ruled-paper" />
        <footer>
          Prepared locally with MedBrige. Not an interaction check, prescription, or emergency
          service. Review all content before sharing.
        </footer>
      </article>
    </section>
  );
}
