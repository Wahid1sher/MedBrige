import { describe, it, expect } from 'vitest';
import { readDocument, validateDocumentFile, MAX_FILE_BYTES } from '../src/services/readDocument';
import { splitSourceText, createHybridAi } from '../src/services/hybridAi';
import {
  scrubPii,
  approveCloudProcessing,
  revokeCloudProcessing,
} from '../src/services/piiScrubber';
describe('private intake boundaries', () => {
  it('supports image formats but rejects empty, oversized and unsupported files', () => {
    expect(validateDocumentFile({ size: 5, name: 'photo.jpg', type: 'image/jpeg' })).toBe('image');
    expect(validateDocumentFile({ size: 5, name: 'scan.pdf', type: 'application/pdf' })).toBe(
      'pdf',
    );
    expect(() => validateDocumentFile({ size: 0, name: 'a.txt', type: 'text/plain' })).toThrow(
      'empty',
    );
    expect(() =>
      validateDocumentFile({ size: MAX_FILE_BYTES + 1, name: 'a.png', type: 'image/png' }),
    ).toThrow('20 MB');
    expect(() => validateDocumentFile({ size: 5, name: 'a.heic', type: 'image/heic' })).toThrow(
      'HEIC',
    );
  });
  it('reads text locally and stops on cancellation before any worker starts', async () => {
    const file = new File(['Fictional source text'], 'source.txt', { type: 'text/plain' });
    expect(await readDocument(file)).toMatchObject({
      text: 'Fictional source text',
      ocrPages: 0,
      pages: 1,
    });
    const controller = new AbortController();
    controller.abort();
    await expect(readDocument(file, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
  it('retains the end of a long document in bounded, overlapping sections', () => {
    const source =
      'Source paragraph with exact instructions.\n'.repeat(900) + 'FINAL IMPORTANT STOP WORDING';
    const chunks = splitSourceText(source);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 7500)).toBe(true);
    expect(chunks.at(-1)).toContain('FINAL IMPORTANT STOP WORDING');
    expect(chunks[0]?.slice(-700)).toBe(chunks[1]?.slice(0, 700));
    expect(() => splitSourceText(source, 100, 120)).toThrow();
  });
  it('re-checks cloud consent between sections and saves no partial result', async () => {
    const doc = scrubPii('Source section.\n'.repeat(1200)),
      permit = approveCloudProcessing(doc, true);
    let calls = 0;
    const service = createHybridAi({
      engine: {
        prepareLocal: async () => {},
        generate: async () => {
          calls++;
          revokeCloudProcessing(permit);
          return { text: '{"medications":[]}', source: 'cloud' };
        },
      },
      connectivity: () => 'online-hint',
      now: () => 0,
    });
    await expect(
      service.analyze({ document: doc, policy: 'local-first-with-consent', cloudPermit: permit }),
    ).rejects.toThrow();
    expect(calls).toBe(1);
  });
});
