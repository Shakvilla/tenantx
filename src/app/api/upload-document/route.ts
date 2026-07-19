/**
 * POST /api/upload-document
 *
 * Uploads a file to Supabase Storage using the native fetch API — no SDK.
 * SUPABASE_SERVICE_ROLE_KEY is a real JWT, so it works as a raw Bearer token
 * against the Storage REST API. The anon key (sb_publishable_*) is never used.
 *
 * Body: FormData  →  file (File) + tenantId (string)
 * Returns: { publicUrl, path, fileId, fileName, bytes, mimeType }
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const BUCKET        = 'documents'

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: 'Supabase is not configured on the server.' },
      { status: 500 }
    )
  }

  const formData = await req.formData()
  const file     = formData.get('file')     as File   | null
  const tenantId = formData.get('tenantId') as string | null

  if (!file)     return NextResponse.json({ error: 'No file provided.' },     { status: 400 })
  if (!tenantId) return NextResponse.json({ error: 'No tenantId provided.' }, { status: 400 })

  const sanitised = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path      = `${tenantId}/${Date.now()}-${sanitised}`

  // Hit the Supabase Storage REST API directly — no SDK dependency
  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${SERVICE_KEY}`,
        'Content-Type': file.type,
        'x-upsert':     'false'
      },
      body: await file.arrayBuffer()
    }
  )

  if (!uploadRes.ok) {
    const body = await uploadRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: (body as any)?.message ?? `Upload failed (HTTP ${uploadRes.status})` },
      { status: uploadRes.status }
    )
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`

  return NextResponse.json({
    publicUrl,
    path,
    fileId:   path,
    fileName: file.name,
    bytes:    file.size,
    mimeType: file.type
  })
}

/**
 * DELETE /api/upload-document?path=<tenantId>/<file>
 *
 * Removes a previously-uploaded object from Supabase Storage so deleting a
 * document doesn't leave an orphaned file behind. `path` is the document's
 * stored `fileId` (which equals its storage path).
 */
export async function DELETE(req: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: 'Supabase is not configured on the server.' },
      { status: 500 }
    )
  }

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'No path provided.' }, { status: 400 })

  const delRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${SERVICE_KEY}` } }
  )

  if (!delRes.ok) {
    const body = await delRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: (body as any)?.message ?? `Delete failed (HTTP ${delRes.status})` },
      { status: delRes.status }
    )
  }

  return NextResponse.json({ ok: true })
}
