import { useEffect, useRef } from 'react';
import { FilePlus2 } from 'lucide-react';
interface Props {
  readonly open: boolean;
  readonly intent?: 'new' | 'sample';
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}
export function ConfirmNewReview({ open, intent = 'new', onCancel, onConfirm }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      onCancel={onCancel}
      aria-labelledby="new-review-title"
      aria-describedby="new-review-copy"
    >
      <span className="dialog-icon">
        <FilePlus2 size={25} aria-hidden="true" />
      </span>
      <h2 id="new-review-title">
        {intent === 'sample' ? 'Open the fictional example?' : 'Start a fresh review?'}
      </h2>
      <p id="new-review-copy">
        {intent === 'sample'
          ? 'This will replace your current document with fictional teaching text. Your care plan and current results will be cleared.'
          : 'The current document, care plan, questions and check-ins will be cleared from this session. Keep your original document before continuing.'}
      </p>
      <div className="dialog-actions">
        <button className="button secondary" onClick={onCancel} autoFocus>
          Keep this review
        </button>
        <button className="button primary" onClick={onConfirm}>
          {intent === 'sample' ? 'Open example' : 'Start new review'}
        </button>
      </div>
    </dialog>
  );
}
