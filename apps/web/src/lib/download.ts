import { api } from '@/lib/api';

/**
 * Fetches a file from the authenticated API client and opens it in a new tab,
 * revoking the object URL afterward.
 *
 * Single path for all PDF "view/export" buttons (roster export, donation
 * statements). Going through `api.getBlob` rather than a raw `<a href>` means
 * the request carries credentials and surfaces backend errors as a thrown
 * `ApiError`, so callers can toast a message instead of opening a broken tab.
 *
 * `path` is relative to the API base (no host) — same convention as `api.get`.
 */
export async function openBlobInNewTab(path: string): Promise<void> {
  const blob = await api.getBlob(path);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Give the new tab time to load before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
