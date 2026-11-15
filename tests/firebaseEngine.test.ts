import { afterEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  models: [] as Array<{
    params: any;
    initializeDeviceModel: ReturnType<typeof vi.fn>;
    generateContent: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock('../src/services/firebase', () => ({ getFirebaseServices: () => ({ app: {} }) }));
vi.mock('firebase/ai', async (original) => ({
  ...(await original<typeof import('firebase/ai')>()),
  getAI: () => ({}),
  getGenerativeModel: (_ai: unknown, params: unknown) => {
    const model = {
      params,
      initializeDeviceModel: vi.fn(async () => {}),
      generateContent: vi.fn(async () => ({
        response: { inferenceSource: 'on-device', text: () => 'OK' },
      })),
    };
    sdk.models.push(model);
    return model;
  },
}));
import { FirebaseHybridEngine, checkLocalAi } from '../src/services/hybridAi';
import { InferenceSource, InferenceMode } from 'firebase/ai';

afterEach(() => {
  sdk.models.length = 0;
  vi.unstubAllGlobals();
});
describe('Firebase local request lifecycle', () => {
  it('passes cancellation into Chrome session creation and prompt options, and gives retries a fresh session', async () => {
    vi.stubGlobal('window', { LanguageModel: {} });
    const engine = new FirebaseHybridEngine();
    const first = new AbortController();
    await engine.prepareLocal(() => {}, first.signal);
    const model = sdk.models[0]!;
    model.generateContent.mockResolvedValue({
      response: { inferenceSource: InferenceSource.ON_DEVICE, text: () => '{"medications":[]}' },
    });
    await engine.generate('synthetic text', false, first.signal);
    expect(model.params.mode).toBe(InferenceMode.ONLY_ON_DEVICE);
    expect(model.params.onDeviceParams.createOptions.signal).toBe(first.signal);
    expect(model.params.onDeviceParams.promptOptions.signal).toBe(first.signal);
    first.abort();
    const retry = new AbortController();
    await engine.prepareLocal(() => {}, retry.signal);
    expect(sdk.models).toHaveLength(2);
    expect(sdk.models[1]!.params.onDeviceParams.createOptions.signal).toBe(retry.signal);
  });
  it('uses JSON Schema null branches rather than silently requiring every missing source field to be an object', async () => {
    vi.stubGlobal('window', { LanguageModel: {} });
    await new FirebaseHybridEngine().prepareLocal(() => {}, new AbortController().signal);
    const schema = sdk.models[0]!.params.onDeviceParams.promptOptions.responseConstraint;
    expect(schema.properties.medications.items.properties.timing.anyOf).toContainEqual({
      type: 'null',
    });
    expect(schema.properties.medications.maxItems).toBe(60);
    expect(schema.additionalProperties).toBe(false);
  });
  it('runs the readiness probe with only a fixed short prompt and rejects cloud provenance', async () => {
    vi.stubGlobal('window', { LanguageModel: {} });
    const stages: string[] = [];
    const run = checkLocalAi(new AbortController().signal, (stage) => stages.push(stage));
    const model = sdk.models[0]!;
    model.generateContent.mockResolvedValue({
      response: { inferenceSource: InferenceSource.IN_CLOUD, text: () => 'OK' },
    });
    await expect(run).rejects.toThrow(/verifiable/);
    expect(model.params.mode).toBe(InferenceMode.ONLY_ON_DEVICE);
    expect(model.params.onDeviceParams.promptOptions.responseConstraint).toBeUndefined();
    expect(model.generateContent.mock.calls[0]![0]).toBe('Reply with exactly the word OK.');
    expect(stages).toContain('Waiting for a short local reply');
  });
});
