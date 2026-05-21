export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms between retries (default: 1000) */
  delay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoff?: number;
  /** Optional predicate to determine if error should trigger retry */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  backoff: 2,
  shouldRetry: () => true,
};

/**
 * Retries a promise-returning function with exponential backoff
 * @param run - Function that returns a promise
 * @param options - Retry configuration options
 * @returns The resolved value of the promise
 * @throws The last error after all retries are exhausted
 */
export async function retry<T>(
  run: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, delay, backoff, shouldRetry } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: unknown;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      if (shouldRetry && !shouldRetry(error)) {
        break;
      }
      await sleep(currentDelay);
      currentDelay *= backoff;
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
