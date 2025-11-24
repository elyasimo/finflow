import Content from "./content"
import Layout from "./layout"
import { User, Account, Transaction, Budget } from "@/lib/types"

interface DashboardProps {
  user?: User;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
}

export default function Dashboard({ user, accounts, transactions, budgets }: DashboardProps) {
  return (
    <Layout user={user}>
      <Content 
        user={user}
        accounts={accounts}
        transactions={transactions}
        budgets={budgets}
      />
    </Layout>
  )
}
