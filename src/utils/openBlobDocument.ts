/**
 * Opens a document that must be fetched with an auth header (so it arrives as a blob) in a new
 * tab, without being eaten by the popup blocker.
 *
 * The order matters and is the whole point of this helper. The obvious version —
 *
 *     const res = await apiClient.get(url, { responseType: 'blob' })
 *     window.open(URL.createObjectURL(res.data), '_blank')
 *
 * — is silently blocked. Once an `await` separates window.open() from the click that caused it,
 * browsers no longer treat it as a user gesture, and the call returns null with no error, no
 * console warning, and nothing on screen. A landlord presses "Receipt" and simply nothing
 * happens; the server meanwhile returned a perfectly good document.
 *
 * That defect was copied: payments and inspections each had their own copy of the wrong order,
 * the second one written to "mirror" the first. Hence one helper.
 *
 * The window is opened FIRST, while the gesture is still live, and pointed at the blob once it
 * arrives. If the browser blocked even that, we say so rather than failing quietly.
 */
export async function openBlobDocument(
  fetchBlob: () => Promise<Blob>,
  options?: { blockedMessage?: string }
): Promise<void> {
  // Synchronous — must happen before any await.
  const win = window.open('', '_blank', 'noopener,noreferrer')

  if (!win) {
    throw new Error(
      options?.blockedMessage ??
        'Your browser blocked the document window. Allow pop-ups for this site and try again.'
    )
  }

  // Something to look at while the document is fetched, instead of an inert blank tab.
  win.document.write('<!doctype html><title>Loading…</title><p style="font:14px system-ui">Loading…</p>')

  try {
    const blob = await fetchBlob()
    const href = URL.createObjectURL(blob)

    win.location.href = href

    // Long enough for the tab to load and the landlord to print it.
    setTimeout(() => URL.revokeObjectURL(href), 60_000)
  } catch (err) {
    // Do not leave a stranded blank tab behind on failure.
    win.close()
    throw err
  }
}
