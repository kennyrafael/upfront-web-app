/**
 * Hands a file the browser already has to whatever the browser does with files.
 *
 * `<a download>` rather than `window.open`: a popup blocker treats a new window as a popup
 * unless it can attribute it to a click, and by the time the fetch resolves that attribution
 * is gone. A synthetic click on an anchor is not a popup and is never blocked.
 *
 * The object URL is revoked on the next frame rather than immediately — Safari has not
 * started reading the blob when `click()` returns, and revoking it there gives an empty file.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
