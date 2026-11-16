let active: symbol | null = null;

/** One browser model job at a time, including probes launched from another surface. */
export async function withAiRun<T>(run: () => Promise<T>): Promise<T> {
  if (active)
    throw new Error('Another AI task is still running. Cancel it or wait before trying again.');
  const owner = Symbol('ai-run');
  active = owner;
  try {
    return await run();
  } finally {
    if (active === owner) active = null;
  }
}
