export const remainingBalance = (debt) =>
    Math.max(0, Number(debt.total_amount || 0) - Number(debt.amount_paid || 0))

export const monthsToPayOff = ({ remaining, annualRate, minimumPayment }) => {
    const bal = Number(remaining) || 0
    const payment = Number(minimumPayment) || 0
    if (bal <= 0) return 0
    if (payment <= 0) return null
    const r = Math.max(0, Number(annualRate) || 0) / 100 / 12
    if (r === 0) return Math.ceil(bal / payment)
    if (payment <= bal * r) return null
    return Math.ceil(Math.log(payment / (payment - bal * r)) / Math.log(1 + r))
}

export const snowballOrder = (debts = []) =>
    [...debts]
        .filter(d => d.status !== 'paid' && d.type !== 'owed' && remainingBalance(d) > 0)
        .sort((a, b) => remainingBalance(a) - remainingBalance(b))

export const avalancheOrder = (debts = []) =>
    [...debts]
        .filter(d => d.status !== 'paid' && d.type !== 'owed' && remainingBalance(d) > 0)
        .sort((a, b) => (Number(b.interestRate) || 0) - (Number(a.interestRate) || 0) || remainingBalance(a) - remainingBalance(b))
