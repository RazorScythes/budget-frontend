import { createContext, useContext } from 'react'

const BudgetContext = createContext(null)

export const useBudgetContext = () => {
    const ctx = useContext(BudgetContext)
    if (!ctx) throw new Error('useBudgetContext must be used within a BudgetProvider')
    return ctx
}

export default BudgetContext
