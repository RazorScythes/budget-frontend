import React, { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf, faFileExport, faChartPie, faWallet, faExclamationTriangle, faCalendarAlt, faArrowDown, faArrowUp, faCreditCard, faCalendarCheck, faCalendarDay } from '@fortawesome/free-solid-svg-icons'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AnimateIn, SafeIcon } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import TrendsChart from './TrendsChart'
import { MONTHS } from './constants'
import { generateBudgetSummaryPdf, formatPdfAmount, sanitizePdfText } from '../../../utils/budgetSummaryPdf'

// ==================== SUMMARY TAB ====================

const SummaryTab = React.memo(({ dashboard, expenses, categories, monthlyBudgetData, groupedByDate, month, year, isLight, card, formatCurrency, formatCurrencyRaw, statusColor, paymentIcon, isLoading, activeViewCurrency, toTargetCurrency, ytdData, ytdLoading, debts, showBalances = true, maskedBalance = '₱ ----' }) => {
    const [downloading, setDownloading] = useState(false)
    const [pdfError, setPdfError] = useState('')
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    const handleDownloadPDF = async () => {
        if (downloading) return
        setDownloading(true)
        setPdfError('')

        try {
            const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt
            const pdfCurrency = (v, code = activeViewCurrency) => formatPdfAmount(v, code)
            const active = expenses.filter(e => !e.listOnly)
            const totalIncome = active.filter(e => e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
            const totalExpenses = active.filter(e => e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
            const balance = totalIncome - totalExpenses
            const totalBudget = monthlyBudgetData.reduce((s, c) => s + (c.budget || 0), 0)
            const remainingBudget = totalBudget - totalExpenses
            const budgetUsedPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0
            const daysInMonth = new Date(year, month, 0).getDate()
            const dailyAvg = active.length > 0 ? totalExpenses / daysInMonth : 0

            const expenseCats = categories.filter(c => c.type === 'expense')
            const incomeCats = categories.filter(c => c.type === 'income')

            const catSpending = expenseCats.map(cat => {
                const spent = active.filter(e => e.category?._id === cat._id && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                return { ...cat, spent }
            }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent)

            const catIncome = incomeCats.map(cat => {
                const earned = active.filter(e => e.category?._id === cat._id && e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                return { ...cat, earned }
            }).filter(c => c.earned > 0).sort((a, b) => b.earned - a.earned)

            const paymentMap = {}
            active.filter(e => e.type === 'expense').forEach(e => {
                const m = e.paymentMethod || 'Cash'
                if (!paymentMap[m]) paymentMap[m] = 0
                paymentMap[m] += convert(e.amount, e.currency)
            })
            const sortedPayments = Object.entries(paymentMap).sort((a, b) => b[1] - a[1])

            const expenseRows = catSpending.map(cat => ({
                label: sanitizePdfText(cat.name),
                value: pdfCurrency(cat.spent),
                sub: totalExpenses > 0 ? `${Math.round((cat.spent / totalExpenses) * 100)}% of expenses` : undefined,
            }))

            const incomeRows = catIncome.map(cat => ({
                label: sanitizePdfText(cat.name),
                value: pdfCurrency(cat.earned),
                sub: totalIncome > 0 ? `${Math.round((cat.earned / totalIncome) * 100)}% of income` : undefined,
            }))

            const budgetTable = monthlyBudgetData.length > 0 ? {
                rows: monthlyBudgetData.map(cat => [
                    sanitizePdfText(cat.name),
                    pdfCurrency(cat.budget),
                    pdfCurrency(cat.spent),
                    pdfCurrency(cat.remaining),
                    cat.budget > 0 ? `${cat.percentage}%` : '—',
                ]),
                rowMeta: monthlyBudgetData.map(cat => ({
                    remaining: cat.remaining,
                    percentage: cat.percentage,
                    budget: cat.budget,
                })),
                foot: [
                    'Total',
                    pdfCurrency(totalBudget),
                    pdfCurrency(totalExpenses),
                    pdfCurrency(remainingBudget),
                    `${budgetUsedPct}%`,
                ],
            } : null

            const paymentRows = sortedPayments.map(([method, amount]) => [
                sanitizePdfText(method),
                pdfCurrency(amount),
                totalExpenses > 0 ? `${Math.round((amount / totalExpenses) * 100)}%` : '—',
            ])

            const ytdCards = ytdData && !ytdLoading ? [
                { label: 'YTD Income', value: pdfCurrency(ytdData.ytdIncome), tone: 'emerald' },
                { label: 'YTD Expenses', value: pdfCurrency(ytdData.ytdExpense), tone: 'red' },
                { label: 'Net Balance', value: pdfCurrency(ytdData.ytdBalance), tone: ytdData.ytdBalance >= 0 ? 'blue' : 'red' },
                { label: 'Monthly Avg', value: pdfCurrency(ytdData.monthlyAvg), tone: 'amber' },
            ] : null

            const ytdMonthlyRows = ytdData?.monthlyBreakdown
                ? Array.from({ length: month }, (_, i) => {
                    const data = ytdData.monthlyBreakdown[i] || { income: 0, expense: 0, count: 0 }
                    const net = data.income - data.expense
                    return [
                        MONTHS[i].slice(0, 3),
                        data.income > 0 ? pdfCurrency(data.income) : '—',
                        data.expense > 0 ? pdfCurrency(data.expense) : '—',
                        data.count > 0 ? pdfCurrency(net) : '—',
                        data.count || '—',
                    ]
                })
                : null

            const ytdMonthlyFoot = ytdData ? [
                'Total',
                pdfCurrency(ytdData.ytdIncome),
                pdfCurrency(ytdData.ytdExpense),
                pdfCurrency(ytdData.ytdBalance),
                String(ytdData.ytdTxCount ?? '—'),
            ] : null

            const ytdTopCategories = ytdData?.topCategories?.length
                ? ytdData.topCategories.map(cat => ({
                    label: sanitizePdfText(cat.name),
                    value: pdfCurrency(cat.amount),
                    sub: ytdData.ytdExpense > 0 ? `${Math.round((cat.amount / ytdData.ytdExpense) * 100)}%` : undefined,
                }))
                : null

            const activeDebts = (debts || []).filter(d => d.status === 'active' && d.amount_paid < d.total_amount)

            const dailyData = {}
            active.filter(e => e.type === 'expense').forEach(e => {
                const day = new Date(e.date).getDate()
                dailyData[day] = (dailyData[day] || 0) + convert(e.amount, e.currency)
            })
            const dailySpendingChart = Array.from({ length: daysInMonth }, (_, i) => ({
                label: String(i + 1),
                value: dailyData[i + 1] || 0,
            }))

            const transactionRows = []
            const transactionRowMeta = []
            const txnGroupFill = isLight ? [241, 245, 249] : [10, 10, 10]
            groupedByDate.forEach(([date, group]) => {
                transactionRows.push([{
                    content: sanitizePdfText(date),
                    colSpan: 5,
                    styles: { fillColor: txnGroupFill, fontStyle: 'bold', fontSize: 7 },
                }])
                transactionRowMeta.push({ isGroup: true })
                group.items.forEach(e => {
                    const fromCur = e.currency || 'PHP'
                    const converted = fromCur !== activeViewCurrency ? toTargetCurrency(e.amount, fromCur, activeViewCurrency) : null
                    const prefix = e.type === 'income' ? '+' : '-'
                    const amount = converted !== null
                        ? `${prefix}${pdfCurrency(converted)} (${prefix}${pdfCurrency(e.amount, fromCur)})`
                        : `${prefix}${pdfCurrency(e.amount, fromCur)}`
                    const rawDesc = e.description || '—'
                    const desc = sanitizePdfText(rawDesc)
                    const isDebt = /^debt\s*:/i.test(rawDesc)
                    transactionRows.push([
                        sanitizePdfText(new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                        e.listOnly ? `${desc} [LIST]` : desc,
                        sanitizePdfText(e.category?.name || 'Uncategorized'),
                        sanitizePdfText(e.paymentMethod || 'Cash'),
                        amount,
                    ])
                    transactionRowMeta.push({
                        type: e.type,
                        isDebt,
                        listOnly: !!e.listOnly,
                    })
                })
            })

            await generateBudgetSummaryPdf({
                theme: isLight ? 'light' : 'dark',
                filename: `Budget_Summary_${MONTHS[month - 1]}_${year}.pdf`,
                monthLabel: MONTHS[month - 1],
                year,
                currency: activeViewCurrency,
                overviewCards: [
                    { label: 'Total Income', value: pdfCurrency(totalIncome), tone: 'emerald' },
                    { label: 'Total Expenses', value: pdfCurrency(totalExpenses), tone: 'red' },
                    { label: 'Net Balance', value: pdfCurrency(balance), tone: balance >= 0 ? 'blue' : 'red' },
                    { label: 'Budget Used', value: totalBudget > 0 ? `${budgetUsedPct}%` : '—', tone: budgetUsedPct >= 100 ? 'red' : budgetUsedPct >= 80 ? 'amber' : 'emerald' },
                ],
                quickStats: [
                    { label: 'Transactions', value: String(active.length) },
                    { label: 'Total Budget', value: pdfCurrency(totalBudget) },
                    { label: 'Daily Average', value: pdfCurrency(dailyAvg) },
                    { label: 'Remaining', value: pdfCurrency(remainingBudget), tone: remainingBudget >= 0 ? 'emerald' : 'red' },
                ],
                expenseChart: catSpending.slice(0, 8).map(c => ({
                    label: c.name,
                    value: c.spent,
                    color: c.color,
                })),
                incomeChart: catIncome.slice(0, 8).map(c => ({
                    label: c.name,
                    value: c.earned,
                    color: c.color,
                })),
                paymentChart: sortedPayments.map(([method, amount]) => ({
                    label: method,
                    value: amount,
                })),
                dailySpendingChart,
                budgetChart: monthlyBudgetData.length > 0
                    ? monthlyBudgetData.map(cat => ({
                        label: cat.name,
                        budget: cat.budget,
                        spent: cat.spent,
                        color: cat.color,
                    }))
                    : null,
                ytdMonthlyChart: ytdData?.monthlyBreakdown
                    ? Array.from({ length: month }, (_, i) => ({
                        label: MONTHS[i].slice(0, 3),
                        income: ytdData.monthlyBreakdown[i]?.income || 0,
                        expense: ytdData.monthlyBreakdown[i]?.expense || 0,
                    }))
                    : null,
                expenseRows,
                incomeRows,
                totalExpenses: pdfCurrency(totalExpenses),
                totalIncome: pdfCurrency(totalIncome),
                budgetTable,
                paymentRows,
                ytdCards,
                ytdMonthlyRows,
                ytdMonthlyFoot,
                ytdTopCategories,
                debtRows: activeDebts.length ? activeDebts : null,
                transactionRows: transactionRows.length ? transactionRows : null,
                transactionRowMeta,
                transactionFoot: transactionRows.length ? [[
                    { content: `Net Total (${active.length} transactions)`, colSpan: 4, styles: { fontStyle: 'bold' } },
                    `${balance >= 0 ? '+' : ''}${pdfCurrency(balance)}`,
                ]] : null,
            })
        } catch (err) {
            console.error('PDF generation failed:', err)
            setPdfError('PDF generation failed. Please try again.')
            setTimeout(() => setPdfError(''), 5000)
        } finally {
            setDownloading(false)
        }
    }

    const handleDownloadCSV = () => {
        const escapeCSV = (val) => {
            const str = String(val ?? '')
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
        }
        const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Currency', 'Converted Amount', 'View Currency', 'Payment Method', 'Notes']
        const rows = expenses.map(e => {
            const cat = categories.find(c => c._id === e.category?._id)
            const converted = toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency)
            return [
                new Date(e.date).toLocaleDateString('en-US'),
                e.description,
                e.type,
                cat?.name || 'Uncategorized',
                e.amount,
                e.currency || 'PHP',
                converted ?? e.amount,
                activeViewCurrency,
                e.paymentMethod || 'Cash',
                e.notes || '',
            ].map(escapeCSV).join(',')
        })
        const csv = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `Budget_${MONTHS[month - 1]}_${year}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
    }

    if (isLoading || !dashboard) {
        return (
            <div className="page-type-scale space-y-4">
                <div className={`${card} p-5`}>
                    <div className={`h-5 w-48 mb-4 ${pulse}`} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i}>
                                <div className={`h-3 w-20 mb-2 ${pulse}`} />
                                <div className={`h-6 w-28 ${pulse}`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`${card} p-5`}>
                    <div className={`h-4 w-40 mb-4 ${pulse}`} />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                            <div className={`h-3 w-32 ${pulse}`} />
                            <div className={`h-3 w-20 ${pulse}`} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const d = dashboard
    const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt
    const active = expenses.filter(e => !e.listOnly)
    const totalIncome = active.filter(e => e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const totalExpenses = active.filter(e => e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const balance = totalIncome - totalExpenses
    const totalBudget = monthlyBudgetData.reduce((s, c) => s + (c.budget || 0), 0)
    const remainingBudget = totalBudget - totalExpenses
    const budgetUsedPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0
    const daysInMonth = new Date(year, month, 0).getDate()
    const dailyAvg = active.length > 0 ? totalExpenses / daysInMonth : 0

    const expenseCats = categories.filter(c => c.type === 'expense')
    const incomeCats = categories.filter(c => c.type === 'income')

    const catSpending = expenseCats.map(cat => {
        const spent = active.filter(e => e.category?._id === cat._id && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
        return { ...cat, spent }
    }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent)

    const catIncome = incomeCats.map(cat => {
        const earned = active.filter(e => e.category?._id === cat._id && e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
        return { ...cat, earned }
    }).filter(c => c.earned > 0).sort((a, b) => b.earned - a.earned)

    const paymentMap = {}
    active.filter(e => e.type === 'expense').forEach(e => {
        const m = e.paymentMethod || 'Cash'
        if (!paymentMap[m]) paymentMap[m] = 0
        paymentMap[m] += convert(e.amount, e.currency)
    })
    const sortedPayments = Object.entries(paymentMap).sort((a, b) => b[1] - a[1])

    const sectionTitle = `text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b border-solid ${isLight ? 'text-slate-400 border-slate-100' : 'text-gray-500 border-[#1f1f1f]'}`
    const rowCls = `flex items-center justify-between py-1.5 text-sm`
    const labelCls = isLight ? 'text-slate-600' : 'text-gray-300'
    const valueCls = `font-semibold ${isLight ? 'text-slate-800' : 'text-gray-100'}`
    const tableNumCls = `text-right align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`

    return (
        <div className="page-type-scale space-y-4">
            {/* Download Buttons */}
            <AnimateIn delay={0}><div className="flex justify-end gap-2">
                <button
                    onClick={handleDownloadCSV}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLight
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                >
                    <FontAwesomeIcon icon={faFileExport} className="text-xs" />
                    Download CSV
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${isLight
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                    {downloading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faFilePdf} className="text-xs" />
                            Download PDF
                        </>
                    )}
                </button>
            </div></AnimateIn>

            {pdfError && (
                <div className={`rounded-lg p-3 mb-2 text-sm font-medium flex items-center gap-2 ${isLight ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-900/20 text-red-400 border border-red-800/50'}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                    {pdfError}
                </div>
            )}

            {/* Printable Summary */}
            <AnimateIn delay={100}><div className={`${card} overflow-hidden`}>
                {/* Header */}
                <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-solid ${isLight ? 'border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50' : 'border-[#1f1f1f] bg-gradient-to-r from-blue-900/10 to-indigo-900/10'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                Monthly Budget Summary
                            </h2>
                            <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                {MONTHS[month - 1]} {year}
                            </p>
                        </div>
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-white shadow-sm' : 'bg-[#1a1a1a]'}`}>
                            <FontAwesomeIcon icon={faWallet} className={`text-base sm:text-lg ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {[
                            { label: 'Total Income', value: formatCurrency(totalIncome), color: 'emerald', isMoney: true },
                            { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: 'red', isMoney: true },
                            { label: 'Net Balance', value: formatCurrency(balance), color: balance >= 0 ? 'blue' : 'red', isMoney: true },
                            { label: 'Budget Used', value: totalBudget > 0 ? `${budgetUsedPct}%` : '—', color: budgetUsedPct >= 100 ? 'red' : budgetUsedPct >= 80 ? 'amber' : 'emerald' },
                        ].map((item, i) => {
                            const colors = {
                                emerald: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-900/15 text-emerald-400 border-emerald-800/30',
                                red: isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-900/15 text-red-400 border-red-800/30',
                                blue: isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-900/15 text-blue-400 border-blue-800/30',
                                amber: isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-900/15 text-amber-400 border-amber-800/30',
                            }
                            return (
                                <div key={i} className={`rounded-lg p-3 border border-solid ${colors[item.color]}`}>
                                    <p className="text-xs font-medium uppercase tracking-wider opacity-70">{item.label}</p>
                                    <p className="text-base font-bold mt-1">
                                        {item.isMoney ? <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{item.value}</BalanceAmount> : item.value}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    <TrendsChart isLight={isLight} ytdData={ytdData} month={month} formatCurrency={formatCurrency} card={`${card} !shadow-none`} />

                    {/* Quick Stats Row */}
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 px-3 sm:px-4 py-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</span>
                            <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{active.length}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Budget</span>
                            <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(totalBudget)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Daily Avg</span>
                            <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(dailyAvg)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Remaining</span>
                            <span className={`text-sm font-bold ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(remainingBudget, activeViewCurrency)}</span>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Expense Category Pie */}
                        {catSpending.length > 0 && (
                            <div>
                                <h4 className={sectionTitle}>
                                    <FontAwesomeIcon icon={faChartPie} className="mr-1.5 text-indigo-400 text-xs" />
                                    Expense Distribution
                                </h4>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={catSpending.slice(0, 8)} dataKey="spent" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2} strokeWidth={0}>
                                            {catSpending.slice(0, 8).map((c, i) => <Cell key={i} fill={c.color} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '13px' }}
                                            labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                            itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '13px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Monthly Trend (YTD) */}
                        {ytdData && ytdData.monthlyBreakdown && (
                            <div>
                                <h4 className={sectionTitle}>
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-blue-400 text-xs" />
                                    Monthly Trend (YTD)
                                </h4>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={Array.from({ length: month }, (_, i) => ({
                                        name: MONTHS[i].slice(0, 3),
                                        expense: ytdData.monthlyBreakdown[i]?.expense || 0,
                                        income: ytdData.monthlyBreakdown[i]?.income || 0,
                                    }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} />
                                        <YAxis tick={{ fontSize: 12, fill: isLight ? '#94a3b8' : '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={40} />
                                        <Tooltip
                                            contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '13px' }}
                                            labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                            itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                        <Legend wrapperStyle={{ fontSize: '13px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Two Column: Expense Categories + Income Sources */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Expense Breakdown */}
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faArrowDown} className="mr-1.5 text-red-400 text-xs" />
                                Expense Breakdown
                            </h4>
                            {catSpending.length > 0 ? (
                                <div className="space-y-0.5">
                                    {catSpending.map((cat) => {
                                        const pct = totalExpenses > 0 ? Math.round((cat.spent / totalExpenses) * 100) : 0
                                        return (
                                            <div key={cat._id} className={rowCls}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                        {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                    </div>
                                                    <span className={labelCls}>{cat.name}</span>
                                                    <span className={`text-sm ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>{pct}%</span>
                                                </div>
                                                <span className={valueCls}>{formatCurrency(cat.spent)}</span>
                                            </div>
                                        )
                                    })}
                                    <div className={`flex items-center justify-between pt-2 mt-1 border-t border-solid text-sm font-bold ${isLight ? 'border-slate-100 text-red-600' : 'border-[#1f1f1f] text-red-400'}`}>
                                        <span>Total Expenses</span>
                                        <span>{formatCurrency(totalExpenses)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No expenses recorded.</p>
                            )}
                        </div>

                        {/* Income Breakdown */}
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faArrowUp} className="mr-1.5 text-emerald-400 text-xs" />
                                Income Sources
                            </h4>
                            {catIncome.length > 0 ? (
                                <div className="space-y-0.5">
                                    {catIncome.map((cat) => {
                                        const pct = totalIncome > 0 ? Math.round((cat.earned / totalIncome) * 100) : 0
                                        return (
                                            <div key={cat._id} className={rowCls}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                        {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                    </div>
                                                    <span className={labelCls}>{cat.name}</span>
                                                    <span className={`text-sm ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>{pct}%</span>
                                                </div>
                                                <span className={valueCls}>{formatCurrency(cat.earned)}</span>
                                            </div>
                                        )
                                    })}
                                    <div className={`flex items-center justify-between pt-2 mt-1 border-t border-solid text-sm font-bold ${isLight ? 'border-slate-100 text-emerald-600' : 'border-[#1f1f1f] text-emerald-400'}`}>
                                        <span>Total Income</span>
                                        <span>{formatCurrency(totalIncome)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No income recorded.</p>
                            )}
                        </div>
                    </div>

                    {/* Budget per Category */}
                    {monthlyBudgetData.length > 0 && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faChartPie} className="mr-1.5 text-blue-400 text-xs" />
                                Budget vs Actual
                            </h4>
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg border border-solid min-w-[500px]" style={{ borderColor: isLight ? '#e2e8f0' : '#1f1f1f' }}>
                                <table className="w-full text-sm align-top">
                                    <thead>
                                        <tr className={isLight ? 'bg-slate-50 text-slate-400' : 'bg-[#111] text-gray-500'}>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Category</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Budget</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Spent</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Remaining</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyBudgetData.map((cat, i) => {
                                            const sc = statusColor(cat.percentage)
                                            return (
                                                <tr key={cat._id} className={`${i > 0 ? `border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}` : ''}`}>
                                                    <td className={`px-3 py-2 align-top ${labelCls}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                                {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                            </div>
                                                            {cat.name}
                                                        </div>
                                                    </td>
                                                    <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(cat.budget)}</td>
                                                    <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(cat.spent)}</td>
                                                    <td className={`px-3 py-2 align-top ${tableNumCls}`}>
                                                        {formatCurrency(cat.remaining)}
                                                    </td>
                                                    <td className={`px-3 py-2 align-top text-right`}>
                                                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${sc.text} ${sc.bg}`}>
                                                            {cat.budget > 0 ? `${cat.percentage}%` : '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className={`border-t-2 border-solid ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2B2B2B] bg-[#111]'}`}>
                                            <td className={`px-3 py-2 font-bold align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Total</td>
                                            <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(totalBudget)}</td>
                                            <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(totalExpenses)}</td>
                                            <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrencyRaw(remainingBudget, activeViewCurrency)}</td>
                                            <td className="px-3 py-2 text-right align-top">
                                                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(budgetUsedPct).text} ${statusColor(budgetUsedPct).bg}`}>
                                                    {budgetUsedPct}%
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Methods */}
                    {sortedPayments.length > 0 && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faCreditCard} className="mr-1.5 text-indigo-400 text-xs" />
                                Payment Methods
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {sortedPayments.map(([method, amount]) => {
                                    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                                    return (
                                        <div key={method} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
                                                <FontAwesomeIcon icon={paymentIcon(method)} className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{method}</p>
                                                <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(amount)} · {pct}%</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Year-to-Date Summary */}
                    {ytdData && !ytdLoading && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faCalendarCheck} className="mr-1.5 text-indigo-400 text-xs" />
                                Year-to-Date ({year})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                                {[
                                    { label: 'YTD Income', value: formatCurrencyRaw(ytdData.ytdIncome, activeViewCurrency), color: 'emerald' },
                                    { label: 'YTD Expenses', value: formatCurrencyRaw(ytdData.ytdExpense, activeViewCurrency), color: 'red' },
                                    { label: 'Net Balance', value: formatCurrencyRaw(ytdData.ytdBalance, activeViewCurrency), color: ytdData.ytdBalance >= 0 ? 'blue' : 'red' },
                                    { label: 'Monthly Avg', value: formatCurrencyRaw(ytdData.monthlyAvg, activeViewCurrency), color: 'amber' },
                                ].map((item, i) => {
                                    const colors = {
                                        emerald: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-900/15 text-emerald-400 border-emerald-800/30',
                                        red: isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-900/15 text-red-400 border-red-800/30',
                                        blue: isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-900/15 text-blue-400 border-blue-800/30',
                                        amber: isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-900/15 text-amber-400 border-amber-800/30',
                                    }
                                    return (
                                        <div key={i} className={`rounded-lg p-3 border border-solid ${colors[item.color]}`}>
                                            <p className="text-xs font-medium uppercase tracking-wider opacity-70">{item.label}</p>
                                            <p className="text-sm font-bold mt-1">{item.value}</p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Monthly Breakdown Table */}
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg border border-solid min-w-[400px]" style={{ borderColor: isLight ? '#e2e8f0' : '#1f1f1f' }}>
                                <table className="w-full text-sm align-top">
                                    <thead>
                                        <tr className={isLight ? 'bg-slate-50 text-slate-400' : 'bg-[#111] text-gray-500'}>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Month</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Income</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Expenses</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Net</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Txns</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: month }, (_, i) => {
                                            const data = ytdData.monthlyBreakdown[i] || { income: 0, expense: 0, count: 0 }
                                            const net = data.income - data.expense
                                            return (
                                                <tr key={i} className={i > 0 ? `border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}` : ''}>
                                                    <td className={`px-3 py-2 font-medium align-top ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{MONTHS[i].slice(0, 3)}</td>
                                                    <td className={`px-3 py-2 ${tableNumCls}`}>{data.income > 0 ? formatCurrencyRaw(data.income, activeViewCurrency) : '—'}</td>
                                                    <td className={`px-3 py-2 ${tableNumCls}`}>{data.expense > 0 ? formatCurrencyRaw(data.expense, activeViewCurrency) : '—'}</td>
                                                    <td className={`px-3 py-2 ${tableNumCls}`}>{data.count > 0 ? formatCurrencyRaw(net, activeViewCurrency) : '—'}</td>
                                                    <td className={`px-3 py-2 text-right align-top ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{data.count || '—'}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className={`border-t-2 border-solid ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2B2B2B] bg-[#111]'}`}>
                                            <td className={`px-3 py-2 font-bold align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Total</td>
                                            <td className={`px-3 py-2 ${tableNumCls}`}>{formatCurrencyRaw(ytdData.ytdIncome, activeViewCurrency)}</td>
                                            <td className={`px-3 py-2 ${tableNumCls}`}>{formatCurrencyRaw(ytdData.ytdExpense, activeViewCurrency)}</td>
                                            <td className={`px-3 py-2 ${tableNumCls}`}>{formatCurrencyRaw(ytdData.ytdBalance, activeViewCurrency)}</td>
                                            <td className={`px-3 py-2 text-right align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{ytdData.ytdTxCount}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            </div>

                            {/* YTD Top Categories */}
                            {ytdData.topCategories.length > 0 && (
                                <div className="mt-4">
                                    <span className={`text-sm font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Top Spending Categories (YTD)</span>
                                    <div className="space-y-1.5 mt-2">
                                        {ytdData.topCategories.map((cat, i) => {
                                            const pct = ytdData.ytdExpense > 0 ? Math.round((cat.amount / ytdData.ytdExpense) * 100) : 0
                                            return (
                                                <div key={i} className={`flex items-center justify-between py-1 text-sm`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                            {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                        </div>
                                                        <span className={isLight ? 'text-slate-600' : 'text-gray-300'}>{cat.name}</span>
                                                        <span className={`text-sm ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>{pct}%</span>
                                                    </div>
                                                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-gray-100'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Daily Transaction Log */}
                    {groupedByDate.length > 0 && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faCalendarDay} className="mr-1.5 text-amber-400 text-xs" />
                                Daily Transactions
                            </h4>
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg border border-solid min-w-[550px]" style={{ borderColor: isLight ? '#e2e8f0' : '#1f1f1f' }}>
                                <table className="w-full text-sm align-top">
                                    <thead>
                                        <tr className={isLight ? 'bg-slate-50 text-slate-400' : 'bg-[#111] text-gray-500'}>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Date</th>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Description</th>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Category</th>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Method</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedByDate.map(([date, group]) => {
                                            const grpIncome = group.items.filter(e => !e.listOnly && e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                                            const grpExpense = group.items.filter(e => !e.listOnly && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                                            const grpCurrencies = {}
                                            group.items.filter(e => !e.listOnly).forEach(e => {
                                                const cur = e.currency || 'PHP'
                                                if (cur === activeViewCurrency) return
                                                if (!grpCurrencies[cur]) grpCurrencies[cur] = { income: 0, expense: 0 }
                                                if (e.type === 'income') grpCurrencies[cur].income += e.amount
                                                else grpCurrencies[cur].expense += e.amount
                                            })
                                            const grpCurrencyEntries = Object.entries(grpCurrencies)
                                            return (
                                            <React.Fragment key={date}>
                                                <tr className={isLight ? 'bg-slate-50/50' : 'bg-[#0a0a0a]'}>
                                                    <td colSpan={3} className="px-3 py-1.5 align-top">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{date}</span>
                                                            {grpCurrencyEntries.map(([code, v]) => (
                                                                <span key={code} className={`text-xs font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                                                    {v.expense > 0 && <span className="text-red-500">-{formatCurrencyRaw(v.expense, code)}</span>}
                                                                    {v.income > 0 && v.expense > 0 && ' '}
                                                                    {v.income > 0 && <span className="text-emerald-500">+{formatCurrencyRaw(v.income, code)}</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right align-top" colSpan={2}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            {grpIncome > 0 && <span className="text-sm font-semibold text-emerald-500">+{formatCurrencyRaw(grpIncome, activeViewCurrency)}</span>}
                                                            {grpExpense > 0 && <span className="text-sm font-semibold text-red-500">-{formatCurrencyRaw(grpExpense, activeViewCurrency)}</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {group.items.map(e => {
                                                    const fromCur = e.currency || 'PHP'
                                                    const converted = fromCur !== activeViewCurrency ? toTargetCurrency(e.amount, fromCur, activeViewCurrency) : null
                                                    return (
                                                    <tr key={e._id} className={`border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'} ${e.listOnly ? 'opacity-40' : ''}`}>
                                                        <td className={`px-3 py-1.5 whitespace-nowrap align-top ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className={`px-3 py-1.5 align-top ${e.listOnly ? 'line-through' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                            {e.description}
                                                            {e.listOnly && <span className={`ml-1 text-xs font-bold px-1 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#1a1a1a] text-gray-500'}`}>LIST</span>}
                                                        </td>
                                                        <td className={`px-3 py-1.5 align-top ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                                                    {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-[8px]" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                                                </div>
                                                                {e.category?.name || 'Uncategorized'}
                                                            </div>
                                                        </td>
                                                        <td className={`px-3 py-1.5 align-top ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{e.paymentMethod}</td>
                                                        <td className={`px-3 py-1.5 text-right align-top whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                            {converted !== null ? (
                                                                <>
                                                                    <span className={`text-sm ${e.listOnly ? 'line-through' : ''}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(converted, activeViewCurrency)}
                                                                    </span>
                                                                    <span className={`block text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, fromCur)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className={`text-sm ${e.listOnly ? 'line-through' : ''}`}>
                                                                    {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, fromCur)}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    )
                                                })}
                                            </React.Fragment>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className={`border-t-2 border-solid ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2B2B2B] bg-[#111]'}`}>
                                            <td colSpan={4} className={`px-3 py-2 font-bold align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                Net Total ({active.length} transactions)
                                            </td>
                                            <td className={`px-3 py-2 text-right align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                {balance >= 0 ? '+' : ''}{formatCurrencyRaw(balance, activeViewCurrency)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pt-4 mt-2 border-t border-solid text-xs ${isLight ? 'border-slate-100 text-slate-300' : 'border-[#1f1f1f] text-gray-600'}`}>
                        <span>Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span>Budget Manager · {MONTHS[month - 1]} {year}</span>
                    </div>
                </div>
            </div></AnimateIn>

        </div>
    )
})

export default SummaryTab
