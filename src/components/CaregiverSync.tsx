import { useRef, useState } from 'react';
import { Users, LockKeyhole, Download, Upload, ShieldCheck, Eye, Trash2 } from 'lucide-react';
import { useCarePlan } from '../state/CarePlan';
import {
  decryptSnapshot,
  encryptSnapshot,
  downloadLocal,
  handoffText,
  type CareSnapshot,
} from '../services/carePlan';
const VAULT = 'medbrige-encrypted-care-v1';
export function CaregiverSync({ onRestore }: { onRestore: () => void }) {
  const { snapshot, setSnapshot } = useCarePlan();
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [pending, setPending] = useState<CareSnapshot | null>(null),
    [question, setQuestion] = useState(''),
    [showPreview, setShowPreview] = useState(false),
    [hasVault, setHasVault] = useState(() => {
      try {
        return !!localStorage.getItem(VAULT);
      } catch {
        return false;
      }
    });
  const fileInput = useRef<HTMLInputElement>(null);
  const reviewed = snapshot.medicines.filter((m) => m.confirmed);
  async function protect(mode: 'download' | 'save') {
    setError('');
    setMessage('');
    if (password !== confirmation) {
      setError('The passphrases do not match.');
      return;
    }
    setBusy(true);
    try {
      const payload =
        mode === 'download'
          ? {
              ...snapshot,
              medicines: reviewed,
              checkins: Object.fromEntries(
                Object.entries(snapshot.checkins).filter(([key]) =>
                  reviewed.some((m) => key.includes(`:${m.id}:`)),
                ),
              ),
            }
          : snapshot;
      const encoded = await encryptSnapshot(payload, password);
      if (mode === 'save') {
        localStorage.setItem(VAULT, encoded);
        setHasVault(true);
        setMessage(
          'Encrypted care copy saved on this device. It does not include photos or your original document.',
        );
      } else {
        downloadLocal('medbrige-care.medbrige', encoded, 'application/json');
        setMessage(
          'Encrypted file downloaded. Give the passphrase to your caregiver through a separate channel.',
        );
      }
      setPassword('');
      setConfirmation('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this copy.');
    } finally {
      setBusy(false);
    }
  }
  async function unlock(text: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setPending(await decryptSnapshot(text, password));
      setPassword('');
      setConfirmation('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not unlock.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="card handoff-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">A PRIVATE HANDOFF</span>
            <h2>Care travels. Your photos don’t.</h2>
          </div>
          <Users size={26} />
        </div>
        <p className="supporting">
          Create an encrypted care file for someone you trust. They open it here with your
          passphrase. No account, email upload or cloud document storage is involved.
        </p>
        <div className="handoff-summary">
          <span>
            <ShieldCheck size={18} />
            {reviewed.length} reviewed medicine{reviewed.length === 1 ? '' : 's'}
          </span>
          <span>{snapshot.questions.length} care-team questions</span>
        </div>
        <div className="vault-form">
          <label htmlFor="vault-password">
            Passphrase <small>At least 10 characters. Keep it somewhere safe.</small>
          </label>
          <input
            id="vault-password"
            type="password"
            autoComplete="new-password"
            value={password}
            maxLength={200}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create or enter a passphrase"
          />
          <label htmlFor="vault-confirmation">Confirm for saving or sharing</label>
          <input
            id="vault-confirmation"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            maxLength={200}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Repeat for save / download"
          />
          <div className="vault-actions">
            <button
              disabled={busy || !reviewed.length}
              className="button dark"
              onClick={() => void protect('download')}
            >
              <Download size={16} />
              Download encrypted handoff
            </button>
            <button
              disabled={busy || !snapshot.medicines.length}
              className="button secondary"
              onClick={() => void protect('save')}
            >
              <LockKeyhole size={16} />
              Save encrypted copy on device
            </button>
          </div>
        </div>
        <p className="privacy-note">
          Encryption protects the saved file, not an unlocked screen. Passphrases cannot be
          recovered. The app does not send messages or invite anyone automatically.
        </p>
        <div className="vault-open">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} />
            Open encrypted file
          </button>
          {hasVault && (
            <>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => {
                  const text = localStorage.getItem(VAULT);
                  if (text) void unlock(text);
                }}
              >
                Unlock saved copy
              </button>
              <button className="text-button" disabled={busy} onClick={() => setDeleting(true)}>
                <Trash2 size={14} />
                Delete saved copy
              </button>
            </>
          )}
          <input
            hidden
            type="file"
            accept=".medbrige,application/json"
            ref={fileInput}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              if (file.size > 3000000) {
                setError('Choose a care file smaller than 3 MB.');
                return;
              }
              await unlock(await file.text());
            }}
          />
        </div>
        {deleting && (
          <div className="import-review" role="alert">
            <h3>Delete the encrypted device copy?</h3>
            <p>
              This cannot be undone. Download a backup first if you need to keep it. The open
              session will stay.
            </p>
            <button className="button secondary" onClick={() => setDeleting(false)}>
              Keep saved copy
            </button>
            <button
              className="text-button"
              onClick={() => {
                localStorage.removeItem(VAULT);
                setHasVault(false);
                setDeleting(false);
                setMessage('Encrypted device copy deleted.');
              }}
            >
              Delete saved copy permanently
            </button>
          </div>
        )}
        {busy && <p role="status">Protecting your care notes on this device…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success-note" role="status">
            {message}
          </p>
        )}
        {pending && (
          <div className="import-review">
            <h3>Review before restoring</h3>
            <p>
              {pending.medicines.length} medicine entries and {pending.questions.length} questions.
              This replaces the current care plan, not your source document. Imported medicines must
              be reviewed again.
            </p>
            <button
              className="button dark"
              onClick={() => {
                onRestore();
                setSnapshot({
                  ...pending,
                  medicines: pending.medicines.map((m) => ({ ...m, confirmed: false })),
                  checkins: {},
                });
                setPending(null);
                setMessage('Care copy restored. Review each medicine before using its times.');
              }}
            >
              Restore and review entries
            </button>
            <button className="text-button" onClick={() => setPending(null)}>
              Keep current plan
            </button>
          </div>
        )}
      </section>
      <section className="card questions-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">BETTER CONVERSATIONS</span>
            <h2>Questions for your care team</h2>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!question.trim()) return;
            setSnapshot((s) => ({
              ...s,
              questions: [...s.questions, question.trim()].slice(0, 100),
            }));
            setQuestion('');
          }}
        >
          <label htmlFor="care-question">What would you like to ask?</label>
          <textarea
            id="care-question"
            rows={3}
            value={question}
            maxLength={2000}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="For example: the packet and bottle label say different things. Which should I follow?"
          />
          <button
            className="button dark"
            disabled={!question.trim() || snapshot.questions.length >= 100}
          >
            Add question
          </button>
        </form>
        <ul>
          {snapshot.questions.map((q, index) => (
            <li key={index}>
              <span>{q}</span>
              <button
                aria-label={`Remove question ${index + 1}`}
                onClick={() =>
                  setSnapshot((s) => ({
                    ...s,
                    questions: s.questions.filter((_, i) => i !== index),
                  }))
                }
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="vault-actions">
          <button
            className="button secondary"
            disabled={!reviewed.length && !snapshot.questions.length}
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={16} />
            {showPreview ? 'Hide' : 'Preview'} care notes
          </button>
          <button
            className="button secondary"
            disabled={!reviewed.length && !snapshot.questions.length}
            onClick={() => downloadLocal('medbrige-care-notes.txt', handoffText(snapshot))}
          >
            <Download size={16} />
            Download plain text
          </button>
        </div>
        {showPreview && <pre className="care-text-preview">{handoffText(snapshot)}</pre>}
      </section>
    </>
  );
}
