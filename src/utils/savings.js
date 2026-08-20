import { DENOMINATIONS } from '../components/Pages/Budget/constants'

export const calcDenominationsTotal = (denominations = {}) =>
    DENOMINATIONS.reduce((sum, d) => sum + (parseInt(denominations?.[d.value], 10) || 0) * d.value, 0)

export const calcAccountTotal = (account) => {
    if (!account) return 0
    if (typeof account.computedTotal === 'number') return account.computedTotal
    if (account.category === 'bank') return parseFloat(account.total) || 0
    return calcDenominationsTotal(account.denominations)
}

export const calcAllSavingsTotal = (accounts) => {
    if (!Array.isArray(accounts)) {
        if (accounts && typeof accounts === 'object') return calcDenominationsTotal(accounts)
        return 0
    }
    return accounts.reduce((sum, account) => sum + calcAccountTotal(account), 0)
}

export const emptyDenominations = () => {
    const init = {}
    DENOMINATIONS.forEach(d => { init[d.value] = 0 })
    return init
}

export const countsFromDenominations = (denominations = {}) => {
    const counts = {}
    DENOMINATIONS.forEach(d => {
        const val = denominations[d.value]
        counts[d.value] = val ? parseInt(val, 10) : ''
    })
    return counts
}

const PERIODS_PER_YEAR = { daily: 365, weekly: 52, monthly: 12, yearly: 1 }

export const calcInterestEstimate = (balance, interestRate, withholdingTax = 20, frequency = 'daily') => {
    const principal = Math.max(0, parseFloat(balance) || 0)
    const rate = Math.max(0, parseFloat(interestRate) || 0)
    const tax = Math.min(100, Math.max(0, parseFloat(withholdingTax) || 0))
    const periods = PERIODS_PER_YEAR[frequency] || PERIODS_PER_YEAR.daily
    const gross = principal * (rate / 100) / periods
    const taxAmt = gross * (tax / 100)
    const net = gross - taxAmt
    const round = (n) => Math.round(n * 100) / 100
    return { gross: round(gross), tax: round(taxAmt), net: round(net) }
}

/** Net interest estimates per day, month, and year (after withholding tax). */
export const calcInterestBreakdown = (balance, interestRate, withholdingTax = 20) => ({
    daily: calcInterestEstimate(balance, interestRate, withholdingTax, 'daily'),
    monthly: calcInterestEstimate(balance, interestRate, withholdingTax, 'monthly'),
    yearly: calcInterestEstimate(balance, interestRate, withholdingTax, 'yearly'),
})

export const INTEREST_FREQUENCY_OPTIONS = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
]
