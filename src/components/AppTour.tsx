import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { tourSteps, placeTourCard, type TourRect, type TourRoute } from '../services/appTour';

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

  useEffect(() => {
    onNavigate(step.route);
  }, [step.route, onNavigate]);
  useEffect(() => {
    const root = document.getElementById('root');
    const previousInert = root?.inert ?? false;
    const previousHidden = root?.getAttribute('aria-hidden');
    const previousOverflow = document.body.style.overflow;
    if (root) {
      root.inert = true;
      root.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = 'hidden';
    return () => {
      if (root) {
        root.inert = previousInert;
        if (previousHidden === null) root.removeAttribute('aria-hidden');
        else if (previousHidden !== undefined) root.setAttribute('aria-hidden', previousHidden);
      }
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  useLayoutEffect(() => {
    let stopped = false,
      frame = 0;
    let target: HTMLElement | null = null;
    const findTarget = () =>
      [...document.querySelectorAll<HTMLElement>(step.target)].find(
        (node) => node.getClientRects().length && node.getBoundingClientRect().width > 0,
      ) ?? null;
    const update = () => {
      if (stopped) return;
      target = findTarget();
      const size = { width: document.documentElement.clientWidth, height: window.innerHeight };
      const bounds = target?.getBoundingClientRect();
      const next = bounds
        ? {
            left: Math.max(8, bounds.left - 6),
            top: Math.max(8, bounds.top - 6),
            width: Math.max(
              0,
              Math.min(size.width - 8, bounds.right + 6) - Math.max(8, bounds.left - 6),
            ),
            height: Math.max(
              0,
              Math.min(size.height - 8, bounds.bottom + 6) - Math.max(8, bounds.top - 6),
            ),
          }
        : null;
      setViewport(size);
      setRect(next);
      const card = panel.current?.getBoundingClientRect();
      if (card) setPosition(placeTourCard(next, size, { width: card.width, height: card.height }));
    };
    const queue = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const reveal = () => {
      target = findTarget();
      target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      if (target && window.innerWidth < 640 && !target.closest('.mobile-nav')) {
        window.scrollBy({ top: target.getBoundingClientRect().top - 96, behavior: 'instant' });
      }
      update();
      heading.current?.focus({ preventScroll: true });
    };
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(reveal);
    });
    const observer = new ResizeObserver(queue);
    if (panel.current) observer.observe(panel.current);
    const mutation = new MutationObserver(queue);
    const root = document.getElementById('root');
    if (root) mutation.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', queue);
    window.addEventListener('scroll', queue, true);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', queue);
      window.removeEventListener('scroll', queue, true);
    };
  }, [step.id, step.target]);

  function next() {
    if (finished) onClose(true);
    else setIndex((n) => n + 1);
  }
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
        className="tour-popover"
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
                'button:not(:disabled), a[href]',
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
        <div className="tour-chapter">
          <Sparkles size={13} aria-hidden="true" />
          {step.chapter}
        </div>
        <h2 ref={heading} tabIndex={-1} id="tour-heading">
          {step.title}
        </h2>
        <p id="tour-description">{step.description}</p>
        {step.note && <p className="tour-note">{step.note}</p>}
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
