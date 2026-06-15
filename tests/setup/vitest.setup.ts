import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks(); // Clear all mocks before each test to ensure test isolation
  vi.useRealTimers(); // Use real timers by default; individual tests can override this if needed
});
