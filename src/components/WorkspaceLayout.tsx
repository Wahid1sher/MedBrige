import type { ReactNode } from 'react';
import { ReadingOptions } from './ReadingOptions';
import {
  Sun,
  FileText,
  Pill,
  Users,
  Plus,
  LockKeyhole,
  ArrowUpRight,
  CircleHelp,
  ChevronDown,
  CalendarDays,
  Layers,
  MoreHorizontal,
} from 'lucide-react';
export type Page =
  | 'overview'
  | 'documents'
  | 'medicines'
  | 'schedule'
  | 'caregivers'
  | 'how-it-works'
  | 'gp-summary';
const navigation = [
  { id: 'overview', label: 'Today', icon: Sun },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'medicines', label: 'Medicines', icon: Pill },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'caregivers', label: 'Care circle', icon: Users },
  { id: 'how-it-works', label: 'How it works', icon: Layers },
] as const;
export function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M17 11H37L48 22V52H17V11Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path d="M36 12V24H47" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" />
      <path
        d="M32.5 44L24.2 36.2C18.8 30.9 26 25 32.5 31C39 25 46.2 30.9 40.8 36.2L32.5 44Z"
        fill="#FFDA82"
      />
    </svg>
  );
}
interface Props {
  readonly children: ReactNode;
  readonly page: Page;
  readonly documentCount: number;
  readonly medicineCount: number;
  readonly onNew: () => void;
  readonly onAdd: () => void;
  readonly privacyControls: ReactNode;
  readonly privacyLabel: string;
  readonly onTour: () => void;
  readonly tourDisabled: boolean;
}
export function WorkspaceLayout({
  children,
  page,
  documentCount,
  medicineCount,
  onNew,
  onAdd,
  privacyControls,
  privacyLabel,
  onTour,
  tourDisabled,
}: Props) {
  const links = (mobile = false) =>
    navigation
      .filter(
        (item) => !mobile || ['overview', 'documents', 'medicines', 'caregivers'].includes(item.id),
      )
      .map(({ id, label, icon: Icon }) => {
        const count = id === 'documents' ? documentCount : id === 'medicines' ? medicineCount : 0;
        return (
          <a
            href={`#${id}`}
            key={id}
            aria-label={label}
            aria-current={page === id ? 'page' : undefined}
            className={page === id ? 'active' : ''}
          >
            <span className="nav-icon">
              <Icon size={mobile ? 22 : 20} aria-hidden="true" />
            </span>
            <span className="nav-copy">
              <strong>{label}</strong>
            </span>
            {!mobile &&
              (count > 0 ? (
                <small>{count}</small>
              ) : page === id ? (
                <i className="nav-active-dot" aria-hidden="true" />
              ) : null)}
          </a>
        );
      });
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <a href="#overview" className="brand" aria-label="MedBrige home">
            <span className="brand-symbol">
              <BrandMark />
            </span>
            <span>
              MedBrige<span className="brand-period">.</span>
            </span>
          </a>
          <span className="brand-tagline">A little clearer, together.</span>
        </div>
        <div className="sidebar-section-heading">
          <p className="nav-label">YOUR SPACE</p>
        </div>
        <nav aria-label="Workspace" data-tour="workspace-nav">
          {links()}
        </nav>
        <button className="sidebar-add" onClick={onAdd}>
          <span>
            <Plus size={18} aria-hidden="true" />
          </span>
          <div>Add document</div>
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
        <div className="sidebar-bottom">
          <details className="sidebar-settings">
            <summary>
              <LockKeyhole size={17} aria-hidden="true" />
              <span>Privacy</span>
              <small>{privacyLabel}</small>
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="sidebar-settings-body">{privacyControls}</div>
          </details>
          <button
            className="sidebar-tour"
            data-tour="tour-launcher"
            onClick={onTour}
            disabled={tourDisabled}
          >
            <CircleHelp size={18} aria-hidden="true" />
            <span>Take a tour</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
          <div className="sidebar-foot">
            <span>
              <i />
              Research preview
            </span>
            <LockKeyhole size={13} aria-label="Session only" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <a className="mobile-brand" href="#overview" aria-label="MedBrige home">
            <span className="brand-symbol">
              <BrandMark />
            </span>
            MedBrige<span className="mobile-brand-period">.</span>
          </a>
          <div className="breadcrumb">
            <span>Your space</span>
            <span>/</span>
            <strong>
              {page === 'gp-summary'
                ? 'GP summary'
                : navigation.find((item) => item.id === page)?.label}
            </strong>
          </div>
          <div className="header-actions">
            <ReadingOptions />
            <button
              className="header-tour"
              data-tour="tour-launcher"
              onClick={onTour}
              disabled={tourDisabled}
              aria-label="Take a tour"
            >
              <CircleHelp size={18} aria-hidden="true" />
              <span>Take a tour</span>
            </button>
            <span className="session-badge">
              <LockKeyhole size={13} aria-hidden="true" />
              Session only
            </span>
            <button
              className="button dark new-review"
              onClick={onNew}
              aria-label="Start a new review"
            >
              <Plus size={17} aria-hidden="true" />
              <span>New review</span>
            </button>
          </div>
        </header>
        {children}
      </div>
      <nav className="mobile-nav" aria-label="Mobile workspace" data-tour="workspace-nav">
        {links(true)}
        <details className="mobile-more">
          <summary aria-label="More pages">
            <MoreHorizontal size={22} />
            <strong>More</strong>
          </summary>
          <div>
            <a
              href="#schedule"
              aria-label="Schedule"
              onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
              aria-current={page === 'schedule' ? 'page' : undefined}
            >
              <CalendarDays size={18} />
              Schedule
            </a>
            <a
              href="#how-it-works"
              aria-label="How it works"
              onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
              aria-current={page === 'how-it-works' ? 'page' : undefined}
            >
              <Layers size={18} />
              How it works
            </a>
          </div>
        </details>
      </nav>
    </div>
  );
}
