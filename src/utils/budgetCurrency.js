import { CURRENCIES, DEFAULT_EXCHANGE_RATES } from '../components/Pages/Budget/constants'

export const buildExchangeRates = (savedRates, liveRates) => {
    const live = liveRates || {}
    const user = savedRates || {}
    const merged = { ...DEFAULT_EXCHANGE_RATES }
    CURRENCIES.forEach(c => {
        if (c.code === 'PHP') return
        if (live[c.code]) merged[c.code] = live[c.code]
    })
    Object.entries(user).forEach(([code, val]) => {
        if (val > 0) merged[code] = val
    })
    return merged
}

export const toTargetCurrency = (amount, fromCurrency, target, exchangeRates) => {
    if (fromCurrency === target) return amount
    if (target === 'PHP') {
        if (fromCurrency === 'PHP') return amount
        const fromRate = exchangeRates[fromCurrency]
        return (fromRate && fromRate > 0) ? amount / fromRate : amount
    }
    const targetRate = exchangeRates[target]
    if (!targetRate || targetRate <= 0) return null
    if (fromCurrency === 'PHP') return amount * targetRate
    const fromRate = exchangeRates[fromCurrency]
    return (fromRate && fromRate > 0) ? (amount / fromRate) * targetRate : amount * targetRate
}

export const getActiveViewCurrency = (viewCurrency, baseCurrency = 'PHP') => viewCurrency || baseCurrency || 'PHP'

export const computeMonthlyStats = ({ expenses, month, year, viewCurrency, exchangeRates, baseCurrency = 'PHP' }) => {
    const active = (expenses || []).filter(e => {
        if (e.listOnly) return false
        const d = new Date(e.date)
        return d.getMonth() + 1 === month && d.getFullYear() === year
    })

    const target = getActiveViewCurrency(viewCurrency, baseCurrency)
    const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', target, exchangeRates) ?? amt

    const income = active
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + convert(e.amount, e.currency), 0)

    const spent = active
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + convert(e.amount, e.currency), 0)

    return {
        income,
        expenses: spent,
        balance: income - spent,
        currency: target,
    }
}
