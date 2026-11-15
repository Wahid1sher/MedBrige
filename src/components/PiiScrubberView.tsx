import { ShieldCheck, ScanLine, LockKeyhole, Check, Info, Cloud } from 'lucide-react';
import type { ScrubbedDocument, PiiCategory } from '../services/piiScrubber';
interface Props {
  readonly document: ScrubbedDocument;
  readonly reviewed: boolean;
  readonly onReviewed: (value: boolean) => void;
}
export function PiiScrubberView({ document, reviewed, onReviewed }: Props) {
  const categories = new Set(document.redactions.flatMap((r) => r.categories));
  return (
    <section className="card privacy-panel">
      <div className="card-heading">
        <div>
          <span className="section-kicker">YOUR PRIVATE PREVIEW</span>
          <h2>Decide what leaves.</h2>
        </div>
        <span className="icon-tile mint">
          <ShieldCheck size={21} aria-hidden="true" />
        </span>
      </div>
      <p className="supporting">
        Common identifiers are masked here, before AI receives your document text.
      </p>
      <div className="scrub-summary" role="status">
        <div className="scrub-count">{String(document.redactions.length).padStart(2, '0')}</div>
        <div>
          <strong>
            {document.inputCharacters ? 'Identifiers masked locally' : 'Ready when you are'}
          </strong>
          <span>
            {document.inputCharacters
              ? 'Review every line before sharing.'
              : 'Add a document to see its private preview.'}
          </span>
        </div>
        <ScanLine size={23} aria-hidden="true" />
      </div>
      <div className="redaction-tags">
        {(['patient-name', 'mrn', 'date-of-birth', 'phone', 'ssn'] satisfies PiiCategory[]).map(
          (category) => (
            <span key={category} className={categories.has(category) ? 'detected' : ''}>
              {categories.has(category) && <Check size={11} aria-hidden="true" />}
              {category === 'patient-name'
                ? 'Names'
                : category === 'date-of-birth'
                  ? 'Birth dates'
                  : category.toUpperCase()}
            </span>
          ),
        )}
      </div>
      <div className="textarea-label">
        <label htmlFor="redacted-document">Text available to AI</label>
        <span>
          <LockKeyhole size={12} aria-hidden="true" />
          LOCAL PREVIEW
        </span>
      </div>
      <textarea
        id="redacted-document"
        className="redacted-preview"
        readOnly
        value={document.text}
        rows={14}
        placeholder="Your locally redacted text will appear here…"
        aria-describedby="redaction-limitations"
      />
      <p id="redaction-limitations" className="privacy-note">
        <Info size={15} aria-hidden="true" />
        <span>
          Scrubbing can miss identifiers. Check every line. Anonymity and HIPAA compliance are not
          guaranteed.
        </span>
      </p>
      {document.cloudBlockReasons.map((reason) => (
        <p className="error" key={reason}>
          {reason}
        </p>
      ))}
      <label className="consent">
        <input
          type="checkbox"
          checked={reviewed}
          disabled={!document.text.trim() || !!document.cloudBlockReasons.length}
          onChange={(e) => onReviewed(e.target.checked)}
        />
        <span>
          <strong>Allow this reviewed text in the cloud</strong>
          <span>
            Only if local AI is unavailable. Changing the document clears this permission.
          </span>
        </span>
        <Cloud size={18} aria-hidden="true" />
      </label>
    </section>
  );
}
