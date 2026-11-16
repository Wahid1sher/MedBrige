import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import {
  tourSteps,
  placeTourCard,
  tourScrollDestination,
  clipTourTarget,
  type TourRect,
  type TourRoute,
} from '../services/appTour';

export function AppTour({
  onNavigate,
  onClose,
}: {
  onNavigate: (route: TourRoute) => void;
  onClose: (completed: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<TourRect | null>(null);
  const [position, setPosition] = useState({ left: 12, top: 12, side: 'center' });
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = tourSteps[index]!;
  const finished = index === tourSteps.length - 1;

  useLayoutEffect(() => {
    onNavigate(step.route);
  }, [step.route, onNavigate]);
  useEffect(() => {
    const root = document.getElementById('root');
    const previousInert = root?.inert ?? false;
    const previousHidden = root?.getAttribute('aria-hidden');
    const previousOverflow = document.body.style.overflow;
    const previousTourActive = document.body.getAttribute('data-tour-active');
    if (root) {
      root.inert = true;
      root.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-tour-active', '');
    return () => {
      if (root) {
        root.inert = previousInert;
        if (previousHidden === null) root.removeAttribute('aria-hidden');
        else if (previousHidden !== undefined) root.setAttribute('aria-hidden', previousHidden);
      }
      document.body.style.overflow = previousOverflow;
      if (previousTourActive === null) document.body.removeAttribute('data-tour-active');
      else document.body.setAttribute('data-tour-active', previousTourActive);
    };
  }, []);
  useLayoutEffect(() => {
    let stopped = false,
      frame = 0;
    let target: HTMLElement | null = null;
    let needsReveal = true,
      attempts = 0,
      didFocus = false;
    const copy = panel.current?.querySelector<HTMLElement>('.tour-copy');
    if (copy) copy.scrollTop = 0;
    const findTarget = () =>
      [...document.querySelectorAll<HTMLElement>(step.target)].find(
        (node) => node.getClientRects().length && node.getBoundingClientRect().width > 0,
      ) ?? null;
    const update = () => {
      if (stopped) return;
      const found = findTarget();
      if (found !== target) {
        if (target) observer.unobserve(target);
        target = found;
        needsReveal = true;
        attempts = 0;
        if (target) observer.observe(target);
      }
      const size = { width: document.documentElement.clientWidth, height: window.innerHeight };
      const card = panel.current?.getBoundingClientRect();
      if (target && needsReveal) {
        needsReveal = false;
        const sidebar = target.closest<HTMLElement>('.sidebar');
        if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'instant' });
        else if (!target.closest('.mobile-nav')) {
          const r = target.getBoundingClientRect();
          window.scrollTo({
            top: tourScrollDestination(
              { left: r.left, top: r.top, width: r.width, height: r.height },
              window.scrollY,
              size,
              card?.height ?? 300,
            ),
            behavior: 'instant',
          });
        }
      }
      const bounds = target?.getBoundingClientRect();
      const next = bounds
        ? clipTourTarget(
            { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height },
            size,
          )
        : null;
      setViewport(size);
      setRect(next);
      if (card) setPosition(placeTourCard(next, size, { width: card.width, height: card.height }));
      if (target && !next && attempts++ < 3) queue(true);
      if (next && !didFocus) {
        didFocus = true;
        heading.current?.focus({ preventScroll: true });
      }
    };
    const queue = (reveal = false) => {
      needsReveal ||= reveal;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(() => queue(true));
    if (panel.current) observer.observe(panel.current);
    const mutation = new MutationObserver(() => queue(true));
    const root = document.getElementById('root');
    if (root)
      mutation.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-pane'],
      });
    const resize = () => queue(true),
      scroll = () => queue();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scroll, true);
    setRect(null);
    queue(true);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [step.id, step.target]);

  function next() {
    if (finished) onClose(true);
    else setIndex((n) => n + 1);
  }
  const compact = viewport.width <= 1024;
  const description = compact ? (step.compactDescription ?? step.description) : step.description;
  const note = compact ? (step.compactNote ?? step.note) : step.note;
  return createPortal(
    <div className="app-tour-layer" data-tour-step={step.id}>
      <svg
        className="tour-shade"
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="medbrige-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                {...{ x: rect.left, y: rect.top, width: rect.width, height: rect.height }}
                rx="15"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="#0b1527"
          fillOpacity=".67"
          mask="url(#medbrige-tour-mask)"
        />
      </svg>
      {rect && (
        <div
          className="tour-spotlight"
          aria-hidden="true"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      )}
      <div
        className={`tour-popover ${compact ? 'is-compact' : ''}`}
        data-placement={position.side}
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-heading"
        aria-describedby="tour-description"
        style={{ left: position.left, top: position.top }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose(false);
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            next();
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setIndex((n) => Math.max(0, n - 1));
          } else if (event.key === 'Tab') {
            const controls = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), a[href], [tabindex="0"]',
              ),
            ];
            const first = controls[0],
              last = controls.at(-1);
            if (
              event.shiftKey &&
              (document.activeElement === first || document.activeElement === heading.current)
            ) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="tour-topline">
          <span>
            {index + 1}
            <span> / {tourSteps.length}</span>
          </span>
          <button className="tour-skip" onClick={() => onClose(false)}>
            Skip tour
          </button>
        </div>
        <div className="tour-progress" aria-hidden="true">
          <span style={{ width: `${((index + 1) / tourSteps.length) * 100}%` }} />
        </div>
        <div className="tour-copy" tabIndex={0} aria-label="Tour explanation">
          <div className="tour-chapter">
            <Sparkles size={13} aria-hidden="true" />
            {step.chapter}
          </div>
          <h2 ref={heading} tabIndex={-1} id="tour-heading">
            {step.title}
          </h2>
          <p id="tour-description">{description}</p>
          {note && <p className="tour-note">{note}</p>}
        </div>
        <div className="tour-actions">
          <button
            className="tour-back"
            disabled={index === 0}
            onClick={() => setIndex((n) => Math.max(0, n - 1))}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </button>
          <button className="tour-next" onClick={next}>
            {finished ? 'Finish tour' : 'Next'}
            {finished ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <ArrowRight size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          Step {index + 1} of {tourSteps.length}: {step.title}
        </span>
      </div>
    </div>,
    document.body,
  );
}
