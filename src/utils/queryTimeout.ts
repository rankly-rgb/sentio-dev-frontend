const DEFAULT_TIMEOUT_MS = 15_000;

export function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  ms = DEFAULT_TIMEOUT_MS,
  label = 'Query',
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(
    () => clearTimeout(timeoutId),
  );
}
