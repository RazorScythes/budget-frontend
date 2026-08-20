export const LS_GLOBAL_BALANCES = 'budget_global_balances_visible'

export const loadGlobalBalancesVisible = () => {
    try {
        const v = localStorage.getItem(LS_GLOBAL_BALANCES)
        return v === null ? true : v === 'true'
    } catch {
        return true
    }
}

export const saveGlobalBalancesVisible = (visible) => {
    try {
        localStorage.setItem(LS_GLOBAL_BALANCES, String(visible))
    } catch { /* ignore */ }
}

export const extractCurrencySymbol = (formatCurrency) => {
    const sample = formatCurrency(0)
    const symbol = sample.replace(/[0-9.,\-\s]+/g, '').trim()
    return symbol || '₱'
}

export const maskedBalanceText = (formatCurrency) => `${extractCurrencySymbol(formatCurrency)} ----`

export const maskedBalancePositive = (formatCurrency) => `+${extractCurrencySymbol(formatCurrency)} ----`
