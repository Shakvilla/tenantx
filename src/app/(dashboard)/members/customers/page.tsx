// Next Imports
import type { Metadata } from 'next'

// Component Imports
import CustomersListTable from '@views/members/customers/CustomersListTable'

export const metadata: Metadata = {
  title: 'Customers List',
  description: 'List of all customers'
}

const CustomersPage = () => {
  return <CustomersListTable />
}

export default CustomersPage

