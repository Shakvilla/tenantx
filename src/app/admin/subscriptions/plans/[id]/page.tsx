'use client'

import { useParams } from 'next/navigation'

import PlanEditorForm from '@/views/admin/plans/PlanEditorForm'

const EditPlanPage = () => {
  const { id } = useParams<{ id: string }>()

  return <PlanEditorForm planId={id} />
}

export default EditPlanPage
