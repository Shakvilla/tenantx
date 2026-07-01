/**
 * POST /api/upload-logo
 *
 * Uploads a logo image to Supabase Storage under the `logos/` folder
 * of the existing `documents` bucket. Returns the public URL which is
 * then saved as the `branding.logo_url` platform setting.
 *
 * Body: FormData  →  file (File)
 * Returns: { publicUrl }
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const BUCKET       = 'documents'

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: 'Supabase is not configured on the server.' },
      { status: 500 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload PNG, JPG, GIF, SVG, or WebP.' },
      { status: 400 }
    )
  }

  const ext       = file.name.split('.').pop() ?? 'png'
  const path      = `logos/platform-logo-${Date.now()}.${ext}`

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${SERVICE_KEY}`,
        'Content-Type': file.type,
        'x-upsert':     'true',   // overwrite any previous logo
      },
      body: await file.arrayBuffer(),
    }
  )

  if (!uploadRes.ok) {
    const body = await uploadRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: (body as { message?: string }).message ?? `Upload failed (HTTP ${uploadRes.status})` },
      { status: uploadRes.status }
    )
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
  return NextResponse.json({ publicUrl })
}
