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
 * arrives. If the browser blocked even that, the document is fetched and handed over as a
 * download instead — a blocked pop-up is a browser setting, not a reason to send a landlord away
 * without the receipt his tenant is standing there waiting for.
 */
export async function openBlobDocument(
  fetchBlob: () => Promise<Blob>,
  options?: { blockedMessage?: string; downloadName?: string }
): Promise<void> {
  // Synchronous — must happen before any await.
  const win = window.open('', '_blank', 'noopener,noreferrer')

  if (!win) {
    // Blocked. Do not give up: the document exists and the landlord asked for it. Fetch it and
    // hand it over as a download instead, which needs no popup.
    //
    // This is the third visit on which a landlord pressed "Receipt" and got nothing usable. His
    // tenant pays cash and asks for paper; for that trade the receipt IS the transaction. A
    // pop-up setting is not a good enough reason to send him away empty-handed.
    const blob = await fetchBlob()
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = href
    link.download = options?.downloadName ?? 'document.html'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(href), 60_000)

    return
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
