import { draftToPlan } from '../src/components/MedicationSchedule';
import { parseMedicationResponse } from '../src/services/hybridAi';
import { describe, it, expect } from 'vitest';
import {
  encryptSnapshot,
  decryptSnapshot,
  emptySnapshot,
  validateSnapshot,
  dueEntries,
  handoffText,
  localDay,
  type CareSnapshot,
} from '../src/services/carePlan';
const snapshot = (): CareSnapshot => ({
  ...emptySnapshot(),
  medicines: [
    {
      id: 'reviewed-1',
      name: 'Examplemed',
      strength: '0.5 mg',
      dose: '1 tablet',
      frequency: 'once daily',
      timing: '',
      route: 'by mouth',
      duration: '5 days',
      status: 'Continue',
      quote: 'Examplemed 0.5 mg. Take 1 tablet once daily.',
      times: ['14:00', '08:00'],
      confirmed: true,
    },
    {
      id: 'draft-1',
      name: 'Unreviewed private entry',
      strength: '',
      dose: '',
      frequency: '',
      timing: '',
      quote: 'Draft only',
      times: ['09:00'],
      confirmed: false,
    },
  ],
  questions: ['Which time did my pharmacist confirm?'],
  checkins: { '2026-11-15:reviewed-1:08:00': 'taken' },
});
describe('encrypted care handoff', () => {
  it('round-trips locally without putting care text in the saved payload', async () => {
    const text = await encryptSnapshot(snapshot(), 'a sufficiently long passphrase');
    expect(text).not.toContain('Examplemed');
    expect(text).not.toContain('pharmacist');
    expect(await decryptSnapshot(text, 'a sufficiently long passphrase')).toEqual(
      validateSnapshot(snapshot()),
    );
  });
  it('uses a different salt and nonce for every copy', async () => {
    const a = JSON.parse(await encryptSnapshot(snapshot(), 'a sufficiently long passphrase')),
      b = JSON.parse(await encryptSnapshot(snapshot(), 'a sufficiently long passphrase'));
    expect(a.iv).not.toBe(b.iv);
    expect(a.salt).not.toBe(b.salt);
    expect(a.data).not.toBe(b.data);
  });
  it('rejects wrong passwords and edited ciphertext without returning partial data', async () => {
    const text = await encryptSnapshot(snapshot(), 'a sufficiently long passphrase');
    await expect(decryptSnapshot(text, 'the wrong passphrase')).rejects.toThrow(
      'Nothing was imported',
    );
    const payload = JSON.parse(text);
    payload.data = 'AAAA' + payload.data.slice(4);
    await expect(
      decryptSnapshot(JSON.stringify(payload), 'a sufficiently long passphrase'),
    ).rejects.toThrow();
  });
  it('rejects short passwords and unbounded imports', async () => {
    await expect(encryptSnapshot(snapshot(), 'short')).rejects.toThrow('10–200');
    await expect(decryptSnapshot('x'.repeat(3000001), 'test passphrase')).rejects.toThrow();
  });
  it('validates schedule times, duplicate IDs and malicious shapes', () => {
    expect(() =>
      validateSnapshot({
        ...snapshot(),
        medicines: [{ ...snapshot().medicines[0], times: ['25:99'] }],
      }),
    ).toThrow();
    expect(() =>
      validateSnapshot({
        ...snapshot(),
        medicines: [snapshot().medicines[0], snapshot().medicines[0]],
      }),
    ).toThrow();
    expect(() => validateSnapshot({ ...snapshot(), checkins: [] })).toThrow();
  });
});
describe('review-bound personal log', () => {
  it('shows only reviewed entries, orders times and uses the selected local day', () => {
    const entries = dueEntries(validateSnapshot(snapshot()), '2026-11-15');
    expect(entries.map((e) => e.time)).toEqual(['08:00', '14:00']);
    expect(entries[0]?.status).toBe('taken');
    expect(dueEntries(snapshot(), '2026-11-16')[0]?.status).toBe('pending');
    expect(localDay(new Date(2026, 10, 15, 0, 2))).toBe('2026-11-15');
  });
  it('does not invent times from a frequency', () => {
    const s = snapshot();
    s.medicines[0]!.times = [];
    expect(dueEntries(s)).toHaveLength(0);
  });
  it('excludes unreviewed medicines from a caregiver conversation sheet', () => {
    const text = handoffText(snapshot());
    expect(text).toContain('Examplemed');
    expect(text).not.toContain('Unreviewed private entry');
    expect(text).toContain('Not a prescription');
    expect(text).toContain('pharmacist');
    expect(text).toContain('Source duration: 5 days');
    expect(text).toContain('Source status: Continue');
  });
});

it('retains route, duration and stop/continue wording when creating a review plan', () => {
  const quote = 'Examplemed 0.5 mg. Take 1 tablet by mouth once daily for 5 days. Stop.';
  const f = (value: string) => ({ value, quote });
  const [draft] = parseMedicationResponse(
    JSON.stringify({
      medications: [
        {
          name: f('Examplemed'),
          strength: f('0.5 mg'),
          dose: f('1 tablet'),
          route: f('by mouth'),
          frequency: f('once daily'),
          duration: f('5 days'),
          status: f('Stop'),
        },
      ],
    }),
    quote,
  );
  expect(draftToPlan(draft!)).toMatchObject({
    route: 'by mouth',
    duration: '5 days',
    status: 'Stop',
    times: [],
    confirmed: false,
  });
});
