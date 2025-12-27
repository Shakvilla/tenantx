'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

interface ApiDocProps {
  spec: Record<string, unknown>
}

/**
 * Modern API documentation component using Scalar.
 * Compatible with React 18/19 strict mode.
 */
export default function ApiDoc({ spec }: ApiDocProps) {
  return (
    <ApiReferenceReact
      configuration={{
        content: spec,
        theme: 'default',
        hideModels: false,
        hideDownloadButton: false,
        defaultHttpClient: {
          targetKey: 'js',
          clientKey: 'fetch',
        },
      }}
    />
  )
}
