import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  LockKeyhole,
  LoaderCircle,
  Cloud,
  Info,
  FileText,
  ShieldCheck,
  Check,
  ChevronRight,
} from 'lucide-react';
import { WorkspaceLayout, type Page } from './components/WorkspaceLayout';
import { Overview } from './components/Overview';
import { ConfirmNewReview } from './components/ConfirmNewReview';
import { DischargeUploader } from './components/DischargeUploader';
import { PiiScrubberView } from './components/PiiScrubberView';
import { draftToPlan, MedicationSchedule } from './components/MedicationSchedule';
import { CaregiverSync } from './components/CaregiverSync';
import { LocalAiCheck } from './components/LocalAiCheck';
import { AiPrivacyPanel } from './components/AiPrivacyPanel';
import { useLocalAiCheck } from './state/useLocalAiCheck';
import { AppTour } from './components/AppTour';
import { rememberTour, tourHasBeenSeen, type TourRoute } from './services/appTour';
import {
  scrubPii,
  approveCloudProcessing,
  revokeCloudProcessing,
  type CloudPermit,
} from './services/piiScrubber';
import {
  analyzeDischarge,
  getConnectivity,
  subscribeConnectivity,
  type AnalysisPolicy,
  type AiProgress,
} from './services/hybridAi';
import { firebaseConfigured, isExtension } from './services/firebase';
import { useCarePlan } from './state/CarePlan';
import { emptySnapshot } from './services/carePlan';
import { parseMedicationResponse } from './services/hybridAi';
import type { MedicationAnalysis } from './types/medication';
const sample = `SYNTHETIC DOCUMENT — FICTIONAL INFORMATION ONLY
Patient name: Alex Example
DOB: 01/01/1950
MRN: DEMO-123456
Phone: (916) 555-0142

Medication instructions at discharge
Examplemed 0.5 mg tablet. Take 1 tablet by mouth once daily. Status: Continue.
Samplemed 10 mg tablet. Take 1 tablet by mouth every 12 hours for 5 days.
No clock times are provided. Ask the care team to confirm the current list.
This is fictional teaching text, not a prescription.`;
const route = (): Page => {
  const hash = location.hash.slice(1);
  return hash === 'privacy'
    ? 'documents'
    : (['documents', 'medicines', 'caregivers'] as string[]).includes(hash)
      ? (hash as Page)
      : 'overview';
};
export default function App() {
  const { snapshot, setSnapshot } = useCarePlan();
  const [documentEpoch, setDocumentEpoch] = useState(0);
  const [raw, setRaw] = useState(''),
    [permit, setPermit] = useState<CloudPermit | null>(null),
    [policy, setPolicy] = useState<AnalysisPolicy>('local-only');
  const [analysis, setAnalysis] = useState<MedicationAnalysis | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [progress, setProgress] = useState<AiProgress | null>(null);
  const localCheck = useLocalAiCheck();
  const [tourOpen, setTourOpen] = useState(false);
  const [intakePending, setIntakePending] = useState(false);
  const tourOrigin = useRef<{ hash: string; scroll: number; focus: HTMLElement | null } | null>(
    null,
  );
  const autoTourOffered = useRef(false);
  const [requestedPolicy, setRequestedPolicy] = useState<AnalysisPolicy | null>(null);
  const [page, setPage] = useState<Page>(route),
    [pane, setPane] = useState<'source' | 'privacy'>(() =>
      location.hash === '#privacy' ? 'privacy' : 'source',
    );
  const [connectivity, setConnectivity] = useState(getConnectivity),
    [dialogAction, setDialogAction] = useState<'new' | 'sample' | null>(null);
  const scrubbed = useMemo(() => scrubPii(raw), [raw]);
  const pending = useRef<AbortController | null>(null),
    permitRef = useRef<CloudPermit | null>(null);
  useEffect(() => subscribeConnectivity(setConnectivity), []);
  useEffect(() => {
    const update = () => {
      setPage(route());
      if (location.hash === '#privacy') setPane('privacy');
      else if (location.hash === '#documents') setPane('source');
      if (location.hash === '#day-plan')
        setTimeout(
          () => document.getElementById('day-plan')?.scrollIntoView({ block: 'start' }),
          0,
        );
      else window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(
    () => () => {
      pending.current?.abort();
      if (permitRef.current) revokeCloudProcessing(permitRef.current);
    },
    [],
  );
  function navigate(to: Page | 'privacy') {
    setPage(to === 'privacy' ? 'documents' : to);
    if (to === 'privacy') setPane('privacy');
    else if (to === 'documents') setPane('source');
    location.hash = to;
    window.scrollTo({ top: 0 });
  }
  const navigateTour = useCallback((to: TourRoute) => {
    history.replaceState(null, '', `#${to}`);
    setPage(to === 'privacy' ? 'documents' : to);
    setPane(to === 'privacy' ? 'privacy' : 'source');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const tourDisabled = busy || localCheck.busy || intakePending || dialogAction !== null;
  function startTour() {
    if (tourDisabled || tourOpen || document.querySelector('[aria-modal="true"], dialog[open]'))
      return;
    tourOrigin.current = {
      hash: location.hash || '#overview',
      scroll: window.scrollY,
      focus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    };
    setTourOpen(true);
  }
  function closeTour(completed: boolean) {
    rememberTour(completed);
    setTourOpen(false);
    const origin = tourOrigin.current;
    tourOrigin.current = null;
    if (origin) {
      history.replaceState(null, '', origin.hash);
      setPage(route());
      setPane(origin.hash === '#privacy' ? 'privacy' : 'source');
      requestAnimationFrame(() => {
        window.scrollTo({ top: origin.scroll, behavior: 'instant' });
        if (origin.focus?.isConnected && origin.focus !== document.body)
          origin.focus.focus({ preventScroll: true });
        else document.querySelector<HTMLElement>('.header-tour')?.focus({ preventScroll: true });
      });
    }
  }
  useEffect(() => {
    if (
      autoTourOffered.current ||
      tourOpen ||
      tourDisabled ||
      page !== 'overview' ||
      raw.trim() ||
      snapshot.medicines.length ||
      snapshot.questions.length ||
      tourHasBeenSeen()
    )
      return;
    const timer = setTimeout(() => {
      autoTourOffered.current = true;
      startTour();
    }, 900);
    return () => clearTimeout(timer);
  }, [tourOpen, tourDisabled, page, raw, snapshot.medicines.length, snapshot.questions.length]);
  function changeText(text: string) {
    if (text.length > 200000) {
      setError(
        'This document exceeds 200,000 characters. Choose a smaller section. The original text was not replaced.',
      );
      return;
    }
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setProgress(null);
    if (permitRef.current) revokeCloudProcessing(permitRef.current);
    permitRef.current = null;
    setPermit(null);
    setPolicy('local-only');
    setRequestedPolicy(null);
    setAnalysis(null);
    setError('');
    setRaw(text);
    setSnapshot((s) => ({ ...emptySnapshot(), questions: s.questions }));
  }
  function requestSample() {
    if (raw.trim() || snapshot.medicines.length || snapshot.questions.length) {
      setDialogAction('sample');
      return;
    }
    changeText(sample);
    navigate('documents');
  }
  function requestNew() {
    if (raw.trim() || snapshot.medicines.length || snapshot.questions.length) {
      setDialogAction('new');
      return;
    }
    setDocumentEpoch((e) => e + 1);
    changeText('');
    setSnapshot(emptySnapshot());
    navigate('documents');
  }
  function review(checked: boolean) {
    if (permitRef.current) revokeCloudProcessing(permitRef.current);
    try {
      const next = checked
        ? approveCloudProcessing(
            scrubbed,
            true,
            requestedPolicy === 'cloud-first-with-consent' || policy === 'cloud-first-with-consent'
              ? 'cloud-first'
              : 'fallback',
          )
        : null;
      permitRef.current = next;
      setPermit(next);
      if (!next) setPolicy('local-only');
      else if (requestedPolicy) {
        setPolicy(requestedPolicy);
        setRequestedPolicy(null);
      }
      setError('');
    } catch {
      permitRef.current = null;
      setPermit(null);
      setPolicy('local-only');
      setError('Review the text and resolve its privacy warning before allowing cloud processing.');
    }
  }
  function choosePrivacy(next: AnalysisPolicy) {
    if (busy || localCheck.busy) return;
    if (next === 'local-only') {
      review(false);
      setRequestedPolicy(null);
      return;
    }
    if (isExtension()) {
      setError('Cloud modes are available only in the web companion.');
      navigate('privacy');
      return;
    }
    if (!permit || (next === 'cloud-first-with-consent' && permit.scope !== 'cloud-first')) {
      if (permit) review(false);
      setRequestedPolicy(next);
      navigate('privacy');
      setError(
        'To use this mode, review the masked text and explicitly allow cloud processing. Strict local remains on until you approve.',
      );
      return;
    }
    setPolicy(next);
    setRequestedPolicy(null);
    setError('');
  }
  async function analyze() {
    if (busy || localCheck.busy) return;
    const controller = new AbortController();
    let timedOut = false;
    let lastStage: AiProgress['stage'] = 'preparing-local';
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 180000);
    pending.current?.abort();
    pending.current = controller;
    setBusy(true);
    setError('');
    setAnalysis(null);
    try {
      const result = await analyzeDischarge({
        document: scrubbed,
        policy,
        ...(permit ? { cloudPermit: permit } : {}),
        signal: controller.signal,
        onProgress: (event) => {
          lastStage = event.stage;
          setProgress(event);
        },
      });
      if (!controller.signal.aborted) {
        setAnalysis(result);
        setSnapshot((s) => ({
          ...s,
          medicines: result.medications.map(draftToPlan),
          checkins: {},
        }));
        navigate('medicines');
      }
    } catch (e) {
      if (pending.current === controller)
        setError(
          controller.signal.aborted
            ? timedOut
              ? `${lastStage === 'preparing-local' ? 'Local model setup' : lastStage === 'extracting' ? 'AI extraction' : 'Source checking'} timed out after 3 minutes. No partial result was saved. Use “Check local AI” below to test the model separately.`
              : 'Extraction cancelled. No partial result was saved.'
            : e instanceof Error
              ? e.message
              : 'Analysis did not finish.',
        );
    } finally {
      clearTimeout(timeout);
      controller.abort();
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
        setProgress(null);
      }
    }
  }
  function sampleReview() {
    const quote1 = 'Examplemed 0.5 mg tablet. Take 1 tablet by mouth once daily. Status: Continue.';
    const quote2 = 'Samplemed 10 mg tablet. Take 1 tablet by mouth every 12 hours for 5 days.';
    const f = (value: string, quote: string) => ({ value, quote });
    const meds = parseMedicationResponse(
      JSON.stringify({
        medications: [
          {
            name: f('Examplemed', quote1),
            strength: f('0.5 mg', quote1),
            dose: f('1 tablet', quote1),
            frequency: f('once daily', quote1),
            status: f('Continue', quote1),
          },
          {
            name: f('Samplemed', quote2),
            strength: f('10 mg', quote2),
            dose: f('1 tablet', quote2),
            frequency: f('every 12 hours', quote2),
            duration: f('5 days', quote2),
          },
        ],
      }),
      raw,
    );
    setAnalysis({
      documentId: scrubbed.id,
      medications: meds,
      inferenceSource: 'sample',
      connectivity,
      elapsedMs: 0,
      reviewRequired: true,
      interactionScreening: {
        status: 'not-performed',
        explanation: 'No interaction screening performed.',
      },
    });
    setSnapshot((s) => ({ ...s, medicines: meds.map(draftToPlan), checkins: {} }));
    navigate('medicines');
  }
  const progressText =
    progress?.stage === 'preparing-local'
      ? `Preparing local AI${progress.fraction !== undefined ? ' · ' + Math.round(progress.fraction * 100) + '%' : ''}`
      : progress?.stage === 'checking-evidence'
        ? 'Checking source evidence'
        : 'Extracting instructions';
  const runtimeStatus = busy
    ? progressText
    : localCheck.busy
      ? localCheck.message
      : localCheck.outcome === 'error'
        ? 'Local AI check did not finish'
        : analysis?.inferenceSource === 'cloud'
          ? 'Last AI result · cloud'
          : analysis?.inferenceSource === 'on-device'
            ? 'Last AI result · on-device'
            : localCheck.outcome === 'ready'
              ? 'Local AI replied successfully'
              : 'Local AI not checked yet';
  const privacyPanel = (
    <AiPrivacyPanel
      policy={policy}
      disabled={busy}
      onSelect={choosePrivacy}
      status={runtimeStatus}
      check={localCheck}
    />
  );
  return (
    <WorkspaceLayout
      page={page}
      documentCount={raw.trim() ? 1 : 0}
      medicineCount={snapshot.medicines.length}
      onNew={requestNew}
      privacyControls={privacyPanel}
      privacyLabel={
        policy === 'local-only'
          ? 'Strict local'
          : policy === 'local-first-with-consent'
            ? 'Balanced'
            : 'Best quality'
      }
      onTour={startTour}
      tourDisabled={tourDisabled}
    >
      <main id="main" className={`page-content page-${page}`} key={page}>
        <div className="prototype-callout">
          <span>RESEARCH</span>Fictional documents only · Not for medical decisions
        </div>
        {page === 'overview' && (
          <>
            <Overview
              raw={raw}
              medicineCount={snapshot.medicines.length}
              redactions={scrubbed.redactions.length}
              onSample={requestSample}
              onDocuments={() => navigate('documents')}
              policyLabel={
                policy === 'local-only'
                  ? 'Strict local'
                  : policy === 'local-first-with-consent'
                    ? 'Balanced'
                    : 'Best quality'
              }
            />
            <div className="mobile-privacy-panel">{privacyPanel}</div>
            {firebaseConfigured() && <LocalAiCheck check={localCheck} disabled={busy} />}
          </>
        )}
        {page === 'documents' && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">YOUR WORDS. YOUR BOUNDARIES.</span>
                <h1>Start with the source.</h1>
                <p>Bring your instructions into focus. Keep the original close.</p>
              </div>
              <span className="page-status">
                <LockKeyhole size={14} aria-hidden="true" />
                Private by default
              </span>
            </div>
            <div className="review-steps">
              <span className={raw.trim() ? 'done' : 'current'}>
                <i>{raw.trim() ? <Check size={13} aria-hidden="true" /> : '1'}</i>Add document
              </span>
              <ChevronRight size={14} aria-hidden="true" />
              <span className={permit ? 'done' : ''}>
                <i>{permit ? <Check size={13} aria-hidden="true" /> : '2'}</i>Choose privacy
              </span>
              <ChevronRight size={14} aria-hidden="true" />
              <span>
                <i>3</i>Extract & review
              </span>
            </div>
            <div className="document-pane-switch" role="group" aria-label="Document review panel">
              <button aria-pressed={pane === 'source'} onClick={() => setPane('source')}>
                <FileText size={16} aria-hidden="true" />
                Original document
              </button>
              <button aria-pressed={pane === 'privacy'} onClick={() => setPane('privacy')}>
                <ShieldCheck size={16} aria-hidden="true" />
                Private preview{' '}
                {scrubbed.redactions.length > 0 && <small>{scrubbed.redactions.length}</small>}
              </button>
            </div>
            <div className="document-grid" data-pane={pane}>
              <div className="source-panel">
                <DischargeUploader
                  key={documentEpoch}
                  value={raw}
                  onChange={changeText}
                  onSample={requestSample}
                  onPendingChange={setIntakePending}
                />
                <button
                  className="mobile-continue button dark"
                  disabled={!raw.trim()}
                  onClick={() => {
                    setPane('privacy');
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Continue to privacy <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
              <div className="preview-panel">
                <PiiScrubberView
                  document={scrubbed}
                  reviewed={!!permit}
                  onReviewed={review}
                  cloudFirst={
                    requestedPolicy === 'cloud-first-with-consent' ||
                    policy === 'cloud-first-with-consent'
                  }
                />
              </div>
            </div>
            {raw === sample && (
              <div className="sample-review-action">
                <span>Explore the complete flow with a hand-authored example. No AI call.</span>
                <button className="button secondary" onClick={sampleReview}>
                  Open sample review
                </button>
              </div>
            )}
            <div className="device-readiness">
              <span className={connectivity === 'offline' ? 'offline' : ''}>
                {connectivity === 'offline'
                  ? 'Offline · local scan and manual review available'
                  : 'Connected · photos stay on this device'}
              </span>
              <p>
                {typeof window !== 'undefined' && 'LanguageModel' in window
                  ? 'This browser exposes on-device AI. Model availability is checked when you extract.'
                  : 'This browser has no supported on-device language model. Use manual entry, or review the cloud privacy choices. Local photo scanning still works.'}
              </p>
            </div>
            <section className="processing-bar" aria-labelledby="processing-title">
              <div className="processing-heading">
                <span className="processing-icon">
                  <ShieldCheck size={22} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="processing-title">Your document. Your choice.</h2>
                  <p>
                    {policy === 'local-only'
                      ? 'Strict local never falls back to cloud AI.'
                      : policy === 'local-first-with-consent'
                        ? 'Balanced tries on-device AI before the approved cloud fallback.'
                        : 'Best quality tries cloud AI first, using only your approved text.'}
                  </p>
                </div>
              </div>
              <div
                className="mode-controls"
                role="group"
                aria-label="AI processing mode"
                data-tour="processing"
              >
                <button
                  aria-pressed={policy === 'local-only'}
                  onClick={() => choosePrivacy('local-only')}
                >
                  <LockKeyhole size={15} aria-hidden="true" />
                  Strict local
                </button>
                <button
                  disabled={!permit || isExtension()}
                  aria-pressed={policy === 'local-first-with-consent'}
                  aria-describedby="hybrid-help"
                  onClick={() => choosePrivacy('local-first-with-consent')}
                >
                  <Cloud size={16} aria-hidden="true" />
                  Balanced
                </button>
                <button
                  disabled={!permit || isExtension() || busy || localCheck.busy}
                  aria-pressed={policy === 'cloud-first-with-consent'}
                  onClick={() => choosePrivacy('cloud-first-with-consent')}
                >
                  <Cloud size={16} aria-hidden="true" />
                  Best quality
                </button>
              </div>
              <button
                className="button primary extract-button"
                disabled={busy || localCheck.busy || !raw.trim() || !firebaseConfigured()}
                aria-describedby={!firebaseConfigured() ? 'ai-setup-help' : undefined}
                onClick={() => void analyze()}
              >
                {busy ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : null}
                {busy ? progressText : 'Extract instructions'}
                {!busy && <ArrowRight size={17} aria-hidden="true" />}
              </button>
              {busy && (
                <button className="button secondary" onClick={() => pending.current?.abort()}>
                  Cancel extraction
                </button>
              )}
              <p className="mode-help" id="hybrid-help">
                {permit
                  ? 'Cloud permission is limited to the text you reviewed.'
                  : 'Cloud modes require reviewing the preview and explicitly allowing cloud processing.'}
              </p>
              <span role="status" className="sr-only">
                {busy ? progressText : ''}
              </span>
            </section>
            {!firebaseConfigured() && (
              <div className="setup-note" id="ai-setup-help">
                <Info size={17} aria-hidden="true" />
                <p>
                  <strong>AI extraction isn’t connected yet.</strong> You can still add documents
                  and review local redaction.
                </p>
                <span>SETUP PENDING</span>
              </div>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {firebaseConfigured() && <LocalAiCheck disabled={busy} check={localCheck} />}
          </>
        )}
        {page === 'medicines' && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">THE DETAILS THAT MATTER</span>
                <h1>
                  Less guesswork.
                  <br />
                  <span>More understanding.</span>
                </h1>
                <p>Every instruction, connected to the words it came from.</p>
              </div>
              <a href="#documents" className="button secondary">
                <FileText size={16} aria-hidden="true" />
                Your documents
              </a>
            </div>
            <MedicationSchedule analysis={analysis} sourceText={raw} />
          </>
        )}
        {page === 'caregivers' && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">YOUR PEOPLE. YOUR PERMISSION.</span>
                <h1>
                  You don’t have to
                  <br />
                  <span>figure it out alone.</span>
                </h1>
                <p>A private care handoff for the people you trust.</p>
              </div>
              <span className="research-badge">Encrypted on your device</span>
            </div>
            <CaregiverSync onRestore={() => setAnalysis(null)} />
          </>
        )}
        <footer>
          <span>
            <span className="footer-status" />
            Research preview · Fictional documents only
          </span>
          <span>
            Not for medication or emergency decisions.
            <a href="#privacy">
              Privacy & limitations <ArrowUpRightIcon />
            </a>
          </span>
        </footer>
      </main>
      <ConfirmNewReview
        open={dialogAction !== null}
        intent={dialogAction === 'sample' ? 'sample' : 'new'}
        onCancel={() => setDialogAction(null)}
        onConfirm={() => {
          const action = dialogAction;
          setDialogAction(null);
          setDocumentEpoch((e) => e + 1);
          changeText(action === 'sample' ? sample : '');
          setSnapshot(emptySnapshot());
          navigate('documents');
        }}
      />
      {tourOpen && <AppTour onNavigate={navigateTour} onClose={closeTour} />}
    </WorkspaceLayout>
  );
}
function ArrowUpRightIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}
