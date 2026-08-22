import { describe, it, expect } from 'vitest'
import { calcCashRunway } from '../cashRunway'

describe('calcCashRunway', () => {
    it('divides savings by daily burn', () => {
        const result = calcCashRunway({ savingsTotal: 10000, ytdExpenses: 3000, daysElapsed: 30 })
        expect(result.dailyBurn).toBe(100)
        expect(result.days).toBe(100)
    })

    it('returns no spending when burn is zero', () => {
        const result = calcCashRunway({ savingsTotal: 5000, ytdExpenses: 0, daysElapsed: 10, monthExpenses: 0 })
        expect(result.days).toBeNull()
        expect(result.label).toBe('No spending yet')
    })
})
