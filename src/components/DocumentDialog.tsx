import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, FileText, LockKeyhole, UploadCloud, X } from 'lucide-react';
import { DischargeUploader } from './DischargeUploader';
import { scrubPii } from '../services/piiScrubber';
import type { MedicationAnalysis } from '../types/medication';
interface Props {
  open: boolean;
  showResult: boolean;
  raw: string;
  analysis: MedicationAnalysis | null;
  onClose: () => void;
  onChange: (text: string) => void;
  onExample: () => void;
  onContinue: () => void;
  onPlan: () => void;
  onPendingChange: (pending: boolean) => void;
}
export function DocumentDialog({
  open,
  showResult,
  raw,
  analysis,
  onClose,
  onChange,
  onExample,
  onContinue,
  onPlan,
  onPendingChange,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<'choose' | 'source' | 'ready' | 'result' | 'done'>('choose');
  const scrubbed = scrubPii(raw);
  useEffect(() => {
    if (open)
      dialog.current
        ?.querySelector<HTMLElement>('#document-dialog-title')
        ?.focus({ preventScroll: true });
  }, [stage, open]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      setStage(showResult && analysis ? 'result' : 'choose');
      node.showModal();
    } else if (!open && node.open) node.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={`r-dialog r-document-dialog stage-${stage}`}
      aria-labelledby="document-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <>
          <button className="r-dialog-close" aria-label="Close document dialog" onClick={onClose}>
            <X size={17} />
          </button>
          <div className="r-kicker">BEGIN WITH THE ORIGINAL</div>
          <h2 id="document-dialog-title" tabIndex={-1}>
            Add a document
          </h2>
          <p>
            Read the text on this device, mask personal details, and build the plan from what is
            actually written.
          </p>
          {(stage === 'choose' || stage === 'source') && (
            <>
              <div className={`r-modal-intake ${stage === 'choose' ? 'is-chooser' : ''}`}>
                <DischargeUploader
                  value={raw}
                  onChange={onChange}
                  onSample={() => {
                    onExample();
                    setStage('ready');
                  }}
                  onPendingChange={onPendingChange}
                />
              </div>
              <div className="r-dialog-actions">
                {raw.trim() ? (
                  <button className="button dark" onClick={() => setStage('ready')}>
                    Review this document <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    className="button dark"
                    onClick={() => {
                      onExample();
                      setStage('ready');
                    }}
                  >
                    Analyse the example <ArrowRight size={14} />
                  </button>
                )}
                {stage === 'choose' && (
                  <button className="button secondary" onClick={() => setStage('source')}>
                    <FileText size={14} />
                    Paste text instead
                  </button>
                )}
              </div>
            </>
          )}
          {stage === 'ready' && (
            <>
              <div className="r-modal-file">
                <span className="r-icon">
                  <FileText size={17} />
                </span>
                <div>
                  <strong>Document text is ready</strong>
                  <small>
                    {raw.trim() ? raw.trim().split(/\s+/).length : 0} words · read locally
                  </small>
                </div>
                <Check size={16} />
              </div>
              <div className="r-kicker">YOUR PRIVATE PREVIEW</div>
              <ul className="r-checklist">
                <li>
                  <Check size={13} />
                  {scrubbed.redactions.length} common identifiers masked locally
                </li>
                <li>
                  <Check size={13} />
                  Original photos stay on this device
                </li>
                <li>
                  <Check size={13} />
                  No cloud processing approved here
                </li>
                <li>
                  <Check size={13} />
                  Medicine extraction still needs a separate action
                </li>
              </ul>
              <details className="r-modal-text">
                <summary>See the text that will be reviewed</summary>
                <pre>{scrubbed.text}</pre>
              </details>
              <div className="r-dialog-actions">
                <button className="button dark" disabled={!raw.trim()} onClick={onContinue}>
                  Review text & privacy <ArrowRight size={14} />
                </button>
                <button className="button secondary" onClick={() => setStage('source')}>
                  Try another file
                </button>
              </div>
            </>
          )}
          {stage === 'result' && (
            <>
              <div className="r-modal-file">
                <span className="r-icon">
                  <Check size={17} />
                </span>
                <div>
                  <strong>Source-linked draft is ready</strong>
                  <small>
                    {analysis?.medications.length ?? 0} medicine entries ·{' '}
                    {analysis?.inferenceSource === 'sample'
                      ? 'hand-authored example'
                      : analysis?.inferenceSource === 'cloud'
                        ? 'approved cloud AI'
                        : 'on-device AI'}
                  </small>
                </div>
              </div>
              <div className="r-kicker">WHAT THE DRAFT SAYS</div>
              <ul className="r-checklist">
                <li>
                  <Check size={13} />
                  Fields were checked against their quoted source
                </li>
                <li>
                  <Check size={13} />
                  Missing details still need your review
                </li>
                <li>
                  <Check size={13} />
                  No clock times have been assigned automatically
                </li>
              </ul>
              <div className="r-result-medicines">
                <div className="r-kicker">MEDICINES FOUND</div>
                {analysis?.medications.map((m) => (
                  <div key={m.id}>
                    <span>
                      {m.name.value} <small>{m.strength?.value}</small>
                    </span>
                    <small>{m.frequency?.value || 'Review required'}</small>
                  </div>
                ))}
              </div>
              <div className="r-dialog-actions">
                <button className="button dark" onClick={() => setStage('done')}>
                  <Check size={14} />
                  Continue with this draft
                </button>
                <button className="button secondary" onClick={() => setStage('source')}>
                  Try another file
                </button>
              </div>
            </>
          )}
          {stage === 'done' && (
            <>
              <div className="r-blue-note">
                <Check size={17} />
                <div>
                  <strong>Ready for your review</strong>
                  <p>
                    {analysis?.medications.length ?? 0} draft entries are waiting in Medicines.
                    Confirm the original instructions and care-team times before scheduling.
                  </p>
                </div>
              </div>
              <div className="r-dialog-actions">
                <button className="button dark" onClick={onPlan}>
                  Review my medicines <ArrowRight size={14} />
                </button>
                <button className="button secondary" onClick={onClose}>
                  Back to my workspace
                </button>
              </div>
            </>
          )}
          <small className="r-dialog-privacy">
            <LockKeyhole size={12} />
            Your document stays in this session.
          </small>
        </>
      )}
    </dialog>
  );
}
