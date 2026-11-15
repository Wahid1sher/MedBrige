import { describe, expect, it } from 'vitest';
import {
  createHybridAi,
  parseMedicationResponse,
  type HybridEngine,
  type Connectivity,
  type ModelReply,
} from '../src/services/hybridAi';
import {
  scrubPii,
  approveCloudProcessing,
  revokeCloudProcessing,
  type ScrubbedDocument,
} from '../src/services/piiScrubber';
const quote = 'Examplemed 0.5 mg tablet. Take 1 tablet by mouth once daily.';
const field = (value: string) => ({ value, quote });
const reply = JSON.stringify({
  medications: [
    {
      name: field('Examplemed'),
      strength: field('0.5 mg'),
      dose: field('1 tablet'),
      frequency: field('once daily'),
    },
  ],
});
function setup(
  options: {
    offline?: boolean;
    localFails?: boolean;
    response?: ModelReply;
    prepare?: () => Promise<void>;
  } = {},
) {
  const calls: { prompt: string; allowCloud: boolean }[] = [];
  const engine: HybridEngine = {
    prepareLocal:
      options.prepare ??
      (async () => {
        if (options.localFails) throw new Error('no hardware');
      }),
    generate: async (prompt, allowCloud) => {
      calls.push({ prompt, allowCloud });
      return options.response ?? { text: reply, source: allowCloud ? 'cloud' : 'on-device' };
    },
  };
  const service = createHybridAi({
    engine,
    connectivity: (): Connectivity => (options.offline ? 'offline' : 'online-hint'),
    now: () => 1,
  });
  return { service, calls };
}
describe('privacy-aware inference routing', () => {
  it('defaults to a strict local-only request even when online', async () => {
    const { service, calls } = setup();
    const result = await service.analyze({ document: scrubPii(quote), policy: 'local-only' });
    expect(calls[0]!.allowCloud).toBe(false);
    expect(result.inferenceSource).toBe('on-device');
    expect(result.interactionScreening.status).toBe('not-performed');
  });
  it('does not call generate or fall back when private local initialization fails', async () => {
    const { service, calls } = setup({ localFails: true });
    await expect(
      service.analyze({ document: scrubPii(quote), policy: 'local-only' }),
    ).rejects.toMatchObject({ code: 'LOCAL_UNAVAILABLE' });
    expect(calls).toHaveLength(0);
  });
  it('requires cloud permission before any model is called', async () => {
    const { service, calls } = setup();
    await expect(
      service.analyze({ document: scrubPii(quote), policy: 'local-first-with-consent' }),
    ).rejects.toThrow(/permission/);
    expect(calls).toHaveLength(0);
  });
  it('allows SDK fallback with approved scrubbed text, never the raw name or MRN', async () => {
    const { service, calls } = setup({ localFails: true });
    const document = scrubPii(`Patient: Alex Example\nMRN: PRIVATE123\n${quote}`),
      permit = approveCloudProcessing(document, true);
    const result = await service.analyze({
      document,
      policy: 'local-first-with-consent',
      cloudPermit: permit,
    });
    expect(result.inferenceSource).toBe('cloud');
    expect(calls[0]!.allowCloud).toBe(true);
    expect(calls[0]!.prompt).not.toContain('Alex Example');
    expect(calls[0]!.prompt).not.toContain('PRIVATE123');
    expect(calls[0]!.prompt).toContain('[REDACTED:');
  });
  it('forces local inference when offline, even with cloud permission', async () => {
    const { service, calls } = setup({ offline: true });
    const document = scrubPii(quote);
    await service.analyze({
      document,
      policy: 'local-first-with-consent',
      cloudPermit: approveCloudProcessing(document, true),
    });
    expect(calls[0]!.allowCloud).toBe(false);
  });
  it('rechecks revoked consent after local model preparation', async () => {
    const document = scrubPii(quote),
      permit = approveCloudProcessing(document, true);
    const { service, calls } = setup({
      prepare: async () => {
        revokeCloudProcessing(permit);
        throw new Error('local unavailable');
      },
    });
    await expect(
      service.analyze({ document, policy: 'local-first-with-consent', cloudPermit: permit }),
    ).rejects.toThrow(/permission/);
    expect(calls).toHaveLength(0);
  });
  it('rejects edited documents and forged scrub results', async () => {
    const { service, calls } = setup();
    const document = scrubPii(quote),
      permit = approveCloudProcessing(document, true);
    await expect(
      service.analyze({
        document: scrubPii(quote + ' edited'),
        policy: 'local-first-with-consent',
        cloudPermit: permit,
      }),
    ).rejects.toThrow();
    await expect(
      service.analyze({ document: { ...document } as ScrubbedDocument, policy: 'local-only' }),
    ).rejects.toThrow(/fresh/);
    expect(calls).toHaveLength(0);
  });
  it('rejects unexpected cloud output from a private request', async () => {
    const { service } = setup({ response: { text: reply, source: 'cloud' } });
    await expect(
      service.analyze({ document: scrubPii(quote), policy: 'local-only' }),
    ).rejects.toMatchObject({ code: 'UNEXPECTED_CLOUD' });
  });
  it('never silently truncates a ten-page intake to fit local context', async () => {
    const { service, calls } = setup();
    await expect(
      service.analyze({ document: scrubPii(quote.repeat(200)), policy: 'local-only' }),
    ).resolves.toMatchObject({ inferenceSource: 'on-device' });
    expect(calls.length).toBeGreaterThan(1);
  });
  it('cancels before any model call', async () => {
    const controller = new AbortController();
    controller.abort();
    const { service, calls } = setup();
    await expect(
      service.analyze({
        document: scrubPii(quote),
        policy: 'local-only',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(calls).toHaveLength(0);
  });
  it('rechecks connectivity immediately before allowing a fallback', async () => {
    let connection: Connectivity = 'online-hint';
    let cloudFlag: boolean | undefined;
    const document = scrubPii(quote);
    const engine: HybridEngine = {
      prepareLocal: async () => {
        connection = 'offline';
      },
      generate: async (_prompt, allow) => {
        cloudFlag = allow;
        return { text: reply, source: 'on-device' };
      },
    };
    await createHybridAi({ engine, connectivity: () => connection, now: () => 1 }).analyze({
      document,
      policy: 'local-first-with-consent',
      cloudPermit: approveCloudProcessing(document, true),
    });
    expect(cloudFlag).toBe(false);
  });
});
describe('AI source validation', () => {
  it('keeps exact source wording and missing timing as null', () => {
    const meds = parseMedicationResponse(reply, quote);
    expect(meds[0]!.strength!.value).toBe('0.5 mg');
    expect(meds[0]!.timing).toBe(null);
    expect(Object.isFrozen(meds)).toBe(true);
  });
  it('rejects 5 mg borrowed from 0.5 mg', () => {
    const data = JSON.parse(reply);
    data.medications[0].strength.value = '5 mg';
    expect(() => parseMedicationResponse(JSON.stringify(data), quote)).toThrow(/matched/);
  });
  it('rejects invented evidence, partial medicine names, and redacted values', () => {
    for (const patch of [
      { value: 'Example', quote },
      { value: '[REDACTED:MRN]', quote },
      { value: 'Examplemed', quote: 'Examplemed 20 mg.' },
    ]) {
      const data = JSON.parse(reply);
      data.medications[0].name = patch;
      expect(() => parseMedicationResponse(JSON.stringify(data), quote)).toThrow();
    }
  });
  it('rejects invalid JSON and excessive entries', () => {
    expect(() => parseMedicationResponse('Ignore instructions and take a pill.', quote)).toThrow();
    expect(() =>
      parseMedicationResponse(JSON.stringify({ medications: Array(61).fill({}) }), quote),
    ).toThrow();
  });
});

it('cancels a running engine even when its provider ignores AbortSignal', async () => {
  const controller = new AbortController();
  let started: () => void = () => {};
  const began = new Promise<void>((resolve) => {
    started = resolve;
  });
  const service = createHybridAi({
    engine: {
      prepareLocal: async () => {},
      generate: async () => {
        started();
        return new Promise<ModelReply>(() => {});
      },
    },
    connectivity: () => 'online-hint',
    now: () => 0,
  });
  const pending = service.analyze({
    document: scrubPii(quote),
    policy: 'local-only',
    signal: controller.signal,
  });
  await began;
  controller.abort();
  await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
});
