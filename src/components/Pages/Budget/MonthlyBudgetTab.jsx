import React, { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faExclamationTriangle, faCalendarAlt, faTimes } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, ModalOverlay, SafeIcon } from './SharedComponents'
import { MONTHS } from './constants'


// ==================== MONTHLY BUDGET TAB ====================

const MonthlyBudgetTab = React.memo(({ monthlyBudgetData, dashboard, isLight, card, formatCurrency, statusColor, month, year, isLoading, expenses, formatCurrencyRaw, activeViewCurrency, toTargetCurrency, categories, paymentIcon, setReceiptViewer }) => {
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`
    const [drilldown, setDrilldown] = useState(null)

    const drilldownItems = useMemo(() => {
        if (!drilldown) return []
        const active = expenses.filter(e => !e.listOnly && e.type === 'expense')
        return active
            .filter(e => (e.category?._id || 'uncategorized') === drilldown._id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [drilldown, expenses])

    if (isLoading || !dashboard) {
        return (
            <div className="page-type-scale space-y-4">
                <div className={`${card} p-5`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`h-4 w-32 ${pulse}`} />
                        <div className={`h-4 w-24 ${pulse}`} />
                    </div>
                    <div className={`h-3 rounded-full w-full ${pulse}`} />
                    <div className="flex justify-between mt-2">
                        <div className={`h-3 w-20 ${pulse}`} />
                        <div className={`h-3 w-20 ${pulse}`} />
                    </div>
                </div>
                <div className={`${card} overflow-hidden`}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`flex items-center gap-3 px-5 py-4 ${i > 0 ? `border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}` : ''}`}>
                            <div className={`w-3 h-3 rounded-full ${pulse}`} />
                            <div className="flex-1 space-y-1.5">
                                <div className={`h-3.5 w-28 ${pulse}`} />
                                <div className={`h-2 rounded-full w-full ${pulse}`} />
                            </div>
                            <div className={`h-4 w-20 ${pulse}`} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const allocatedCats = monthlyBudgetData.filter(c => !c.unallocated)
    const unallocated = monthlyBudgetData.find(c => c.unallocated)
    const totalBudget = allocatedCats.reduce((s, c) => s + (c.budget || 0), 0)
    const totalSpent = allocatedCats.reduce((s, c) => s + (c.spent || 0), 0)
    const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    const overallStatus = statusColor(overallPct)

    return (
        <div className="page-type-scale space-y-4">
            <AnimateIn delay={0}><div className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                        {MONTHS[month - 1]} {year} — Overall Budget
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${overallStatus.text} ${overallStatus.bg}`}>
                        {overallPct}%
                    </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`} role="progressbar" aria-valuenow={Math.min(overallPct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Overall budget ${overallPct}% used`}>
                    <div className={`h-full rounded-full ${overallStatus.bar}`} style={{ width: `${Math.min(overallPct, 100)}%`, animation: 'barGrow 0.8s ease-out 0.3s both' }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Spent: {formatCurrency(totalSpent)}</span>
                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget: {formatCurrency(totalBudget)}</span>
                </div>
            </div></AnimateIn>

            {unallocated && (
                <AnimateIn delay={40}>
                    <div
                        className={`${card} p-5 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}
                        onClick={() => setDrilldown(unallocated)}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Unallocated / Uncategorized</h3>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                Unallocated
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Spent: {formatCurrency(unallocated.spent)}</span>
                            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Not included in overall budget</span>
                        </div>
                    </div>
                </AnimateIn>
            )}

            {/* Per Category */}
            {allocatedCats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allocatedCats.map((cat, catIdx) => {
                        const sc = statusColor(cat.percentage)
                        const isUnallocated = !!cat.unallocated
                        return (
                            <AnimateIn key={cat._id} delay={catIdx * 80}>
                            <div className={`${card} p-4 border-l-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} style={{ borderLeftColor: cat.color }} onClick={() => setDrilldown(cat)}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                            {cat.icon ? <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} /> : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                        </div>
                                        <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        isUnallocated
                                            ? (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400')
                                            : `${sc.text} ${sc.bg}`
                                    }`}>
                                        {isUnallocated ? 'Unallocated' : cat.budget > 0 ? `${cat.percentage}%` : 'No budget'}
                                    </span>
                                </div>
                                {cat.budget > 0 && (
                                    <div className={`h-2 rounded-full overflow-hidden mb-2 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                        <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${Math.min(cat.percentage, 100)}%`, animation: `barGrow 0.8s ease-out ${0.2 + catIdx * 0.08}s both` }} />
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Spent: {formatCurrency(cat.spent)}</span>
                                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {isUnallocated ? 'No budget assigned' : cat.budget > 0 ? `Remaining: ${formatCurrency(cat.remaining)}` : `Budget: ${formatCurrency(0)}`}
                                    </span>
                                </div>
                                {cat.percentage > 100 && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium text-red-500`}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                                        Over budget by {formatCurrency(Math.abs(cat.remaining))}
                                    </div>
                                )}
                                {cat.percentage === 100 && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-500`}>
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
                                        Exactly on budget
                                    </div>
                                )}
                                {cat.percentage >= 80 && cat.percentage < 100 && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-500`}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                                        Approaching budget limit
                                    </div>
                                )}
                            </div>
                            </AnimateIn>
                        )
                    })}
                </div>
            ) : (
                <div className={`${card} p-8 text-center`}>
                    <FontAwesomeIcon icon={faCalendarAlt} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No budget categories set up.</p>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>Go to Categories tab to create expense categories with budgets.</p>
                </div>
            )}

            {drilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setDrilldown(null)}>
                    <div
                        className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-solid shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`px-6 pt-5 pb-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className={`text-2xl font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldown.name}</h3>
                                    <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                        Budget breakdown · {MONTHS[month - 1]} {year}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDrilldown(null)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>
                        </div>

                        <div className={`px-6 py-4 border-b border-solid flex-shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                        {drilldown.unallocated ? 'Unallocated spent' : 'Spent / Budget'}
                                    </p>
                                    <p className={`text-lg font-semibold mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                        {formatCurrency(drilldown.spent)}
                                        {!drilldown.unallocated && (
                                            <span className={`text-sm font-normal ${isLight ? 'text-slate-500' : 'text-gray-400'}`}> / {formatCurrency(drilldown.budget)}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Transactions</p>
                                    <p className={`text-lg font-semibold mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldownItems.length}</p>
                                </div>
                            </div>
                            {drilldown.budget > 0 && (
                                <div className="mt-4">
                                    <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                        <div className={`h-full rounded-full ${statusColor(drilldown.percentage).bar}`} style={{ width: `${Math.min(drilldown.percentage, 100)}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-sm ${statusColor(drilldown.percentage).text}`}>
                                            {drilldown.percentage}% used
                                            {drilldown.percentage > 100 && ` · ${formatCurrency(Math.abs(drilldown.remaining))} over`}
                                        </span>
                                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                            {drilldown.remaining >= 0 ? `${formatCurrency(drilldown.remaining)} left` : ''}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1 min-h-0">
                            {drilldownItems.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {drilldownItems.map(e => {
                                        const converted = (e.currency || 'PHP') !== activeViewCurrency ? toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency) : null
                                        return (
                                            <div key={e._id} className={`flex items-center gap-3 px-6 py-3.5 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#151515]'}`}>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description || 'No description'}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        {e.paymentMethod && (
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                                                <FontAwesomeIcon icon={paymentIcon(e.paymentMethod)} className="text-[10px]" />
                                                                {e.paymentMethod}
                                                            </span>
                                                        )}
                                                        {e.notes && (
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`} title={e.notes}>Note</span>
                                                        )}
                                                        {e.attachments?.length > 0 && (
                                                            <button type="button" onClick={() => setReceiptViewer(e.attachments[0])} className={`text-xs font-medium px-2 py-0.5 rounded-md ${isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900/20 text-blue-400'}`}>
                                                                Receipt
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-semibold text-red-500">
                                                        -{converted !== null ? formatCurrencyRaw(converted, activeViewCurrency) : formatCurrencyRaw(e.amount, activeViewCurrency)}
                                                    </p>
                                                    {converted !== null && (
                                                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>-{formatCurrencyRaw(e.amount, e.currency)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10 px-6">
                                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No expenses in this category.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    )
})

export default MonthlyBudgetTab
