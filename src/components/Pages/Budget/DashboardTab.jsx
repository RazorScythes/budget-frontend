import React, { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faWallet, faChartPie, faArrowUp, faArrowDown, faSyncAlt, faPiggyBank,
    faHandHoldingUsd, faCheckCircle, faExclamationTriangle, faCalendarCheck,
    faEye, faFilePdf, faCoins, faCheck, faUniversity, faExchangeAlt, faCalendarAlt,
    faHistory, faTimes,
    faMobileAlt, faCreditCard, faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AnimateIn, ModalOverlay, SafeIcon } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import TrendsChart from './TrendsChart'
import { calcNetWorth } from '../../../utils/netWorth'
import { calcAllSavingsTotal, calcAccountTotal } from '../../../utils/savings'
import { calcCashRunway } from '../../../utils/cashRunway'
import { MONTHS, DENOMINATIONS as DENOMINATIONS_CONST } from './constants'

// ==================== DASHBOARD TAB ====================

const DashboardTab = React.memo(({ dashboard, expenses, categories, monthlyBudgetData, isLight, card, formatCurrency, formatCurrencyRaw, statusColor, isLoading, activeViewCurrency, toTargetCurrency, month, year, savingsAccounts, debts, goals, paymentIcon, setReceiptViewer, ytdData, ytdLoading, isViewer, templateStyles, allocatedPool, autoSavings, showBalances = true, maskedBalance = '₱ ----', netWorthHistory = [] }) => {
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    if (isLoading || !dashboard) {
        return (
            <div className="page-type-scale space-y-4">
                <div className={`${templateStyles?.statGridCls || 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} ${templateStyles?.gridGap || 'gap-4'}`}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${card} p-5`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`h-3 w-20 ${pulse}`} />
                                <div className={`w-8 h-8 rounded-lg ${pulse}`} />
                            </div>
                            <div className={`h-6 w-28 ${pulse}`} />
                        </div>
                    ))}
                </div>
                <div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className={`${card} p-5`}>
                            <div className={`h-4 w-40 mb-4 ${pulse}`} />
                            <div className="space-y-3">
                                {[...Array(4)].map((_, j) => (
                                    <div key={j}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className={`h-3 w-24 ${pulse}`} />
                                            <div className={`h-3 w-16 ${pulse}`} />
                                        </div>
                                        <div className={`h-1.5 rounded-full ${pulse}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className={`${card} p-5`}>
                    <div className={`h-4 w-32 mb-4 ${pulse}`} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className={`h-7 w-20 mx-auto ${pulse}`} />
                                <div className={`h-3 w-16 mx-auto mt-2 ${pulse}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const d = dashboard
    const active = expenses.filter(e => !e.listOnly)
    const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt

    const totalIncome = active.filter(e => e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const totalExpenses = active.filter(e => e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const balance = totalIncome - totalExpenses
    const totalBudget = monthlyBudgetData.reduce((s, c) => s + (c.budget || 0), 0)
    const remainingBudget = totalBudget - totalExpenses
    const balancePositive = balance >= 0
    const transactionCount = active.length
    const listOnlyCount = expenses.length - active.length
    const daysInMonth = new Date(year, month, 0).getDate()
    const dailyAvg = transactionCount > 0 ? totalExpenses / daysInMonth : 0

    const currencyBreakdown = useMemo(() => {
        const map = {}
        active.forEach(e => {
            const cur = e.currency || 'PHP'
            if (!map[cur]) map[cur] = { income: 0, expense: 0 }
            if (e.type === 'income') map[cur].income += e.amount
            else map[cur].expense += e.amount
        })
        return Object.entries(map).filter(([code]) => code !== activeViewCurrency)
    }, [active, activeViewCurrency])

    const topCategories = useMemo(() => {
        const catMap = {}
        active.filter(e => e.type === 'expense').forEach(e => {
            const catId = e.category?._id || 'uncategorized'
            const cat = categories.find(c => c._id === catId)
            if (!catMap[catId]) catMap[catId] = { id: catId, name: cat?.name || 'Uncategorized', color: cat?.color || '#94a3b8', icon: cat?.icon || '', amount: 0 }
            catMap[catId].amount += convert(e.amount, e.currency)
        })
        return Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 6)
    }, [active, categories, activeViewCurrency])

    const paymentMethods = useMemo(() => {
        const map = {}
        active.filter(e => e.type === 'expense').forEach(e => {
            const m = e.paymentMethod || 'Cash'
            if (!map[m]) map[m] = 0
            map[m] += convert(e.amount, e.currency)
        })
        return Object.entries(map).sort((a, b) => b[1] - a[1])
    }, [active, activeViewCurrency])

    const incomeSources = useMemo(() => {
        const catMap = {}
        active.filter(e => e.type === 'income').forEach(e => {
            const catId = e.category?._id || 'uncategorized'
            const cat = categories.find(c => c._id === catId)
            if (!catMap[catId]) catMap[catId] = { id: catId, name: cat?.name || 'Uncategorized', color: cat?.color || '#94a3b8', icon: cat?.icon || '', amount: 0 }
            catMap[catId].amount += convert(e.amount, e.currency)
        })
        return Object.values(catMap).sort((a, b) => b.amount - a.amount)
    }, [active, categories, activeViewCurrency])

    const [drilldown, setDrilldown] = useState(null)
    const [debtDrilldown, setDebtDrilldown] = useState(null)
    const [savingsDrilldown, setSavingsDrilldown] = useState(null)
    const [goalsDrilldown, setGoalsDrilldown] = useState(null)

    const drilldownItems = useMemo(() => {
        if (!drilldown) return []
        const src = drilldown.type === 'currency' ? expenses.filter(e => !e.listOnly) : active
        const items = src.filter(e => {
            if (drilldown.type === 'category') return e.type === 'expense' && (e.category?._id || 'uncategorized') === drilldown.id
            if (drilldown.type === 'payment') return e.type === 'expense' && (e.paymentMethod || 'Cash') === drilldown.id
            if (drilldown.type === 'income') return e.type === 'income' && (e.category?._id || 'uncategorized') === drilldown.id
            if (drilldown.type === 'budget') return e.type === 'expense' && (e.category?._id || 'uncategorized') === drilldown.id
            if (drilldown.type === 'currency') return (e.currency || 'PHP') === drilldown.id
            return false
        })
        return items.sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [drilldown, active, expenses])

    const budgetCategories = useMemo(() => monthlyBudgetData.filter(c => c.budget > 0), [monthlyBudgetData])

    const recentTransactions = useMemo(() =>
        [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    , [expenses])

    const topExpenses = useMemo(() =>
        active.filter(e => e.type === 'expense')
            .map(e => ({ ...e, converted: convert(e.amount, e.currency) }))
            .sort((a, b) => b.converted - a.converted)
            .slice(0, 5)
    , [active, activeViewCurrency])

    const savingsTotal = useMemo(() => calcAllSavingsTotal(savingsAccounts), [savingsAccounts])

    const activeDebts = debts?.filter(d => d.amount_paid < d.total_amount) || []

    const budgetAlerts = useMemo(() => {
        const alerts = []
        monthlyBudgetData.filter(c => c.budget > 0).forEach(cat => {
            const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0
            if (pct > 100) alerts.push({ type: 'exceeded', severity: 'danger', icon: faExclamationTriangle, name: cat.name, color: cat.color, pct: Math.round(pct), spent: cat.spent, budget: cat.budget, msg: `Over budget by ${formatCurrency(cat.spent - cat.budget)}` })
            else if (pct >= 80 && pct < 100) alerts.push({ type: 'warning', severity: 'warning', icon: faExclamationTriangle, name: cat.name, color: cat.color, pct: Math.round(pct), spent: cat.spent, budget: cat.budget, msg: `${formatCurrency(cat.budget - cat.spent)} remaining` })
        })
        if (activeDebts.some(d => d.due_date && new Date(d.due_date) < new Date())) {
            const overdueCount = activeDebts.filter(d => d.due_date && new Date(d.due_date) < new Date()).length
            alerts.push({ type: 'overdue', severity: 'danger', icon: faHandHoldingUsd, msg: `${overdueCount} overdue debt${overdueCount > 1 ? 's' : ''} need attention` })
        }
        if (goals?.some(g => g.deadline && new Date(g.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && g.currentAmount < g.targetAmount)) {
            const approachingGoals = goals.filter(g => g.deadline && new Date(g.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && g.currentAmount < g.targetAmount)
            alerts.push({ type: 'goal', severity: 'warning', icon: faCalendarCheck, msg: `${approachingGoals.length} goal${approachingGoals.length > 1 ? 's' : ''} deadline${approachingGoals.length > 1 ? 's' : ''} approaching` })
        }
        return alerts
    }, [monthlyBudgetData, activeDebts, goals])
    const totalOwed = activeDebts.filter(d => d.type === 'owe').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0)
    const totalOwedToYou = activeDebts.filter(d => d.type === 'owed').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0)
    const activeGoals = goals?.filter(g => g.currentAmount < g.targetAmount) || []
    const goalsTotalSaved = activeGoals.reduce((s, g) => s + (g.currentAmount || 0), 0)
    const goalsTotalTarget = activeGoals.reduce((s, g) => s + (g.targetAmount || 0), 0)
    const goalsOverallPct = goalsTotalTarget > 0 ? Math.round((goalsTotalSaved / goalsTotalTarget) * 100) : 0

    const netWorthData = useMemo(() => calcNetWorth({ savingsAccounts, debts }), [savingsAccounts, debts])
    const runway = useMemo(() => {
        const ytdExpense = ytdData?.totalExpenses || 0
        const start = new Date(year, 0, 1)
        const daysElapsed = Math.max(1, Math.round((Date.now() - start) / 86400000))
        return calcCashRunway({
            savingsTotal: netWorthData.savingsTotal,
            ytdExpenses: ytdExpense,
            daysElapsed,
            monthExpenses: totalExpenses,
        })
    }, [netWorthData.savingsTotal, ytdData, year, totalExpenses])
    const historyChart = useMemo(() => (netWorthHistory || []).map(s => ({
        name: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        netWorth: s.netWorth,
        savings: s.savingsTotal,
    })), [netWorthHistory])

    const autoSavingsPct = totalIncome > 0 ? Math.round((autoSavings / totalIncome) * 100) : 0
    const summaryCards = [
        { label: 'Total Income', value: formatCurrencyRaw(totalIncome, activeViewCurrency), icon: faArrowUp, color: 'emerald' },
        { label: 'Total Expenses', value: formatCurrencyRaw(totalExpenses, activeViewCurrency), icon: faArrowDown, color: 'red' },
        { label: 'Balance', value: formatCurrencyRaw(balance, activeViewCurrency), icon: faWallet, color: balancePositive ? 'blue' : 'red' },
        { label: 'Remaining Budget', value: formatCurrencyRaw(remainingBudget, activeViewCurrency), icon: faChartPie, color: remainingBudget >= 0 ? 'emerald' : 'red' },
    ]

    const colorMap = {
        emerald: { icon: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20' },
        red: { icon: isLight ? 'text-red-600' : 'text-red-400', bg: isLight ? 'bg-red-50' : 'bg-red-900/20' },
        blue: { icon: templateStyles?.accentText || (isLight ? 'text-blue-600' : 'text-blue-400'), bg: templateStyles?.accentBg || (isLight ? 'bg-blue-50' : 'bg-blue-900/20') },
    }

    const budgetUsedPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0

    const healthScore = useMemo(() => {
        let score = 100
        let factors = []

        if (totalBudget > 0) {
            if (budgetUsedPct > 100) { score -= 30; factors.push({ label: 'Over budget', impact: -30, color: 'red' }) }
            else if (budgetUsedPct > 90) { score -= 15; factors.push({ label: 'Near budget limit', impact: -15, color: 'amber' }) }
            else if (budgetUsedPct < 50 && transactionCount > 0) { factors.push({ label: 'Budget well managed', impact: 0, color: 'emerald' }) }
        }

        if (totalIncome > 0) {
            const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100
            if (savingsRate >= 20) { factors.push({ label: `${Math.round(savingsRate)}% savings rate`, impact: 0, color: 'emerald' }) }
            else if (savingsRate >= 0) { score -= 10; factors.push({ label: `Low savings rate (${Math.round(savingsRate)}%)`, impact: -10, color: 'amber' }) }
            else { score -= 25; factors.push({ label: 'Spending exceeds income', impact: -25, color: 'red' }) }
        }

        const overBudgetCats = monthlyBudgetData.filter(c => c.budget > 0 && c.percentage > 100).length
        if (overBudgetCats > 2) { score -= 15; factors.push({ label: `${overBudgetCats} categories over budget`, impact: -15, color: 'red' }) }
        else if (overBudgetCats > 0) { score -= 5; factors.push({ label: `${overBudgetCats} category over budget`, impact: -5, color: 'amber' }) }

        const overdueDebts = activeDebts.filter(d => d.due_date && new Date(d.due_date) < new Date()).length
        if (overdueDebts > 0) { score -= 10; factors.push({ label: `${overdueDebts} overdue debt${overdueDebts > 1 ? 's' : ''}`, impact: -10, color: 'red' }) }

        if (transactionCount === 0 && new Date().getMonth() + 1 === month) {
            score -= 5; factors.push({ label: 'No transactions logged', impact: -5, color: 'amber' })
        }

        return { score: Math.max(0, Math.min(100, score)), factors }
    }, [totalBudget, budgetUsedPct, totalIncome, totalExpenses, monthlyBudgetData, activeDebts, transactionCount, month])

    const spendingInsights = useMemo(() => {
        const insights = []
        if (!ytdData || !ytdData.monthlyBreakdown) return insights

        const prevMonthIdx = month - 2
        const currMonthIdx = month - 1
        const prevData = ytdData.monthlyBreakdown[prevMonthIdx]
        const currExpense = totalExpenses

        if (prevData && prevData.expense > 0) {
            const change = ((currExpense - prevData.expense) / prevData.expense) * 100
            if (Math.abs(change) >= 10) {
                insights.push({
                    type: change > 0 ? 'increase' : 'decrease',
                    label: `${Math.abs(Math.round(change))}% ${change > 0 ? 'more' : 'less'} spending vs last month`,
                    detail: `${formatCurrencyRaw(prevData.expense, activeViewCurrency)} → ${formatCurrencyRaw(currExpense, activeViewCurrency)}`,
                    color: change > 0 ? 'red' : 'emerald',
                })
            }
        }

        if (ytdData.monthlyAvg > 0 && currExpense > ytdData.monthlyAvg * 1.3) {
            insights.push({
                type: 'above_average',
                label: 'Spending above yearly average',
                detail: `Monthly avg: ${formatCurrencyRaw(ytdData.monthlyAvg, activeViewCurrency)}`,
                color: 'amber',
            })
        }

        if (topExpenses.length > 0 && totalExpenses > 0) {
            const topPct = (topExpenses[0].converted / totalExpenses) * 100
            if (topPct > 30) {
                insights.push({
                    type: 'concentration',
                    label: `Largest expense is ${Math.round(topPct)}% of total`,
                    detail: `"${topExpenses[0].description}" — ${formatCurrencyRaw(topExpenses[0].converted, activeViewCurrency)}`,
                    color: 'amber',
                })
            }
        }

        if (dailyAvg > 0 && totalBudget > 0) {
            const projectedMonthly = dailyAvg * daysInMonth
            if (projectedMonthly > totalBudget * 1.1) {
                insights.push({
                    type: 'projection',
                    label: 'On pace to exceed budget',
                    detail: `Projected: ${formatCurrencyRaw(projectedMonthly, activeViewCurrency)} vs Budget: ${formatCurrencyRaw(totalBudget, activeViewCurrency)}`,
                    color: 'red',
                })
            } else if (projectedMonthly < totalBudget * 0.7) {
                insights.push({
                    type: 'projection',
                    label: 'Well under budget pace',
                    detail: `Projected: ${formatCurrencyRaw(projectedMonthly, activeViewCurrency)}`,
                    color: 'emerald',
                })
            }
        }

        return insights
    }, [ytdData, month, totalExpenses, topExpenses, dailyAvg, daysInMonth, totalBudget, activeViewCurrency, formatCurrencyRaw])

    return (
        <div className={`page-type-scale ${templateStyles?.sectionGap || 'space-y-4'}`}>
            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
                <AnimateIn>
                    <div className="flex flex-wrap gap-2">
                        {budgetAlerts.map((alert, i) => {
                            const isDanger = alert.severity === 'danger'
                            return (
                                <div key={i} className={`inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border border-solid ${
                                    isDanger
                                        ? (isLight ? 'bg-red-50 border-red-200' : 'bg-[#111] border-[#1f1f1f]')
                                        : (isLight ? 'bg-amber-50 border-amber-200' : 'bg-[#111] border-[#1f1f1f]')
                                }`}>
                                    <div className={`ml-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                        isDanger
                                            ? (isLight ? 'bg-red-500' : 'bg-red-600')
                                            : (isLight ? 'bg-amber-500' : 'bg-amber-600')
                                    }`}>
                                        <FontAwesomeIcon icon={alert.icon} className="text-[10px] text-white" />
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                        isDanger
                                            ? (isLight ? 'text-red-700' : 'text-red-300')
                                            : (isLight ? 'text-amber-700' : 'text-amber-300')
                                    }`}>
                                        {alert.name || (alert.type === 'overdue' ? 'Overdue Debts' : 'Goal Deadline')}
                                    </span>
                                    {alert.pct != null && (
                                        <span className={`text-xs font-extrabold ${isDanger ? 'text-red-500' : 'text-amber-500'}`}>{alert.pct}%</span>
                                    )}
                                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{alert.msg}</span>
                                </div>
                            )
                        })}
                    </div>
                </AnimateIn>
            )}

            {/* Budget Health Score + Spending Insights */}
            {(healthScore.factors.length > 0 || spendingInsights.length > 0) && (
                <AnimateIn delay={50}>
                    <div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                        {/* Health Score */}
                        <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`relative w-14 h-14 flex-shrink-0`}>
                                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                        <circle cx="28" cy="28" r="24" fill="none" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} strokeWidth="5" />
                                        <circle cx="28" cy="28" r="24" fill="none"
                                            stroke={healthScore.score >= 80 ? '#10b981' : healthScore.score >= 60 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="5" strokeLinecap="round"
                                            strokeDasharray={`${(healthScore.score / 100) * 150.8} 150.8`}
                                            style={{ transition: 'stroke-dasharray 1s ease-out' }}
                                        />
                                    </svg>
                                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
                                        healthScore.score >= 80 ? 'text-emerald-500' : healthScore.score >= 60 ? 'text-amber-500' : 'text-red-500'
                                    }`}>{healthScore.score}</span>
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Budget Health</h3>
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {healthScore.score >= 80 ? 'Excellent' : healthScore.score >= 60 ? 'Needs attention' : 'Critical'}
                                    </p>
                                </div>
                            </div>
                            {healthScore.factors.length > 0 && (
                                <div className="space-y-1.5">
                                    {healthScore.factors.slice(0, 4).map((f, i) => (
                                        <div key={i} className={`flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-md ${
                                            f.color === 'red' ? (isLight ? 'bg-red-50 text-red-600' : 'bg-red-900/10 text-red-400') :
                                            f.color === 'amber' ? (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/10 text-amber-400') :
                                            (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/10 text-emerald-400')
                                        }`}>
                                            <FontAwesomeIcon icon={f.color === 'emerald' ? faCheckCircle : faExclamationTriangle} className="text-xs flex-shrink-0" />
                                            <span className="font-medium">{f.label}</span>
                                            {f.impact < 0 && <span className="ml-auto opacity-60">{f.impact}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Spending Insights */}
                        <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-indigo-50' : 'bg-indigo-900/20'}`}>
                                    <FontAwesomeIcon icon={faChartPie} className={`text-sm ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                                </div>
                                <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Spending Insights</h3>
                            </div>
                            {spendingInsights.length > 0 ? (
                                <div className="space-y-2">
                                    {spendingInsights.map((insight, i) => (
                                        <div key={i} className={`px-3 py-2.5 rounded-lg border border-solid ${
                                            insight.color === 'red' ? (isLight ? 'bg-red-50/50 border-red-100' : 'bg-red-900/5 border-red-900/20') :
                                            insight.color === 'amber' ? (isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-900/5 border-amber-900/20') :
                                            (isLight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-emerald-900/5 border-emerald-900/20')
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={
                                                    insight.type === 'increase' ? faArrowUp :
                                                    insight.type === 'decrease' ? faArrowDown :
                                                    insight.type === 'projection' ? faCalendarAlt :
                                                    faExclamationTriangle
                                                } className={`text-sm flex-shrink-0 ${
                                                    insight.color === 'red' ? 'text-red-500' :
                                                    insight.color === 'amber' ? 'text-amber-500' : 'text-emerald-500'
                                                }`} />
                                                <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{insight.label}</span>
                                            </div>
                                            <p className={`text-sm mt-1 ml-5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{insight.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`flex flex-col items-center justify-center py-6 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-lg mb-2 text-emerald-500" />
                                    <p className="text-sm">Everything looks good this month!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </AnimateIn>
            )}

            {/* Summary Cards */}
            <div className={`${templateStyles?.statGridCls || 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {summaryCards.map((s, i) => {
                    const cm = colorMap[s.color]
                    return (
                        <AnimateIn key={i} delay={i * 80}>
                            <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`${templateStyles?.bodyTextCls || 'text-sm'} font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cm.bg}`}>
                                        <FontAwesomeIcon icon={s.icon} className={`text-sm ${cm.icon}`} />
                                    </div>
                                </div>
                                <p className={`${templateStyles?.valueTextCls || 'text-lg sm:text-xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{s.value}</BalanceAmount>
                                </p>
                            </div>
                        </AnimateIn>
                    )
                })}
            </div>

            {/* Net Worth */}
            <AnimateIn delay={320}>
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Net Worth</span>
                        <FontAwesomeIcon icon={faChartPie} className={`text-sm ${templateStyles?.accentText || (isLight ? 'text-blue-500' : 'text-blue-400')}`} />
                    </div>
                    <p className={`text-2xl font-bold ${netWorthData.netWorth >= 0 ? (isLight ? 'text-slate-800' : 'text-white') : 'text-red-500'}`}>
                        <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.netWorth)}</BalanceAmount>
                    </p>
                    <p className={`text-sm mt-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                        Savings <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.savingsTotal)}</BalanceAmount>
                        {' · '}Owed to you <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.totalOwedToYou)}</BalanceAmount>
                        {' · '}You owe <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.totalOwed)}</BalanceAmount>
                    </p>
                    {runway.days != null && (
                        <p className={`text-sm mt-2 font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                            Cash runway {runway.label} at {formatCurrency(runway.dailyBurn)}/day
                        </p>
                    )}
                    {historyChart.length > 1 && (
                        <div className="mt-4 h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '13px' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Line type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={2} dot={false} name="Net worth" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </AnimateIn>

            {/* Auto Savings Banner */}
            {autoSavings > 0 && (
                <AnimateIn delay={350}>
                    <div className={`${card} ${templateStyles?.cardPadding || 'px-5 py-4'} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                                <FontAwesomeIcon icon={faPiggyBank} className={`text-sm ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Auto Savings</p>
                                <p className={`text-lg font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrencyRaw(autoSavings, activeViewCurrency)}</p>
                            </div>
                        </div>
                        <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>{autoSavingsPct}% of income</span>
                    </div>
                </AnimateIn>
            )}

            {/* Currency Breakdown */}
            {currencyBreakdown.length > 0 && (
                <AnimateIn delay={350}><div className={`${card} px-5 py-4`}>
                    <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faExchangeAlt} className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Raw currency totals</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {currencyBreakdown.map(([code, v]) => (
                            <div key={code} className={`inline-flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-md cursor-pointer transition-colors ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`} onClick={() => setDrilldown({ type: 'currency', id: code, title: code, total: v.expense, income: v.income })}>
                                <span className={`font-bold ${isLight ? 'text-slate-500' : 'text-gray-300'}`}>{code}</span>
                                {v.income > 0 && <span className="text-emerald-500">+{formatCurrencyRaw(v.income, code)}</span>}
                                {v.expense > 0 && <span className="text-red-500">-{formatCurrencyRaw(v.expense, code)}</span>}
                            </div>
                        ))}
                    </div>
                </div></AnimateIn>
            )}

            {/* Charts */}
            {(topCategories.length > 0 || active.length > 0) && (
                <AnimateIn delay={380}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                    {/* Spending by Category Pie */}
                    <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                        <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Spending by Category</h3>
                        {topCategories.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={topCategories} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                                        {topCategories.map((c, i) => <Cell key={i} fill={c.color} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '14px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => formatCurrencyRaw(val, activeViewCurrency)}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '13px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className={`text-sm text-center py-8 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No spending data</p>
                        )}
                    </div>

                    {/* Daily Spending Bar Chart */}
                    <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                        <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Daily Spending</h3>
                        {(() => {
                            const dailyData = {}
                            active.filter(e => e.type === 'expense').forEach(e => {
                                const day = new Date(e.date).getDate()
                                dailyData[day] = (dailyData[day] || 0) + convert(e.amount, e.currency)
                            })
                            const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
                                day: i + 1,
                                amount: dailyData[i + 1] || 0,
                            }))
                            const hasData = chartData.some(d => d.amount > 0)
                            return hasData ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} />
                                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} interval={Math.ceil(daysInMonth / 10) - 1} />
                                        <YAxis tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={40} />
                                        <Tooltip
                                            contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '14px' }}
                                            labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                            itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                            formatter={(val) => [formatCurrencyRaw(val, activeViewCurrency), 'Spent']}
                                            labelFormatter={(label) => `Day ${label}`}
                                        />
                                        <Bar dataKey="amount" fill={isLight ? '#6366f1' : '#818cf8'} radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className={`text-sm text-center py-8 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No spending data</p>
                            )
                        })()}
                    </div>
                </div></AnimateIn>
            )}

            <AnimateIn delay={400}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {/* Top Categories */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Top Spending Categories</h3>
                    {topCategories.length > 0 ? (
                        <div className="space-y-3">
                            {topCategories.map((cat, i) => {
                                const pct = totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0
                                return (
                                    <div key={i} className={`cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDrilldown({ type: 'category', id: cat.id, title: cat.name, color: cat.color, icon: cat.icon, total: cat.amount })}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                    {cat.icon ? <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                </div>
                                                <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                            </div>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: cat.color, animation: `barGrow 0.8s ease-out ${0.4 + i * 0.1}s both` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No spending data this month.</p>
                    )}
                </div>

                {/* Payment Methods */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Payment Methods</h3>
                    {paymentMethods.length > 0 ? (
                        <div>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={paymentMethods.map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2} strokeWidth={0}>
                                        {paymentMethods.map((_, i) => <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'][i % 8]} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '13px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => formatCurrencyRaw(val, activeViewCurrency)}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '13px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-3">
                            {paymentMethods.map(([method, amount]) => (
                                <div key={method} className={`flex items-center justify-between cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDrilldown({ type: 'payment', id: method, title: method, total: amount })}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                            <FontAwesomeIcon icon={
                                                method === 'GCash' ? faMobileAlt : 
                                                method === 'Bank' ? faUniversity : 
                                                ['Credit Card', 'Debit Card'].includes(method) ? faCreditCard : 
                                                faMoneyBillWave
                                            } className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
                                        </div>
                                        <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{method}</span>
                                    </div>
                                    <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(amount, activeViewCurrency)}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No payments recorded this month.</p>
                    )}
                </div>
            </div></AnimateIn>

            {/* Income Sources + Budget Status */}
            <AnimateIn delay={500}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {/* Income Sources */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Income Sources</h3>
                    {incomeSources.length > 0 ? (
                        <div className="space-y-3">
                            {incomeSources.map((cat, i) => {
                                const pct = totalIncome > 0 ? Math.round((cat.amount / totalIncome) * 100) : 0
                                return (
                                    <div key={i} className={`cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDrilldown({ type: 'income', id: cat.id, title: cat.name, color: cat.color, icon: cat.icon, total: cat.amount })}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                    {cat.icon ? <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                </div>
                                                <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                            </div>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color, animation: `barGrow 0.8s ease-out ${0.5 + i * 0.1}s both` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No income recorded this month.</p>
                    )}
                </div>

                {/* Budget Status per Category */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Budget vs Spending</h3>
                    {budgetCategories.length > 0 ? (
                        <div>
                            <ResponsiveContainer width="100%" height={Math.max(budgetCategories.length * 36, 120)}>
                                <BarChart data={budgetCategories.map(c => ({ name: c.name, spent: c.spent, budget: c.budget }))} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} width={70} />
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '13px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => formatCurrencyRaw(val, activeViewCurrency)}
                                    />
                                    <Bar dataKey="budget" fill={isLight ? '#e2e8f0' : '#2a2a2a'} radius={[0, 3, 3, 0]} name="Budget" />
                                    <Bar dataKey="spent" fill={isLight ? '#6366f1' : '#818cf8'} radius={[0, 3, 3, 0]} name="Spent" />
                                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No budgets set up.</p>
                    )}
                </div>
            </div></AnimateIn>

            {/* Recent Transactions + Top Expenses */}
            <AnimateIn delay={700}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {/* Recent Transactions */}
                <div className={`${card} overflow-hidden`}>
                    <div className={`px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Recent Transactions</h3>
                    </div>
                    {recentTransactions.length > 0 ? (
                        <div className={`divide-y divide-solid ${isLight ? 'divide-[#f1f5f9]' : 'divide-[#1a1a1a]'}`}>
                            {recentTransactions.map(e => {
                                const converted = (e.currency || 'PHP') !== activeViewCurrency ? toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency) : null
                                return (
                                    <div key={e._id} className={`flex items-center gap-3 px-5 py-3 ${e.listOnly ? 'opacity-40' : ''}`}>
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                            {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-xs" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${e.listOnly ? 'line-through' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                {e.description}
                                                {e.listOnly && <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#1a1a1a] text-gray-500'}`}>LIST</span>}
                                            </p>
                                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {e.category?.name || 'Uncategorized'}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-sm font-semibold ${e.listOnly ? 'line-through' : ''} ${e.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {e.type === 'income' ? '+' : '-'}{converted !== null ? formatCurrencyRaw(converted, activeViewCurrency) : formatCurrencyRaw(e.amount, e.currency || 'PHP')}
                                            </p>
                                            {converted !== null && (
                                                <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(e.amount, e.currency)}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-5 text-center">
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No transactions yet.</p>
                        </div>
                    )}
                </div>

                {/* Top Expenses */}
                <div className={`${card} overflow-hidden`}>
                    <div className={`px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Largest Expenses</h3>
                    </div>
                    {topExpenses.length > 0 ? (
                        <div className={`divide-y divide-solid ${isLight ? 'divide-[#f1f5f9]' : 'divide-[#1a1a1a]'}`}>
                            {topExpenses.map((e, i) => {
                                const pct = totalExpenses > 0 ? Math.round((e.converted / totalExpenses) * 100) : 0
                                return (
                                    <div key={e._id} className="flex items-center gap-3 px-5 py-3">
                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-bold ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#1a1a1a] text-gray-500'}`}>{i + 1}</span>
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                            {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-xs" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description}</p>
                                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {e.category?.name || 'Uncategorized'} · {pct}%
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold text-red-500">{formatCurrencyRaw(e.converted, activeViewCurrency)}</p>
                                            {(e.currency || 'PHP') !== activeViewCurrency && (
                                                <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(e.amount, e.currency)}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-5 text-center">
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No expenses recorded.</p>
                        </div>
                    )}
                </div>
            </div></AnimateIn>

            {/* Savings / Debts / Goals Summary */}
            <AnimateIn delay={800}><div className={`grid grid-cols-1 sm:grid-cols-3 ${templateStyles?.gridGap || 'gap-4'}`}>
                <div className={`${card} p-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setSavingsDrilldown(true)}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${templateStyles?.accentBg || (isLight ? 'bg-blue-50' : 'bg-blue-900/20')}`}>
                            <FontAwesomeIcon icon={faPiggyBank} className={`text-sm ${templateStyles?.accentText || (isLight ? 'text-blue-500' : 'text-blue-400')}`} />
                        </div>
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Savings</span>
                    </div>
                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(savingsTotal)}</BalanceAmount>
                    </p>
                    <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Current balance</p>
                </div>

                <div className={`${card} p-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDebtDrilldown(true)}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-red-50' : 'bg-red-900/20'}`}>
                            <FontAwesomeIcon icon={faHandHoldingUsd} className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`} />
                        </div>
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Debts</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <div>
                            <p className="text-lg font-bold text-red-500"><BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(totalOwed)}</BalanceAmount></p>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>You owe</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-emerald-500"><BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(totalOwedToYou)}</BalanceAmount></p>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Owed to you</p>
                        </div>
                    </div>
                    <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{activeDebts.length} active</p>
                </div>

                <div className={`${card} p-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setGoalsDrilldown(true)}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                            <FontAwesomeIcon icon={faCheckCircle} className={`text-sm ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
                        </div>
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Goals</span>
                    </div>
                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{activeGoals.length} active</p>
                    {activeGoals.length > 0 && (
                        <>
                            <div className={`h-1.5 rounded-full overflow-hidden mt-2 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(goalsOverallPct, 100)}%`, animation: 'barGrow 0.8s ease-out 0.8s both' }} />
                            </div>
                            <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{goalsOverallPct}% overall · {formatCurrency(goalsTotalSaved)} / {formatCurrency(goalsTotalTarget)}</p>
                        </>
                    )}
                </div>
            </div></AnimateIn>

            {/* Monthly Overview */}
            <AnimateIn delay={900}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Monthly Overview</h3>
                <div className={`grid grid-cols-2 sm:grid-cols-4 ${templateStyles?.gridGap || 'gap-3 sm:gap-4'}`}>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>{transactionCount}</p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-sm'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</p>
                    </div>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>{formatCurrencyRaw(totalBudget, activeViewCurrency)}</p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-sm'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Budget</p>
                    </div>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${totalBudget > 0 ? (budgetUsedPct > 100 ? 'text-red-500' : budgetUsedPct > 80 ? 'text-amber-500' : 'text-emerald-500') : (isLight ? 'text-slate-800' : 'text-white')}`}>
                            {totalBudget > 0 ? `${budgetUsedPct}%` : '—'}
                        </p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-sm'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget Used</p>
                    </div>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            {transactionCount > 0 ? formatCurrencyRaw(dailyAvg, activeViewCurrency) : '—'}
                        </p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-sm'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Daily Average</p>
                    </div>
                </div>

                {/* Additional details */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <div className="text-center">
                        <p className={`text-lg font-bold text-emerald-500`}>{formatCurrencyRaw(totalIncome, activeViewCurrency)}</p>
                        <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Income</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-lg font-bold text-red-500`}>{formatCurrencyRaw(totalExpenses, activeViewCurrency)}</p>
                        <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Spent</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(remainingBudget, activeViewCurrency)}</p>
                        <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget Left</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{listOnlyCount > 0 ? listOnlyCount : '—'}</p>
                        <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>List Only</p>
                    </div>
                </div>

                {d.rolloverAmount > 0 && (
                    <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'} flex items-center gap-2`}>
                        <FontAwesomeIcon icon={faSyncAlt} className={`text-sm ${templateStyles?.accentText || (isLight ? 'text-blue-500' : 'text-blue-400')}`} />
                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Budget rollover from last month: <span className="font-semibold">{formatCurrency(d.rolloverAmount)}</span></span>
                    </div>
                )}
            </div></AnimateIn>

            {/* Year-to-Date Overview */}
            <AnimateIn delay={1000}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-indigo-50' : 'bg-indigo-900/20'}`}>
                            <FontAwesomeIcon icon={faCalendarCheck} className={`text-sm ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                        </div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Year-to-Date ({year})</h3>
                    </div>
                </div>
                {ytdLoading || !ytdData ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className={`h-7 w-20 mx-auto animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`} />
                                <div className={`h-3 w-16 mx-auto mt-2 animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold text-emerald-500`}>{formatCurrencyRaw(ytdData.ytdIncome, activeViewCurrency)}</p>
                                <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>YTD Income</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold text-red-500`}>{formatCurrencyRaw(ytdData.ytdExpense, activeViewCurrency)}</p>
                                <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>YTD Expenses</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold ${ytdData.ytdBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(ytdData.ytdBalance, activeViewCurrency)}</p>
                                <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Net Balance</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{ytdData.ytdTxCount}</p>
                                <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</p>
                            </div>
                        </div>

                        {/* Monthly Avg + Monthly Bar Chart */}
                        <div className={`mt-4 pt-4 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Monthly spending ({MONTHS[0].slice(0, 3)} – {MONTHS[month - 1].slice(0, 3)})</span>
                                <span className={`text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Avg: {formatCurrencyRaw(ytdData.monthlyAvg, activeViewCurrency)}/mo</span>
                            </div>
                            <ResponsiveContainer width="100%" height={100}>
                                <BarChart data={Array.from({ length: month }, (_, i) => ({
                                    name: MONTHS[i].slice(0, 3),
                                    expense: ytdData.monthlyBreakdown[i]?.expense || 0,
                                }))} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '13px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => [formatCurrencyRaw(val, activeViewCurrency), 'Spent']}
                                    />
                                    <Bar dataKey="expense" radius={[3, 3, 0, 0]}>
                                        {Array.from({ length: month }, (_, i) => (
                                            <Cell key={i} fill={i === month - 1 ? (isLight ? '#6366f1' : '#818cf8') : (isLight ? '#e2e8f0' : '#2a2a2a')} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* YTD Top Categories */}
                        {ytdData.topCategories.length > 0 && (
                            <div className={`mt-4 pt-4 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Top YTD categories</span>
                                <div className="space-y-2 mt-2">
                                    {ytdData.topCategories.map((cat, i) => {
                                        const pct = ytdData.ytdExpense > 0 ? Math.round((cat.amount / ytdData.ytdExpense) * 100) : 0
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                            {cat.icon ? <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                        </div>
                                                        <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                        <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className={`h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color, animation: `barGrow 0.8s ease-out ${0.5 + i * 0.1}s both` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div></AnimateIn>

            {/* Budget Forecasting / Projection */}
            <AnimateIn delay={1100}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-violet-50' : 'bg-violet-900/20'}`}>
                        <FontAwesomeIcon icon={faCalendarAlt} className={`text-sm ${isLight ? 'text-violet-500' : 'text-violet-400'}`} />
                    </div>
                    <div>
                        <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>End-of-Month Forecast</h3>
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Projected based on current spending pace</p>
                    </div>
                </div>
                {(() => {
                    const today = new Date()
                    const currentDay = (today.getMonth() + 1 === month && today.getFullYear() === year) ? today.getDate() : daysInMonth
                    const daysElapsed = Math.max(currentDay, 1)
                    const dailyRate = totalExpenses / daysElapsed
                    const projectedExpenses = dailyRate * daysInMonth
                    const projectedBalance = totalIncome - projectedExpenses
                    const projectedBudgetRemain = totalBudget - projectedExpenses
                    const daysLeft = daysInMonth - daysElapsed
                    const safeDaily = totalBudget > 0 ? Math.max((totalBudget - totalExpenses) / Math.max(daysLeft, 1), 0) : 0

                    return (
                        <div className="space-y-3">
                            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${projectedExpenses > totalBudget && totalBudget > 0 ? 'text-red-500' : (isLight ? 'text-slate-800' : 'text-white')}`}>{formatCurrencyRaw(projectedExpenses, activeViewCurrency)}</p>
                                    <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Projected Spend</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${projectedBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(projectedBalance, activeViewCurrency)}</p>
                                    <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Projected Balance</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{daysLeft}</p>
                                    <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Days Left</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${safeDaily > dailyRate ? 'text-emerald-500' : 'text-amber-500'}`}>{totalBudget > 0 ? formatCurrencyRaw(safeDaily, activeViewCurrency) : '—'}</p>
                                    <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Safe Daily Budget</p>
                                </div>
                            </div>
                            {totalBudget > 0 && (
                                <div className={`px-3 py-2.5 rounded-lg border border-solid ${
                                    projectedExpenses > totalBudget
                                        ? (isLight ? 'bg-red-50/50 border-red-100' : 'bg-red-900/5 border-red-900/20')
                                        : projectedExpenses > totalBudget * 0.9
                                            ? (isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-900/5 border-amber-900/20')
                                            : (isLight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-emerald-900/5 border-emerald-900/20')
                                }`}>
                                    <p className={`text-sm font-medium ${
                                        projectedExpenses > totalBudget ? 'text-red-600' : projectedExpenses > totalBudget * 0.9 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>
                                        <FontAwesomeIcon icon={projectedExpenses > totalBudget ? faExclamationTriangle : faCheckCircle} className="mr-1.5 text-sm" />
                                        {projectedExpenses > totalBudget
                                            ? `At this rate, you'll exceed budget by ${formatCurrencyRaw(projectedExpenses - totalBudget, activeViewCurrency)}`
                                            : projectedExpenses > totalBudget * 0.9
                                                ? `Close to budget — spending ${formatCurrencyRaw(dailyRate, activeViewCurrency)}/day`
                                                : `On track! You'll save ~${formatCurrencyRaw(totalBudget - projectedExpenses, activeViewCurrency)} this month`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                })()}
            </div></AnimateIn>

            {/* Spending Streaks & Challenges */}
            <AnimateIn delay={1200}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                        <FontAwesomeIcon icon={faHistory} className={`text-sm ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
                    </div>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Spending Streaks</h3>
                </div>
                {(() => {
                    const expenseDates = new Set(active.filter(e => e.type === 'expense').map(e => new Date(e.date).toDateString()))
                    const today = new Date()
                    let noSpendStreak = 0
                    let checkDate = new Date(today)
                    if (today.getMonth() + 1 === month && today.getFullYear() === year) {
                        for (let i = 0; i < 60; i++) {
                            checkDate.setDate(checkDate.getDate() - (i === 0 ? 0 : 1))
                            if (!expenseDates.has(checkDate.toDateString())) noSpendStreak++
                            else break
                        }
                    }

                    const underBudgetDays = (() => {
                        if (totalBudget <= 0) return 0
                        const dailyBudget = totalBudget / daysInMonth
                        let streak = 0
                        for (let day = daysInMonth; day >= 1; day--) {
                            const dayDate = new Date(year, month - 1, day)
                            const dayExpenses = active.filter(e => e.type === 'expense' && new Date(e.date).toDateString() === dayDate.toDateString())
                                .reduce((s, e) => s + convert(e.amount, e.currency), 0)
                            if (dayExpenses <= dailyBudget) streak++
                            else break
                        }
                        return streak
                    })()

                    const weeklyBudget = totalBudget > 0 ? totalBudget / 4 : 0
                    const currentWeek = Math.ceil((new Date().getDate()) / 7)
                    const weekStart = new Date(year, month - 1, (currentWeek - 1) * 7 + 1)
                    const weekExpenses = active.filter(e => e.type === 'expense' && new Date(e.date) >= weekStart)
                        .reduce((s, e) => s + convert(e.amount, e.currency), 0)
                    const weeklyChallenge = weeklyBudget > 0 ? Math.round((weekExpenses / weeklyBudget) * 100) : 0

                    const streaks = [
                        { label: 'No-Spend Streak', value: `${noSpendStreak} day${noSpendStreak !== 1 ? 's' : ''}`, icon: '🔥', active: noSpendStreak > 0 },
                        { label: 'Under Daily Budget', value: `${underBudgetDays} day${underBudgetDays !== 1 ? 's' : ''}`, icon: '✅', active: underBudgetDays > 0 },
                        { label: 'Weekly Challenge', value: weeklyBudget > 0 ? `${weeklyChallenge}% of weekly limit` : 'Set budget first', icon: '🎯', active: weeklyChallenge <= 100 && weeklyBudget > 0 },
                    ]

                    return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {streaks.map((s, i) => (
                                <div key={i} className={`px-3 py-3 rounded-lg border border-solid text-center ${
                                    s.active
                                        ? (isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-900/10 border-emerald-800/30')
                                        : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111] border-[#1f1f1f]')
                                }`}>
                                    <span className="text-xl">{s.icon}</span>
                                    <p className={`text-sm font-bold mt-1 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{s.value}</p>
                                    <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )
                })()}
            </div></AnimateIn>

            {/* Recurring Expense Calendar */}
            {(expenses.filter(e => e.isRecurring).length > 0 || activeDebts.some(d => d.due_date) || (goals || []).some(g => g.deadline && g.currentAmount < g.targetAmount)) && (
                <AnimateIn delay={1300}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-cyan-50' : 'bg-cyan-900/20'}`}>
                            <FontAwesomeIcon icon={faCalendarCheck} className={`text-sm ${isLight ? 'text-cyan-500' : 'text-cyan-400'}`} />
                        </div>
                        <div>
                            <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Upcoming bills</h3>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Recurring, debts, and goal deadlines</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {activeDebts.filter(d => d.due_date).slice(0, 4).map(d => (
                            <div key={`debt-${d._id}`} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-red-100' : 'bg-red-900/20'}`}>
                                    <FontAwesomeIcon icon={faHandHoldingUsd} className="text-sm text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{d.name}</p>
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        Debt due {new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-red-500">{formatCurrency(Math.max(0, d.total_amount - d.amount_paid))}</span>
                            </div>
                        ))}
                        {(goals || []).filter(g => g.deadline && g.currentAmount < g.targetAmount).slice(0, 3).map(g => (
                            <div key={`goal-${g._id}`} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-blue-100' : 'bg-blue-900/20'}`}>
                                    <FontAwesomeIcon icon={faCalendarCheck} className="text-sm text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{g.name}</p>
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        Goal deadline {new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {expenses.filter(e => e.isRecurring).slice(0, 6).map(e => {
                            const nextDate = new Date(e.date)
                            nextDate.setMonth(nextDate.getMonth() + 1)
                            const isPast = new Date(e.date) < new Date()
                            return (
                                <div key={e._id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isPast ? (isLight ? 'bg-emerald-100' : 'bg-emerald-900/20') : (isLight ? 'bg-amber-100' : 'bg-amber-900/20')}`}>
                                        <FontAwesomeIcon icon={isPast ? faCheckCircle : faSyncAlt} className={`text-sm ${isPast ? 'text-emerald-500' : 'text-amber-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description}</p>
                                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {e.recurrenceRule} · {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className={`text-sm font-semibold ${e.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, e.currency || 'PHP')}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                Total recurring: {expenses.filter(e => e.isRecurring).length} items
                            </span>
                            <span className={`text-sm font-semibold text-red-500`}>
                                {formatCurrencyRaw(expenses.filter(e => e.isRecurring && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0), activeViewCurrency)}/mo
                            </span>
                        </div>
                    </div>
                </div></AnimateIn>
            )}

            {/* Category Comparison (Month over Month) */}
            {ytdData && ytdData.monthlyBreakdown && month > 1 && (
                <AnimateIn delay={1400}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-pink-50' : 'bg-pink-900/20'}`}>
                            <FontAwesomeIcon icon={faChartPie} className={`text-sm ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                        </div>
                        <div>
                            <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Category Trends</h3>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>This month vs last month</p>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        {topCategories.slice(0, 5).map((cat, i) => {
                            const prevMonthExpenses = ytdData.categoryBreakdown?.[cat.id]?.[month - 2] || 0
                            const change = prevMonthExpenses > 0 ? ((cat.amount - prevMonthExpenses) / prevMonthExpenses) * 100 : (cat.amount > 0 ? 100 : 0)
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                        {cat.icon ? <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                    </div>
                                    <span className={`text-sm flex-1 min-w-0 truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                        {prevMonthExpenses > 0 && (
                                            <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full ${
                                                change > 10 ? (isLight ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-400') :
                                                change < -10 ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400') :
                                                (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400')
                                            }`}>
                                                <FontAwesomeIcon icon={change > 0 ? faArrowUp : change < 0 ? faArrowDown : faCheck} className="mr-0.5 text-xs" />
                                                {Math.abs(Math.round(change))}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div></AnimateIn>
            )}

            {/* Income Tracking Summary */}
            {totalIncome > 0 && (
                <AnimateIn delay={1500}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                            <FontAwesomeIcon icon={faArrowUp} className={`text-sm ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                            <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Income Overview</h3>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Earnings & savings rate</p>
                        </div>
                    </div>
                    {(() => {
                        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
                        const incomeVsExpenseRatio = totalExpenses > 0 ? totalIncome / totalExpenses : 0
                        return (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-emerald-500">{formatCurrencyRaw(totalIncome, activeViewCurrency)}</p>
                                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Income</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${savingsRate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{Math.round(savingsRate)}%</p>
                                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Savings Rate</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{incomeVsExpenseRatio.toFixed(1)}x</p>
                                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Income/Expense</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(Math.abs(balance), activeViewCurrency)}</p>
                                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{balance >= 0 ? 'Net Saved' : 'Net Loss'}</p>
                                    </div>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                    <div className="h-full flex">
                                        <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0}%` }} />
                                        <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${totalIncome > 0 ? Math.max(100 - (totalExpenses / totalIncome) * 100, 0) : 0}%` }} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Expenses ({totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%)
                                    </span>
                                    <span className={`text-sm flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Savings ({Math.round(Math.max(savingsRate, 0))}%)
                                    </span>
                                </div>
                            </div>
                        )
                    })()}
                </div></AnimateIn>
            )}

            {/* Drilldown Modal */}
            {drilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-solid shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 pt-5 pb-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className={`text-2xl font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldown.title}</h3>
                                    <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                        {drilldown.type === 'category' && 'Expense breakdown'}
                                        {drilldown.type === 'payment' && 'Payment method breakdown'}
                                        {drilldown.type === 'income' && 'Income breakdown'}
                                        {drilldown.type === 'budget' && 'Budget breakdown'}
                                        {drilldown.type === 'currency' && 'Currency breakdown'}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>
                        </div>

                        <div className={`px-6 py-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            {drilldown.type === 'currency' ? (
                                <div className="flex items-end justify-between gap-4">
                                    <div className="flex items-end gap-6">
                                        {drilldown.income > 0 && (
                                            <div>
                                                <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Income</p>
                                                <p className="text-lg font-semibold text-emerald-500 mt-1">+{formatCurrencyRaw(drilldown.income, drilldown.id)}</p>
                                            </div>
                                        )}
                                        {drilldown.total > 0 && (
                                            <div>
                                                <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Expense</p>
                                                <p className="text-lg font-semibold text-red-500 mt-1">-{formatCurrencyRaw(drilldown.total, drilldown.id)}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Transactions</p>
                                        <p className={`text-lg font-semibold mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldownItems.length}</p>
                                    </div>
                                </div>
                            ) : (
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                        {drilldown.type === 'budget' ? 'Spent / Budget' : 'Total'}
                                    </p>
                                    <p className={`text-lg font-semibold mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                        {formatCurrencyRaw(drilldown.total, activeViewCurrency)}
                                        {drilldown.type === 'budget' && <span className={`text-sm font-normal ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> / {formatCurrencyRaw(drilldown.budget, activeViewCurrency)}</span>}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Transactions</p>
                                    <p className={`text-lg font-semibold mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldownItems.length}</p>
                                </div>
                            </div>
                            )}
                            {drilldown.type === 'budget' && drilldown.percentage != null && (
                                <div className="mt-4">
                                    <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                        <div className={`h-full rounded-full transition-all duration-500 ${drilldown.percentage > 100 ? 'bg-red-500' : drilldown.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(drilldown.percentage, 100)}%` }} />
                                    </div>
                                    <p className={`text-sm mt-2 ${drilldown.percentage > 100 ? 'text-red-500' : drilldown.percentage > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {drilldown.percentage}% used
                                        {drilldown.percentage > 100 && ` · ${formatCurrencyRaw(drilldown.total - drilldown.budget, activeViewCurrency)} over`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Items list */}
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {drilldownItems.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {drilldownItems.map(e => {
                                        const converted = (e.currency || 'PHP') !== activeViewCurrency ? toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency) : null
                                        const cat = categories.find(c => c._id === e.category?._id)
                                        return (
                                            <div key={e._id} className={`flex items-center gap-3 px-6 py-3.5 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#151515]'}`}>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (cat?.color || '#94a3b8') + '20' }}>
                                                    {cat?.icon ? <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} /> : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description || 'No description'}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        {drilldown.type !== 'payment' && e.paymentMethod && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1a1a1a] text-gray-400'}`}>{e.paymentMethod}</span>
                                                        )}
                                                        {drilldown.type === 'payment' && cat && (
                                                            <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: cat.color + '15', color: cat.color }}>{cat.name}</span>
                                                        )}
                                                        {drilldown.type === 'currency' && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${e.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{e.type === 'income' ? 'Income' : 'Expense'}</span>
                                                        )}
                                                        {drilldown.type === 'currency' && cat && (
                                                            <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: cat.color + '15', color: cat.color }}>{cat.name}</span>
                                                        )}
                                                        {e.notes && (
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`} title={e.notes}>Note</span>
                                                        )}
                                                        {e.attachments?.length > 0 && (
                                                            <button type="button" onClick={() => setReceiptViewer(e.attachments[0])} className={`text-xs font-medium px-2 py-0.5 rounded-md ${isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900/20 text-blue-400'}`} title="View receipt">
                                                                Receipt
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {drilldown.type === 'currency' ? (
                                                        <>
                                                            <p className={`text-sm font-semibold ${e.type === 'income' ? 'text-emerald-500' : (isLight ? 'text-slate-700' : 'text-gray-200')}`}>
                                                                {e.type === 'income' ? '+' : ''}{formatCurrencyRaw(e.amount, e.currency)}
                                                            </p>
                                                            {converted !== null && (
                                                                <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatCurrencyRaw(converted, activeViewCurrency)}</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                                {converted !== null ? formatCurrencyRaw(converted, activeViewCurrency) : formatCurrencyRaw(e.amount, activeViewCurrency)}
                                                            </p>
                                                            {converted !== null && (
                                                                <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatCurrencyRaw(e.amount, e.currency)}</p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No transactions found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Debt Drilldown Modal */}
            {debtDrilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setDebtDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-solid shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 pt-5 pb-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className={`text-2xl font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Debts breakdown</h3>
                                    <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{activeDebts.length} active debt{activeDebts.length !== 1 ? 's' : ''}</p>
                                </div>
                                <button type="button" onClick={() => setDebtDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>
                        </div>

                        <div className={`px-6 py-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>You owe</p>
                                    <p className="text-lg font-semibold text-red-500 mt-1">{formatCurrency(totalOwed)}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Owed to you</p>
                                    <p className="text-lg font-semibold text-emerald-500 mt-1">{formatCurrency(totalOwedToYou)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Debts list */}
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {activeDebts.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {activeDebts.map(debt => {
                                        const remaining = debt.total_amount - debt.amount_paid
                                        const pct = debt.total_amount > 0 ? Math.round((debt.amount_paid / debt.total_amount) * 100) : 0
                                        const isOwe = debt.type === 'owe'
                                        const isOverdue = debt.due_date && new Date(debt.due_date) < new Date()
                                        return (
                                            <div key={debt._id} className={`px-6 py-3.5 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#151515]'}`}>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{debt.name}</p>
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${isOwe ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                {isOwe ? 'You owe' : 'Owes you'}
                                                            </span>
                                                            {isOverdue && (
                                                                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 flex-shrink-0">Overdue</span>
                                                            )}
                                                        </div>
                                                        {debt.person && <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{debt.person}</p>}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className={`text-sm font-semibold ${isOwe ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(remaining)}</p>
                                                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>of {formatCurrency(debt.total_amount)}</p>
                                                    </div>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                    <div className={`h-full rounded-full transition-all duration-500 ${isOwe ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                        {pct}% paid · {formatCurrency(debt.amount_paid)} paid
                                                    </span>
                                                    {debt.due_date && (
                                                        <span className={`text-sm ${isOverdue ? 'text-amber-500' : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>
                                                            Due {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                {debt.payments?.length > 0 && (
                                                    <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                        <p className={`text-sm font-medium mb-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Payments ({debt.payments.length})</p>
                                                        <div className="space-y-1.5">
                                                            {debt.payments.slice(-3).map((p, i) => (
                                                                <div key={i} className="flex items-center justify-between">
                                                                    <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        {p.notes && ` · ${p.notes}`}
                                                                    </span>
                                                                    <span className={`text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{formatCurrency(p.amount)}</span>
                                                                </div>
                                                            ))}
                                                            {debt.payments.length > 3 && (
                                                                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>+{debt.payments.length - 3} more</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active debts.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Savings Drilldown Modal */}
            {savingsDrilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setSavingsDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-solid shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 pt-5 pb-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className={`text-2xl font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Savings breakdown</h3>
                                    <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{savingsAccounts?.length || 0} account{(savingsAccounts?.length || 0) !== 1 ? 's' : ''}</p>
                                </div>
                                <button type="button" onClick={() => setSavingsDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>
                        </div>
                        <div className={`px-6 py-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Total balance</p>
                            <p className={`text-lg font-semibold mt-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrency(savingsTotal)}</p>
                        </div>
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {savingsAccounts?.length > 0 ? (
                                <div className="divide-y divide-solid" style={{ borderColor: isLight ? '#f1f5f9' : '#1f1f1f' }}>
                                    {savingsAccounts.map(account => {
                                        const accountTotal = calcAccountTotal(account)
                                        const isCash = account.category === 'cash'
                                        const denoms = account.denominations || {}
                                        const bills = DENOMINATIONS_CONST.filter(d => d.type === 'bill')
                                        const coins = DENOMINATIONS_CONST.filter(d => d.type === 'coin')
                                        const renderDenomGroup = (label, denomList) => (
                                            <div className="mt-2 space-y-1.5">
                                                <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{label}</p>
                                                {denomList.map(d => {
                                                    const count = parseInt(denoms[d.value], 10) || 0
                                                    if (count === 0) return null
                                                    return (
                                                        <div key={d.value} className="flex items-center justify-between">
                                                            <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{d.label} × {count}</span>
                                                            <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(count * d.value)}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )
                                        return (
                                            <div key={account._id} className="px-6 py-3.5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCash ? (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400') : (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400')}`}>
                                                            <FontAwesomeIcon icon={isCash ? faWallet : faUniversity} className="text-xs" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{account.name}</p>
                                                            <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{isCash ? 'Cash' : 'Bank'}{account.isDefault ? ' · Default' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm font-semibold flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrency(accountTotal)}</p>
                                                </div>
                                                {isCash && accountTotal > 0 && (
                                                    <div className={`mt-3 pl-10 rounded-lg px-3 py-2 ${isLight ? 'bg-slate-50' : 'bg-white/[0.02]'}`}>
                                                        {renderDenomGroup('Bills', bills)}
                                                        {renderDenomGroup('Coins', coins)}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No savings recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Goals Drilldown Modal */}
            {goalsDrilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setGoalsDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-solid shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        <div className={`px-6 pt-5 pb-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className={`text-2xl font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Goals breakdown</h3>
                                    <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</p>
                                </div>
                                <button type="button" onClick={() => setGoalsDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>
                        </div>
                        {activeGoals.length > 0 && (
                            <div className={`px-6 py-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                <div className="flex items-end justify-between gap-4 mb-4">
                                    <div>
                                        <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Overall progress</p>
                                        <p className={`text-lg font-semibold mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{formatCurrency(goalsTotalSaved)} <span className={`text-sm font-normal ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>/ {formatCurrency(goalsTotalTarget)}</span></p>
                                    </div>
                                    <span className={`text-lg font-semibold ${goalsOverallPct >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{goalsOverallPct}%</span>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                    <div className={`h-full rounded-full transition-all duration-500 ${goalsOverallPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(goalsOverallPct, 100)}%` }} />
                                </div>
                            </div>
                        )}
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {activeGoals.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {activeGoals.map(goal => {
                                        const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
                                        const remaining = goal.targetAmount - goal.currentAmount
                                        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date()
                                        return (
                                            <div key={goal._id} className={`px-6 py-3.5 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#151515]'}`}>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: goal.color + '20' }}>
                                                            {goal.icon ? <SafeIcon name={goal.icon} cls="text-xs" style={{ color: goal.color }} /> : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goal.color }} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{goal.name}</p>
                                                                {isOverdue && <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 flex-shrink-0">Overdue</span>}
                                                            </div>
                                                            {goal.notes && <p className={`text-sm truncate mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{goal.notes}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-semibold" style={{ color: goal.color }}>{pct}%</p>
                                                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatCurrency(remaining)} left</p>
                                                    </div>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }} />
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                                                    {goal.deadline && (
                                                        <span className={`text-sm ${isOverdue ? 'text-amber-500' : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>
                                                            {isOverdue ? 'Was due' : 'Due'} {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                {goal.contributions?.length > 0 && (
                                                    <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                        <p className={`text-sm font-medium mb-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Contributions ({goal.contributions.length})</p>
                                                        <div className="space-y-1.5">
                                                            {goal.contributions.slice(-3).map((c, i) => (
                                                                <div key={i} className="flex items-center justify-between">
                                                                    <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                        {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        {c.notes && ` · ${c.notes}`}
                                                                    </span>
                                                                    <span className="text-sm font-semibold text-emerald-500">+{formatCurrency(c.amount)}</span>
                                                                </div>
                                                            ))}
                                                            {goal.contributions.length > 3 && (
                                                                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>+{goal.contributions.length - 3} more</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active goals.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    )
})


export default DashboardTab
