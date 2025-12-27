/**
 * @swagger
 * /api/v1/properties/upload:
 *   post:
 *     summary: Upload property images
 *     description: Upload one or more images for a property
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               propertyId:
 *                 type: string
 *                 description: Optional property ID to organize files
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Invalid file or no files provided
 *       401:
 *         description: Unauthorized
 */

import { type NextRequest, NextResponse } from 'next/server'

import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { uploadPropertyImage } from '@/services/storage-service'

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get tenant context
    const { tenantId, supabase } = await authenticateApiRoute(request)

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const propertyId = formData.get('propertyId') as string | null

    // Validate we have files
    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NO_FILES', message: 'No files provided' },
        },
        { status: 400 }
      )
    }

    // Filter out non-file entries
    const validFiles = files.filter((file) => file instanceof File && file.size > 0)

    if (validFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NO_VALID_FILES', message: 'No valid files provided' },
        },
        { status: 400 }
      )
    }

    // Upload all files
    const results = []

    for (const file of validFiles) {
      const result = await uploadPropertyImage(
        supabase,
        tenantId,
        file,
        propertyId || undefined
      )

      results.push(result)
    }

    return NextResponse.json({
      success: true,
      data: {
        images: results,
        count: results.length,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
