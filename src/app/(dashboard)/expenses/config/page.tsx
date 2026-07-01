import ExpenseConfigsListTable from '@/views/expenses/config/ExpenseConfigsListTable'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const ExpenseConfigsPage = () => {
  return (
    <FeatureGate
      feature='EXPENSES'
      lockedMessage='Expense tracking is available on the Basic plan.'
    >
      <ExpenseConfigsListTable />
    </FeatureGate>
  )
}

export default ExpenseConfigsPage
