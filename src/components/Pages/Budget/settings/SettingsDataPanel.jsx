import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartPie, faEye, faFileExport, faSyncAlt, faHistory, faCheck } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn } from '../SharedComponents'
import { useSettings } from './SettingsContext.jsx'
import { CURRENCIES, MONTHS } from '../constants'
import { exportBudgetBackup, importBudgetBackup } from '../../../../endpoint'
import { getBudgetInitialLoad } from '../../../../actions/budget'
import AuditLogPanel from '../AuditLogPanel'

export default function SettingsDataPanel() {
    const {
        isLight, card, cardP, descCls, titleCls, metaCls, sectionCls, templateStyles, btnPrimary, btnSecondary,
        expenseStats, activeViewCurrency, setNotification, dispatch,
        expenses, month, year, monthlyBudgetData, formatCurrencyRaw,
    } = useSettings()

    return (
        <div className="space-y-4">
            {/* ─── Transaction Stats ─── */}
            <AnimateIn delay={500}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-cyan-50' : 'bg-cyan-900/20'}`}>
                        <FontAwesomeIcon icon={faChartPie} className={`text-sm ${isLight ? 'text-cyan-500' : 'text-cyan-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Current Month Stats</h3>
                        <p className={descCls}>Transaction statistics for the selected month</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { label: 'Total Transactions', value: expenseStats.total, color: isLight ? 'text-slate-700' : 'text-gray-200' },
                        { label: 'Active', value: expenseStats.active, color: templateStyles?.accentText || (isLight ? 'text-blue-600' : 'text-blue-400') },
                        { label: 'List Only', value: expenseStats.listOnly, color: isLight ? 'text-amber-600' : 'text-amber-400' },
                        { label: 'Recurring', value: expenseStats.recurring, color: isLight ? 'text-violet-600' : 'text-violet-400' },
                    ].map((s, i) => (
                        <div key={i} className={`text-center px-3 py-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {expenseStats.currencies.length > 0 && (
                    <div className={`mt-4 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <p className={`${sectionCls} mb-2`}>Currencies in Use</p>
                        <div className="flex flex-wrap gap-1.5">
                            {expenseStats.currencies.map(code => {
                                const cur = CURRENCIES.find(c => c.code === code)
                                return (
                                    <span key={code} className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1.5 rounded-lg ${
                                        code === activeViewCurrency
                                            ? templateStyles?.tabActive || (isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                                            : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                                    }`}>
                                        {cur?.symbol || ''} {code}
                                        {code === activeViewCurrency && <FontAwesomeIcon icon={faEye} className="text-xs ml-0.5" />}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div></AnimateIn>

            {/* ─── Full Backup ─── */}
            <AnimateIn delay={720}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                        <FontAwesomeIcon icon={faFileExport} className={`text-sm ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Full Backup</h3>
                        <p className={descCls}>Export or restore all budget data as JSON</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={btnPrimary}
                        onClick={async () => {
                            try {
                                const res = await exportBudgetBackup()
                                const blob = new Blob([JSON.stringify(res.data.result, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`
                                a.click()
                                URL.revokeObjectURL(url)
                                setNotification({ msg: 'Backup downloaded', variant: 'success' })
                            } catch {
                                setNotification({ msg: 'Export failed', variant: 'danger' })
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faFileExport} className="mr-1.5 text-xs" />Export JSON
                    </button>
                    <label className={`${btnSecondary} cursor-pointer inline-flex items-center`}>
                        <FontAwesomeIcon icon={faSyncAlt} className="mr-1.5 text-xs" />Import JSON
                        <input
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                try {
                                    const text = await file.text()
                                    const backup = JSON.parse(text)
                                    await importBudgetBackup({ backup, mode: 'merge' })
                                    setNotification({ msg: 'Backup imported — reload to see all data', variant: 'success' })
                                    dispatch(getBudgetInitialLoad())
                                } catch {
                                    setNotification({ msg: 'Import failed — check file format', variant: 'danger' })
                                }
                                e.target.value = ''
                            }}
                        />
                    </label>
                </div>
            </div></AnimateIn>

            {/* ─── Budget Snapshots ─── */}
            <AnimateIn delay={750}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-indigo-50' : 'bg-indigo-900/20'}`}>
                        <FontAwesomeIcon icon={faHistory} className={`text-sm ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Monthly Snapshots</h3>
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Save a snapshot of current month's budget data</p>
                    </div>
                </div>
                {(() => {
                    const snapshots = JSON.parse(localStorage.getItem('budget_snapshots') || '[]')
                    const currentKey = `${year}-${String(month).padStart(2, '0')}`
                    const hasSnapshot = snapshots.some(s => s.key === currentKey)

                    const saveSnapshot = () => {
                        const totalIncome = expenses.filter(e => !e.listOnly && e.type === 'income').reduce((s, e) => s + e.amount, 0)
                        const totalExpense = expenses.filter(e => !e.listOnly && e.type === 'expense').reduce((s, e) => s + e.amount, 0)
                        const snapshot = {
                            key: currentKey,
                            date: new Date().toISOString(),
                            month, year,
                            totalIncome, totalExpense,
                            balance: totalIncome - totalExpense,
                            transactions: expenses.length,
                            categories: (monthlyBudgetData || []).filter(c => c.budget > 0).map(c => ({ name: c.name, spent: c.spent, budget: c.budget })),
                        }
                        const updated = [...snapshots.filter(s => s.key !== currentKey), snapshot].sort((a, b) => b.key.localeCompare(a.key))
                        localStorage.setItem('budget_snapshots', JSON.stringify(updated.slice(0, 12)))
                        setNotification({ msg: `Snapshot saved for ${MONTHS[month - 1]} ${year}`, variant: 'success' })
                    }

                    return (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <button onClick={saveSnapshot} className={btnPrimary}>
                                    <FontAwesomeIcon icon={faCheck} className="mr-1.5 text-xs" />
                                    {hasSnapshot ? 'Update Snapshot' : 'Save Snapshot'}
                                </button>
                                <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {MONTHS[month - 1]} {year} — {expenses.length} transactions
                                </span>
                            </div>
                            {snapshots.length > 0 && (
                                <div className="space-y-1.5">
                                    {snapshots.slice(0, 6).map(s => (
                                        <div key={s.key} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                            <div>
                                                <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{MONTHS[s.month - 1]} {s.year}</span>
                                                <span className={`text-sm ml-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.transactions} txns</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-emerald-500 font-medium">+{formatCurrencyRaw(s.totalIncome, activeViewCurrency)}</span>
                                                <span className="text-sm text-red-500 font-medium">-{formatCurrencyRaw(s.totalExpense, activeViewCurrency)}</span>
                                                <span className={`text-sm font-bold ${s.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(s.balance, activeViewCurrency)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })()}
            </div></AnimateIn>

            {/* ─── Activity Log ─── */}
            <AuditLogPanel isLight={isLight} card={card} cardP={cardP} descCls={descCls} titleCls={titleCls} metaCls={metaCls} />
        </div>
    )
}
