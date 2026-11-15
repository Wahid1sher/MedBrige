import { useEffect, useRef, useState } from 'react';
import { checkLocalAi } from '../services/hybridAi';

export function LocalAiCheck({
  disabled,
  onBusy,
}: {
  disabled: boolean;
  onBusy: (value: boolean) => void;
}) {
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(
    () => () => {
      pending.current?.abort();
      onBusy(false);
    },
    [onBusy],
  );
  async function check() {
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    onBusy(true);
    let stage = 'Checking model setup';
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 45000);
    try {
      await checkLocalAi(controller.signal, (next) => {
        stage = next;
        setMessage(next);
      });
      setMessage(
        'Local AI replied through Firebase AI Logic. This checks local execution, not the model version. You can now try extraction.',
      );
    } catch (error) {
      setMessage(
        timedOut
          ? `${stage} timed out after 45 seconds. The test sent no document text. Keep Chrome in the foreground, close other AI tabs, and restart Chrome before trying again.`
          : controller.signal.aborted
            ? 'Local AI check cancelled.'
            : `Local AI check failed: ${error instanceof Error ? error.message : 'No reply'}. No document text was used.`,
      );
    } finally {
      clearTimeout(timeout);
      controller.abort();
      pending.current = null;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <section className="setup-note" aria-label="Local AI check">
      <div>
        <strong>Having trouble with local AI?</strong>
        <p>
          Test a short reply first. This uses no document text and cannot fall back to the cloud.
        </p>
        <button
          className="button secondary"
          disabled={disabled || busy}
          onClick={() => void check()}
        >
          {busy ? 'Checking local AI…' : 'Check local AI'}
        </button>
        {busy && (
          <button className="button secondary" onClick={() => pending.current?.abort()}>
            Cancel check
          </button>
        )}
        {message && <p role="status">{message}</p>}
      </div>
    </section>
  );
}
