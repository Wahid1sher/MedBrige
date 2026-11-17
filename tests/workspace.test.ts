import { describe, expect, it } from 'vitest';
import { dayPart, exampleSnapshot, recentDays, recordedEntries } from '../src/services/workspace';
import { emptySnapshot, localDay, validateSnapshot } from '../src/services/carePlan';

describe('workspace schedule boundaries', () => {
  it('keeps night on both sides of midnight, with no gaps between day parts', () => {
    expect(
      [
        '00:00',
        '05:59',
        '06:00',
        '11:59',
        '12:00',
        '16:59',
        '17:00',
        '20:59',
        '21:00',
        '23:59',
      ].map(dayPart),
    ).toEqual([
      'Night',
      'Night',
      'Morning',
      'Morning',
      'Midday',
      'Midday',
      'Evening',
      'Evening',
      'Night',
      'Night',
    ]);
  });
  it('does not invent missed doses for dates before the current plan existed', () => {
    const plan = exampleSnapshot();
    expect(recordedEntries(plan, '2020-01-01')).toEqual([]);
    const day = localDay();
    expect(recordedEntries(plan, day)).toHaveLength(4);
    expect(recordedEntries(plan, day).every((e) => e.medicine.confirmed)).toBe(true);
  });
  it('shows only existing historical check-ins, never every current-plan time', () => {
    const plan = exampleSnapshot();
    plan.checkins = { '2026-01-02:demo-metformin:13:00': 'taken' };
    const historical = recordedEntries(plan, '2026-01-02', '2026-01-03');
    expect(historical.map((e) => [e.time, e.status])).toEqual([['13:00', 'taken']]);
  });
  it('does not schedule as-needed or paused example entries', () => {
    const plan = validateSnapshot(exampleSnapshot());
    expect(recordedEntries(plan, localDay()).map((e) => e.medicine.name)).not.toContain(
      'Paracetamol',
    );
    expect(recordedEntries(plan, localDay()).map((e) => e.medicine.name)).not.toContain('Warfarin');
    expect(plan.medicines.some((m) => m.name === 'Warfarin')).toBe(true);
  });
  it('isolates example activity from the real workspace and other example sessions', () => {
    const actual = emptySnapshot(),
      first = exampleSnapshot(),
      second = exampleSnapshot();
    first.medicines[0]!.name = 'Changed example';
    first.questions.push('Only in this example');
    expect(actual).toEqual(emptySnapshot());
    expect(second.medicines[0]!.name).toBe('Metformin');
    expect(second.questions).not.toContain('Only in this example');
  });
  it('uses seven unique local calendar dates across month and year boundaries', () => {
    expect(recentDays(new Date(2027, 0, 3, 1)).map((d) => d.key)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });
});
