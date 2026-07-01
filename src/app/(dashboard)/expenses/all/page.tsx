import ExpensesListTable from '@/views/expenses/all-expenses/ExpensesListTable'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const AllExpensesPage = () => {
  return (
    <FeatureGate
      feature='EXPENSES'
      lockedMessage='Expense tracking is available on the Basic plan. Upgrade to record and categorise property expenses.'
    >
      <ExpensesListTable />
    </FeatureGate>
  )
}

export default AllExpensesPage
