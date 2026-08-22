import { calcAllSavingsTotal } from './savings'

/**
 * Net worth = savings + debts owed to you − debts you owe
 */
const convert = (amount, currency, rates = {}, base = 'PHP') => {
    const from = currency || base
    if (from === base) return Number(amount) || 0
    const rate = Number(rates[from])
    if (!rate) return Number(amount) || 0
    return (Number(amount) || 0) / rate
}

export const calcNetWorth = ({ savingsAccounts = [], debts = [], rates = {}, baseCurrency = 'PHP' }) => {
    const savingsTotal = calcAllSavingsTotal(savingsAccounts)
    const activeDebts = debts.filter(d => d.status !== 'paid' && d.amount_paid < d.total_amount)
    const totalOwed = activeDebts.filter(d => d.type === 'owe').reduce((s, d) => s + convert(d.total_amount - d.amount_paid, d.currency, rates, baseCurrency), 0)
    const totalOwedToYou = activeDebts.filter(d => d.type === 'owed').reduce((s, d) => s + convert(d.total_amount - d.amount_paid, d.currency, rates, baseCurrency), 0)
    return {
        netWorth: savingsTotal + totalOwedToYou - totalOwed,
        savingsTotal,
        totalOwed,
        totalOwedToYou,
    }
}

/**
 * Month-over-month spending change from YTD breakdown (0-indexed months).
 */
export const calcMonthOverMonth = (monthlyBreakdown, currentMonthIndex) => {
    if (!monthlyBreakdown || currentMonthIndex < 1) return null
    const prev = monthlyBreakdown[currentMonthIndex - 1]
    const curr = monthlyBreakdown[currentMonthIndex]
    if (!prev || !curr) return null
    const changes = {}
    ;['expense', 'income'].forEach(key => {
        const p = prev[key] || 0
        const c = curr[key] || 0
        changes[key] = {
            current: c,
            previous: p,
            diff: c - p,
            pct: p > 0 ? Math.round(((c - p) / p) * 100) : (c > 0 ? 100 : 0),
        }
    })
    return changes
}
