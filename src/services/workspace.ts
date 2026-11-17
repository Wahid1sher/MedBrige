import {
  dueEntries,
  emptySnapshot,
  localDay,
  type CareSnapshot,
  type PlanMedicine,
} from './carePlan';

/** Never invent a past day's expected doses from today's medicine list. */
export function recordedEntries(snapshot: CareSnapshot, day: string, today = localDay()) {
  const entries = dueEntries(snapshot, day);
  return day === today
    ? entries
    : entries.filter((entry) => Object.hasOwn(snapshot.checkins, entry.key));
}

export const dayParts = ['Morning', 'Midday', 'Evening', 'Night'] as const;
export type DayPart = (typeof dayParts)[number];
export function dayPart(time: string): DayPart {
  const hour = Number(time.slice(0, 2));
  return hour >= 6 && hour < 12
    ? 'Morning'
    : hour < 17 && hour >= 12
      ? 'Midday'
      : hour >= 17 && hour < 21
        ? 'Evening'
        : 'Night';
}
export function recentDays(now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i, 12);
    return { key: localDay(date), date };
  });
}
export function exampleSnapshot(): CareSnapshot {
  const make = (
    id: string,
    name: string,
    strength: string,
    times: string[],
    status = 'Continue',
  ): PlanMedicine => ({
    id,
    name,
    strength,
    times,
    status,
    confirmed: true,
    dose: '1 tablet',
    frequency: times.length === 2 ? 'Twice daily' : 'Once daily',
    timing: 'Fictional example times',
    quote: `FICTIONAL EXAMPLE: ${name} ${strength}. Take 1 tablet ${times.length === 2 ? 'twice daily' : 'once daily'}. Status: ${status}.`,
  });
  return {
    ...emptySnapshot(),
    medicines: [
      make('demo-metformin', 'Metformin', '500 mg', ['08:00', '13:00']),
      make('demo-lisinopril', 'Lisinopril', '10 mg', ['08:00']),
      make('demo-atorvastatin', 'Atorvastatin', '20 mg', ['18:30']),
      {
        ...make('demo-paracetamol', 'Paracetamol', '500 mg', [], 'As needed'),
        frequency: 'As needed',
        confirmed: false,
      },
      {
        ...make('demo-warfarin', 'Warfarin', '2 mg', [], 'Paused in fictional source'),
        confirmed: false,
      },
    ],
    questions: [
      'Can we review my current medicine list together?',
      'Who should I contact if the written instructions are unclear?',
    ],
    checkins: {
      [`${localDay()}:demo-metformin:08:00`]: 'taken',
      [`${localDay()}:demo-lisinopril:08:00`]: 'taken',
    },
  };
}
export interface SessionDocument {
  id: string;
  title: string;
  text: string;
  savedAt: string;
  redactions: number;
  source: 'Session' | 'Example';
}
export const exampleDocuments: SessionDocument[] = [
  [
    'Discharge summary',
    'A fictional hospital discharge letter. The medicine list needs a review with the care team.',
  ],
  [
    'Lab results',
    'Fictional laboratory report. No lab interpretation is performed in this prototype.',
  ],
  [
    'Cardiology visit note',
    'Fictional clinic note. Keep the original instructions available for your next appointment.',
  ],
  [
    'Pharmacy printout',
    'Fictional pharmacy handout. Ask your pharmacist about unclear medicine instructions.',
  ],
  [
    'Rehab exercise sheet',
    'Fictional rehabilitation handout. Follow the instructions your care team actually supplied.',
  ],
].map(([title, text], i) => ({
  id: `example-${i}`,
  title: title!,
  text: text!,
  savedAt: 'Fictional example',
  redactions: 0,
  source: 'Example',
}));
