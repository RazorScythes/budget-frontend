import { describe, it, expect } from 'vitest'
import { monthsToPayOff, snowballOrder, avalancheOrder, remainingBalance } from '../debtPayoff'

describe('monthsToPayOff', () => {
    it('computes months with no interest', () => {
        expect(monthsToPayOff({ remaining: 1200, annualRate: 0, minimumPayment: 100 })).toBe(12)
    })

    it('returns null when payment cannot cover interest', () => {
        expect(monthsToPayOff({ remaining: 10000, annualRate: 36, minimumPayment: 10 })).toBeNull()
    })
})

describe('payoff order', () => {
    const debts = [
        { _id: 'a', name: 'Card', type: 'owe', status: 'active', total_amount: 5000, amount_paid: 0, interestRate: 24 },
        { _id: 'b', name: 'Bike', type: 'owe', status: 'active', total_amount: 800, amount_paid: 0, interestRate: 6 },
    ]

    it('snowball sorts smallest remaining first', () => {
        expect(snowballOrder(debts).map(d => d._id)).toEqual(['b', 'a'])
    })

    it('avalanche sorts highest APR first', () => {
        expect(avalancheOrder(debts).map(d => d._id)).toEqual(['a', 'b'])
    })

    it('remainingBalance subtracts payments', () => {
        expect(remainingBalance({ total_amount: 100, amount_paid: 25 })).toBe(75)
    })
})
