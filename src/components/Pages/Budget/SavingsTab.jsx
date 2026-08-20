import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPiggyBank, faCoins, faMoneyBillWave, faHistory, faPlus, faPen, faTrash,
    faCheck, faTimes, faSpinner, faBuildingColumns, faWallet, faArrowUp, faArrowDown,
    faCalendarDay, faFilter, faPercent,
} from '@fortawesome/free-solid-svg-icons'
import { DENOMINATIONS } from './constants'
import { AnimateIn, ModalOverlay } from './SharedComponents'
import {
    getBudgetSavingsHistory, deleteBudgetSavingsHistory,
    createBudgetSavingsAccount, updateBudgetSavingsAccount, deleteBudgetSavingsAccount,
    processSavingsInterest,
} from '../../../actions/budget'
import {
    calcAccountTotal, calcAllSavingsTotal, countsFromDenominations, emptyDenominations,
    calcInterestBreakdown, INTEREST_FREQUENCY_OPTIONS,
} from '../../../utils/savings'

const fmtInterestAmount = (value) =>
    `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const ACCRUAL_LABELS = {
    daily: 'Daily accrual',
    weekly: 'Weekly accrual',
    monthly: 'Monthly accrual',
    yearly: 'Yearly accrual',
}

const InterestBreakdownPanel = ({ isLight, breakdown, withholdingTax, activeFrequency, compact = false }) => {
    if (!breakdown) return null

    const items = [
        { key: 'yearly', label: 'Per year', short: 'Year', data: breakdown.yearly },
        { key: 'monthly', label: 'Per month', short: 'Month', data: breakdown.monthly },
        { key: 'daily', label: 'Per day', short: 'Day', data: breakdown.daily },
    ]

    const accrualLabel = ACCRUAL_LABELS[activeFrequency] || 'Auto accrual'
    const taxPct = withholdingTax || 20

    const shellCls = isLight
        ? 'border-slate-200 bg-slate-50/80'
        : 'border-[#2a2a2a] bg-[#111]/60'
    const labelCls = `text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'}`
    const metaCls = `text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`
    const valueCls = `text-sm font-bold tabular-nums ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`

    if (compact) {
        return (
            <div className={`rounded-xl border border-solid overflow-hidden ${shellCls}`}>
                <div className={`px-3 py-2 border-b border-solid flex items-center justify-between gap-2 ${isLight ? 'border-slate-200' : 'border-[#222]'}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        Net interest
                    </span>
                    <span className={metaCls}>{taxPct}% tax</span>
                </div>
                <div className={`flex divide-x divide-solid ${isLight ? 'divide-slate-200' : 'divide-[#222]'}`}>
                    {items.map(({ key, short, data }) => (
                        <div key={key} className="flex-1 min-w-0 px-2 py-2.5 text-center">
                            <p className={`text-xs font-medium mb-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{short}</p>
                            <p className={valueCls}>+{fmtInterestAmount(data.net)}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className={`rounded-xl border border-solid overflow-hidden ${shellCls}`}>
            <div className={`px-4 py-3 border-b border-solid ${isLight ? 'border-slate-200 bg-white/60' : 'border-[#222] bg-[#0e0e0e]/60'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                            Interest projection
                        </p>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                            Net earnings after {taxPct}% withholding
                        </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-900/40 text-indigo-300'}`}>
                        {accrualLabel}
                    </span>
                </div>
            </div>

            <div className={`divide-y divide-solid ${isLight ? 'divide-slate-200' : 'divide-[#222]'}`}>
                {items.map(({ key, label, data }) => {
                    const isActive = activeFrequency === key
                    return (
                        <div
                            key={key}
                            className={`px-4 py-3 flex items-start justify-between gap-4 ${
                                isActive ? (isLight ? 'bg-indigo-50/50' : 'bg-indigo-950/20') : ''
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={labelCls}>{label}</span>
                                    {isActive && (
                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-900/50 text-indigo-300'}`}>
                                            Accrual
                                        </span>
                                    )}
                                </div>
                                <p className={`${metaCls} mt-1`}>
                                    Gross {fmtInterestAmount(data.gross)}
                                    <span className={`mx-1.5 ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>·</span>
                                    Tax {fmtInterestAmount(data.tax)}
                                </p>
                            </div>
                            <p className={`${valueCls} shrink-0 text-right`}>+{fmtInterestAmount(data.net)}</p>
                        </div>
                    )
                })}
            </div>

            {activeFrequency === 'weekly' && (
                <p className={`px-4 py-2.5 text-xs border-t border-solid ${isLight ? 'border-slate-200 text-slate-400 bg-white/40' : 'border-[#222] text-gray-500 bg-[#0e0e0e]/40'}`}>
                    Weekly accrual — figures below show equivalent day, month, and year rates.
                </p>
            )}
        </div>
    )
}

const DeleteConfirmModal = ({ isLight, onConfirm, onCancel, title, message }) => (
    <ModalOverlay isLight={isLight} onClose={onCancel}>
        <div className={`w-full max-w-sm rounded-2xl border border-solid p-5 shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-base font-bold mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>{title}</h3>
            <p className={`text-sm mb-5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{message}</p>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className={`px-4 py-2 rounded-lg text-sm font-medium ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'}`}>Cancel</button>
                <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white">Delete</button>
            </div>
        </div>
    </ModalOverlay>
)

const formatHistoryDateLabel = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    if (sameDay(d, today)) return 'Today'
    if (sameDay(d, yesterday)) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const SavingsHistoryPanel = ({ isLight, card, inputCls, formatCurrency, savingsHistory, savingsAccounts, isViewer, onDelete }) => {
    const allEntries = savingsHistory || []
    const [accountFilter, setAccountFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [changeFilter, setChangeFilter] = useState('all')

    const accountOptions = useMemo(() => {
        const names = new Set()
        allEntries.forEach(e => { if (e.accountName) names.add(e.accountName) })
        ;(savingsAccounts || []).forEach(a => { if (a.name) names.add(a.name) })
        return Array.from(names).sort()
    }, [allEntries, savingsAccounts])

    const entries = useMemo(() => allEntries.filter(entry => {
        if (accountFilter !== 'all' && (entry.accountName || 'Savings') !== accountFilter) return false
        if (categoryFilter !== 'all' && entry.category !== categoryFilter) return false
        if (changeFilter === 'increase' && !(entry.diffTotal > 0)) return false
        if (changeFilter === 'decrease' && !(entry.diffTotal < 0)) return false
        return true
    }), [allEntries, accountFilter, categoryFilter, changeFilter])

    const hasFilters = accountFilter !== 'all' || categoryFilter !== 'all' || changeFilter !== 'all'

    const grouped = useMemo(() => {
        const map = new Map()
        entries.forEach(entry => {
            const label = formatHistoryDateLabel(entry.createdAt)
            if (!map.has(label)) map.set(label, [])
            map.get(label).push(entry)
        })
        return Array.from(map.entries())
    }, [entries])

    const filteredStats = useMemo(() => {
        let up = 0
        let down = 0
        entries.forEach(e => {
            if (e.diffTotal > 0) up += 1
            else if (e.diffTotal < 0) down += 1
        })
        return { up, down }
    }, [entries])

    const filterFieldCls = `${inputCls} w-full !py-2 !text-xs !min-h-0`
    const filterLabelCls = `block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`

    if (allEntries.length === 0) {
        return (
            <div className={`${card} text-center py-12 px-4`}>
                <FontAwesomeIcon icon={faHistory} className={`text-2xl mb-2 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No changes recorded yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className={`${card} p-3`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faFilter} className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                        <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Filters</span>
                    </div>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() => { setAccountFilter('all'); setCategoryFilter('all'); setChangeFilter('all') }}
                            className={`text-[11px] font-medium px-2 py-1 rounded-md ${isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10'}`}
                        >
                            Clear all
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                        <label className={filterLabelCls}>Account</label>
                        <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className={filterFieldCls}>
                            <option value="all">All accounts</option>
                            {accountOptions.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={filterLabelCls}>Type</label>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={filterFieldCls}>
                            <option value="all">All types</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank</option>
                        </select>
                    </div>
                    <div>
                        <label className={filterLabelCls}>Change</label>
                        <select value={changeFilter} onChange={e => setChangeFilter(e.target.value)} className={filterFieldCls}>
                            <option value="all">All changes</option>
                            <option value="increase">Increases only</option>
                            <option value="decrease">Decreases only</option>
                        </select>
                    </div>
                </div>

                <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-3 border-t border-solid text-[10px] ${isLight ? 'border-slate-100 text-slate-400' : 'border-[#1f1f1f] text-gray-500'}`}>
                    <span>Showing <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{entries.length}</span> of {allEntries.length}</span>
                    {entries.length > 0 && (
                        <>
                            <span>·</span>
                            <span className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>{filteredStats.up} increase{filteredStats.up !== 1 ? 's' : ''}</span>
                            <span>·</span>
                            <span className={isLight ? 'text-red-500' : 'text-red-400'}>{filteredStats.down} decrease{filteredStats.down !== 1 ? 's' : ''}</span>
                        </>
                    )}
                </div>
            </div>

            {entries.length === 0 ? (
                <div className={`${card} text-center py-10 px-4`}>
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No entries match your filters.</p>
                </div>
            ) : (
                grouped.map(([dateLabel, dayEntries]) => (
                    <div key={dateLabel}>
                        <div className="flex items-center gap-2 mb-2 px-0.5">
                            <FontAwesomeIcon icon={faCalendarDay} className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{dateLabel}</p>
                            <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-[#222]'}`} />
                        </div>

                        <div className="space-y-2">
                            {dayEntries.map((entry, idx) => {
                                const isUp = entry.diffTotal > 0
                                const isDown = entry.diffTotal < 0
                                const isBank = entry.category === 'bank'
                                const isInterest = entry.source === 'interest'
                                const time = new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

                                return (
                                    <div
                                        key={entry._id || idx}
                                        className={`${card} overflow-hidden ${isLight ? 'hover:bg-slate-50/50' : 'hover:bg-white/[0.02]'}`}
                                    >
                                        <div className={`border-l-2 ${isUp ? 'border-emerald-400' : isDown ? 'border-red-400' : (isLight ? 'border-slate-300' : 'border-gray-600')}`}>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-start gap-2 min-w-0">
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                            isBank
                                                                ? (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-900/30 text-indigo-400')
                                                                : (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400')
                                                        }`}>
                                                            <FontAwesomeIcon icon={isBank ? faBuildingColumns : faWallet} className="text-[10px]" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{entry.accountName || 'Savings'}</p>
                                                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                {time} · {isBank ? 'Bank' : 'Cash'}
                                                                {isInterest && (
                                                                    <span className={`ml-1.5 font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>· Interest</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className={`text-xs font-bold tabular-nums ${
                                                            isUp ? (isLight ? 'text-emerald-600' : 'text-emerald-400')
                                                                : isDown ? (isLight ? 'text-red-600' : 'text-red-400')
                                                                    : (isLight ? 'text-slate-500' : 'text-gray-400')
                                                        }`}>
                                                            {isUp ? '+' : ''}{formatCurrency(entry.diffTotal)}
                                                        </span>
                                                        {!isViewer && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onDelete(entry._id)}
                                                                className={`w-6 h-6 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-red-50 text-red-400' : 'hover:bg-red-900/20 text-red-400'}`}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} className="text-[9px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {entry.note && (
                                                    <p className={`text-[10px] mb-2 px-2 py-1.5 rounded-md ${isLight ? 'bg-amber-50 text-amber-800' : 'bg-amber-900/20 text-amber-300'}`}>
                                                        {entry.note}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 text-[10px] mb-2">
                                                    <span className={`px-2 py-1 rounded-md ${isLight ? 'bg-slate-50 text-slate-600' : 'bg-[#111] text-gray-300'}`}>
                                                        Before {formatCurrency(entry.previousTotal)}
                                                    </span>
                                                    <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>→</span>
                                                    <span className={`px-2 py-1 rounded-md ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/20 text-blue-300'}`}>
                                                        After {formatCurrency(entry.newTotal)}
                                                    </span>
                                                </div>

                                                {entry.changes?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {entry.changes.map((c, ci) => (
                                                            isBank || c.denomination === 0 ? (
                                                                <span
                                                                    key={ci}
                                                                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                                                                        c.diff >= 0
                                                                            ? (isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-900/20 text-emerald-400')
                                                                            : (isLight ? 'bg-red-50 text-red-700' : 'bg-red-900/20 text-red-400')
                                                                    }`}
                                                                >
                                                                    <FontAwesomeIcon icon={c.diff >= 0 ? faArrowUp : faArrowDown} className="text-[7px]" />
                                                                    {c.diff >= 0 ? '+' : ''}{formatCurrency(c.diff)}
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    key={ci}
                                                                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                                                                        c.diff > 0
                                                                            ? (isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-900/20 text-emerald-400')
                                                                            : (isLight ? 'bg-red-50 text-red-700' : 'bg-red-900/20 text-red-400')
                                                                    }`}
                                                                >
                                                                    <FontAwesomeIcon icon={c.diff > 0 ? faArrowUp : faArrowDown} className="text-[7px]" />
                                                                    ₱{c.denomination} {c.diff > 0 ? '+' : ''}{c.diff}
                                                                    <span className="opacity-50 hidden sm:inline">({c.previous}→{c.current})</span>
                                                                </span>
                                                            )
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

const SavingsFormModal = ({ isLight, inputCls, account, onClose, onSave, saving }) => {
    const isEdit = !!account?._id
    const isBankAccount = isEdit ? account?.category === 'bank' : false
    const [name, setName] = useState(account?.name || '')
    const [category, setCategory] = useState(account?.category || 'cash')
    const [bankTotal, setBankTotal] = useState(account?.category === 'bank' ? String(account.total ?? '') : '')
    const [interestRate, setInterestRate] = useState(account?.category === 'bank' ? String(account.interestRate ?? '') : '')
    const [withholdingTax, setWithholdingTax] = useState(
        account?.category === 'bank' ? String(account.withholdingTax ?? 20) : '20',
    )
    const [interestFrequency, setInterestFrequency] = useState(account?.interestFrequency || 'daily')
    const [interestEnabled, setInterestEnabled] = useState(account?.interestEnabled !== false)
    const [counts, setCounts] = useState(() => countsFromDenominations(account?.denominations || emptyDenominations()))

    const showBankFields = category === 'bank' || isBankAccount

    const billsDenoms = DENOMINATIONS.filter(d => d.type === 'bill')
    const coinsDenoms = DENOMINATIONS.filter(d => d.type === 'coin')

    const cashTotal = useMemo(() =>
        DENOMINATIONS.reduce((sum, d) => sum + ((counts[d.value] === '' ? 0 : parseInt(counts[d.value], 10) || 0) * d.value), 0),
    [counts])

    const interestBreakdown = useMemo(() => {
        if (!showBankFields) return null
        const rate = parseFloat(interestRate) || 0
        if (rate <= 0 || !interestEnabled) return null
        return calcInterestBreakdown(parseFloat(bankTotal) || 0, rate, withholdingTax)
    }, [showBankFields, bankTotal, interestRate, withholdingTax, interestEnabled])

    const handleSubmit = () => {
        if (!name.trim()) return
        const payload = { name: name.trim(), category: isBankAccount ? 'bank' : category }
        if (showBankFields) {
            payload.total = parseFloat(bankTotal) || 0
            payload.interestRate = parseFloat(interestRate) || 0
            payload.withholdingTax = parseFloat(withholdingTax) || 20
            payload.interestFrequency = interestFrequency
            payload.interestEnabled = interestEnabled && (parseFloat(interestRate) || 0) > 0
        } else {
            const denominations = {}
            DENOMINATIONS.forEach(d => {
                denominations[d.value] = counts[d.value] === '' ? 0 : parseInt(counts[d.value], 10) || 0
            })
            payload.denominations = denominations
        }
        if (isEdit) payload.id = account._id
        onSave(payload, isEdit)
    }

    const noSpinner = `[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`

    return (
        <ModalOverlay isLight={isLight} onClose={onClose}>
            <div className={`relative w-full max-w-lg rounded-2xl border border-solid shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                <div className={`px-5 pt-5 pb-4 border-b border-solid ${isLight ? 'border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50/40' : 'border-[#1f1f1f] bg-gradient-to-br from-blue-950/20 via-[#0e0e0e] to-indigo-950/10'}`}>
                    <button type="button" onClick={onClose} className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'hover:bg-white/80 text-slate-400' : 'hover:bg-[#1a1a1a] text-gray-500'}`}>
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                    <h3 className={`text-base font-bold pr-8 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {isEdit ? 'Update savings' : 'Add savings'}
                    </h3>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Choose cash for breakdown or bank for total balance only</p>
                </div>

                <div className="px-5 py-4 space-y-4 max-h-[min(70vh,520px)] overflow-y-auto">
                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund, BPI Savings" className={inputCls} disabled={account?.isDefault && isEdit} />
                        {account?.isDefault && isEdit && (
                            <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Default Personal Savings name cannot be changed</p>
                        )}
                    </div>

                    {!isEdit && (
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'cash', label: 'Cash', icon: faWallet, desc: 'Bill & coin breakdown' },
                                    { id: 'bank', label: 'Bank', icon: faBuildingColumns, desc: 'Total balance only' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setCategory(opt.id)}
                                        className={`text-left rounded-xl border border-solid p-3 transition-all ${
                                            category === opt.id
                                                ? (isLight ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-blue-700 bg-blue-900/25 ring-1 ring-blue-800/50')
                                                : (isLight ? 'border-slate-200 hover:border-slate-300' : 'border-[#2a2a2a] hover:border-[#333]')
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={opt.icon} className={`text-sm mb-1.5 ${category === opt.id ? 'text-blue-500' : (isLight ? 'text-slate-400' : 'text-gray-500')}`} />
                                        <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{opt.label}</p>
                                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {showBankFields ? (
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total balance</label>
                                <input type="number" min="0" step="0.01" value={bankTotal} onChange={e => setBankTotal(e.target.value)} placeholder="0.00" className={`${inputCls} ${noSpinner}`} />
                            </div>

                            <div className={`rounded-xl border border-solid p-4 space-y-3 ${isLight ? 'border-indigo-100 bg-indigo-50/40' : 'border-indigo-900/30 bg-indigo-950/10'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faPercent} className={`text-xs ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Interest settings</span>
                                    </div>
                                    <label className={`flex items-center gap-2 text-xs cursor-pointer ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                                        <input
                                            type="checkbox"
                                            checked={interestEnabled}
                                            onChange={e => setInterestEnabled(e.target.checked)}
                                            className="rounded border-slate-300"
                                        />
                                        Auto-accrue
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Annual rate (%)</label>
                                        <input type="number" min="0" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="e.g. 3.25" className={`${inputCls} ${noSpinner}`} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Withholding tax (%)</label>
                                        <input type="number" min="0" max="100" step="0.01" value={withholdingTax} onChange={e => setWithholdingTax(e.target.value)} placeholder="20" className={`${inputCls} ${noSpinner}`} />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Accrual frequency</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {INTEREST_FREQUENCY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setInterestFrequency(opt.id)}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border border-solid transition-all ${
                                                    interestFrequency === opt.id
                                                        ? (isLight ? 'border-indigo-300 bg-indigo-100 text-indigo-700' : 'border-indigo-700 bg-indigo-900/30 text-indigo-300')
                                                        : (isLight ? 'border-slate-200 text-slate-500 hover:border-slate-300' : 'border-[#2a2a2a] text-gray-500 hover:border-[#333]')
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {interestBreakdown && (
                                <InterestBreakdownPanel
                                    isLight={isLight}
                                    breakdown={interestBreakdown}
                                    withholdingTax={withholdingTax}
                                    activeFrequency={interestFrequency}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-[#111] border border-[#252525]'}`}>
                                <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Cash total</span>
                                <span className={`text-sm font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>₱{cashTotal.toLocaleString()}</span>
                            </div>
                            <div className={`rounded-xl border border-solid overflow-hidden ${isLight ? 'border-slate-200' : 'border-[#252525]'}`}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={isLight ? 'bg-slate-50 text-slate-500' : 'bg-[#111] text-gray-500'}>
                                            <th className="text-left px-3 py-2 text-[10px] uppercase font-semibold">Denom</th>
                                            <th className="text-center px-2 py-2 text-[10px] uppercase font-semibold">Qty</th>
                                            <th className="text-right px-3 py-2 text-[10px] uppercase font-semibold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DENOMINATIONS.map(d => {
                                            const qty = counts[d.value] === '' ? 0 : parseInt(counts[d.value], 10) || 0
                                            const amt = qty * d.value
                                            return (
                                                <tr key={d.value} className={`border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <FontAwesomeIcon icon={d.type === 'bill' ? faMoneyBillWave : faCoins} className={`text-[10px] ${d.type === 'bill' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                            <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{d.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={counts[d.value]}
                                                            onChange={e => setCounts(prev => ({ ...prev, [d.value]: e.target.value === '' ? '' : e.target.value }))}
                                                            placeholder="0"
                                                            className={`${inputCls} w-16 text-center !py-1 text-xs ${noSpinner}`}
                                                        />
                                                    </td>
                                                    <td className={`px-3 py-2 text-right text-xs font-semibold tabular-nums ${amt > 0 ? (isLight ? 'text-blue-600' : 'text-blue-400') : (isLight ? 'text-slate-300' : 'text-gray-600')}`}>
                                                        ₱{amt.toLocaleString()}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className={`px-2 py-1.5 rounded-lg ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-900/20 text-emerald-400'}`}>
                                    Bills: ₱{billsDenoms.reduce((s, d) => s + ((counts[d.value] === '' ? 0 : parseInt(counts[d.value], 10) || 0) * d.value), 0).toLocaleString()}
                                </div>
                                <div className={`px-2 py-1.5 rounded-lg ${isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-900/20 text-amber-400'}`}>
                                    Coins: ₱{coinsDenoms.reduce((s, d) => s + ((counts[d.value] === '' ? 0 : parseInt(counts[d.value], 10) || 0) * d.value), 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`px-5 py-4 border-t border-solid flex justify-end gap-2 ${isLight ? 'border-slate-100 bg-slate-50/80' : 'border-[#1f1f1f] bg-[#0a0a0a]/80'}`}>
                    <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl text-sm font-medium ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'}`}>Cancel</button>
                    <button type="button" onClick={handleSubmit} disabled={!name.trim() || saving} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                        {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                        {isEdit ? 'Save changes' : 'Create savings'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    )
}

const SavingsTab = React.memo(({ isLight, card, inputCls, formatCurrency, dispatch, savingsAccounts, savingsHistory, isLoading, isViewer }) => {
    const accounts = Array.isArray(savingsAccounts) ? savingsAccounts : []
    const [subTab, setSubTab] = useState('accounts')
    const [formAccount, setFormAccount] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleteModal, setDeleteModal] = useState(null)
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => {
        dispatch(getBudgetSavingsHistory({}))
    }, [dispatch])

    useEffect(() => {
        if (isViewer) return
        dispatch(processSavingsInterest()).then((action) => {
            if (action?.payload?.data?.accountsUpdated > 0) {
                dispatch(getBudgetSavingsHistory({}))
            }
        })
    }, [dispatch, isViewer])

    const grandTotal = useMemo(() => calcAllSavingsTotal(accounts), [accounts])

    const summary = useMemo(() => {
        let cashTotal = 0
        let bankTotal = 0
        let cashCount = 0
        let bankCount = 0
        let billsTotal = 0
        let coinsTotal = 0

        accounts.forEach(account => {
            const total = calcAccountTotal(account)
            if (account.category === 'bank') {
                bankTotal += total
                bankCount += 1
            } else {
                cashTotal += total
                cashCount += 1
                DENOMINATIONS.forEach(d => {
                    const qty = parseInt(account.denominations?.[d.value], 10) || 0
                    const amount = qty * d.value
                    if (d.type === 'bill') billsTotal += amount
                    else coinsTotal += amount
                })
            }
        })

        const cashShare = grandTotal > 0 ? Math.round((cashTotal / grandTotal) * 100) : 0
        const bankShare = grandTotal > 0 ? Math.round((bankTotal / grandTotal) * 100) : 0

        return { cashTotal, bankTotal, cashCount, bankCount, billsTotal, coinsTotal, cashShare, bankShare }
    }, [accounts, grandTotal])

    const openCreate = () => {
        setFormAccount(null)
        setShowForm(true)
    }

    const openEdit = (account) => {
        setFormAccount(account)
        setShowForm(true)
    }

    const handleSave = async (payload, isEdit) => {
        setSaving(true)
        try {
            if (isEdit) await dispatch(updateBudgetSavingsAccount(payload)).unwrap()
            else await dispatch(createBudgetSavingsAccount(payload)).unwrap()
            dispatch(getBudgetSavingsHistory({}))
            setShowForm(false)
            setFormAccount(null)
        } catch {
            /* alert via redux */
        } finally {
            setSaving(false)
        }
    }

    const confirmDeleteAccount = async (id) => {
        await dispatch(deleteBudgetSavingsAccount({ id })).unwrap()
        dispatch(getBudgetSavingsHistory({}))
        setDeleteModal(null)
        if (expandedId === id) setExpandedId(null)
    }

    const confirmDeleteHistory = async (id) => {
        await dispatch(deleteBudgetSavingsHistory({ id }))
        setDeleteModal(null)
    }

    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    const historyCount = savingsHistory?.length || 0

    const tabDetail = useMemo(() => {
        if (subTab === 'accounts') {
            const parts = [
                `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`,
                `${formatCurrency(grandTotal)} total`,
            ]
            if (summary.cashCount > 0) parts.push(`${summary.cashCount} cash`)
            if (summary.bankCount > 0) parts.push(`${summary.bankCount} bank`)
            return parts.join(' · ')
        }
        if (historyCount === 0) return 'Balance changes will appear here when you update savings'
        return `${historyCount} recorded change${historyCount !== 1 ? 's' : ''} · filter by account, type, or increase/decrease`
    }, [subTab, accounts.length, grandTotal, formatCurrency, summary.cashCount, summary.bankCount, historyCount])

    if (isLoading && accounts.length === 0) {
        return (
            <div className="space-y-4">
                <div className={`${card} p-5`}>
                    <div className={`h-4 w-32 mb-4 ${pulse}`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[...Array(2)].map((_, i) => <div key={i} className={`h-24 ${pulse}`} />)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <AnimateIn delay={0}>
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                            {[
                                { id: 'accounts', label: 'Accounts', icon: faPiggyBank },
                                { id: 'history', label: 'History', icon: faHistory },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setSubTab(t.id)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                        subTab === t.id
                                            ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400')
                                            : (isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/5')
                                    }`}
                                >
                                    <FontAwesomeIcon icon={t.icon} className="text-[10px]" />
                                    {t.label}
                                    {t.id === 'history' && historyCount > 0 && (
                                        <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                                            subTab === t.id ? (isLight ? 'bg-blue-100' : 'bg-blue-500/20') : (isLight ? 'bg-slate-200' : 'bg-white/10')
                                        }`}>{historyCount}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {subTab === 'accounts' && !isViewer && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    isLight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                                Add savings
                            </button>
                        )}
                    </div>
                    <p className={`text-[11px] leading-relaxed px-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                        {tabDetail}
                    </p>
                </div>
            </AnimateIn>

            {subTab === 'accounts' && (
                <>
                    <AnimateIn delay={100}>
                        <div className={`${card} p-4 ${isLight ? 'bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/30' : 'bg-gradient-to-br from-blue-950/15 via-[#141414] to-indigo-950/10'}`}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isLight ? 'bg-blue-500 text-white shadow-lg shadow-blue-200/50' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'}`}>
                                        <FontAwesomeIcon icon={faPiggyBank} className="text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total savings</p>
                                        <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{formatCurrency(grandTotal)}</p>
                                        <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                                            {summary.cashCount > 0 && summary.bankCount > 0 && (
                                                <> · {summary.cashCount} cash, {summary.bankCount} bank</>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex-1 lg:max-w-md grid grid-cols-2 gap-2 sm:gap-3 ${isLight ? '' : ''}`}>
                                    <div className={`rounded-xl border border-solid p-3 ${isLight ? 'bg-white/80 border-emerald-100' : 'bg-[#111]/80 border-emerald-900/30'}`}>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <FontAwesomeIcon icon={faWallet} className={`text-[10px] shrink-0 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Cash</span>
                                            </div>
                                            {grandTotal > 0 && (
                                                <span className={`text-[10px] font-semibold shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{summary.cashShare}%</span>
                                            )}
                                        </div>
                                        <p className={`text-sm font-bold tabular-nums ${isLight ? 'text-slate-800' : 'text-gray-100'}`}>{formatCurrency(summary.cashTotal)}</p>
                                        {summary.cashCount > 0 && (
                                            <div className={`mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                <span>Bills {formatCurrency(summary.billsTotal)}</span>
                                                <span>·</span>
                                                <span>Coins {formatCurrency(summary.coinsTotal)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`rounded-xl border border-solid p-3 ${isLight ? 'bg-white/80 border-indigo-100' : 'bg-[#111]/80 border-indigo-900/30'}`}>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <FontAwesomeIcon icon={faBuildingColumns} className={`text-[10px] shrink-0 ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Bank</span>
                                            </div>
                                            {grandTotal > 0 && (
                                                <span className={`text-[10px] font-semibold shrink-0 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>{summary.bankShare}%</span>
                                            )}
                                        </div>
                                        <p className={`text-sm font-bold tabular-nums ${isLight ? 'text-slate-800' : 'text-gray-100'}`}>{formatCurrency(summary.bankTotal)}</p>
                                        <p className={`mt-1.5 text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {summary.bankCount > 0
                                                ? `${summary.bankCount} account${summary.bankCount !== 1 ? 's' : ''} · total balance only`
                                                : 'No bank accounts yet'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimateIn>

                    <AnimateIn delay={150}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {accounts.map(account => {
                                const total = calcAccountTotal(account)
                                const isCash = account.category === 'cash'
                                const isExpanded = expandedId === account._id
                                return (
                                    <div key={account._id} className={`${card} overflow-hidden transition-all ${isExpanded ? (isLight ? 'ring-2 ring-blue-200' : 'ring-2 ring-blue-800/50') : ''}`}>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCash ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400') : (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-900/30 text-indigo-400')}`}>
                                                        <FontAwesomeIcon icon={isCash ? faWallet : faBuildingColumns} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h4 className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{account.name}</h4>
                                                            {account.isDefault && (
                                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/40 text-blue-400'}`}>Default</span>
                                                            )}
                                                        </div>
                                                        <span className={`inline-flex mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${isCash ? (isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/30 text-emerald-400') : (isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-900/30 text-indigo-400')}`}>
                                                            {isCash ? 'Cash' : 'Bank'}
                                                        </span>
                                                        {!isCash && (account.interestRate > 0) && account.interestEnabled !== false && (
                                                            <span className={`inline-flex ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-900/30 text-amber-400'}`}>
                                                                {account.interestRate}% · {account.interestFrequency || 'daily'}
                                                            </span>
                                                        )}
                                                        <p className={`text-lg font-bold mt-2 tabular-nums ${isLight ? 'text-slate-800' : 'text-gray-100'}`}>{formatCurrency(total)}</p>
                                                    </div>
                                                </div>
                                                {!isViewer && (
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <button type="button" onClick={() => openEdit(account)} title="Edit" className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'hover:bg-blue-50 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                                            <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                                                        </button>
                                                        {!account.isDefault && (
                                                            <button type="button" onClick={() => setDeleteModal({ type: 'account', id: account._id, title: 'Delete savings account', message: `Delete "${account.name}"? This cannot be undone.` })} title="Delete" className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-900/20 text-red-400'}`}>
                                                                <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {!isCash && (account.interestRate > 0) && account.interestEnabled !== false && (
                                                <div className="mt-3">
                                                    <InterestBreakdownPanel
                                                        isLight={isLight}
                                                        breakdown={calcInterestBreakdown(total, account.interestRate, account.withholdingTax ?? 20)}
                                                        withholdingTax={account.withholdingTax ?? 20}
                                                        activeFrequency={account.interestFrequency || 'daily'}
                                                        compact
                                                    />
                                                </div>
                                            )}

                                            {isCash && (
                                                <button type="button" onClick={() => setExpandedId(isExpanded ? null : account._id)}
                                                    className={`mt-3 text-[11px] font-medium ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}>
                                                    {isExpanded ? 'Hide breakdown' : 'View breakdown'}
                                                </button>
                                            )}

                                            {isCash && isExpanded && (() => {
                                                const denoms = account.denominations || {}
                                                const bills = DENOMINATIONS.filter(d => d.type === 'bill')
                                                const coins = DENOMINATIONS.filter(d => d.type === 'coin')
                                                const getQty = (d) => parseInt(denoms[d.value], 10) || 0
                                                const getAmt = (d) => getQty(d) * d.value
                                                const totalBills = bills.reduce((s, d) => s + getAmt(d), 0)
                                                const totalCoins = coins.reduce((s, d) => s + getAmt(d), 0)
                                                const hasAny = DENOMINATIONS.some(d => getQty(d) > 0)

                                                const renderRows = (list, label, subtotal) => {
                                                    const active = list.filter(d => getQty(d) > 0)
                                                    if (active.length === 0) return null
                                                    return (
                                                        <div className="mb-3 last:mb-0">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{label}</p>
                                                                <p className={`text-[11px] font-bold tabular-nums ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{formatCurrency(subtotal)}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {active.map(d => {
                                                                    const qty = getQty(d)
                                                                    const amt = getAmt(d)
                                                                    return (
                                                                        <div key={d.value} className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <FontAwesomeIcon
                                                                                    icon={d.type === 'bill' ? faMoneyBillWave : faCoins}
                                                                                    className={`text-[10px] shrink-0 ${d.type === 'bill' ? 'text-emerald-500' : 'text-amber-500'}`}
                                                                                />
                                                                                <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{d.label}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 shrink-0 text-right">
                                                                                <span className={`text-[11px] tabular-nums ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>× {qty}</span>
                                                                                <span className={`text-xs font-bold tabular-nums w-20 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrency(amt)}</span>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                return (
                                                    <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#222]'}`}>
                                                        {hasAny ? (
                                                            <>
                                                                {renderRows(bills, 'Bills', totalBills)}
                                                                {renderRows(coins, 'Coins', totalCoins)}
                                                                <div className={`flex items-center justify-between gap-2 mt-3 pt-3 border-t border-solid px-2.5 ${isLight ? 'border-slate-200' : 'border-[#2a2a2a]'}`}>
                                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Total</span>
                                                                    <span className={`text-sm font-bold tabular-nums ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrency(total)}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <p className={`text-xs text-center py-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No breakdown recorded yet</p>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </AnimateIn>

                    {accounts.length === 0 && (
                        <div className={`${card} text-center py-16 px-5`}>
                            <FontAwesomeIcon icon={faPiggyBank} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                            <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>No savings accounts yet</p>
                            <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Add your first savings account to get started</p>
                        </div>
                    )}
                </>
            )}

            {subTab === 'history' && (
                <AnimateIn delay={50}>
                    <SavingsHistoryPanel
                        isLight={isLight}
                        card={card}
                        inputCls={inputCls}
                        formatCurrency={formatCurrency}
                        savingsHistory={savingsHistory}
                        savingsAccounts={accounts}
                        isViewer={isViewer}
                        onDelete={(id) => setDeleteModal({ type: 'history', id, title: 'Delete history entry', message: 'Delete this savings history entry?' })}
                    />
                </AnimateIn>
            )}

            {showForm && (
                <SavingsFormModal
                    isLight={isLight}
                    inputCls={inputCls}
                    account={formAccount}
                    onClose={() => { setShowForm(false); setFormAccount(null) }}
                    onSave={handleSave}
                    saving={saving}
                />
            )}

            {deleteModal && (
                <DeleteConfirmModal
                    isLight={isLight}
                    title={deleteModal.title}
                    message={deleteModal.message}
                    onCancel={() => setDeleteModal(null)}
                    onConfirm={() => deleteModal.type === 'account' ? confirmDeleteAccount(deleteModal.id) : confirmDeleteHistory(deleteModal.id)}
                />
            )}
        </div>
    )
})

export default SavingsTab
