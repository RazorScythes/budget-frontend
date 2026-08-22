import { describe, it, expect } from 'vitest'
import { calcNetWorth, calcMonthOverMonth } from '../netWorth'

describe('calcNetWorth', () => {
    it('computes savings minus debts plus owed to you', () => {
        const result = calcNetWorth({
            savingsAccounts: [{ category: 'bank', total: 10000 }],
            debts: [
                { type: 'owe', status: 'active', total_amount: 3000, amount_paid: 1000 },
                { type: 'owed', status: 'active', total_amount: 500, amount_paid: 0 },
            ],
        })
        expect(result.savingsTotal).toBe(10000)
        expect(result.totalOwed).toBe(2000)
        expect(result.totalOwedToYou).toBe(500)
        expect(result.netWorth).toBe(8500)
    })

    it('converts foreign-currency debts when rates are provided', () => {
        const result = calcNetWorth({
            savingsAccounts: [{ category: 'bank', total: 10000 }],
            debts: [
                { type: 'owe', status: 'active', total_amount: 100, amount_paid: 0, currency: 'USD' },
            ],
            rates: { USD: 0.02 },
            baseCurrency: 'PHP',
        })
        expect(result.totalOwed).toBe(5000)
        expect(result.netWorth).toBe(5000)
    })
})

describe('calcMonthOverMonth', () => {
    it('returns percent change vs previous month', () => {
        const mom = calcMonthOverMonth(
            [{ expense: 1000, income: 2000 }, { expense: 1200, income: 2100 }],
            1,
        )
        expect(mom.expense.pct).toBe(20)
        expect(mom.income.pct).toBe(5)
    })
})
