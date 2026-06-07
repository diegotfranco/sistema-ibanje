import { vi } from 'vitest';

// The global test setup (src/test/setup.ts) resolves `min-width` media queries to true so components
// render their DESKTOP layout by default. Tests that specifically exercise the mobile layout
// (DataTable mobileRow lists, etc.) call setMobileViewport() to flip matchMedia to a phone profile.
function stubMatchMedia(predicate: (query: string) => boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: predicate(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia;
}

/** Force a mobile viewport: `min-width` queries resolve false, so components render mobile layout. */
export function setMobileViewport() {
  stubMatchMedia(() => false);
}

/** Force a desktop viewport: `min-width` queries resolve true (the global default). */
export function setDesktopViewport() {
  stubMatchMedia((q) => /min-width/.test(q));
}
