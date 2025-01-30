import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global setup
beforeAll(() => {
  // Add any global setup here
});

// Global teardown
afterAll(() => {
  // Add any global teardown here
}); 