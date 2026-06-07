import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

const originalMatchMedia = window.matchMedia;
const originalWidth = window.innerWidth;

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  setWidth(originalWidth);
});

// useIsMobile reflects whether the viewport is below the 768px breakpoint, and reacts to changes.
describe('useIsMobile', () => {
  it('reports true for a narrow viewport on mount', () => {
    setWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('reports false for a wide viewport on mount', () => {
    setWidth(1200);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates when the media query change fires', () => {
    let changeHandler: (() => void) | null = null;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: () => void) => {
        changeHandler = cb;
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as unknown as typeof window.matchMedia;

    setWidth(1200);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setWidth(400);
      changeHandler?.();
    });
    expect(result.current).toBe(true);
  });
});
