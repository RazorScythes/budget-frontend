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
