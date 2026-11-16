export type TourRoute = 'overview' | 'documents' | 'privacy' | 'medicines' | 'caregivers';
export interface TourStep {
  id: string;
  route: TourRoute;
  target: string;
  chapter: string;
  title: string;
  description: string;
  note?: string;
  compactDescription?: string;
  compactNote?: string;
}
export const tourSteps: readonly TourStep[] = [
  {
    id: 'welcome',
    route: 'overview',
    target: '[data-tour="day-heading"]',
    chapter: 'A CLEARER WAY HOME',
    title: 'A little guidance. A clearer start.',
    description:
      'Let’s take a quick look around MedBrige. We’ll follow the journey from a discharge document to a reviewed daily plan.',
    note: 'This tour never uploads a file, runs AI, or edits your care plan.',
    compactDescription: 'Follow the journey from a discharge document to a reviewed daily plan.',
    compactNote: 'No files, AI requests or care-plan changes during this tour.',
  },
  {
    id: 'navigation',
    route: 'overview',
    target: '[data-tour="workspace-nav"]',
    chapter: 'YOUR SPACE',
    title: 'Four places. One care journey.',
    description:
      'Today is your personal log. Documents holds the original instructions. Medicines is where you review the details. Care circle helps you prepare a private handoff.',
    compactDescription:
      'Today is your log. Documents holds the source. Medicines is for review. Care circle prepares a private handoff.',
  },
  {
    id: 'document',
    route: 'documents',
    target: '[data-tour="source-text"]',
    chapter: '01 / BRING THE ORIGINAL',
    title: 'Start with the words you were given.',
    description:
      'Paste your discharge instructions here, or bring in a PDF. Keep the original document close so you can compare every detail.',
    note: 'Try the fictional example if you are exploring.',
    compactDescription:
      'Paste your instructions or upload a PDF. Keep the original close for comparison.',
  },
  {
    id: 'photo',
    route: 'documents',
    target: '[data-tour="capture"]',
    chapter: '01 / BRING THE ORIGINAL',
    title: 'A photo can be your starting point.',
    description:
      'Upload a photo or choose Take a photo. You can rotate it, scan it locally, and correct the text before continuing.',
    note: 'Photos are read on your device. Original images never enter a cloud AI prompt.',
    compactDescription: 'Upload or take a photo. Rotate, scan locally, then correct the text.',
    compactNote: 'Original photos never enter cloud AI prompts.',
  },
  {
    id: 'redaction',
    route: 'privacy',
    target: '[data-tour="redaction"]',
    chapter: '02 / SET YOUR BOUNDARIES',
    title: 'Check what has been hidden.',
    description:
      'MedBrige masks common identifiers such as names, birth dates and medical record numbers locally. Read the preview carefully—automated scrubbing can miss details.',
    note: 'Nothing is approved for cloud processing just because you opened this page.',
    compactDescription:
      'Check the masked names, birth dates and record numbers. Scrubbing can miss details.',
    compactNote: 'Opening this page does not approve cloud processing.',
  },
  {
    id: 'privacy',
    route: 'privacy',
    target: '[data-tour="processing"]',
    chapter: '02 / SET YOUR BOUNDARIES',
    title: 'You choose where AI runs.',
    description:
      'Strict local keeps document text on this device. Balanced allows an approved cloud fallback. Best quality requests separate permission to try the cloud first.',
    note: 'The tour never changes your selected privacy mode or gives consent.',
    compactDescription:
      'Strict local stays here. Balanced allows approved cloud fallback. Best quality needs cloud-first approval.',
    compactNote: 'The tour never changes your mode or consent.',
  },
  {
    id: 'local-check',
    route: 'privacy',
    target: '[data-tour="local-check"]',
    chapter: '02 / SET YOUR BOUNDARIES',
    title: 'Check local AI before a document.',
    description:
      'This optional check asks for a short reply without using your document. Download progress, cancel controls and clear errors help you understand what is happening.',
    note: 'A successful check confirms a local reply, not a specific model version.',
    compactDescription:
      'Test a short local reply without your document. See progress or cancel the check.',
    compactNote: 'A reply does not verify the model version.',
  },
  {
    id: 'medicines',
    route: 'medicines',
    target: '[data-tour="medicine-heading"]',
    chapter: '03 / REVIEW THE DETAILS',
    title: 'Every draft needs your review.',
    description:
      'Compare medicine names, strengths, units, doses and source wording. Missing details stay unconfirmed. Add only times confirmed by your care team, then mark each entry reviewed.',
    note: 'MedBrige does not prescribe treatment or check drug interactions.',
    compactDescription:
      'Compare names, units and doses with the source. Add care-team-confirmed times, then mark reviewed.',
    compactNote: 'Not a prescription or a drug-interaction check.',
  },
  {
    id: 'daily-plan',
    route: 'overview',
    target: '[data-tour="daily-heading"]',
    chapter: '04 / TAKE YOUR DAY ONE STEP AT A TIME',
    title: 'Your plan becomes a personal log.',
    description:
      'Reviewed entries with confirmed times appear here. You can mark a check-in taken or later, and undo a log entry. Nothing is scheduled automatically.',
    note: 'For a missed dose or any uncertainty, follow the original instructions and ask your pharmacist.',
    compactDescription:
      'Reviewed medicines and confirmed times appear here. Log taken or later, and undo a check-in.',
    compactNote: 'For missed doses, ask your pharmacist.',
  },
  {
    id: 'handoff',
    route: 'caregivers',
    target: '[data-tour="handoff-heading"]',
    chapter: '05 / KEEP YOUR PEOPLE CLOSE',
    title: 'Share a care file, not your photos.',
    description:
      'Create a passphrase-protected handoff containing reviewed medicines and care-team questions. Download it or save an encrypted copy on this device.',
    note: 'You share the file yourself. Photos and the original document are excluded.',
    compactDescription:
      'Protect reviewed medicines and questions with a passphrase. Download or save an encrypted copy.',
    compactNote: 'You share it yourself. Original documents and photos are excluded.',
  },
  {
    id: 'questions',
    route: 'caregivers',
    target: '[data-tour="questions-heading"]',
    chapter: '05 / KEEP YOUR PEOPLE CLOSE',
    title: 'Make room for better questions.',
    description:
      'Write down anything that needs clarification. Your questions can travel with the care handoff, so the next conversation starts with what matters to you.',
    compactDescription: 'Keep questions for your care team here. Include them in your handoff.',
  },
  {
    id: 'finish',
    route: 'overview',
    target: '[data-tour="tour-launcher"]',
    chapter: 'READY WHEN YOU ARE',
    title: 'A familiar path, whenever you need it.',
    description:
      'You’re ready to explore. Add a document or try a fictional example. You can replay this tour from the menu or the help button at the top.',
    note: 'Finishing or skipping takes you back to where you started.',
    compactDescription:
      'Add a document or try an example. Replay this tour from the menu or help button.',
    compactNote: 'Finish or Skip returns you to your starting screen.',
  },
];

