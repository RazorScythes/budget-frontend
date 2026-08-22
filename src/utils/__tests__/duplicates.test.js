import { describe, it, expect } from 'vitest'
import { findDuplicateCandidates, applyCategoryRules, isSimilarDescription } from '../duplicates'

describe('findDuplicateCandidates', () => {
    const existing = [
        { _id: '1', description: 'Grab ride', amount: 150, date: '2026-08-22' },
        { _id: '2', description: 'Coffee', amount: 120, date: '2026-08-21' },
    ]

    it('flags same day, amount, and similar description', () => {
        const hits = findDuplicateCandidates(existing, { description: 'Grab ride home', amount: 150, date: '2026-08-22' })
        expect(hits).toHaveLength(1)
        expect(hits[0]._id).toBe('1')
    })

    it('ignores different amounts', () => {
        const hits = findDuplicateCandidates(existing, { description: 'Grab ride', amount: 200, date: '2026-08-22' })
        expect(hits).toHaveLength(0)
    })
})

describe('isSimilarDescription', () => {
    it('matches contained phrases', () => {
        expect(isSimilarDescription('Grab ride to office', 'Grab ride')).toBe(true)
    })
})

describe('applyCategoryRules', () => {
    it('returns the matching category id', () => {
        const id = applyCategoryRules('Grab to Makati', [{ pattern: 'grab', category: 'transport' }])
        expect(id).toBe('transport')
    })
})
