import { ChevronLeft, Printer } from 'lucide-react';
import { useWorkspace } from '../state/Workspace';
import { dueEntries, type CareSnapshot } from '../services/carePlan';
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