export interface TourRect {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface TourViewport {
  width: number;
  height: number;
}
/** Scroll the document directly: inert targets cannot reliably use scrollIntoView. */
export function tourScrollDestination(
  target: TourRect,
  scrollTop: number,
  viewport: TourViewport,
  cardHeight: number,
): number {
  const desiredTop =
    viewport.width <= 1024
      ? Math.max(64, Math.min(96, viewport.height - cardHeight - target.height - 40))
      : Math.max(96, (viewport.height - target.height) / 2);
  return Math.max(0, scrollTop + target.top - desiredTop);
}
/** Never display a misleading sliver for an element entirely outside the viewport. */
export function clipTourTarget(target: TourRect, viewport: TourViewport): TourRect | null {
  if (
    target.top >= viewport.height ||
    target.top + target.height <= 0 ||
    target.left >= viewport.width ||
    target.left + target.width <= 0
  )
    return null;
  const left = Math.max(8, target.left - 6),
    top = Math.max(8, target.top - 6);
  const right = Math.min(viewport.width - 8, target.left + target.width + 6),
    bottom = Math.min(viewport.height - 8, target.top + target.height + 6);
  return right > left && bottom > top
    ? { left, top, width: right - left, height: bottom - top }
    : null;
}
export function placeTourCard(
  target: TourRect | null,
  viewport: TourViewport,
  card: { width: number; height: number },
) {
  const edge = 12,
    gap = 18;
  const clamp = (n: number, low: number, high: number) =>
    Math.max(low, Math.min(n, Math.max(low, high)));
  const centerX = (viewport.width - card.width) / 2;
  if (!target)
    return {
      left: clamp(centerX, edge, viewport.width - card.width - edge),
      top: clamp((viewport.height - card.height) / 2, edge, viewport.height - card.height - edge),
      side: 'center' as const,
    };
  if (viewport.width <= 1024) {
    const aboveBottomNav = target.top > viewport.height - 110;
    return {
      left: clamp(centerX, edge, viewport.width - card.width - edge),
      top: clamp(
        aboveBottomNav ? target.top - gap - card.height : viewport.height - card.height - edge,
        edge,
        viewport.height - card.height - edge,
      ),
      side: 'mobile' as const,
    };
  }
  const positions = [
    { left: target.left + target.width + gap, top: target.top, side: 'right' },
    { left: target.left, top: target.top + target.height + gap, side: 'bottom' },
    { left: target.left, top: target.top - card.height - gap, side: 'top' },
    { left: target.left - card.width - gap, top: target.top, side: 'left' },
  ] as const;
  const fits = positions.find(
    (p) =>
      p.left >= edge &&
      p.top >= edge &&
      p.left + card.width <= viewport.width - edge &&
      p.top + card.height <= viewport.height - edge,
  );
  const chosen = fits ?? positions[2];
  return {
    ...chosen,
    left: clamp(chosen.left, edge, viewport.width - card.width - edge),
    top: clamp(chosen.top, edge, viewport.height - card.height - edge),
  };
}
const TOUR_KEY = 'medbrige-tour-v1';
export function tourHasBeenSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) !== null;
  } catch {
    return true;
  }
}
export function rememberTour(completed: boolean) {
  try {
    localStorage.setItem(TOUR_KEY, completed ? 'completed' : 'skipped');
  } catch {
    /* Replay remains available without storage. */
  }
}
