import { afterEach, describe, expect, it, vi } from 'vitest';
type FakeReply = { response: { inferenceSource: string; text: () => string } };

const sdk = vi.hoisted(() => ({
  prepare: undefined as undefined | ((progress: (fraction: number) => void) => Promise<void>),
  reply: undefined as undefined | (() => Promise<FakeReply>),
  models: [] as Array<{
    params: any;
    initializeDeviceModel: ReturnType<typeof vi.fn>;
    generateContent: ReturnType<typeof vi.fn>;
    generateContentStream: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock('../src/services/firebase', () => ({ getFirebaseServices: () => ({ app: {} }) }));
vi.mock('firebase/ai', async (original) => ({
  ...(await original<typeof import('firebase/ai')>()),
  getAI: () => ({}),
  getGenerativeModel: (_ai: unknown, params: unknown) => {
    const answer = async (): Promise<FakeReply> =>
      sdk.reply ? sdk.reply() : { response: { inferenceSource: 'on_device', text: () => 'OK' } };
    const model = {
      params,
      initializeDeviceModel: vi.fn(async (progress: (fraction: number) => void) => {
        await sdk.prepare?.(progress);
      }),
      generateContent: vi.fn(answer),
      generateContentStream: vi.fn(async () => {
        const value = await answer();
        return {
          stream: (async function* () {
            yield value.response;
          })(),
          response: Promise.resolve(value.response),
        };
      }),
    };
    sdk.models.push(model);
    return model;
  },
}));
import { FirebaseHybridEngine, checkLocalAi } from '../src/services/hybridAi';
import { InferenceSource, InferenceMode } from 'firebase/ai';

afterEach(() => {
  sdk.models.length = 0;
  sdk.prepare = undefined;
  sdk.reply = undefined;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('Firebase local request lifecycle', () => {
  it('finishes readiness on a verified first token even if the model never ends its turn', async () => {
    vi.stubGlobal('window', { LanguageModel: {} });
    const run = checkLocalAi(new AbortController().signal, () => {});
    const model = sdk.models[0]!;
    model.generateContentStream.mockResolvedValue({
      stream: (async function* () {
        yield { inferenceSource: InferenceSource.ON_DEVICE, text: () => 'OK' };
        await new Promise(() => {});
      })(),
      response: new Promise(() => {}),
    });
    await expect(run).resolves.toBeUndefined();
    expect(model.params.onDeviceParams.createOptions.signal.aborted).toBe(true);
  });
  it('does not spend the reply deadline on a progressing first download', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { LanguageModel: {} });
    let finishSetup: () => void = () => {};
    const setup = new Promise<void>((resolve) => {
      finishSetup = resolve;
    });
    let progress: (fraction: number) => void = () => {};
    sdk.prepare = (next) => {
      progress = next;
      return setup;
    };
    const retry = checkLocalAi(new AbortController().signal, () => {});
    await vi.advanceTimersByTimeAsync(100000);
    progress(0.2);
    await vi.advanceTimersByTimeAsync(100000);
    progress(0.4);
    finishSetup();
    await expect(retry).resolves.toBeUndefined();
    expect(sdk.models[0]!.params.mode).toBe(InferenceMode.ONLY_ON_DEVICE);
  });
  it('aborts stalled setup, releases the shared lock and lets the next check run', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { LanguageModel: {} });
    sdk.prepare = () => new Promise<void>(() => {});
    const run = checkLocalAi(new AbortController().signal, () => {});
    const rejected = expect(run).rejects.toThrow(/no new progress for 120 seconds/);
    await vi.advanceTimersByTimeAsync(120001);
    await rejected;
    expect(sdk.models[0]!.params.onDeviceParams.createOptions.signal.aborted).toBe(true);
    sdk.prepare = undefined;
    await expect(checkLocalAi(new AbortController().signal, () => {})).resolves.toBeUndefined();
  });
  it('gives a reply its own deadline after a long setup', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { LanguageModel: {} });
    sdk.prepare = () => new Promise((resolve) => setTimeout(resolve, 100000));
    sdk.reply = () =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ response: { inferenceSource: 'on_device', text: () => 'OK' } }),
          80000,
        ),
      );
    const run = checkLocalAi(new AbortController().signal, () => {});
    await vi.advanceTimersByTimeAsync(180000);
    await expect(run).resolves.toBeUndefined();
  });
  it('prevents two surfaces from starting model jobs at the same time', async () => {
    vi.stubGlobal('window', { LanguageModel: {} });
    sdk.prepare = () => new Promise<void>(() => {});
    const controller = new AbortController();
    const first = checkLocalAi(controller.signal, () => {});
    await expect(checkLocalAi(new AbortController().signal, () => {})).rejects.toThrow(
      /Another AI task/,
    );
    expect(sdk.models).toHaveLength(1);
    controller.abort();
    await expect(first).rejects.toThrow(/cancelled/);
  });
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
    sdk.reply = async () => ({
      response: { inferenceSource: InferenceSource.IN_CLOUD, text: () => 'OK' },
    });
    const run = checkLocalAi(new AbortController().signal, (stage) => stages.push(stage));
    const model = sdk.models[0]!;
    await expect(run).rejects.toThrow(/verifiable/);
    expect(model.params.mode).toBe(InferenceMode.ONLY_ON_DEVICE);
    expect(model.params.onDeviceParams.promptOptions.responseConstraint).toBeUndefined();
    expect(model.generateContentStream.mock.calls[0]![0]).toBe('Reply with exactly the word OK.');
    expect(stages).toContain('Waiting for a short local reply');
  });
});
