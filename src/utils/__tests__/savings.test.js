import { describe, it, expect } from 'vitest'
import { calcAccountTotal, calcAllSavingsTotal, calcInterestEstimate } from '../savings'

describe('calcAccountTotal', () => {
    it('sums bank account total', () => {
        expect(calcAccountTotal({ category: 'bank', total: 1500 })).toBe(1500)
    })

    it('uses computedTotal when present', () => {
        expect(calcAccountTotal({ computedTotal: 999 })).toBe(999)
    })
})

describe('calcAllSavingsTotal', () => {
    it('sums multiple accounts', () => {
        const accounts = [
            { category: 'bank', total: 1000 },
            { category: 'cash', denominations: { 100: 2, 1000: 0, 500: 0, 200: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 } },
        ]
        expect(calcAllSavingsTotal(accounts)).toBe(1200)
    })
})

describe('calcInterestEstimate', () => {
    it('applies withholding tax', () => {
        const { gross, net, tax } = calcInterestEstimate(100000, 4, 20, 'yearly')
        expect(gross).toBeGreaterThan(0)
        expect(tax).toBeGreaterThan(0)
        expect(net).toBeLessThan(gross)
        expect(Math.round((net + tax) * 100)).toBe(Math.round(gross * 100))
    })
})
