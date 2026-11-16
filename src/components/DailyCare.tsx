import { useEffect, useState } from 'react';
import { Check, Clock3, ArrowRight, Sun, FileText, Download } from 'lucide-react';
import { useCarePlan } from '../state/CarePlan';
import { dueEntries, handoffText, downloadLocal, localDay } from '../services/carePlan';
export function DailyCare() {
  const { snapshot, setSnapshot } = useCarePlan();
  const [now, setNow] = useState(new Date()),
    [filter, setFilter] = useState<'all' | 'pending' | 'taken'>('all');
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);
  const entries = dueEntries(snapshot, localDay(now)),
    completed = entries.filter((e) => e.status === 'taken').length;
  const visible = entries.filter(
    (e) =>
      filter === 'all' ||
      (filter === 'taken' && e.status === 'taken') ||
      (filter === 'pending' && e.status !== 'taken'),
  );
  const current = now.toTimeString().slice(0, 5),
    next = entries.find((e) => e.status === 'pending' && e.time >= current);
  return (
    <section className="card real-day" id="day-plan">
      <div className="card-heading" data-tour="daily-heading">
        <div>
          <span className="section-kicker">YOUR REVIEWED PLAN</span>
          <h2>
            {entries.length
              ? `${completed} of ${entries.length} check-ins today`
              : 'Your day starts with a review.'}
          </h2>
        </div>
        <Sun size={24} />
      </div>
      <p className="supporting">
        {entries.length
          ? 'Times are entered by you after checking with your care team. This is a personal log, not dosing advice.'
          : 'Add instructions, review each medicine, and enter the times your care team has confirmed. Nothing is scheduled automatically.'}
      </p>
      {!entries.length ? (
        <a className="button dark" href="#medicines">
          Set up your medicine review
          <ArrowRight size={17} />
        </a>
      ) : (
        <>
          <div className="daily-summary">
            <span>
              <Clock3 size={17} />
              {next
                ? `Next in your plan · ${next.time} · ${next.medicine.name}`
                : 'No later pending times in this plan.'}
            </span>
            <span>Session only · save an encrypted copy to keep it</span>
          </div>
          <div className="daily-filters" role="group" aria-label="Daily check-in filter">
            {(['all', 'pending', 'taken'] as const).map((value) => (
              <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {value === 'all' ? 'All' : value === 'pending' ? 'Not marked taken' : 'Taken'}
              </button>
            ))}
          </div>
          <div className="daily-entries">
            {visible.map((e) => (
              <article key={e.key} className={e.status === 'taken' ? 'logged' : ''}>
                <time>{e.time}</time>
                <div>
                  <h3>
                    {e.medicine.name} <span>{e.medicine.strength}</span>
                  </h3>
                  <p>
                    {e.medicine.dose || 'Dose not stated'} ·{' '}
                    {e.status === 'taken'
                      ? 'Marked taken'
                      : e.status === 'later'
                        ? 'Marked for later'
                        : 'Not logged'}
                  </p>
                  <p>
                    Duration: {e.medicine.duration || 'not stated'} · Source status:{' '}
                    {e.medicine.status || 'not stated'}
                  </p>
                  <details>
                    <summary>Original instructions</summary>
                    <blockquote>{e.medicine.quote}</blockquote>
                  </details>
                </div>
                <div className="daily-entry-actions">
                  <button
                    aria-label={`${e.status === 'taken' ? 'Undo taken' : 'Mark taken'} for ${e.medicine.name} at ${e.time}`}
                    className="button dark"
                    onClick={() =>
                      setSnapshot((s) => {
                        const checkins = { ...s.checkins };
                        if (e.status === 'taken') delete checkins[e.key];
                        else checkins[e.key] = 'taken';
                        return { ...s, checkins };
                      })
                    }
                  >
                    {e.status === 'taken' ? (
                      <>
                        <Check size={17} />
                        Taken · Undo
                      </>
                    ) : (
                      'I took it'
                    )}
                  </button>
                  {e.status !== 'taken' && (
                    <button
                      className="button secondary"
                      onClick={() =>
                        setSnapshot((s) => ({
                          ...s,
                          checkins: { ...s.checkins, [e.key]: 'later' },
                        }))
                      }
                    >
                      Later
                    </button>
                  )}
                </div>
              </article>
            ))}
            {!visible.length && <p>No check-ins in this view.</p>}
          </div>
          <p className="input-note">
            <FileText size={14} />
            For missed doses or uncertainty, check the original instructions and ask your
            pharmacist.
          </p>
          <button
            className="text-button"
            onClick={() => downloadLocal('medbrige-care-notes.txt', handoffText(snapshot))}
          >
            <Download size={15} />
            Download care notes
          </button>
        </>
      )}
    </section>
  );
}
