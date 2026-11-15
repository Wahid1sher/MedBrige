import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  scrubPii,
  approveCloudProcessing,
  assertCloudPermission,
  revokeCloudProcessing,
  type CloudPermit,
  type ScrubbedDocument,
} from '../src/services/piiScrubber';
afterEach(() => vi.useRealTimers());
describe('local privacy firewall', () => {
  it('masks names, MRNs, dates of birth, phones and SSNs before producing a preview', () => {
    const doc = scrubPii(
      'Patient name: Alex Example\nDOB: 01/01/1950\nMRN: ABC12345\nPhone: (916) 555-0142\nSSN: 123-45-6789\nExamplemed 0.5 mg.',
    );
    for (const value of ['Alex Example', '01/01/1950', 'ABC12345', '(916) 555-0142', '123-45-6789'])
      expect(doc.text).not.toContain(value);
    expect(doc.text).toContain('Examplemed 0.5 mg.');
    expect(doc.redactions).toHaveLength(5);
    expect(doc.reviewRequired).toBe(true);
  });
  it('recognizes Spanish labels and an anchored generic name field', () => {
    const doc = scrubPii(
      'Nombre del paciente: María Pérez\nFecha de nacimiento: 10/10/1960\nName: Alex Example\nMedication name: Examplemed',
    );
    expect(doc.text).not.toContain('María Pérez');
    expect(doc.text).not.toContain('10/10/1960');
    expect(doc.text).not.toContain('Alex Example');
    expect(doc.text).toContain('Medication name: Examplemed');
  });
  it('separates multiple identifiers on one line', () => {
    const doc = scrubPii('Patient: Alex Example DOB: 01/01/1950 MRN: ABC123 Phone: 916-555-0142');
    expect(doc.redactions).toHaveLength(4);
    expect(doc.text).not.toMatch(/Alex|1950|ABC123|555-0142/);
  });
  it('masks email addresses and unlabeled phone/SSN patterns', () => {
    const doc = scrubPii(
      'Reach alex@example.test or +1 (916) 555-0142 ext 12. SSN copy 123 45 6789.',
    );
    expect(doc.text).not.toContain('alex@example.test');
    expect(doc.text).not.toContain('555-0142');
    expect(doc.text).not.toContain('123 45 6789');
  });
  it('supports explicit patient-name hints across repeated occurrences and literal metacharacters', () => {
    const doc = scrubPii(
      'A. Example arrived. A. Example left. AAA Example is a different string.',
      { knownPatientNames: ['A. Example'] },
    );
    expect(doc.redactions).toHaveLength(2);
    expect(doc.text).toContain('AAA Example');
  });
  it('removes labeled identifiers when they reappear in narrative text', () => {
    const doc = scrubPii(
      'Patient: Alex Example\nMRN: DEMO12345\nAlex Example asked a question. The record DEMO12345 was reviewed.',
    );
    expect(doc.text).not.toContain('Alex Example');
    expect(doc.text).not.toContain('DEMO12345');
    expect(doc.redactions).toHaveLength(4);
  });
  it('merges overlapping detections without corrupting offsets', () => {
    const original = 'Phone: 916-555-0142';
    const doc = scrubPii(original, { knownIdentifiers: ['916-555-0142'] });
    expect(doc.redactions).toHaveLength(1);
    expect(original.slice(doc.redactions[0]!.start, doc.redactions[0]!.end)).toBe('916-555-0142');
    expect(doc.redactions[0]!.categories).toContain('phone');
    expect(doc.redactions[0]!.categories).toContain('mrn');
  });
  it('preserves medication numbers, Unicode fractions and non-birth dates', () => {
    const text =
      'Examplemed 0.5 mg: take ½ tablet every 6 hours for 5 days. Follow-up: 11/30/2026.';
    expect(scrubPii(text).text).toBe(text);
  });
  it('does not pretend an unlabeled name is anonymous', () => {
    const doc = scrubPii('Alex Example went home.');
    expect(doc.text).toContain('Alex Example');
    expect(doc.warnings.join(' ')).toContain('can miss');
    expect(doc.reviewRequired).toBe(true);
  });
  it('blocks cloud approval when invisible controls can hide identifiers', () => {
    const doc = scrubPii('Pat\u200Bient: Alex Example');
    expect(doc.cloudBlockReasons).not.toHaveLength(0);
    expect(() => approveCloudProcessing(doc, true)).toThrow(/Invisible/);
  });
  it('does not copy original identifiers into redaction metadata', () => {
    const doc = scrubPii('MRN: PRIVATE123');
    expect(JSON.stringify(doc)).not.toContain('PRIVATE123');
    expect(Object.isFrozen(doc)).toBe(true);
    expect(Object.isFrozen(doc.redactions[0])).toBe(true);
  });
  it('validates input size and hint lengths', () => {
    expect(() => scrubPii('a'.repeat(200001))).toThrow(/200/);
    expect(() => scrubPii('text', { knownPatientNames: ['a'] })).toThrow(/2 and 200/);
  });
});
describe('cloud consent boundary', () => {
  it('requires explicit review and binds approval to object identity', () => {
    const a = scrubPii('Examplemed 1 mg.'),
      b = scrubPii('Examplemed 1 mg.');
    expect(() => approveCloudProcessing(a, false)).toThrow(/Review/);
    const permit = approveCloudProcessing(a, true);
    expect(() => assertCloudPermission(a, permit)).not.toThrow();
    expect(() => assertCloudPermission(b, permit)).toThrow(/different text/);
  });
  it('rejects copied permits and forged TypeScript casts at runtime', () => {
    const a = scrubPii('Examplemed 1 mg.'),
      permit = approveCloudProcessing(a, true);
    expect(() => assertCloudPermission(a, { ...permit } as CloudPermit)).toThrow();
    expect(() => approveCloudProcessing({ ...a } as ScrubbedDocument, true)).toThrow(/fresh/);
  });
  it('expires and revokes grants', () => {
    vi.useFakeTimers();
    const doc = scrubPii('Examplemed 1 mg.'),
      permit = approveCloudProcessing(doc, true);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(() => assertCloudPermission(doc, permit)).toThrow(/expired/);
    const next = approveCloudProcessing(doc, true);
    revokeCloudProcessing(next);
    expect(() => assertCloudPermission(doc, next)).toThrow();
  });
});
