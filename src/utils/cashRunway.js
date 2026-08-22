export const calcCashRunway = ({ savingsTotal = 0, ytdExpenses = 0, daysElapsed = 0, monthExpenses = 0 }) => {
    const safeSavings = Math.max(0, Number(savingsTotal) || 0)
    const ytdDaily = daysElapsed > 0 ? (Number(ytdExpenses) || 0) / daysElapsed : 0
    const monthDaily = (Number(monthExpenses) || 0) / Math.max(1, new Date().getDate())
    const dailyBurn = ytdDaily > 0 ? ytdDaily : monthDaily
    if (dailyBurn <= 0) {
        return { days: null, dailyBurn: 0, label: 'No spending yet' }
    }
    const days = Math.floor(safeSavings / dailyBurn)
    return {
        days,
        dailyBurn,
        label: days >= 365 ? '12+ months' : days === 1 ? '1 day' : `${days} days`,
    }
}
