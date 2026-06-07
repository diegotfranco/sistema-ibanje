import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement matchMedia; ThemeProvider reads it on mount. Stub a light-mode result.
// `min-width` queries resolve true so components render their DESKTOP layout (full DataTable toolbar +
// hideBelow columns); `max-width` (mobile) and `prefers-color-scheme` queries resolve false. Tests
// that need a mobile layout override window.matchMedia locally.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: /min-width/.test(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia;
}

// jsdom lacks ResizeObserver, which several Radix/shadcn primitives observe on mount.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// RTL teardown after every test so the jsdom DOM never leaks between tests.
afterEach(() => {
  cleanup();
});
