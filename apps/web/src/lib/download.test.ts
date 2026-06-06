import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const getBlob = vi.fn();
vi.mock('@/lib/api', () => ({ api: { getBlob: (path: string) => getBlob(path) } }));

import { openBlobInNewTab } from './download';

// openBlobInNewTab routes file views through the authenticated api client, opens the object URL in a
// new tab, then revokes it on a timer so the blob is released without breaking the freshly opened tab.
describe('openBlobInNewTab', () => {
  const open = vi.fn();
  const createObjectURL = vi.fn(() => 'blob:fake-url');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    getBlob.mockReset().mockResolvedValue(new Blob(['x'], { type: 'application/pdf' }));
    window.open = open;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    open.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('fetches the blob and opens it in a new tab', async () => {
    await openBlobInNewTab('/reports/x/pdf');
    expect(getBlob).toHaveBeenCalledWith('/reports/x/pdf');
    expect(createObjectURL).toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith('blob:fake-url', '_blank');
  });

  it('revokes the object URL after the grace period', async () => {
    await openBlobInNewTab('/reports/x/pdf');
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });

  it('propagates a thrown ApiError instead of opening a broken tab', async () => {
    getBlob.mockRejectedValueOnce(new Error('403'));
    await expect(openBlobInNewTab('/reports/x/pdf')).rejects.toThrow('403');
    expect(open).not.toHaveBeenCalled();
  });
});
