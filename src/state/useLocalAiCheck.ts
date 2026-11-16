import { useEffect, useRef, useState } from 'react';
import { checkLocalAi } from '../services/hybridAi';

export interface LocalAiCheckState {
  busy: boolean;
  message: string;
  outcome: 'idle' | 'running' | 'ready' | 'error' | 'cancelled';
  elapsed: number;
  start: () => Promise<void>;
  cancel: () => void;
}

/** All screens share one probe; navigating never loses the cancel button. */
export function useLocalAiCheck(): LocalAiCheckState {
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState<LocalAiCheckState['outcome']>('idle');
  const [elapsed, setElapsed] = useState(0);
  useEffect(
    () => () => {
      pending.current?.abort();
      pending.current = null;
    },
    [],
  );
  useEffect(() => {
    if (!busy) return;
    const began = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - began) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  async function start() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setElapsed(0);
    setBusy(true);
    setOutcome('running');
    setMessage('Checking model setup');
    try {
      await checkLocalAi(controller.signal, (next) => {
        if (pending.current === controller) setMessage(next);
      });
      if (pending.current !== controller) return;
      setOutcome('ready');
      setMessage('Local AI replied through Firebase AI Logic. Model version is not verified.');
    } catch (error) {
      if (pending.current !== controller) return;
      setOutcome(controller.signal.aborted ? 'cancelled' : 'error');
      setMessage(
        controller.signal.aborted
          ? 'Check cancelled. No document text was used.'
          : error instanceof Error
            ? error.message
            : 'Local AI did not reply. No document text was used.',
      );
    } finally {
      controller.abort();
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  return { busy, message, outcome, elapsed, start, cancel: () => pending.current?.abort() };
}
